"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Calendário" },
  { href: "/noticias", label: "Notícias" },
  { href: "/temas", label: "Temas" },
  { href: "/roteiros", label: "Roteiros" },
  { href: "/fontes", label: "Fontes" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-cream-deep/60 bg-forest text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-xl tracking-tight text-cream">
            Pauta<span className="text-gold"> Jurídica</span>
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.2em] text-cream/50 sm:inline">
            SR Advocacia
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-gold/20 text-cream"
                    : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
