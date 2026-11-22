import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QG des agents IA",
  description: "Le QG des agents IA : un immeuble dans le ciel, un étage par pôle, un bureau par agent.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1420",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-BE">
      <body>
        <a className="sauter" href="#contenu">
          Aller à l&apos;immeuble
        </a>
        {children}
      </body>
    </html>
  );
}
