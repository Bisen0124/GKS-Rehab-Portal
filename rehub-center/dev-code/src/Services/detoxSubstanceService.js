/**
 * Detoxification Substance Master API Service
 * 100% LIVE BACKEND DB API ONLY
 * Base URL: https://gks-yjdc.onrender.com/api/detoxification-substances
 */

const BASE_URL = "https://gks-yjdc.onrender.com";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Authorization") || "";
  return {
    "Content-Type": "application/json",
    Authorization: token,
  };
};

/**
 * Fetch all active substances directly from Backend DB API
 * @param {number|string} branchId
 * @param {string} search
 * @returns {Promise<Array>}
 */
export const fetchActiveDetoxSubstances = async (branchId = 1, search = "") => {
  const targetBranch = branchId || 1;
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  try {
    const res = await fetch(
      `${BASE_URL}/api/detoxification-substances?branch_id=${targetBranch}${searchParam}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const json = await res.json();
      const items = json.data || (Array.isArray(json) ? json : []);
      return Array.isArray(items) ? items : [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching substances from DB API:", err);
    return [];
  }
};

/**
 * Fetch all substances including inactive from Backend DB API
 * @param {number|string} branchId
 * @returns {Promise<Array>}
 */
export const fetchAllDetoxSubstances = async (branchId = 1) => {
  const targetBranch = branchId || 1;
  try {
    const res = await fetch(
      `${BASE_URL}/api/detoxification-substances/all?branch_id=${targetBranch}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const json = await res.json();
      const items = json.data || (Array.isArray(json) ? json : []);
      return Array.isArray(items) ? items : [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching all substances from DB API:", err);
    return [];
  }
};

/**
 * Get substance by ID from Backend DB API
 * @param {number|string} id
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const getDetoxSubstanceById = async (id, branchId = 1) => {
  const targetBranch = branchId || 1;
  try {
    const res = await fetch(
      `${BASE_URL}/api/detoxification-substances/${id}?branch_id=${targetBranch}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
    return null;
  } catch (err) {
    console.error("Error fetching substance by ID from DB API:", err);
    return null;
  }
};

/**
 * Create a new substance in Backend DB API
 * @param {Object} data { name, description }
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const createDetoxSubstance = async (data, branchId = 1) => {
  const targetBranch = branchId || 1;
  const res = await fetch(
    `${BASE_URL}/api/detoxification-substances?branch_id=${targetBranch}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: data.name.trim(),
        description: (data.description || "").trim(),
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || json.message || "Failed to create substance in DB";
    throw new Error(msg);
  }

  return json.data || json;
};

/**
 * Update an existing substance in Backend DB API
 * @param {number|string} id
 * @param {Object} data { name, description, isActive }
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const updateDetoxSubstance = async (id, data, branchId = 1) => {
  const targetBranch = branchId || 1;
  const res = await fetch(
    `${BASE_URL}/api/detoxification-substances/${id}?branch_id=${targetBranch}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || json.message || "Failed to update substance in DB";
    throw new Error(msg);
  }

  return json.data || json;
};

/**
 * Delete a substance from Backend DB API (soft delete)
 * @param {number|string} id
 * @param {number|string} branchId
 * @returns {Promise<Object>}
 */
export const deleteDetoxSubstance = async (id, branchId = 1) => {
  const targetBranch = branchId || 1;
  const res = await fetch(
    `${BASE_URL}/api/detoxification-substances/${id}?branch_id=${targetBranch}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || json.message || "Failed to delete substance from DB";
    throw new Error(msg);
  }

  return json;
};
