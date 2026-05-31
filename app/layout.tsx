import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pirriu.app"),
  title: { default: "PIRRIU", template: "%s | PIRRIU" },
  description: "Portal web do aplicativo PIRRIU para assinaturas, resumo da conta e gestão complementar.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "PIRRIU",
    description: "Portal web do aplicativo PIRRIU.",
    url: "https://pirriu.app",
    siteName: "PIRRIU",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
