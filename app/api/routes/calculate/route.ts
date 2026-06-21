import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Coordinate = [number, number];
type OrsSuccess = {
  ok: true;
  geometry: Coordinate[];
  summary: Record<string, any>;
  steps: any[];
  partial?: boolean;
};
type OrsFailure = {
  ok: false;
  status: number;
  error: string;
};
type OrsResult = OrsSuccess | OrsFailure;

const ORS_API_KEY =
  process.env.OPENROUTE_SERVICE_API_KEY ||
  process.env.ORS_API_KEY ||
  process.env.EXPO_PUBLIC_ORS_API_KEY ||
  "";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
const MAX_POINTS = 120;
const ORS_MAX_POINTS_PER_REQUEST = 10;
const CACHE_MAX_AGE_DAYS = 30;
const ORS_TIMEOUT_MS = 28000;

function normalizeCoordinate(point: unknown): Coordinate | null {
  if (!Array.isArray(point) || point.length < 2) return null;

  const lng = Number(point[0]);
  const lat = Number(point[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}

function normalizeCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCoordinate).filter(Boolean) as Coordinate[];
}

function normalizePoints(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((point: any) => {
      const latitude = Number(point?.latitude ?? point?.lat);
      const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

      return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))] as Coordinate;
    })
    .filter(Boolean) as Coordinate[];
}

function buildRouteHash(coordinates: Coordinate[], instructions: boolean) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ coordinates, instructions, provider: "openrouteservice-driving-car-v3" }))
    .digest("hex");
}

function buildDirectGeometry(coordinates: Coordinate[], reason = "fallback") {
  return {
    ok: true,
    source: "fallback",
    reason,
    coordinates,
    summary: {
      distance: 0,
      duration: 0,
      partial: true,
      errors: [reason],
    },
    steps: [],
  };
}

function getOrsErrorMessage(data: any, status: number) {
  return (
    data?.error?.message ||
    data?.error ||
    data?.message ||
    `OpenRouteService respondeu com status ${status}`
  );
}

async function getCachedRoute(routeHash: string) {
  const { data, error } = await supabaseAdmin
    .from("route_cache")
    .select("route_hash, geometry_json, summary_json, steps_json, provider, created_at")
    .eq("route_hash", routeHash)
    .maybeSingle();

  if (error || !data?.geometry_json) return null;

  await supabaseAdmin
    .from("route_cache")
    .update({ last_used_at: new Date().toISOString() })
    .eq("route_hash", routeHash)
    .then(() => null);

  return {
    ok: true,
    source: "cache",
    coordinates: data.geometry_json,
    summary: data.summary_json || undefined,
    steps: data.steps_json || [],
  };
}

