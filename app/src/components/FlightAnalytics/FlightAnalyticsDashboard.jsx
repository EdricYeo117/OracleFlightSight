import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsSessions,
  fetchSessionDashboard,
} from "../../services/analyticsApi.js";
import {
  mapAoiDwellChart,
  mapRuleStatusSummary,
} from "../../utils/analyticsTransform.js";
import FixationOverlay from "./heatmap/FixationOverlay.jsx";
import AoiDwellChart from "./charts/AoiDwellChart.jsx";
import RuleStatusChart from "./charts/RuleStatusChart.jsx";
import RuleResultsTable from "./table/RuleResultsTable.jsx";
import ObjectVisitTable from "./table/ObjectVisitTable.jsx";
import SessionKpiCards from "./charts/SessionKpiCards.jsx";
import "./flightAnalytics.css";

export default function FlightAnalyticsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) loadDashboard(sessionId);
  }, [sessionId]);

  async function loadSessions() {
    try {
      setError("");
      const data = await fetchAnalyticsSessions();
      const rows = data.sessions || [];
      setSessions(rows);
      if (rows.length > 0) {
        setSessionId(rows[0].SESSION_ID);
      }
    } catch (err) {
      setError(err.message || "Failed to load sessions");
    }
  }

  async function loadDashboard(id) {
    try {
      setLoading(true);
      setError("");
      const data = await fetchSessionDashboard(id);
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const summary = dashboard?.summary;
  const attentionRows =
    dashboard?.objectAttention ||
    dashboard?.panelAttentionSummary ||
    dashboard?.aoiAggregates ||
    [];

  const aoiChartData = useMemo(
    () => mapAoiDwellChart(attentionRows),
    [dashboard],
  );

  const ruleSummaryData = useMemo(
    () => mapRuleStatusSummary(dashboard?.ruleResults || []),
    [dashboard],
  );

  const visitRows = dashboard?.visits || [];

  const topAois = useMemo(() => {
    return attentionRows
      .slice()
      .sort(
        (a, b) =>
          Number(b.totalDwellMs ?? b.TOTAL_DWELL_MS ?? 0) -
          Number(a.totalDwellMs ?? a.TOTAL_DWELL_MS ?? 0),
      )
      .slice(0, 4);
  }, [dashboard]);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-shell">
        <div className="analytics-topbar">
          <div className="analytics-brand">
            <div className="analytics-brand-badge">SIA</div>
            <div>
              <div className="analytics-brand-title">Singapore Airlines</div>
              <div className="analytics-brand-subtitle">
                Airbus A350-900 · Flight Crew Attention Analytics
              </div>
            </div>
          </div>

          <div className="analytics-toolbar">
            <div className="analytics-status-chip">
              {summary?.sessionStatus || "ACTIVE"}
            </div>
            <select
              className="analytics-session-select"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.SESSION_ID} value={s.SESSION_ID}>
                  {s.SESSION_ID} · {s.SCENARIO_ID} · {s.PILOT_ID}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="analytics-page-header">
          <div>
            <h2>Flight Analytics Dashboard</h2>
            <p>
              Session-level dwell, fixation, visit, and rules analytics from the
              Oracle pipeline
            </p>
          </div>

          <div className="analytics-focus-strip">
            {topAois.map((row) => (
              <div key={row.aoi ?? row.AOI} className="analytics-focus-chip">
                <span>{row.aoi ?? row.AOI}</span>
                <strong>
                  {(
                    Number(row.totalDwellMs ?? row.TOTAL_DWELL_MS ?? 0) / 1000
                  ).toFixed(2)}
                  s
                </strong>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="analytics-banner">Loading analytics...</div>
        )}
        {error && (
          <div className="analytics-banner analytics-banner-error">{error}</div>
        )}

        {summary && (
          <SessionKpiCards
            summary={summary}
            objectAttention={attentionRows}
            visits={visitRows}
          />
        )}

        <div className="analytics-grid analytics-grid-top">
          <FixationOverlay
            fixations={dashboard?.fixations || []}
            screenWidth={summary?.screenWidth || 1920}
            screenHeight={summary?.screenHeight || 1080}
          />
          <AoiDwellChart data={aoiChartData} />
        </div>

        <div className="analytics-grid analytics-grid-visits">
          <ObjectVisitTable visits={visitRows} />
        </div>

        <div className="analytics-grid analytics-grid-bottom">
          <RuleStatusChart data={ruleSummaryData} />
          <RuleResultsTable
            rows={dashboard?.ruleResults || []}
            objectAttention={attentionRows}
          />
        </div>
      </div>
    </div>
  );
}
