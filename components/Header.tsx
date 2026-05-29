"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

function isPublicAvatar(url?: string | null) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function getFirstName(name?: string | null) {
  const clean = (name || "").trim();
  if (!clean) return "Usuário";
  return clean.split(" ")[0];
}

export function Header({
  logged = false,
  avatarUrl,
  userName,
}: {
  logged?: boolean;
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const safeAvatar = isPublicAvatar(avatarUrl) ? avatarUrl : null;
  const [open, setOpen] = useState(false);
  const firstName = getFirstName(userName);

  return (
    <header className="pw-header">
      <div className="pw-container pw-header-inner">
        {logged ? (
          <>
            <div className="pw-mobile-user-head">
              {safeAvatar ? (
                <img src={safeAvatar} alt="Foto de perfil" className="pw-mobile-user-avatar" />
              ) : (
                <div className="pw-mobile-user-avatar" />
              )}

              <div className="pw-mobile-user-copy">
                <span>Olá,</span>
                <strong>{firstName}</strong>
              </div>
            </div>

            <Link className="pw-desktop-logo-link" href="/painel" aria-label="Ir para o painel">
              <Logo />
            </Link>

            <button
              className="pw-mobile-menu-btn"
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <nav className="pw-nav" aria-label="Navegação principal">
              <Link className="pw-nav-link" href="/painel">Início</Link>
              <Link className="pw-nav-link" href="/painel">Painel</Link>
              <Link className="pw-nav-link" href="/resumo">Resumo</Link>
              <Link className="pw-nav-link pw-nav-link--active" href="/assinatura">Assinatura</Link>
              {safeAvatar ? (
                <img src={safeAvatar} alt="Foto de perfil" width={46} height={46} className="pw-avatar" />
              ) : (
                <div className="pw-avatar" />
              )}
            </nav>
          </>
        ) : (
          <>
            <Link className="pw-desktop-logo-link" href="/" aria-label="Ir para a página inicial">
              <Logo />
            </Link>

            <div className="pw-mobile-public-brand">
              <strong>PIRRIU</strong>
              <span>Portal Web</span>
            </div>

            <nav className="pw-nav pw-nav-public" aria-label="Navegação principal">
              <Link className="pw-nav-link pw-nav-link--active" href="/login">Login</Link>
            </nav>
          </>
        )}
      </div>

      {logged && open && (
        <div className="pw-mobile-dropdown">
          <Link href="/painel"><span className="pw-menu-dot" />Início</Link>
          <Link href="/painel"><span className="pw-menu-dot" />Painel</Link>
          <Link href="/resumo"><span className="pw-menu-dot" />Resumo</Link>
          <Link href="/assinatura"><span className="pw-menu-dot pw-menu-dot--gold" />Assinatura</Link>
        </div>
      )}
    </header>
  );
}
