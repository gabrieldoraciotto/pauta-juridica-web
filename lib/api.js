// Cliente da API. O endereço do backend (Railway) vem da variável de ambiente.
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

// ── Senha do escritório (guardada no navegador) ───────────────────────────
const KEY_NAME = "pj_key";

export function getAppKey() {
  try {
    return localStorage.getItem(KEY_NAME) || "";
  } catch {
    return "";
  }
}
export function setAppKey(value) {
  try {
    localStorage.setItem(KEY_NAME, value);
  } catch {}
}
export function clearAppKey() {
  try {
    localStorage.removeItem(KEY_NAME);
  } catch {}
}

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-app-key": getAppKey(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    // Senha ausente ou errada: limpa e avisa a tela de entrada (AuthGate).
    clearAppKey();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("pj-auth"));
    throw new Error("senha necessária");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // notícias
  ingest: () => req("/articles/ingest", { method: "POST" }),
  articles: (status) => req(`/articles${status ? `?status=${status}` : ""}`),
  generate: (id, format) =>
    req(`/articles/${id}/generate`, { method: "POST", body: JSON.stringify({ format }) }),

  // roteiros
  drafts: (status) => req(`/drafts${status ? `?status=${status}` : ""}`),
  createFromTopic: (body) =>
    req("/drafts/from-topic", { method: "POST", body: JSON.stringify(body) }),
  explainTopic: (topic) =>
    req("/drafts/explain-topic", { method: "POST", body: JSON.stringify({ topic }) }),
  deleteDraft: (id) => req(`/drafts/${id}`, { method: "DELETE" }),
  editDraft: (id, data) => req(`/drafts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  regenerate: (id, body) =>
    req(`/drafts/${id}/regenerate`, { method: "POST", body: JSON.stringify(body) }),
  checkOab: (id) => req(`/drafts/${id}/check-oab`, { method: "POST" }),
  fixOab: (id) => req(`/drafts/${id}/fix-oab`, { method: "POST" }),
  approve: (id) => req(`/drafts/${id}/approve`, { method: "POST" }),
  reject: (id) => req(`/drafts/${id}/reject`, { method: "POST" }),

  // calendário (o agendamento é manual; a tela do calendário fala com o backend direto)
  calendar: () => req("/calendar"),
  settings: () => req("/settings"),

  // fontes
  sources: () => req("/sources"),
  addSource: (data) => req("/sources", { method: "POST", body: JSON.stringify(data) }),
  toggleSource: (id, active) =>
    req(`/sources/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteSource: (id) => req(`/sources/${id}`, { method: "DELETE" }),
};
