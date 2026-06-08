"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card, Badge, Empty } from "@/components/ui";

export default function RoteirosPage() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState("rascunho");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id em edição
  const [form, setForm] = useState({ hook: "", script: "", caption: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      setDrafts(await api.drafts(filter || undefined));
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function startEdit(d) {
    setEditing(d.id);
    setForm({ hook: d.hook, script: d.script, caption: d.caption });
  }

  async function act(fn, label) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(label);
      setEditing(null);
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const filtros = [
    { key: "rascunho", label: "A revisar" },
    { key: "aprovado", label: "Aprovados" },
    { key: "agendado", label: "Agendados" },
    { key: "publicado", label: "Publicados" },
    { key: "rejeitado", label: "Rejeitados" },
  ];

  return (
    <div className="rise">
      <SectionTitle kicker="Produção" title="Roteiros">
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
      ) : drafts.length === 0 ? (
        <Empty>Nenhum roteiro com esse status.</Empty>
      ) : (
        <div className="space-y-4">
          {drafts.map((d) => (
            <Card key={d.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge status={d.status} />
                <span className="text-xs text-muted">
                  {d.format === "carrossel" ? "Carrossel" : "Reel"}
                  {d.article?.source ? ` · ${d.article.source.name}` : ""}
                </span>
              </div>

              {editing === d.id ? (
                <div className="space-y-3">
                  <Field label="Gancho" value={form.hook} onChange={(v) => setForm({ ...form, hook: v })} />
                  <Field
                    label="Roteiro"
                    value={form.script}
                    onChange={(v) => setForm({ ...form, script: v })}
                    rows={8}
                  />
                  <Field
                    label="Legenda"
                    value={form.caption}
                    onChange={(v) => setForm({ ...form, caption: v })}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      disabled={busy}
                      onClick={() => act(() => api.editDraft(d.id, form), "Roteiro salvo.")}
                    >
                      Salvar
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-lg text-forest">{d.hook}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{d.script}</p>
                  {d.caption && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cream-deep/40 p-3 text-sm text-muted">
                      {d.caption}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-cream-deep/50 pt-4">
                    <Button variant="ghost" onClick={() => startEdit(d)}>
                      Editar
                    </Button>
                    {(d.status === "rascunho" || d.status === "rejeitado") && (
                      <Button
                        variant="primary"
                        disabled={busy}
                        onClick={() => act(() => api.approve(d.id), "Aprovado. Sincronize a agenda para encaixar.")}
                      >
                        Aprovar
                      </Button>
                    )}
                    {d.status === "rascunho" && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => act(() => api.reject(d.id), "Rejeitado.")}
                      >
                        Rejeitar
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, rows = 2 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gold-deep">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-forest"
      />
    </label>
  );
}
