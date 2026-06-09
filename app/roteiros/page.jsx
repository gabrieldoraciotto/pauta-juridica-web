"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card, Badge, Empty } from "@/components/ui";
import { Teleprompter } from "@/components/Teleprompter";

export default function RoteirosPage() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState("rascunho");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id em edição
  const [form, setForm] = useState({ hook: "", script: "", caption: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [teleDraft, setTeleDraft] = useState(null); // roteiro aberto no teleprompter
  const [fixBusy, setFixBusy] = useState(null); // id gerando versão corrigida
  const [partBusy, setPartBusy] = useState(null); // "hook" | "script" | "caption" em geração
  const [scriptDurOpen, setScriptDurOpen] = useState(false); // opções de duração do roteiro

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
    setScriptDurOpen(false);
    setMsg("");
  }

  function cancelEdit() {
    setEditing(null);
    setScriptDurOpen(false);
  }

  async function act(fn, label) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(label);
      setEditing(null);
      setScriptDurOpen(false);
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Regenera UMA parte do roteiro e coloca o texto novo no formulário (não salva).
  async function regenPart(id, part, duration) {
    setPartBusy(part);
    setMsg("");
    try {
      const novo = await api.regenerate(id, {
        part,
        duration,
        hook: form.hook,
        script: form.script,
        caption: form.caption,
      });
      setForm((prev) => ({ ...prev, ...novo }));
      if (part === "script") setScriptDurOpen(false);
    } catch (e) {
      setMsg(`Erro ao gerar: ${e.message}`);
    } finally {
      setPartBusy(null);
    }
  }

  // Gera uma versão corrigida ajustando os pontos apontados pela verificação da OAB.
  async function fixOab(id) {
    setFixBusy(id);
    setMsg("");
    try {
      await api.fixOab(id);
      setMsg("Versão corrigida gerada e verificada de novo.");
      await load();
    } catch (e) {
      setMsg(`Erro ao gerar versão corrigida: ${e.message}`);
    } finally {
      setFixBusy(null);
    }
  }

  const filtros = [
    { key: "rascunho", label: "A revisar" },
    { key: "aprovado", label: "Aprovados" },
    { key: "agendado", label: "Agendados" },
    { key: "publicado", label: "Publicados" },
    { key: "rejeitado", label: "Rejeitados" },
  ];

  const duracoes = [
    { key: "curto", label: "Curto ~30s" },
    { key: "medio", label: "Médio ~60s" },
    { key: "longo", label: "Longo ~90s" },
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
          {drafts.map((d) => {
            const locked = busy || fixBusy === d.id;
            return (
              <Card key={d.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge status={d.status} />
                  <span className="text-xs text-muted">
                    {d.format === "carrossel" ? "Carrossel" : "Reel"}
                    {d.article?.source ? ` · ${d.article.source.name}` : ""}
                  </span>
                </div>

                {editing === d.id ? (
                  <div className="space-y-4">
                    {/* Gancho */}
                    <div className="space-y-2">
                      <Field label="Gancho" value={form.hook} onChange={(v) => setForm({ ...form, hook: v })} />
                      {partBusy === "hook" ? (
                        <span className="text-xs text-muted">Gerando outro gancho…</span>
                      ) : (
                        <Button variant="ghost" disabled={!!partBusy} onClick={() => regenPart(d.id, "hook")}>
                          Gerar outro gancho
                        </Button>
                      )}
                    </div>

                    {/* Roteiro */}
                    <div className="space-y-2">
                      <Field
                        label="Roteiro"
                        value={form.script}
                        onChange={(v) => setForm({ ...form, script: v })}
                        rows={8}
                      />
                      {partBusy === "script" ? (
                        <span className="text-xs text-muted">Gerando outro roteiro…</span>
                      ) : scriptDurOpen ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">Duração:</span>
                          {duracoes.map((dur) => (
                            <Button
                              key={dur.key}
                              variant="ghost"
                              disabled={!!partBusy}
                              onClick={() => regenPart(d.id, "script", dur.key)}
                            >
                              {dur.label}
                            </Button>
                          ))}
                          <Button variant="ghost" onClick={() => setScriptDurOpen(false)}>
                            cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" disabled={!!partBusy} onClick={() => setScriptDurOpen(true)}>
                          Gerar outro roteiro
                        </Button>
                      )}
                    </div>

                    {/* Legenda */}
                    <div className="space-y-2">
                      <Field
                        label="Legenda"
                        value={form.caption}
                        onChange={(v) => setForm({ ...form, caption: v })}
                        rows={4}
                      />
                      {partBusy === "caption" ? (
                        <span className="text-xs text-muted">Gerando outra legenda…</span>
                      ) : (
                        <Button variant="ghost" disabled={!!partBusy} onClick={() => regenPart(d.id, "caption")}>
                          Gerar outra legenda
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 border-t border-cream-deep/50 pt-4">
                      <Button
                        variant="primary"
                        disabled={busy || !!partBusy}
                        onClick={() => act(() => api.editDraft(d.id, form), "Roteiro salvo e verificado.")}
                      >
                        Salvar
                      </Button>
                      <Button variant="ghost" disabled={!!partBusy} onClick={cancelEdit}>
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
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-cream-deep/50 pt-4">
                      <Button variant="ghost" onClick={() => startEdit(d)}>
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => setTeleDraft(d)}>
                        Teleprompter
                      </Button>

                      {(d.status === "rascunho" || d.status === "rejeitado") && (
                        <Button
                          variant="primary"
                          disabled={locked}
                          onClick={() =>
                            act(() => api.approve(d.id), "Aprovado. Agora é só arrastar no calendário para agendar.")
                          }
                        >
                          Aprovar
                        </Button>
                      )}
                      {d.status === "rascunho" && (
                        <Button
                          variant="ghost"
                          disabled={locked}
                          onClick={() => act(() => api.reject(d.id), "Rejeitado.")}
                        >
                          Rejeitar
                        </Button>
                      )}
                    </div>

                    {(d.oabConforme === true || d.oabConforme === false) && (
                      <OabResult
                        draft={d}
                        canFix={d.status !== "publicado"}
                        fixing={fixBusy === d.id}
                        onFix={() => fixOab(d.id)}
                      />
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {teleDraft && (
        <Teleprompter
          hook={teleDraft.hook}
          script={teleDraft.script}
          onClose={() => setTeleDraft(null)}
        />
      )}
    </div>
  );
}

function OabResult({ draft, canFix, fixing, onFix }) {
  if (draft.oabConforme === true) {
    return (
      <div className="mt-3">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "#E6EFEA", color: "#1B4332" }}
        >
          OAB: conforme · conferência automática
        </span>
      </div>
    );
  }

  let alertas = [];
  try {
    alertas = JSON.parse(draft.oabAlertas || "[]");
  } catch {
    alertas = [];
  }

  return (
    <div
      className="mt-3 rounded-xl border px-4 py-3 text-sm"
      style={{ backgroundColor: "#FBF3E0", borderColor: "#C9A961", color: "#7a531f" }}
    >
      <p className="font-semibold">Atenção — vale revisar (OAB):</p>
      {alertas.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {alertas.map((a, i) => (
            <li key={i}>
              <span className="font-medium">{a.problema}</span>
              {a.sugestao && (
                <span className="mt-0.5 block text-xs" style={{ opacity: 0.85 }}>
                  Sugestão: {a.sugestao}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1">
          A verificação sinalizou atenção, mas não detalhou os pontos. Vale revisar manualmente.
        </p>
      )}

      {canFix && (
        <div className="mt-3">
          <Button variant="primary" disabled={fixing} onClick={onFix}>
            {fixing ? "Gerando versão corrigida…" : "Gerar versão corrigida"}
          </Button>
        </div>
      )}

      <p className="mt-2 text-xs" style={{ opacity: 0.8 }}>
        Conferência automática, de apoio. A palavra final é sua.
      </p>
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
