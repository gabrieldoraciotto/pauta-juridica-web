"use client";

// Tela do Calendário editorial — Pauta Jurídica
// Agendamento manual: a Sara escolhe os dias da semana em que publica, e arrasta
// (no computador) ou toca (no celular) os roteiros aprovados para os dias válidos.
// Sem limite de roteiros por dia — só os dias da semana é que são restritos.

import { useState, useEffect, useMemo, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// Toda chamada do calendário leva a senha do escritório (mesma chave que o
// lib/api usa). Num 401, avisa a tela de entrada (AuthGate) e ela reaparece.
function authFetch(url, opts = {}) {
  let key = "";
  try {
    key = localStorage.getItem("pj_key") || "";
  } catch {}
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), "x-app-key": key },
  }).then((res) => {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("pj-auth"));
    }
    return res;
  });
}

const C = {
  bg: "#F5F0E8",
  bgAlt: "#E8DCC8",
  card: "#FBF9F4",
  green: "#1B4332",
  greenSoft: "#2D5A45",
  gold: "#C9A961",
  goldDark: "#B07D3A",
  ink: "#2A241E",
  muted: "#8A7F6E",
  blockedBg: "#EDE6D8",
  line: "#E0D6C4",
};

const WEEKDAYS = [
  { idx: 0, short: "Dom", long: "Domingo" },
  { idx: 1, short: "Seg", long: "Segunda" },
  { idx: 2, short: "Ter", long: "Terça" },
  { idx: 3, short: "Qua", long: "Quarta" },
  { idx: 4, short: "Qui", long: "Quinta" },
  { idx: 5, short: "Sex", long: "Sexta" },
  { idx: 6, short: "Sáb", long: "Sábado" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Máximo de dias da semana que a Sara pode marcar como dias de publicação.
const MAX_CADENCE_DAYS = 3;

// ---- helpers de data (tudo em UTC meio-dia, igual ao backend, p/ não virar o dia) ----
function ymd(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateAtNoon(y, m, day) {
  return new Date(Date.UTC(y, m, day, 12, 0, 0));
}
const serif = { fontFamily: "Fraunces, Georgia, serif" };
const sans = { fontFamily: "Mulish, system-ui, sans-serif" };

export default function CalendarioPage() {
  const [cadenceDays, setCadenceDays] = useState([]);
  const [queue, setQueue] = useState([]); // roteiros aprovados (fila)
  const [scheduled, setScheduled] = useState([]); // roteiros já agendados (/calendar)
  const [pendingCount, setPendingCount] = useState(0); // rascunhos aguardando aprovação
  const [view, setView] = useState(() => {
    const n = new Date();
    return { y: n.getUTCFullYear(), m: n.getUTCMonth() };
  });
  const [selectedId, setSelectedId] = useState(null); // card selecionado p/ toque
  const [modal, setModal] = useState(null); // {type:'draft',draft} | {type:'day',dateStr,items}
  const [dragOver, setDragOver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingCadence, setSavingCadence] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, q, cal, pend] = await Promise.all([
        authFetch(`${API}/settings`).then((r) => r.json()),
        authFetch(`${API}/drafts?status=aprovado`).then((r) => r.json()),
        authFetch(`${API}/calendar`).then((r) => r.json()),
        authFetch(`${API}/drafts?status=rascunho`).then((r) => r.json()),
      ]);
      setCadenceDays(Array.isArray(s?.cadenceDays) ? s.cadenceDays : []);
      setQueue(Array.isArray(q) ? q : []);
      setScheduled(Array.isArray(cal) ? cal : []);
      setPendingCount(Array.isArray(pend) ? pend.length : 0);
    } catch (e) {
      setMsg({ type: "error", text: "Não consegui falar com o servidor. Ele está no ar?" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  // ---- ações ----
  async function scheduleDraft(id, dateStr) {
    if (!id || busy) return;
    setBusy(true);
    try {
      const res = await authFetch(`${API}/drafts/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      if (res.status === 409) {
        setMsg({ type: "error", text: "Esse dia não é um dia de publicação." });
        return;
      }
      if (!res.ok) {
        setMsg({ type: "error", text: "Não consegui agendar. Tente de novo." });
        return;
      }
      setSelectedId(null);
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function unschedule(id) {
    if (busy) return;
    setBusy(true);
    try {
      await authFetch(`${API}/drafts/${id}/unschedule`, { method: "POST" });
      setModal(null);
      await loadAll();
      setMsg({ type: "info", text: "Roteiro devolvido para a fila." });
    } finally {
      setBusy(false);
    }
  }

  async function publish(id) {
    if (busy) return;
    setBusy(true);
    try {
      await authFetch(`${API}/drafts/${id}/publish`, { method: "POST" });
      setModal(null);
      await loadAll();
      setMsg({ type: "info", text: "Roteiro marcado como publicado." });
    } finally {
      setBusy(false);
    }
  }

  async function saveCadence(newDays) {
    setSavingCadence(true);
    try {
      const res = await authFetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadenceDays: newDays }),
      });
      const data = await res.json();
      setCadenceDays(Array.isArray(data?.cadenceDays) ? data.cadenceDays : newDays);
      if (data?.devolvidos > 0) {
        setMsg({
          type: "info",
          text: `${data.devolvidos} roteiro(s) voltaram para a fila porque o dia deixou de ser de publicação.`,
        });
      }
      await loadAll();
    } catch (e) {
      setMsg({ type: "error", text: "Não consegui salvar os dias de publicação." });
    } finally {
      setSavingCadence(false);
    }
  }

  function toggleDay(idx) {
    if (savingCadence) return;
    const has = cadenceDays.includes(idx);
    // Não deixa adicionar um novo dia se já bateu o limite (só dá pra trocar).
    if (!has && cadenceDays.length >= MAX_CADENCE_DAYS) return;
    const next = has
      ? cadenceDays.filter((d) => d !== idx)
      : [...cadenceDays, idx].sort((a, b) => a - b);
    saveCadence(next);
  }

  // ---- grade do mês ----
  const grid = useMemo(() => {
    const { y, m } = view;
    const first = dateAtNoon(y, m, 1);
    const startWeekday = first.getUTCDay();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ d: dateAtNoon(y, m, 1 - (startWeekday - i)), inMonth: false });
    }
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ d: dateAtNoon(y, m, day), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].d;
      const nd = new Date(last);
      nd.setUTCDate(nd.getUTCDate() + 1);
      cells.push({ d: nd, inMonth: false });
    }
    return cells;
  }, [view]);

  const byDay = useMemo(() => {
    const map = {};
    for (const dr of scheduled) {
      if (!dr.scheduledDate) continue;
      const key = ymd(new Date(dr.scheduledDate));
      (map[key] ||= []).push(dr);
    }
    return map;
  }, [scheduled]);

  const todayStr = ymd(new Date());

  const agendadosCount = scheduled.filter((d) => d.status === "agendado").length;
  const publicadosCount = scheduled.filter((d) => d.status === "publicado").length;

  const proximoDiaLivre = useMemo(() => {
    if (cadenceDays.length === 0) return null;
    const base = new Date();
    for (let i = 0; i < 90; i++) {
      const d = dateAtNoon(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i);
      if (cadenceDays.includes(d.getUTCDay()) && !(byDay[ymd(d)]?.length)) {
        return d;
      }
    }
    return null;
  }, [cadenceDays, byDay]);

  function prevMonth() {
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  }
  function nextMonth() {
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  }

  function onCellClick(cell, isValid) {
    if (!cell.inMonth || !isValid) return;
    const dateStr = ymd(cell.d);
    if (selectedId) {
      scheduleDraft(selectedId, dateStr);
      return;
    }
    const items = byDay[dateStr] || [];
    if (items.length > 0) {
      setModal({ type: "day", dateStr, items });
    }
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", color: C.ink, ...sans }}>
      {msg && <Toast msg={msg} onClose={() => setMsg(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p style={{ color: C.goldDark, letterSpacing: "0.12em" }} className="text-xs font-semibold uppercase mb-1">
              Planejamento
            </p>
            <h1 style={{ ...serif, color: C.green }} className="text-3xl lg:text-4xl font-semibold">
              Calendário editorial
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              style={{ backgroundColor: C.card, borderColor: C.line, color: C.green }}
              className="border rounded-lg w-10 h-10 text-lg leading-none hover:opacity-80"
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <div style={{ ...serif, color: C.ink }} className="text-lg font-semibold min-w-[170px] text-center">
              {MONTHS[view.m]} {view.y}
            </div>
            <button
              onClick={nextMonth}
              style={{ backgroundColor: C.card, borderColor: C.line, color: C.green }}
              className="border rounded-lg w-10 h-10 text-lg leading-none hover:opacity-80"
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </div>

        {/* Seletor de dias de publicação */}
        <div
          style={{ backgroundColor: C.card, borderColor: C.line }}
          className="border rounded-2xl p-4 lg:p-5 mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0">
              <p style={{ color: C.green }} className="font-semibold">
                Dias de publicação{" "}
                <span
                  style={{ color: cadenceDays.length >= MAX_CADENCE_DAYS ? C.goldDark : C.muted }}
                  className="text-sm font-normal"
                >
                  ({cadenceDays.length}/{MAX_CADENCE_DAYS})
                </span>
              </p>
              <p style={{ color: C.muted }} className="text-xs">
                Escolha até {MAX_CADENCE_DAYS} dias. Os demais ficam bloqueados no calendário.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {WEEKDAYS.map((w) => {
                const on = cadenceDays.includes(w.idx);
                const capReached = cadenceDays.length >= MAX_CADENCE_DAYS;
                const blocked = !on && capReached;
                const disabled = savingCadence || blocked;
                return (
                  <button
                    key={w.idx}
                    onClick={() => toggleDay(w.idx)}
                    disabled={disabled}
                    title={
                      blocked
                        ? `Máximo de ${MAX_CADENCE_DAYS} dias. Desmarque um para trocar.`
                        : undefined
                    }
                    style={{
                      backgroundColor: on ? C.green : "transparent",
                      color: on ? "#fff" : blocked ? "#C7BCA8" : C.muted,
                      borderColor: on ? C.green : blocked ? "#EADFCC" : C.line,
                      opacity: savingCadence ? 0.6 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                    className="border rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-w-[52px]"
                  >
                    {w.short}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Faixa de roteiros prontos (fila) */}
        <div
          style={{ backgroundColor: C.bgAlt, borderColor: C.line }}
          className="border rounded-2xl p-4 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: C.green }} className="font-semibold">
              Roteiros prontos para agendar{" "}
              <span style={{ color: C.muted }} className="font-normal">
                ({queue.length})
              </span>
            </p>
            {selectedId && (
              <button
                onClick={() => setSelectedId(null)}
                style={{ color: C.goldDark }}
                className="text-sm font-semibold underline"
              >
                cancelar seleção
              </button>
            )}
          </div>

          {selectedId && (
            <p
              style={{ color: C.goldDark, backgroundColor: "#FBF3E0", borderColor: C.gold }}
              className="border rounded-lg px-3 py-2 text-sm mb-3"
            >
              Roteiro selecionado. Toque num dia disponível do calendário para agendar.
            </p>
          )}

          {loading ? (
            <p style={{ color: C.muted }} className="text-sm py-2">Carregando…</p>
          ) : queue.length === 0 ? (
            <p style={{ color: C.muted }} className="text-sm py-2">
              Nenhum roteiro aprovado na fila. Aprove roteiros na aba Roteiros para que apareçam aqui.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {queue.map((dr) => (
                <QueueCard
                  key={dr.id}
                  draft={dr}
                  selected={selectedId === dr.id}
                  onSelect={() => setSelectedId(selectedId === dr.id ? null : dr.id)}
                  onView={() => setModal({ type: "draft", draft: dr })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Calendário + Dashboard */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Grade */}
          <div
            style={{ backgroundColor: C.card, borderColor: C.line }}
            className="border rounded-2xl p-3 lg:p-4 flex-1 min-w-0"
          >
            {/* Desktop: grade do mês */}
            <div className="hidden lg:block">
            <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w.idx}
                  style={{ color: cadenceDays.includes(w.idx) ? C.green : C.muted }}
                  className="text-center text-[11px] lg:text-xs font-semibold uppercase py-1"
                >
                  <span className="lg:hidden">{w.short}</span>
                  <span className="hidden lg:inline">{w.long}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
              {grid.map((cell, i) => {
                const dateStr = ymd(cell.d);
                const weekday = cell.d.getUTCDay();
                const isValid = cadenceDays.includes(weekday);
                const items = byDay[dateStr] || [];
                const isToday = dateStr === todayStr;
                const droppable = cell.inMonth && isValid;
                const isDragOver = dragOver === dateStr;

                return (
                  <div
                    key={i}
                    onClick={() => onCellClick(cell, isValid)}
                    onDragOver={(e) => {
                      if (droppable) {
                        e.preventDefault();
                        setDragOver(dateStr);
                      }
                    }}
                    onDragLeave={() => setDragOver((p) => (p === dateStr ? null : p))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      if (!droppable) return;
                      const id = e.dataTransfer.getData("text/plain");
                      if (id) scheduleDraft(id, dateStr);
                    }}
                    style={{
                      backgroundColor: !cell.inMonth
                        ? "transparent"
                        : isValid
                        ? isDragOver
                          ? "#EAF2EC"
                          : C.bg
                        : C.blockedBg,
                      borderColor: isDragOver ? C.green : isToday ? C.gold : C.line,
                      borderWidth: isDragOver || isToday ? 2 : 1,
                      opacity: cell.inMonth ? 1 : 0.4,
                      cursor: droppable && (selectedId || items.length) ? "pointer" : "default",
                      minHeight: "76px",
                    }}
                    className="border rounded-lg p-1.5 lg:p-2 relative transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        style={{ color: isValid && cell.inMonth ? C.ink : C.muted }}
                        className="text-xs lg:text-sm font-semibold"
                      >
                        {cell.d.getUTCDate()}
                      </span>
                      {!isValid && cell.inMonth && (
                        <span style={{ color: C.muted }} className="text-[9px] hidden lg:inline">
                          bloqueado
                        </span>
                      )}
                    </div>

                    {/* desktop: mini-cards */}
                    {cell.inMonth && items.length > 0 && (
                      <div className="mt-1 hidden lg:flex flex-col gap-1">
                        {items.slice(0, 2).map((dr) => (
                          <MiniCard
                            key={dr.id}
                            draft={dr}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: "draft", draft: dr });
                            }}
                          />
                        ))}
                        {items.length > 2 && (
                          <span style={{ color: C.goldDark }} className="text-[10px] font-semibold pl-0.5">
                            +{items.length - 2} mais
                          </span>
                        )}
                      </div>
                    )}

                    {/* mobile: contador */}
                    {cell.inMonth && items.length > 0 && (
                      <div className="mt-1 lg:hidden">
                        <span
                          style={{ backgroundColor: C.green, color: "#fff" }}
                          className="inline-block rounded-full text-[10px] font-bold px-1.5 py-0.5"
                        >
                          {items.length}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>{/* fim grade desktop */}

            {/* Mobile: agenda em lista (no lugar da grade espremida) */}
            <div className="lg:hidden">
              <MobileAgenda
                grid={grid}
                cadenceDays={cadenceDays}
                byDay={byDay}
                todayStr={todayStr}
                selectedId={selectedId}
                onDayClick={(cell) => onCellClick(cell, true)}
              />
            </div>
          </div>

          {/* Dashboard */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <Metric label="Aguardando aprovação" value={pendingCount} color={C.goldDark} />
              <Metric label="Prontos na fila" value={queue.length} color={C.green} />
              <Metric label="Agendados" value={agendadosCount} color={C.greenSoft} />
              <Metric label="Publicados" value={publicadosCount} color={C.muted} />
            </div>

            <div
              style={{ backgroundColor: C.card, borderColor: C.line }}
              className="border rounded-2xl p-4"
            >
              <p style={{ color: C.muted }} className="text-xs uppercase font-semibold mb-1">
                Próximo dia livre
              </p>
              <p style={{ ...serif, color: C.green }} className="text-lg font-semibold">
                {proximoDiaLivre
                  ? `${WEEKDAYS[proximoDiaLivre.getUTCDay()].short}, ${proximoDiaLivre.getUTCDate()} ${MONTHS[
                      proximoDiaLivre.getUTCMonth()
                    ].slice(0, 3).toLowerCase()}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      {modal?.type === "draft" && (
        <DraftModal
          draft={modal.draft}
          busy={busy}
          onClose={() => setModal(null)}
          onUnschedule={() => unschedule(modal.draft.id)}
          onPublish={() => publish(modal.draft.id)}
        />
      )}
      {modal?.type === "day" && (
        <DayModal
          dateStr={modal.dateStr}
          items={modal.items}
          onClose={() => setModal(null)}
          onOpenDraft={(dr) => setModal({ type: "draft", draft: dr })}
        />
      )}
    </div>
  );
}

// ---------- subcomponentes ----------

function formatBadgeStyle(format) {
  return format === "carrossel"
    ? { backgroundColor: "#FBF3E0", color: C.goldDark, label: "Carrossel" }
    : { backgroundColor: "#E6EFEA", color: C.green, label: "Reel" };
}

function QueueCard({ draft, selected, onSelect, onView }) {
  const b = formatBadgeStyle(draft.format);
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", draft.id)}
      onClick={onSelect}
      style={{
        backgroundColor: C.card,
        borderColor: selected ? C.green : C.line,
        borderWidth: selected ? 2 : 1,
        width: "210px",
      }}
      className="border rounded-xl p-3 shrink-0 cursor-grab active:cursor-grabbing"
      title="Arraste para um dia, ou toque para selecionar"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          style={{ backgroundColor: b.backgroundColor, color: b.color }}
          className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5"
        >
          {b.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          style={{ color: C.goldDark }}
          className="text-[11px] font-semibold underline"
        >
          ver
        </button>
      </div>
      <p style={{ color: C.muted }} className="text-[10px] mb-1 truncate">
        {draft.article?.source?.name || "—"}
      </p>
      <p style={{ color: C.ink }} className="text-sm font-medium leading-snug line-clamp-3">
        {draft.hook}
      </p>
    </div>
  );
}

function MiniCard({ draft, onClick }) {
  const b = formatBadgeStyle(draft.format);
  const published = draft.status === "publicado";
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/plain", draft.id);
      }}
      onClick={onClick}
      style={{
        backgroundColor: published ? "#EDEFEA" : b.backgroundColor,
        borderColor: C.line,
        opacity: published ? 0.75 : 1,
      }}
      className="border rounded px-1.5 py-1 cursor-pointer"
      title={draft.hook}
    >
      <p style={{ color: published ? C.muted : b.color }} className="text-[10px] font-semibold leading-tight line-clamp-2">
        {published ? "✓ " : ""}
        {draft.hook}
      </p>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ backgroundColor: C.card, borderColor: C.line }} className="border rounded-2xl p-4">
      <p style={{ color: C.muted }} className="text-xs uppercase font-semibold mb-1">
        {label}
      </p>
      <p style={{ ...serif, color }} className="text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ backgroundColor: "rgba(42,36,30,0.45)" }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: C.card }}
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}

function DraftModal({ draft, busy, onClose, onUnschedule, onPublish }) {
  const b = formatBadgeStyle(draft.format);
  const isScheduled = draft.status === "agendado" || draft.status === "publicado";
  return (
    <Overlay onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span
            style={{ backgroundColor: b.backgroundColor, color: b.color }}
            className="text-[11px] font-bold uppercase rounded px-2 py-1"
          >
            {b.label}
          </span>
          <button onClick={onClose} style={{ color: C.muted }} className="text-2xl leading-none">
            ×
          </button>
        </div>

        <p style={{ color: C.muted }} className="text-xs mb-3">
          {draft.article?.source?.name || "—"}
          {draft.article?.title ? ` · ${draft.article.title}` : ""}
        </p>

        <p style={{ color: C.muted }} className="text-[11px] uppercase font-semibold mb-1">Gancho</p>
        <p style={{ ...serif, color: C.green }} className="text-lg font-semibold mb-4 leading-snug">
          {draft.hook}
        </p>

        <p style={{ color: C.muted }} className="text-[11px] uppercase font-semibold mb-1">Roteiro</p>
        <p style={{ color: C.ink }} className="text-sm whitespace-pre-wrap leading-relaxed mb-4">
          {draft.script}
        </p>

        <p style={{ color: C.muted }} className="text-[11px] uppercase font-semibold mb-1">Legenda</p>
        <p style={{ color: C.ink }} className="text-sm whitespace-pre-wrap leading-relaxed mb-5">
          {draft.caption}
        </p>

        {isScheduled ? (
          <div className="flex flex-col sm:flex-row gap-2">
            {draft.status !== "publicado" && (
              <button
                onClick={onPublish}
                disabled={busy}
                style={{ backgroundColor: C.green, color: "#fff", opacity: busy ? 0.6 : 1 }}
                className="rounded-lg px-4 py-2.5 font-semibold flex-1"
              >
                Marcar como publicado
              </button>
            )}
            <button
              onClick={onUnschedule}
              disabled={busy}
              style={{ borderColor: C.goldDark, color: C.goldDark, opacity: busy ? 0.6 : 1 }}
              className="border rounded-lg px-4 py-2.5 font-semibold flex-1"
            >
              Devolver para a fila
            </button>
          </div>
        ) : (
          <p style={{ color: C.muted }} className="text-xs">
            Arraste este roteiro para um dia do calendário (ou toque nele e depois num dia) para agendar.
          </p>
        )}
      </div>
    </Overlay>
  );
}

function DayModal({ dateStr, items, onClose, onOpenDraft }) {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const dateObj = dateAtNoon(y, m - 1, d);
  return (
    <Overlay onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ ...serif, color: C.green }} className="text-xl font-semibold">
            {WEEKDAYS[dateObj.getUTCDay()].long}, {d} de {MONTHS[m - 1]}
          </h3>
          <button onClick={onClose} style={{ color: C.muted }} className="text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((dr) => {
            const b = formatBadgeStyle(dr.format);
            const published = dr.status === "publicado";
            return (
              <button
                key={dr.id}
                onClick={() => onOpenDraft(dr)}
                style={{ backgroundColor: C.bg, borderColor: C.line }}
                className="border rounded-xl p-3 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{ backgroundColor: b.backgroundColor, color: b.color }}
                    className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5"
                  >
                    {b.label}
                  </span>
                  {published && (
                    <span style={{ color: C.muted }} className="text-[10px] font-semibold">
                      ✓ publicado
                    </span>
                  )}
                </div>
                <p style={{ color: C.ink }} className="text-sm font-medium leading-snug">
                  {dr.hook}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}

function MobileAgenda({ grid, cadenceDays, byDay, todayStr, selectedId, onDayClick }) {
  const dias = grid.filter((c) => c.inMonth && cadenceDays.includes(c.d.getUTCDay()));

  if (cadenceDays.length === 0) {
    return (
      <p style={{ color: C.muted }} className="text-sm py-6 text-center">
        Escolha seus dias de publicação acima para montar a agenda.
      </p>
    );
  }
  if (dias.length === 0) {
    return (
      <p style={{ color: C.muted }} className="text-sm py-6 text-center">
        Nenhum dia de publicação neste mês.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {dias.map((cell) => {
        const dateStr = ymd(cell.d);
        const items = byDay[dateStr] || [];
        const isToday = dateStr === todayStr;
        const wd = WEEKDAYS[cell.d.getUTCDay()];
        return (
          <button
            key={dateStr}
            onClick={() => onDayClick(cell)}
            style={{
              backgroundColor: C.bg,
              borderColor: isToday ? C.gold : C.line,
              borderWidth: isToday ? 2 : 1,
            }}
            className="w-full border rounded-xl p-3 text-left flex gap-3 items-start"
          >
            <div
              style={{ backgroundColor: C.green, color: "#fff" }}
              className="shrink-0 w-12 flex flex-col items-center justify-center rounded-lg py-1.5"
            >
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
                {wd.short}
              </span>
              <span style={serif} className="text-xl font-semibold leading-none">
                {cell.d.getUTCDate()}
              </span>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {items.length === 0 ? (
                <p style={{ color: selectedId ? C.goldDark : C.muted }} className="text-sm">
                  {selectedId ? "Toque para agendar aqui" : "Livre"}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {items.map((dr) => {
                    const b = formatBadgeStyle(dr.format);
                    const published = dr.status === "publicado";
                    return (
                      <div key={dr.id} className="flex items-start gap-2">
                        <span
                          style={{ backgroundColor: b.backgroundColor, color: b.color }}
                          className="shrink-0 text-[9px] font-bold uppercase rounded px-1.5 py-0.5 mt-0.5"
                        >
                          {b.label}
                        </span>
                        <span
                          style={{ color: published ? C.muted : C.ink }}
                          className="text-sm leading-snug line-clamp-2"
                        >
                          {published ? "✓ " : ""}
                          {dr.hook}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedId && (
              <span style={{ color: C.goldDark }} className="shrink-0 text-xl leading-none pt-0.5">
                ＋
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ msg, onClose }) {
  const bg = msg.type === "error" ? "#7A2E2E" : C.green;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-2 w-full max-w-md">
      <div
        onClick={onClose}
        style={{ backgroundColor: bg, color: "#fff" }}
        className="rounded-xl px-4 py-3 shadow-lg text-sm cursor-pointer"
      >
        {msg.text}
      </div>
    </div>
  );
}
