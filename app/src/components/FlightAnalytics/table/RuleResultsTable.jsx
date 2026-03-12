import React from "react";

function formatMs(ms = 0) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function RuleResultsTable({ rows, objectAttention = [] }) {
  const attentionMap = new Map(objectAttention.map((row) => [row.aoi, row]));

  return (
    <div className="panel panel-medium">
      <div className="panel-header">
        <div>
          <h3>Rule Results</h3>
          <p>Checklist-style object attention evaluation by session</p>
        </div>
      </div>

      <div className="rule-table-wrap">
        <table className="rule-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>AOI</th>
              <th>Dwell</th>
              <th>Fixations</th>
              <th>Longest</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const attention = attentionMap.get(row.AOI);
              return (
                <tr key={`${row.RESULT_ID}-${row.RULE_ID}`}>
                  <td>{row.RULE_ID}</td>
                  <td>{row.AOI}</td>
                  <td>{formatMs(row.ACTUAL_DWELL_MS || 0)}</td>
                  <td>{row.ACTUAL_FIXATION_COUNT || 0}</td>
                  <td>
                    {formatMs(
                      row.LONGEST_FIXATION_MS ??
                        attention?.longestFixationMs ??
                        0,
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        Number(row.PASSED) === 1
                          ? "status-pill status-pill-pass"
                          : "status-pill status-pill-fail"
                      }
                    >
                      {Number(row.PASSED) === 1 ? "Passed" : "Failed"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={6} className="rule-table-empty">
                  No rule results for this session yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
