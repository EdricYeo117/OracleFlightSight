import React from "react";

function formatSeconds(ms = 0) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatRelativeTime(ms = 0) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function objectTone(aoi = "") {
  if (aoi.includes("OUTSIDE")) return "visit-pill visit-pill-gold";
  if (aoi.includes("RIGHT")) return "visit-pill visit-pill-cyan";
  if (aoi.includes("BOTTOM")) return "visit-pill visit-pill-green";
  if (aoi.includes("LEFT")) return "visit-pill visit-pill-blue";
  return "visit-pill visit-pill-amber";
}

export default function ObjectVisitTable({ visits = [] }) {
  const sortedVisits = visits
    .filter((visit) => (visit.AOI ?? visit.aoi) !== "NONE")
    .sort((a, b) => {
      const aStart = Number(a.START_TS_MS ?? a.startTsMs ?? 0);
      const bStart = Number(b.START_TS_MS ?? b.startTsMs ?? 0);
      return aStart - bStart;
    });

  return (
    <div className="panel panel-medium">
      <div className="panel-header">
        <div>
          <h3>Object Visit Log</h3>
          <p>
            Every separate eyes-on / eyes-off attention episode by cockpit
            object
          </p>
        </div>
      </div>

      <div className="rule-table-wrap">
        <table className="rule-table">
          <thead>
            <tr>
              <th>Object</th>
              <th>Visit #</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Fixations</th>
            </tr>
          </thead>
          <tbody>
            {sortedVisits.map((visit) => {
              const aoi = visit.AOI ?? visit.aoi ?? "UNKNOWN";
              const visitOrderNo =
                visit.VISIT_ORDER_NO ?? visit.visitOrderNo ?? "-";
              const startTsMs = Number(
                visit.START_TS_MS ?? visit.startTsMs ?? 0,
              );
              const endTsMs = Number(visit.END_TS_MS ?? visit.endTsMs ?? 0);
              const durationMs = Number(
                visit.DURATION_MS ?? visit.durationMs ?? 0,
              );
              const fixationCount = Number(
                visit.FIXATION_COUNT ?? visit.fixationCount ?? 0,
              );

              return (
                <tr
                  key={visit.VISIT_ID ?? `${aoi}-${visitOrderNo}-${startTsMs}`}
                >
                  <td>
                    <span className={objectTone(aoi)}>{aoi}</span>
                  </td>
                  <td>{visitOrderNo}</td>
                  <td>{formatRelativeTime(startTsMs)}</td>
                  <td>{formatRelativeTime(endTsMs)}</td>
                  <td>
                    <span className="duration-chip">
                      {formatSeconds(durationMs)}
                    </span>
                  </td>
                  <td>{fixationCount}</td>
                </tr>
              );
            })}

            {!sortedVisits.length && (
              <tr>
                <td colSpan={6} className="rule-table-empty">
                  No visit data for this session yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
