import "./globals.css";
import { Fraunces, Mulish } from "next/font/google";
import { Nav } from "@/components/Nav";
import { AuthGate } from "@/components/AuthGate";

// Display serifada e característica (títulos) — pega a pegada clássica da banca.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

// Corpo limpo e legível para a interface.
const body = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata = {
  title: "Pauta Jurídica — SR Advocacia",
  description: "Calendário editorial de conteúdo previdenciário",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">
        <AuthGate>
          <Nav />
          <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
