"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Button, Card, Badge, Empty } from "@/components/ui";

const WEEKDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function fmtDate(iso) {
  const d = new Date(iso);
  return {
    weekday: WEEKDAY[d.getDay()],
    day: d.getDate(),
    month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    isPast: d < new Date(new Date().toDateString()),
  };
}

function Metric({ label, value, tone = "forest", hint }) {
  const toneCls =
    tone === "alert" ? "text-gold-deep" : tone === "gold" ? "text-gold-deep" : "text-forest";
  return (
    <Card className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span className={`mt-1 font-display text-4xl ${toneCls}`}>{value}</span>
      {hint && <span className="mt-1 text-xs text-muted">{hint}</span>}
    </Card>
  );
}

export default function CalendarPage() {
  const [slots, setSlots] = useState([]);
  const [pending, setPending] = useState(0); // roteiros em rascunho
  const [queue, setQueue] = useState(0); // aprovados ainda não agendados
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [cal, rascunhos, aprovados] = await Promise.all([
        api.calendar(),
        api.drafts("rascunho"),
        api.drafts("aprovado"),
      ]);
      setSlots(cal);
      setPending(rascunhos.length);
      setQueue(aprovados.length);
    } catch (e) {
      setMsg(`Não consegui falar com o servidor: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(fn, label) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(label);
      await load();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const futuros = slots.filter((s) => !fmtDate(s.date).isPast);
  const vagosFuturos = futuros.filter((s) => s.status === "vago").length;
  const publicados = slots.filter((s) => s.status === "publicado").length;

  return (
    <div className="rise">
      <SectionTitle kicker="Visão geral" title="Calendário editorial">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => run(api.ingest, "Notícias coletadas.")}
          >
            Coletar notícias
          </Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => run(api.syncCalendar, "Agenda sincronizada.")}
          >
            Sincronizar agenda
          </Button>
        </div>
      </SectionTitle>

      {msg && (
        <p className="mb-5 rounded-xl border border-cream-deep bg-cream-card px-4 py-2 text-sm text-muted">
          {msg}
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Aguardando aprovação" value={pending} tone="gold" hint="roteiros em rascunho" />
        <Metric label="Estoque na fila" value={queue} hint="aprovados, prontos p/ agendar" />
        <Metric
          label="Datas sem roteiro"
          value={vagosFuturos}
          tone={vagosFuturos > 0 ? "alert" : "forest"}
          hint={vagosFuturos > 0 ? "risco de furo na cadência" : "tudo coberto"}
        />
        <Metric label="Publicados" value={publicados} hint="já no ar" />
      </div>

      <h2 className="mb-4 font-display text-lg text-forest">Próximas datas</h2>

      {loading ? (
        <Empty>Carregando…</Empty>
      ) : futuros.length === 0 ? (
        <Empty>
          Nenhuma data gerada ainda. Clique em <strong>Sincronizar agenda</strong> para criar os
          slots da cadência.
        </Empty>
      ) : (
        <div className="space-y-3">
          {futuros.map((slot) => (
            <SlotRow key={slot.id} slot={slot} onPublish={() => run(() => api.publish(slot.id), "Marcado como publicado.")} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotRow({ slot, onPublish }) {
  const [open, setOpen] = useState(false);
  const d = fmtDate(slot.date);
  const vago = slot.status === "vago";
  const draft = slot.draft;

  return (
    <div
      onClick={() => {
        if (!vago) setOpen((v) => !v);
      }}
      className={`rounded-2xl border bg-cream-card p-4 shadow-card transition-shadow ${
        vago
          ? "border-dashed border-gold/70"
          : "cursor-pointer border-cream-deep/60 hover:shadow-lift"
      }`}
    >
      <div className="flex items-stretch gap-4">
        <div className="flex w-16 flex-col items-center justify-center rounded-xl bg-forest py-2 text-cream">
          <span className="text-[10px] uppercase tracking-widest text-cream/60">{d.weekday}</span>
          <span className="font-display text-2xl leading-none">{d.day}</span>
          <span className="text-[10px] uppercase text-cream/60">{d.month}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {vago ? (
            <p className="text-sm text-gold-deep">
              <strong>Data vaga.</strong> Aprove um roteiro para preencher este espaço.
            </p>
          ) : (
            <>
              <div className="mb-1 flex items-center gap-2">
                <Badge status={slot.status} />
                <span className="text-xs text-muted">
                  {draft?.format === "carrossel" ? "Carrossel" : "Reel"}
                  {draft?.article?.source ? ` · ${draft.article.source.name}` : ""}
                </span>
              </div>
              <p className="font-display text-base text-ink">{draft?.hook}</p>
            </>
          )}
        </div>

        {!vago && (
          <div className="flex items-center gap-3">
            {slot.status !== "publicado" && (
              <Button
                variant="gold"
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish();
                }}
              >
                Publicado
              </Button>
            )}
            <span className="select-none text-sm text-muted">
              {open ? "ocultar ▴" : "ver roteiro ▾"}
            </span>
          </div>
        )}
      </div>

      {!vago && open && draft && (
        <div
          className="mt-4 border-t border-cream-deep/50 pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold-deep">
            Roteiro
          </p>
          <p className="whitespace-pre-wrap text-sm text-ink">{draft.script}</p>
          {draft.caption && (
            <>
              <p className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gold-deep">
                Legenda
              </p>
              <p className="whitespace-pre-wrap rounded-xl bg-cream-deep/40 p-3 text-sm text-muted">
                {draft.caption}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
