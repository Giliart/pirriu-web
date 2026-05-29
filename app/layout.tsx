import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIRRIU Portal",
  description: "Portal web complementar do aplicativo PIRRIU",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
