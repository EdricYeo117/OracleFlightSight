import oracledb from "oracledb";
import { getConnection } from "../config/db.js";

export async function getAoiRulesByScenario(scenarioId) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        RULE_ID,
        SCENARIO_ID,
        AOI,
        RULE_NAME,
        MIN_DWELL_MS,
        MIN_FIXATION_COUNT,
        REQUIRED_ORDER_NO,
        IS_REQUIRED,
        DESCRIPTION
      FROM AOI_RULE
      WHERE SCENARIO_ID = :scenarioId
      ORDER BY REQUIRED_ORDER_NO NULLS LAST, RULE_ID
      `,
      { scenarioId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows || [];
  } finally {
    await conn.close();
  }
}

export async function insertAoiRule({
  ruleId,
  scenarioId,
  aoi,
  ruleName = null,
  minDwellMs = null,
  minFixationCount = null,
  requiredOrderNo = null,
  isRequired = 1,
  description = null,
}) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `
      INSERT INTO AOI_RULE (
        RULE_ID,
        SCENARIO_ID,
        AOI,
        RULE_NAME,
        MIN_DWELL_MS,
        MIN_FIXATION_COUNT,
        REQUIRED_ORDER_NO,
        IS_REQUIRED,
        DESCRIPTION
      ) VALUES (
        :ruleId,
        :scenarioId,
        :aoi,
        :ruleName,
        :minDwellMs,
        :minFixationCount,
        :requiredOrderNo,
        :isRequired,
        :description
      )
      `,
      {
        ruleId,
        scenarioId,
        aoi,
        ruleName,
        minDwellMs,
        minFixationCount,
        requiredOrderNo,
        isRequired,
        description,
      },
      { autoCommit: true }
    );
  } finally {
    await conn.close();
  }
}