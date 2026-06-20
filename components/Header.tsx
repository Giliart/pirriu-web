"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CreditCard, Home, LayoutDashboard, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { SecureImage } from "./SecureImage";

function isPublicAvatar(url?: string | null) {
  return Boolean(url && (/^https?:\/\//i.test(url) || url.startsWith('/api/avatar/')));
}

function getFirstName(name?: string | null) {
  const clean = (name || "").trim();
  if (!clean) return "Usuário";
  return clean.split(" ")[0];
}

const menuItems = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/resumo", label: "Resumo", icon: UserRound },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
];

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
  const pathname = usePathname();

  return (
    <header className="pw-header">
      <div className="pw-container pw-header-inner">
        {logged ? (
          <>
            <div className="pw-mobile-user-head pw-header-user">
              {safeAvatar ? (
                <SecureImage src={safeAvatar} alt="Foto de perfil" className="pw-mobile-user-avatar" />
              ) : (
                <div className="pw-mobile-user-avatar pw-mobile-user-avatar--fallback">{firstName[0]}</div>
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
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
            >
              {open ? <X size={26} /> : <Menu size={27} />}
            </button>

            <nav className="pw-nav" aria-label="Navegação principal">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} className={`pw-nav-link ${active ? "pw-nav-link--active" : ""}`} href={item.href}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {safeAvatar ? (
                <SecureImage src={safeAvatar} alt="Foto de perfil" width={46} height={46} className="pw-avatar" />
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
              <Link className="pw-nav-link" href="/suporte">
                <UserRound size={16} />
                <span>Suporte</span>
              </Link>
              <Link className="pw-nav-link pw-nav-link--active" href="/login">
                <Home size={16} />
                <span>Login</span>
              </Link>
            </nav>
          </>
        )}
      </div>

      {logged && open && (
        <div className="pw-mobile-dropdown">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                <span className="pw-mobile-menu-icon"><Icon size={19} /></span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
