import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** POST /api/query — natural language → filtered records or summary (workspace-scoped). */
export async function postNaturalLanguageQuery(userQuery) {
  return api.post("/query", { userQuery });
}

/** GET /api/report — workspace aggregate report (summary, trends, AI narrative). */
export async function fetchWorkspaceReport() {
  return api.get("/report");
}

export default api;

