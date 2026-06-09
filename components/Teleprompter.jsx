"use client";

// Teleprompter em tela cheia: mostra o roteiro em letra grande rolando devagar,
// para a Dra. Sara ler enquanto grava o reel. Não fala com o backend — recebe o
// texto pronto via props.

import { useEffect, useRef, useState } from "react";

export function Teleprompter({ hook, script, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50); // pixels por segundo
  const [fontSize, setFontSize] = useState(34); // pixels
  const [dark, setDark] = useState(true);

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
        accRef.current += speed * dt;
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
  }, [playing, speed]);

  function restart() {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    accRef.current = 0;
  }

  // Divide o roteiro em blocos (carrosséis usam "---" entre cartões).
  const blocos = String(script || "")
    .split(/\n?-{3,}\n?/)
    .map((b) => b.trim())
    .filter(Boolean);

  const bg = dark ? "#0E0C0A" : "#F5F0E8";
  const fg = dark ? "#F3EEE4" : "#2A241E";
  const barBg = dark ? "#1A1612" : "#FBF9F4";
  const barLine = dark ? "#2C2620" : "#E0D6C4";
  const gold = "#C9A961";
  const green = "#1B4332";

  const ctrlStyle = {
    backgroundColor: dark ? "#241F18" : "#ffffff",
    color: fg,
    borderColor: barLine,
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: bg }}>
      {/* Barra superior */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${barLine}` }}
      >
        <span className="text-sm font-semibold" style={{ color: gold, letterSpacing: "0.12em" }}>
          TELEPROMPTER
        </span>
        <button
          onClick={onClose}
          style={{ color: fg }}
          className="px-2 text-3xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      {/* Área de leitura */}
      <div className="relative flex-1 overflow-hidden">
        {/* Guia de leitura (onde olhar) */}
        <div
          className="pointer-events-none absolute left-0 right-0"
          style={{ top: "28%", borderTop: `2px solid ${gold}`, opacity: 0.3 }}
        />
        <div ref={scrollRef} className="h-full overflow-y-auto px-6 sm:px-10">
          <div style={{ paddingTop: "26vh", paddingBottom: "80vh", maxWidth: "880px", margin: "0 auto" }}>
            {hook && (
              <p
                style={{
                  color: gold,
                  fontSize: fontSize * 1.05,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  marginBottom: "1.1em",
                }}
              >
                {hook}
              </p>
            )}
            {blocos.map((b, i) => (
              <div key={i}>
                {i > 0 && (
                  <div style={{ height: 2, backgroundColor: barLine, opacity: 0.5, margin: "1em 0" }} />
                )}
                <p
                  style={{
                    color: fg,
                    fontSize: fontSize,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    fontWeight: 500,
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
      <div className="px-3 py-3" style={{ backgroundColor: barBg, borderTop: `1px solid ${barLine}` }}>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{ backgroundColor: green, color: "#fff" }}
            className="min-w-[120px] rounded-lg px-5 py-2.5 font-semibold"
          >
            {playing ? "Pausar" : "Reproduzir"}
          </button>

          <Stepper
            label="Velocidade"
            onMinus={() => setSpeed((s) => Math.max(15, s - 15))}
            onPlus={() => setSpeed((s) => Math.min(220, s + 15))}
            style={ctrlStyle}
          />
          <Stepper
            label="Texto"
            onMinus={() => setFontSize((f) => Math.max(20, f - 4))}
            onPlus={() => setFontSize((f) => Math.min(72, f + 4))}
            style={ctrlStyle}
          />

          <button onClick={restart} style={ctrlStyle} className="rounded-lg border px-4 py-2.5 font-semibold">
            Reiniciar
          </button>
          <button onClick={() => setDark((d) => !d)} style={ctrlStyle} className="rounded-lg border px-4 py-2.5 font-semibold">
            {dark ? "Fundo claro" : "Fundo escuro"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ label, onMinus, onPlus, style }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onMinus}
        style={style}
        className="h-10 w-10 rounded-lg border text-xl font-bold leading-none"
        aria-label={`Diminuir ${label}`}
      >
        −
      </button>
      <span
        style={{ color: style.color, opacity: 0.85 }}
        className="min-w-[68px] px-1 text-center text-xs font-semibold uppercase"
      >
        {label}
      </span>
      <button
        onClick={onPlus}
        style={style}
        className="h-10 w-10 rounded-lg border text-xl font-bold leading-none"
        aria-label={`Aumentar ${label}`}
      >
        +
      </button>
    </div>
  );
}