async function saveCachedRoute(params: {
  routeHash: string;
  coordinates: Coordinate[];
  geometry: Coordinate[];
  summary: any;
  steps: any[];
  provider: string;
  context: string;
}) {
  const expiresAt = new Date(Date.now() + CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from("route_cache").upsert(
    {
      route_hash: params.routeHash,
      input_coordinates: params.coordinates,
      geometry_json: params.geometry,
      summary_json: params.summary || {},
      steps_json: params.steps || [],
      provider: params.provider,
      context: params.context,
      last_used_at: new Date().toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: "route_hash" }
  );

  if (error) {
    console.warn("PIRRIU route_cache save failed:", error.message);
  }
}

function mergeGeometry(current: Coordinate[], next: Coordinate[]) {
  if (!current.length) return next;
  if (!next.length) return current;

  const last = current[current.length - 1];
  const first = next[0];

  if (last && first && last[0] === first[0] && last[1] === first[1]) {
    return [...current, ...next.slice(1)];
  }

  return [...current, ...next];
}

function splitIntoOverlappingChunks(coordinates: Coordinate[]) {
  if (coordinates.length <= ORS_MAX_POINTS_PER_REQUEST) return [coordinates];

  const chunks: Coordinate[][] = [];
  let start = 0;

  while (start < coordinates.length - 1) {
    const end = Math.min(start + ORS_MAX_POINTS_PER_REQUEST, coordinates.length);
    const chunk = coordinates.slice(start, end);

    if (chunk.length >= 2) chunks.push(chunk);
    if (end >= coordinates.length) break;

    start = end - 1;
  }

  return chunks;
}

async function callOrsSingle(coordinates: Coordinate[], instructions: boolean): Promise<OrsResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);

  try {
    const orsResponse = await fetch(ORS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, application/geo+json",
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        coordinates,
        instructions,
        language: "pt",
        units: "m",
        geometry_simplify: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await orsResponse.json().catch(() => null);

    if (!orsResponse.ok) {
      return {
        ok: false,
        status: orsResponse.status,
        error: getOrsErrorMessage(data, orsResponse.status),
      };
    }

    const feature = data?.features?.[0];
    const geometryCoords = Array.isArray(feature?.geometry?.coordinates)
      ? feature.geometry.coordinates.map(normalizeCoordinate).filter(Boolean)
      : [];

    return {
      ok: true,
      geometry: geometryCoords.length ? geometryCoords : coordinates,
      summary: feature?.properties?.summary || {},
      steps: feature?.properties?.segments?.flatMap((segment: any) => segment?.steps || []) || [],
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error?.name === "AbortError" ? "Tempo esgotado ao consultar OpenRouteService." : error?.message || "Erro desconhecido na rota.",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenRouteService(coordinates: Coordinate[], instructions: boolean): Promise<OrsResult> {
  const chunks = splitIntoOverlappingChunks(coordinates);

  if (chunks.length === 1) {
    return callOrsSingle(chunks[0], instructions);
  }

  let geometry: Coordinate[] = [];
  let distance = 0;
  let duration = 0;
  const steps: any[] = [];
  const errors: string[] = [];

  for (const chunk of chunks) {
    const result = await callOrsSingle(chunk, instructions);

    if (!result.ok) {
      errors.push(result.error);
      geometry = mergeGeometry(geometry, chunk);
      continue;
    }

    geometry = mergeGeometry(geometry, result.geometry);
    distance += Number(result.summary?.distance || 0);
    duration += Number(result.summary?.duration || 0);
    steps.push(...(result.steps || []));
  }

  if (!geometry.length) {
    return {
      ok: false,
      status: 0,
      error: errors.join(" | ") || "Falha ao calcular rota em blocos.",
    };
  }

  return {
    ok: true,
    geometry,
    summary: {
      distance,
      duration,
      partial: errors.length > 0,
      errors,
      chunks: chunks.length,
    },
    steps,
    partial: errors.length > 0,
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pirriu-routes",
    orsConfigured: Boolean(ORS_API_KEY),
    maxPoints: MAX_POINTS,
    chunkSize: ORS_MAX_POINTS_PER_REQUEST,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const fromCoordinates = normalizeCoordinates(body?.coordinates);
    const coordinates = fromCoordinates.length ? fromCoordinates : normalizePoints(body?.points);
    const instructions = Boolean(body?.instructions);
    const context = String(body?.context || "mobile").slice(0, 80);

    if (coordinates.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Informe pelo menos 2 pontos válidos." },
        { status: 400 }
      );
    }

    if (coordinates.length > MAX_POINTS) {
      return NextResponse.json(
        { ok: false, error: `Limite máximo de ${MAX_POINTS} pontos por chamada.` },
        { status: 400 }
      );
    }

    const routeHash = buildRouteHash(coordinates, instructions);
    const cached = await getCachedRoute(routeHash);
    if (cached) return NextResponse.json(cached);

    if (!ORS_API_KEY) {
      const fallback = buildDirectGeometry(coordinates, "OPENROUTE_SERVICE_API_KEY ausente na Vercel");
      await saveCachedRoute({
        routeHash,
        coordinates,
        geometry: fallback.coordinates,
        summary: fallback.summary,
        steps: [],
        provider: "fallback_no_ors_key",
        context,
      });

      return NextResponse.json(fallback);
    }

    const orsResult = await callOpenRouteService(coordinates, instructions);

    if (!orsResult.ok) {
      const fallback = buildDirectGeometry(coordinates, orsResult.error || "Falha na OpenRouteService");
      await saveCachedRoute({
        routeHash,
        coordinates,
        geometry: fallback.coordinates,
        summary: fallback.summary,
        steps: [],
        provider: "fallback_ors_error",
        context,
      });

      return NextResponse.json({
        ...fallback,
        orsStatus: orsResult.status,
      });
    }

    const provider = orsResult.partial ? "openrouteservice_partial" : "openrouteservice";

    await saveCachedRoute({
      routeHash,
      coordinates,
      geometry: orsResult.geometry,
      summary: orsResult.summary,
      steps: orsResult.steps,
      provider,
      context,
    });

    return NextResponse.json({
      ok: true,
      source: provider,
      coordinates: orsResult.geometry,
      summary: orsResult.summary,
      steps: orsResult.steps,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao calcular rota.",
        detail: error?.message || "unknown",
      },
      { status: 500 }
    );
  }
}
