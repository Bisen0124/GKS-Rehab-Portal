/**
 * Detoxification Assessment Parameters & CIWA Scoring API Service
 * 100% LIVE BACKEND DB API ONLY
 * Base URL: https://gks-yjdc.onrender.com/api/detoxification-ciwa-scoring
 */

import { fetchActiveDetoxSubstances } from "./detoxSubstanceService";

const BASE_URL = "https://gks-yjdc.onrender.com";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Authorization") || "";
  return {
    "Content-Type": "application/json",
    Authorization: token,
  };
};

/**
 * Determine severity label from score value
 */
export const getScoreSeverity = (score) => {
  const num = Number(score);
  if (num === 0) return "None";
  if (num <= 2) return "Mild";
  if (num <= 4) return "Moderate";
  return "Severe";
};

/**
 * Fetch all Assessment Parameters directly from Backend DB API
 * @param {number|string} branchId
 * @param {string} subId
 * @param {string} search
 * @returns {Promise<Array>}
 */
export const fetchAssessmentParameters = async (branchId = 1, subId = "", search = "") => {
  const targetBranch = branchId || 1;
  const subParam = subId && subId !== "all" ? `&sub_id=${subId}` : "";
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

  // 1. Fetch active substances to map substance names
  const subMap = {};
  try {
    const subs = await fetchActiveDetoxSubstances(targetBranch);
    if (Array.isArray(subs)) {
      subs.forEach((s) => {
        subMap[String(s.id || s.sub_id)] = s.name;
      });
    }
  } catch {
    // ignore
  }

  // 2. Fetch live CIWA scoring bands directly from backend DB API
  try {
    const res = await fetch(
      `${BASE_URL}/api/detoxification-ciwa-scoring?branch_id=${targetBranch}${subParam}${searchParam}`,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const bands = json.data || (Array.isArray(json) ? json : []);

    if (!Array.isArray(bands) || bands.length === 0) {
      return [];
    }

    // 3. Group live DB bands into assessment parameter groups
    const groups = {};
    bands.forEach((band) => {
      const pName =
        band.parameter_name ||
        band.name ||
        subMap[String(band.sub_id)] ||
        `Parameter #${band.id}`;

      const groupKey = band.parameter_name
        ? `${band.sub_id}_${band.parameter_name}`
        : `${band.sub_id}_${pName}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: band.id,
          sub_id: band.sub_id,
          substance_name: subMap[String(band.sub_id)] || band.substance_name || `Substance #${band.sub_id}`,
          parameter_name: pName,
          scores: [],
          bandIds: [],
          isActive: band.isActive !== false,
        };
      }

      const scoreDisplay =
        band.min_score === band.max_score ? band.min_score : `${band.min_score}-${band.max_score}`;

      groups[groupKey].scores.push({
        id: band.id,
        score: scoreDisplay,
        min_score: band.min_score,
        max_score: band.max_score,
        severity: band.severity || getScoreSeverity(band.min_score),
        description: band.description || "",
      });
      groups[groupKey].bandIds.push(band.id);
    });

    let result = Object.values(groups);

    // Apply client-side search filter if needed
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.parameter_name.toLowerCase().includes(q) ||
          item.substance_name.toLowerCase().includes(q) ||
          item.scores.some((sc) => sc.description.toLowerCase().includes(q))
      );
    }

    return result;
  } catch (err) {
    console.error("Error fetching live CIWA scoring bands from DB API:", err);
    return [];
  }
};

/**
 * Create a new Assessment Parameter (Posts all score bands directly to DB API)
 * @param {Object} data { sub_id, parameter_name, scores: [{ score, description, severity }] }
 * @param {number|string} branchId
 * @returns {Promise<Array>}
 */
export const createAssessmentParameter = async (data, branchId = 1) => {
  const targetBranch = branchId || 1;
  const createdBands = [];

  for (const row of data.scores) {
    const minVal = Number(row.score !== undefined ? row.score : row.min_score) || 0;
    const maxVal = Number(row.max_score !== undefined ? row.max_score : row.score) || minVal;
    const severityVal = row.severity || getScoreSeverity(minVal);

    const payload = {
      sub_id: Number(data.sub_id),
      min_score: minVal,
      max_score: maxVal,
      severity: severityVal,
      description: row.description ? row.description.trim() : "",
    };

    if (data.parameter_name) {
      payload.parameter_name = data.parameter_name.trim();
    }

    const res = await fetch(
      `${BASE_URL}/api/detoxification-ciwa-scoring?branch_id=${targetBranch}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();
    if (!res.ok) {
      const errMsg = json.error || json.message || "Failed to create CIWA scoring band in DB";
      throw new Error(errMsg);
    }
    createdBands.push(json.data || json);
  }

  return createdBands;
};

/**
 * Update an existing Assessment Parameter via DB API
 * @param {number|string} id
 * @param {Object} data { sub_id, parameter_name, scores: [...] }
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const updateAssessmentParameter = async (id, data, branchId = 1) => {
  const targetBranch = branchId || 1;

  for (const row of data.scores) {
    const minVal = Number(row.score !== undefined ? row.score : row.min_score) || 0;
    const maxVal = Number(row.max_score !== undefined ? row.max_score : row.score) || minVal;
    const severityVal = row.severity || getScoreSeverity(minVal);

    if (row.id) {
      // Update existing band
      const res = await fetch(
        `${BASE_URL}/api/detoxification-ciwa-scoring/${row.id}?branch_id=${targetBranch}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            min_score: minVal,
            max_score: maxVal,
            severity: severityVal,
            description: row.description ? row.description.trim() : "",
            parameter_name: data.parameter_name ? data.parameter_name.trim() : undefined,
          }),
        }
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || json.message || "Failed to update band");
      }
    } else {
      // Create newly added row
      await fetch(
        `${BASE_URL}/api/detoxification-ciwa-scoring?branch_id=${targetBranch}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sub_id: Number(data.sub_id),
            min_score: minVal,
            max_score: maxVal,
            severity: severityVal,
            description: row.description ? row.description.trim() : "",
            parameter_name: data.parameter_name ? data.parameter_name.trim() : undefined,
          }),
        }
      );
    }
  }

  return { success: true };
};

/**
 * Delete an Assessment Parameter (Deletes its scoring bands directly from DB API)
 * @param {Object|number|string} paramOrId
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const deleteAssessmentParameter = async (paramOrId, branchId = 1) => {
  const targetBranch = branchId || 1;

  // If a full parameter object was passed with bandIds
  const bandIds =
    paramOrId && paramOrId.bandIds
      ? paramOrId.bandIds
      : paramOrId && paramOrId.scores
      ? paramOrId.scores.map((s) => s.id).filter(Boolean)
      : [paramOrId];

  for (const bandId of bandIds) {
    try {
      await fetch(
        `${BASE_URL}/api/detoxification-ciwa-scoring/${bandId}?branch_id=${targetBranch}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
    } catch {
      // ignore individual delete failure
    }
  }

  return { success: true };
};
