const BASE = process.env.REACT_APP_BACKEND_URL;

export function evidenceUrl(e) {
  if (!e) return "";
  const u = typeof e === "string" ? e : e.url;
  return u && u.startsWith("/") ? `${BASE}${u}` : u;
}

export function evidenceViewUrl(e) {
  if (!e || typeof e === "string") return evidenceUrl(e);
  const u = e.view_url || e.url;
  return u && u.startsWith("/") ? `${BASE}${u}` : u;
}
