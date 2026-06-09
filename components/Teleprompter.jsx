"use client";

// Teleprompter em tela cheia, na identidade do escritório (verde profundo + creme +
// dourado). Mostra o roteiro em letra grande rolando devagar, para a Dra. Sara ler
// enquanto grava. Não fala com o backend — recebe o texto pronto via props.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Teleprompter({ hook, script, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(55); // pixels por segundo
  const [fontSize, setFontSize] = useState(36); // pixels
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  const speedRef = useRef(55);
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const accRef = useRef(0); // acumula frações de pixel entre frames

  // Trava a rolagem da página de trás enquanto o teleprompter está aberto.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  // Renderiza só no cliente (o teleprompter é aberto via portal no body).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Teclado: espaço = reproduzir/pausar, Esc = fechar.
  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Rolagem automática, suave e independente da taxa de quadros.
  // Lê a velocidade de um ref para não reiniciar a animação ao arrastar o controle.
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      return;
    }
    function step(ts) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const el = scrollRef.current;
      if (el) {
        accRef.current += speedRef.current * dt;
        const inteiro = Math.floor(accRef.current);
        if (inteiro > 0) {
          accRef.current -= inteiro;
          el.scrollTop += inteiro;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
            setPlaying(false);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  function setSpd(v) {
    speedRef.current = v;
    setSpeed(v);
  }

  function restart() {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    accRef.current = 0;
  }

  // Divide o roteiro em blocos (carrosséis usam "---" entre cartões).
  const blocos = String(script || "")
    .split(/\n?-{3,}\n?/)
    .map((b) => b.trim())
    .filter(Boolean);

  const t = dark
    ? {
        bg: "#0E211A",
        text: "#EFE9DC",
        hook: "#DCC07E",
        panel: "#13271D",
        line: "rgba(201,169,97,0.22)",
        track: "rgba(239,233,220,0.18)",
        ghostBorder: "rgba(239,233,220,0.22)",
        ghostText: "#EFE9DC",
        playBg: "#C9A961",
        playIcon: "#0E211A",
      }
    : {
        bg: "#F5F0E8",
        text: "#2A241E",
        hook: "#9C6B2E",
        panel: "#FBF9F4",
        line: "rgba(176,125,58,0.3)",
        track: "rgba(42,36,30,0.14)",
        ghostBorder: "#E0D6C4",
        ghostText: "#1B4332",
        playBg: "#1B4332",
        playIcon: "#F5F0E8",
      };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: t.bg, height: "100dvh" }}
    >
      <style>{`
        .tp-range { -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background:${t.track}; outline:none; }
        .tp-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:${t.playBg}; cursor:pointer; border:3px solid ${t.bg}; box-shadow:0 0 0 1px ${t.line}; }
        .tp-range::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:${t.playBg}; cursor:pointer; border:3px solid ${t.bg}; }
      `}</style>

      {/* Barra superior */}
      <div
        className="flex shrink-0 items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${t.line}` }}
      >
        <span
          style={{ color: t.hook, letterSpacing: "0.18em", fontFamily: "Mulish, system-ui, sans-serif" }}
          className="text-xs font-bold uppercase"
        >
          Teleprompter
        </span>
        <button
          onClick={onClose}
          style={{ color: t.ghostText, borderColor: t.ghostBorder }}
          className="flex h-9 w-9 items-center justify-center rounded-full border text-xl leading-none"
          aria-label="Fechar teleprompter"
        >
          ×
        </button>
      </div>

      {/* Área de leitura */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        {/* esmaecimento no topo e na base */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
          style={{ height: "16%", background: `linear-gradient(to bottom, ${t.bg} 0%, ${t.bg}00 100%)` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
          style={{ height: "22%", background: `linear-gradient(to top, ${t.bg} 0%, ${t.bg}00 100%)` }}
        />
        {/* marcador de leitura */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
          style={{ top: "30%" }}
        >
          <div style={{ flex: 1, borderTop: `1px solid ${t.line}` }} />
        </div>

        <div ref={scrollRef} className="h-full overflow-y-auto px-6 sm:px-10">
          <div
            style={{
              paddingTop: "30vh",
              paddingBottom: "82vh",
              maxWidth: "820px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            {hook && (
              <p
                style={{
                  color: t.hook,
                  fontSize: fontSize * 1.08,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  marginBottom: "0.9em",
                  fontFamily: "Fraunces, Georgia, serif",
                }}
              >
                {hook}
              </p>
            )}
            {blocos.map((b, i) => (
              <div key={i}>
                {i > 0 && (
                  <div
                    style={{
                      width: 44,
                      height: 2,
                      backgroundColor: t.hook,
                      opacity: 0.5,
                      margin: "0.9em auto",
                      borderRadius: 2,
                    }}
                  />
                )}
                <p
                  style={{
                    color: t.text,
                    fontSize: fontSize,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    fontWeight: 500,
                    fontFamily: "Mulish, system-ui, sans-serif",
                  }}
                >
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de controles */}
      <div
        className="shrink-0 px-4 pt-3"
        style={{
          backgroundColor: t.panel,
          borderTop: `1px solid ${t.line}`,
          paddingBottom: "max(0.85rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* velocidade */}
        <div className="mx-auto mb-3 flex max-w-2xl items-center gap-3">
          <span
            style={{ color: t.ghostText, opacity: 0.8 }}
            className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide"
          >
            Velocidade
          </span>
          <span style={{ color: t.ghostText, opacity: 0.6 }} className="text-xs">
            devagar
          </span>
          <input
            type="range"
            className="tp-range"
            min={15}
            max={220}
            step={5}
            value={speed}
            onChange={(e) => setSpd(Number(e.target.value))}
            aria-label="Velocidade de rolagem"
          />
          <span style={{ color: t.ghostText, opacity: 0.6 }} className="text-xs">
            rápido
          </span>
        </div>

        {/* botões */}
        <div className="mx-auto grid max-w-2xl grid-cols-3 items-center">
          {/* esquerda: tamanho do texto */}
          <div className="flex items-center gap-1 justify-self-start">
            <button
              onClick={() => setFontSize((f) => Math.max(20, f - 4))}
              style={{ color: t.ghostText, borderColor: t.ghostBorder }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border font-bold leading-none"
              aria-label="Diminuir o texto"
            >
              <span style={{ fontSize: 13 }}>A</span>
            </button>
            <button
              onClick={() => setFontSize((f) => Math.min(72, f + 4))}
              style={{ color: t.ghostText, borderColor: t.ghostBorder }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border font-bold leading-none"
              aria-label="Aumentar o texto"
            >
              <span style={{ fontSize: 20 }}>A</span>
            </button>
          </div>

          {/* centro: reproduzir/pausar */}
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{ backgroundColor: t.playBg, color: t.playIcon }}
            className="h-16 w-16 justify-self-center rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center"
            aria-label={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                <rect x="6" y="5" width="4.5" height="14" rx="1.2" fill="currentColor" />
                <rect x="13.5" y="5" width="4.5" height="14" rx="1.2" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                <path
                  d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* direita: reiniciar e tema */}
          <div className="flex items-center gap-2 justify-self-end">
            <button
              onClick={restart}
              style={{ color: t.ghostText, borderColor: t.ghostBorder }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border"
              aria-label="Reiniciar do começo"
              title="Reiniciar"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              style={{ color: t.ghostText, borderColor: t.ghostBorder }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border"
              aria-label={dark ? "Mudar para fundo claro" : "Mudar para fundo escuro"}
              title={dark ? "Fundo claro" : "Fundo escuro"}
            >
              {dark ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
