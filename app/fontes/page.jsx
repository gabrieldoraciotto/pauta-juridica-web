"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card, Empty } from "@/components/ui";

const TIPOS = [
  { key: "imprensa_juridica", label: "Imprensa jurídica" },
  { key: "tribunal", label: "Tribunal" },
  { key: "legislativo", label: "Legislativo" },
];

export default function FontesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", feedUrl: "", type: "imprensa_juridica" });
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null); // fonte aguardando confirmação de exclusão
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      setSources(await api.sources());
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.name || !form.feedUrl) {
      setMsg("Preencha nome e URL do feed.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await api.addSource(form);
      setForm({ name: "", feedUrl: "", type: "imprensa_juridica" });
      setMsg("Fonte adicionada.");
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(s) {
    await api.toggleSource(s.id, !s.active);
    await load();
  }

  async function remove(id) {
    setBusy(true);
    setMsg("");
    try {
      await api.deleteSource(id);
      setConfirmId(null);
      setMsg("Fonte apagada.");
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise">
      <SectionTitle kicker="Configuração" title="Fontes de notícia" />

      <Card className="mb-8">
        <h2 className="mb-3 font-display text-lg text-forest">Adicionar feed</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Nome (ex.: Migalhas)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-cream-deep bg-cream px-3 py-2 text-sm outline-none focus:border-forest"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-xl border border-cream-deep bg-cream px-3 py-2 text-sm outline-none focus:border-forest"
          >
            {TIPOS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            placeholder="URL do feed RSS"
            value={form.feedUrl}
            onChange={(e) => setForm({ ...form, feedUrl: e.target.value })}
            className="rounded-xl border border-cream-deep bg-cream px-3 py-2 text-sm outline-none focus:border-forest sm:col-span-2"
          />
        </div>
        <div className="mt-3">
          <Button variant="primary" disabled={busy} onClick={add}>
            Adicionar
          </Button>
        </div>
      </Card>

      {msg && (
        <p className="mb-5 rounded-xl border border-cream-deep bg-cream-card px-4 py-2 text-sm text-muted">
          {msg}
        </p>
      )}

      {loading ? (
        <Empty>Carregando…</Empty>
      ) : sources.length === 0 ? (
        <Empty>Nenhuma fonte cadastrada.</Empty>
      ) : (
        <div className="space-y-2">
          <p className="mb-3 text-xs text-muted">
            Apagar uma fonte remove as notícias dela, mas mantém os roteiros que você já criou.
          </p>
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-cream-deep/60 bg-cream-card p-4 shadow-card"
            >
              <div className="min-w-0">
                <p className="font-display text-base text-forest">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.feedUrl}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => toggle(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    s.active ? "bg-forest text-cream" : "border border-cream-deep text-muted"
                  }`}
                >
                  {s.active ? "Ativa" : "Inativa"}
                </button>

                {confirmId === s.id ? (
                  <>
                    <button
                      onClick={() => remove(s.id)}
                      disabled={busy}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-cream disabled:opacity-60"
                      style={{ backgroundColor: "#8a2d2d" }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-full px-2 py-1.5 text-xs text-muted hover:text-forest"
                    >
                      cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmId(s.id)}
                    className="rounded-full border border-cream-deep px-3 py-1.5 text-xs text-muted transition-colors hover:text-forest"
                  >
                    Apagar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
