const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  async sources() {
    return apiFetch("/sources");
  },

  async addSource(source) {
    return apiFetch("/sources", {
      method: "POST",
      body: JSON.stringify(source),
    });
  },

  async toggleSource(id, active) {
    return apiFetch(`/sources/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },

  async articles(status) {
    const query = status ? `?status=${status}` : "";
    return apiFetch(`/articles${query}`);
  },

  async generate(id, format = "reel") {
    return apiFetch("/articles/generate", {
      method: "POST",
      body: JSON.stringify({ articleId: id, format }),
    });
  },

  async drafts(status) {
    const query = status ? `?status=${status}` : "";
    return apiFetch(`/drafts${query}`);
  },

  async editDraft(id, data) {
    return apiFetch(`/drafts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async approve(id) {
    return apiFetch(`/drafts/${id}/approve`, { method: "POST" });
  },

  async reject(id) {
    return apiFetch(`/drafts/${id}/reject`, { method: "POST" });
  },

  async calendar() {
    return apiFetch("/calendar");
  },

  async syncCalendar() {
    return apiFetch("/calendar/sync", { method: "POST" });
  },

  async publish(id) {
    return apiFetch(`/calendar/${id}/publish`, { method: "POST" });
  },

  async ingest() {
    return apiFetch("/articles/ingest", { method: "POST" });
  },
};
