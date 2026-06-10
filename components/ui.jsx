// Pequenos componentes de UI compartilhados entre as páginas.

const STATUS_STYLES = {
  novo: "bg-cream-deep text-muted",
  relevante: "bg-forest/10 text-forest",
  descartado: "bg-ink/5 text-muted",
  lida: "bg-gold/10 text-gold-deep",
  rascunho: "bg-gold/15 text-gold-deep",
  aprovado: "bg-forest/10 text-forest",
  rejeitado: "bg-ink/5 text-muted",
  agendado: "bg-forest text-cream",
  publicado: "bg-gold text-ink",
  vago: "bg-ink/5 text-muted",
  preenchido: "bg-forest/10 text-forest",
};

export function Badge({ status, children }) {
  const cls = STATUS_STYLES[status] || "bg-cream-deep text-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {children || status}
    </span>
  );
}

export function SectionTitle({ kicker, title, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          {kicker && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
              {kicker}
            </p>
          )}
          <h1 className="font-display text-3xl text-forest">{title}</h1>
        </div>
        {children}
      </div>
      <div className="rule-gold mt-4 w-full max-w-[140px]" />
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", disabled }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-forest text-cream hover:bg-forest-light shadow-card hover:shadow-lift",
    gold: "bg-gold text-ink hover:bg-gold-deep hover:text-cream",
    ghost: "border border-cream-deep text-forest hover:bg-cream-deep/40",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-cream-deep/60 bg-cream-card p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-deep bg-cream-card/50 px-6 py-12 text-center text-muted">
      {children}
    </div>
  );
}
