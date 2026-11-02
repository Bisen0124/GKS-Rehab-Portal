/**
 * Detoxification Severity Benchmarks (CIWA Scoring Ranges) API Service
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
 * Fetch all Severity Benchmarks directly from Backend DB API
 * @param {number|string} branchId
 * @param {string} subId
 * @param {string} search
 * @returns {Promise<Array>}
 */
export const fetchDetoxSeverities = async (branchId = 1, subId = "", search = "") => {
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

  // 2. Fetch live CIWA scoring benchmarks from DB API
  try {
    const res = await fetch(
      `${BASE_URL}/api/detoxification-ciwa-scoring?branch_id=${targetBranch}${subParam}${searchParam}`,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const items = json.data || (Array.isArray(json) ? json : []);

    if (!Array.isArray(items)) {
      return [];
    }

    // 3. Map records with substance names and format
    let mapped = items.map((item) => ({
      id: item.id,
      sub_id: item.sub_id,
      substance_name: subMap[String(item.sub_id)] || item.substance_name || `Substance #${item.sub_id}`,
      min_score: Number(item.min_score) || 0,
      max_score: Number(item.max_score) || 0,
      severity: item.severity || "Standard",
      description: item.description || "",
      isActive: item.isActive !== false,
    }));

    // Client-side search if needed
    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(
        (m) =>
          m.severity.toLowerCase().includes(q) ||
          m.substance_name.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          String(m.id).includes(q) ||
          String(m.min_score).includes(q) ||
          String(m.max_score).includes(q)
      );
    }

    // Sort by sub_id and min_score ascending
    mapped.sort((a, b) => a.min_score - b.min_score);

    return mapped;
  } catch (err) {
    console.error("Error fetching severity benchmarks from DB API:", err);
    return [];
  }
};

/**
 * Create a new Severity Benchmark in Backend DB API
 * @param {Object} data { sub_id, min_score, max_score, severity, description }
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const createDetoxSeverity = async (data, branchId = 1) => {
  const targetBranch = branchId || 1;

  const payload = {
    sub_id: Number(data.sub_id),
    min_score: Number(data.min_score),
    max_score: Number(data.max_score),
    severity: data.severity.trim(),
    description: (data.description || "").trim(),
  };

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
    const msg = json.error || json.message || "Failed to create severity benchmark in DB";
    throw new Error(msg);
  }

  return json.data || json;
};

/**
 * Update an existing Severity Benchmark in Backend DB API
 * @param {number|string} id
 * @param {Object} data { min_score, max_score, severity, description, isActive }
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const updateDetoxSeverity = async (id, data, branchId = 1) => {
  const targetBranch = branchId || 1;

  const payload = {
    min_score: Number(data.min_score),
    max_score: Number(data.max_score),
    severity: data.severity.trim(),
    description: (data.description || "").trim(),
    isActive: data.isActive !== undefined ? data.isActive : true,
  };

  const res = await fetch(
    `${BASE_URL}/api/detoxification-ciwa-scoring/${id}?branch_id=${targetBranch}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || json.message || "Failed to update severity benchmark in DB";
    throw new Error(msg);
  }

  return json.data || json;
};

/**
 * Delete a Severity Benchmark from Backend DB API
 * @param {number|string} id
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const deleteDetoxSeverity = async (id, branchId = 1) => {
  const targetBranch = branchId || 1;

  const res = await fetch(
    `${BASE_URL}/api/detoxification-ciwa-scoring/${id}?branch_id=${targetBranch}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || json.message || "Failed to delete severity benchmark from DB";
    throw new Error(msg);
  }

  return json;
};
