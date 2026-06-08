"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card, Badge, Empty } from "@/components/ui";

export default function NoticiasPage() {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState("relevante");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.articles(filter || undefined);
      setArticles(data);
    } catch (e) {
      setMsg(`Erro ao carregar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function gerar(id, format) {
    setBusyId(id);
    setMsg("");
    try {
      await api.generate(id, format);
      setMsg("Roteiro gerado. Veja na aba Roteiros.");
      await load();
    } catch (e) {
      setMsg(`Erro ao gerar roteiro: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  const filtros = [
    { key: "relevante", label: "Relevantes" },
    { key: "novo", label: "Novas" },
    { key: "descartado", label: "Descartadas" },
    { key: "", label: "Todas" },
  ];

  return (
    <div className="rise">
      <SectionTitle kicker="Matéria-prima" title="Notícias">
        <Button variant="ghost" onClick={load}>
          Atualizar
        </Button>
      </SectionTitle>

      <div className="mb-6 flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? "bg-forest text-cream"
                : "border border-cream-deep text-forest hover:bg-cream-deep/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mb-5 rounded-xl border border-cream-deep bg-cream-card px-4 py-2 text-sm text-muted">
          {msg}
        </p>
      )}

      {loading ? (
        <Empty>Carregando…</Empty>
      ) : articles.length === 0 ? (
        <Empty>Nenhuma notícia aqui. Use “Coletar notícias” no calendário para buscar nos feeds.</Empty>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge status={a.status} />
                    {typeof a.relevanceScore === "number" && (
                      <span className="text-xs font-semibold text-gold-deep">
                        relevância {a.relevanceScore}
                      </span>
                    )}
                    <span className="text-xs text-muted">{a.source?.name}</span>
                  </div>
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-display text-lg text-forest hover:text-gold-deep"
                  >
                    {a.title}
                  </a>
                  {a.relevanceReason && (
                    <p className="mt-1 text-sm italic text-muted">{a.relevanceReason}</p>
                  )}
                  {a.drafts?.length > 0 && (
                    <p className="mt-2 text-xs text-forest">
                      {a.drafts.length} roteiro(s) já gerado(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-cream-deep/50 pt-4">
                <Button variant="primary" disabled={busyId === a.id} onClick={() => gerar(a.id, "reel")}>
                  {busyId === a.id ? "Gerando…" : "Gerar reel"}
                </Button>
                <Button variant="ghost" disabled={busyId === a.id} onClick={() => gerar(a.id, "carrossel")}>
                  Gerar carrossel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
