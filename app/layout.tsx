import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "../components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "Everwod FAQ Cloud",
  description: "Plataforma centralizada para gestión de conocimiento. Sube tus documentos base y conviértelos en FAQs automatizadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
