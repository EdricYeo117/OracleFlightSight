// src/services/analyticsApi.js
const API_BASE = "http://localhost:4000/api/analytics";

export async function fetchAnalyticsSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function fetchSessionDashboard(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch session dashboard");
  return res.json();
}
