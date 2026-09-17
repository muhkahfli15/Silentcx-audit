import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const http = axios.create({ baseURL: API });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("sx_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const api = {
  // auth
  login: (body) => http.post("/auth/login", body).then((r) => r.data),
  register: (body) => http.post("/auth/register", body).then((r) => r.data),
  shopperRegister: (body) => http.post("/shopper/register", body).then((r) => r.data),
  me: () => http.get("/auth/me").then((r) => r.data),
  // public
  packages: () => http.get("/packages").then((r) => r.data),
  addons: () => http.get("/addons").then((r) => r.data),
  cms: () => http.get("/cms").then((r) => r.data),
  // onboarding
  onboarding: (body) => http.post("/onboarding", body).then((r) => r.data),
  // client
  overview: () => http.get("/client/overview").then((r) => r.data),
  projects: () => http.get("/client/projects").then((r) => r.data),
  project: (id) => http.get(`/client/projects/${id}`).then((r) => r.data),
  report: (id) => http.get(`/reports/${id}`).then((r) => r.data),
  outlet: (id) => http.get(`/outlets/${id}`).then((r) => r.data),
  requestAddon: (body) => http.post("/client/addons/request", body).then((r) => r.data),
  requestConsultation: (body) => http.post("/client/consultation/request", body).then((r) => r.data),
  consultationSlots: (date) => http.get(`/client/consultation/slots`, { params: { date } }).then((r) => r.data),
  bookConsultation: (body) => http.post("/client/consultation/book", body).then((r) => r.data),
  cancelConsultation: (id) => http.post(`/client/consultation/${id}/cancel`).then((r) => r.data),
  payInvoice: (id) => http.post(`/invoices/${id}/pay`).then((r) => r.data),
  readNotification: (id) => http.post(`/notifications/${id}/read`).then((r) => r.data),
  // shopper
  shopperHome: () => http.get("/shopper/home").then((r) => r.data),
  assignment: (id) => http.get(`/shopper/assignments/${id}`).then((r) => r.data),
  submitAudit: (id, body) => http.post(`/shopper/assignments/${id}/submit`, body).then((r) => r.data),
  uploadEvidence: (id, file, questionId, onProgress) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("question_id", questionId || "");
    return http.post(`/shopper/assignments/${id}/evidence`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total || 1))),
    }).then((r) => r.data);
  },
  // admin
  adminNotifications: () => http.get("/admin/notifications").then((r) => r.data),
  googleStatus: () => http.get("/admin/integrations/google").then((r) => r.data),
  googleConnect: () => http.get("/admin/integrations/google/connect").then((r) => r.data),
  googleDisconnect: () => http.delete("/admin/integrations/google").then((r) => r.data),
  createQuestionnaire: (body) => http.post("/admin/questionnaires", body).then((r) => r.data),
  updateQuestionnaire: (id, body) => http.put(`/admin/questionnaires/${id}`, body).then((r) => r.data),
  duplicateQuestionnaire: (id) => http.post(`/admin/questionnaires/${id}/duplicate`).then((r) => r.data),
  deleteQuestionnaire: (id) => http.delete(`/admin/questionnaires/${id}`).then((r) => r.data),
  adminDashboard: () => http.get("/admin/dashboard").then((r) => r.data),
  adminList: (coll) => http.get(`/admin/${coll}`).then((r) => r.data),
  adminProjectDetail: (id) => http.get(`/admin/projects/${id}/detail`).then((r) => r.data),
  adminSubmissionDetail: (id) => http.get(`/admin/submissions/${id}/detail`).then((r) => r.data),
  appAction: (id, body) => http.post(`/admin/applications/${id}/action`, body).then((r) => r.data),
  projectStatus: (id, body) => http.post(`/admin/projects/${id}/status`, body).then((r) => r.data),
  submissionAction: (id, body) => http.post(`/admin/submissions/${id}/action`, body).then((r) => r.data),
  createAssignment: (body) => http.post("/admin/assignments", body).then((r) => r.data),
  updateCms: (body) => http.patch("/admin/cms", body).then((r) => r.data),
  updatePackage: (id, body) => http.patch(`/admin/packages/${id}`, body).then((r) => r.data),
  createAddon: (body) => http.post("/admin/addons", body).then((r) => r.data),
  updateAddon: (id, body) => http.patch(`/admin/addons/${id}`, body).then((r) => r.data),
};
