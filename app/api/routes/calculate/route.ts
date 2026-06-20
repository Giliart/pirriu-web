import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Coordinate = [number, number];

const ORS_API_KEY =
  process.env.OPENROUTE_SERVICE_API_KEY ||
  process.env.ORS_API_KEY ||
  process.env.EXPO_PUBLIC_ORS_API_KEY ||
  "";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
const MAX_POINTS = 120;
const CACHE_MAX_AGE_DAYS = 30;

function normalizeCoordinate(point: unknown): Coordinate | null {
  if (!Array.isArray(point) || point.length < 2) return null;

  const lng = Number(point[0]);
  const lat = Number(point[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [
    Number(lng.toFixed(6)),
    Number(lat.toFixed(6)),
  ];
}

function normalizeCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeCoordinate)
    .filter(Boolean) as Coordinate[];
}

function buildRouteHash(coordinates: Coordinate[], instructions: boolean) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ coordinates, instructions, provider: "openrouteservice-driving-car-v1" }))
    .digest("hex");
}

function buildDirectGeometry(coordinates: Coordinate[]) {
  return {
    ok: true,
    source: "fallback",
    coordinates,
    summary: {
      distance: 0,
      duration: 0,
    },
    steps: [],
  };
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

  await supabaseAdmin
    .from("route_cache")
    .upsert(
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
    )
    .then(() => null);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const coordinates = normalizeCoordinates(body?.coordinates);
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
      return NextResponse.json(buildDirectGeometry(coordinates));
    }

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
      }),
      cache: "no-store",
    });

    const data = await orsResponse.json().catch(() => null);

    if (!orsResponse.ok) {
      return NextResponse.json(buildDirectGeometry(coordinates));
    }

    const feature = data?.features?.[0];
    const geometryCoords = Array.isArray(feature?.geometry?.coordinates)
      ? feature.geometry.coordinates.map(normalizeCoordinate).filter(Boolean)
      : [];

    const summary = feature?.properties?.summary || {};
    const steps = feature?.properties?.segments?.[0]?.steps || [];

    const finalGeometry = geometryCoords.length ? geometryCoords : coordinates;

    await saveCachedRoute({
      routeHash,
      coordinates,
      geometry: finalGeometry,
      summary,
      steps,
      provider: "openrouteservice",
      context,
    });

    return NextResponse.json({
      ok: true,
      source: "openrouteservice",
      coordinates: finalGeometry,
      summary,
      steps,
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
