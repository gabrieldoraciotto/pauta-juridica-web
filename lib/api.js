// Cliente da API. O endereço do backend (Railway) vem da variável de ambiente.
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
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
  editDraft: (id, data) => req(`/drafts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  regenerate: (id, duration) =>
    req(`/drafts/${id}/regenerate`, { method: "POST", body: JSON.stringify({ duration }) }),
  checkOab: (id) => req(`/drafts/${id}/check-oab`, { method: "POST" }),
  fixOab: (id) => req(`/drafts/${id}/fix-oab`, { method: "POST" }),
  approve: (id) => req(`/drafts/${id}/approve`, { method: "POST" }),
  reject: (id) => req(`/drafts/${id}/reject`, { method: "POST" }),

  // calendário (o agendamento é manual; a tela do calendário fala com o backend direto)
  calendar: () => req("/calendar"),

  // fontes
  sources: () => req("/sources"),
  addSource: (data) => req("/sources", { method: "POST", body: JSON.stringify(data) }),
  toggleSource: (id, active) =>
    req(`/sources/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
};
