"use client";

// Porteiro do app: se não há senha guardada no navegador, mostra a tela de
// entrada; com a senha certa, libera o conteúdo. Quando qualquer requisição
// volta 401 (senha errada/trocada), o lib/api dispara o evento "pj-auth" e
// esta tela reaparece.

import { useEffect, useState } from "react";
import { api, getAppKey, setAppKey } from "@/lib/api";

export function AuthGate({ children }) {
  const [state, setState] = useState("checking"); // checking | locked | open
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(getAppKey() ? "open" : "locked");
    const onAuth = () => setState("locked");
    window.addEventListener("pj-auth", onAuth);
    return () => window.removeEventListener("pj-auth", onAuth);
  }, []);

  async function entrar(e) {
    e.preventDefault();
    const senha = pwd.trim();
    if (!senha || busy) return;
    setBusy(true);
    setErr("");
    setAppKey(senha);
    try {
      await api.settings(); // pergunta ao servidor se a senha vale
      setPwd("");
      setState("open");
    } catch (error) {
      setErr(
        error.message === "senha necessária"
          ? "Senha incorreta."
          : "Não consegui falar com o servidor. Tente de novo."
      );
    } finally {
      setBusy(false);
    }
  }

  if (state === "open") return children;
  if (state === "checking") return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-3xl border border-cream-deep bg-cream-card p-8 shadow-card"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
          SR Advocacia
        </p>
        <h1 className="mt-1 font-display text-2xl text-forest">
          Pauta <span className="text-gold-deep">Jurídica</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Espaço do escritório. Digite a senha para entrar.
        </p>

        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Senha do escritório"
          className="mt-5 w-full rounded-xl border border-cream-deep bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-forest"
        />

        {err && <p className="mt-2 text-sm" style={{ color: "#8a2d2d" }}>{err}</p>}

        <button
          type="submit"
          disabled={busy || !pwd.trim()}
          className="mt-4 w-full rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Conferindo…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
