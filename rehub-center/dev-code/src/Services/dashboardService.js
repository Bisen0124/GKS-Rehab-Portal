/**
 * Dashboard API Service
 * Base URL: https://gks-yjdc.onrender.com
 * Endpoints:
 * 1. GET /api/dashboard?branch_id=... (Complete Dashboard Overview)
 * 2. GET /api/dashboard?branch_id=...&section=... (Searchable Patient List of One Widget)
 * 3. PUT /api/users/:id?branch_id=... (User Profile Update)
 */

const BASE_URL = "https://gks-yjdc.onrender.com";

/**
 * Helper to construct authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("Authorization") || "";
  return {
    "Content-Type": "application/json",
    Authorization: token.startsWith("Bearer ") ? token : token,
  };
};

/**
 * 2) Get Complete Dashboard Overview
 * Single call fetching all 11 widgets with Today, Week, Month, Year numbers
 * @param {string|number} branchId
 * @returns {Promise<Object>} complete overview data
 */
export const fetchDashboardOverview = async (branchId) => {
  const headers = getAuthHeaders();
  const branchParam = branchId ? `?branch_id=${branchId}` : "";
  const url = `${BASE_URL}/api/dashboard${branchParam}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    const errorMsg =
      result.error ||
      result.message ||
      (result.details && result.details[0]?.message) ||
      `Dashboard request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return result.data;
};

/**
 * 3-14) Get Searchable & Paginated Patient List for a Dashboard Widget Section
 * @param {Object} params
 * @param {string|number} params.branchId - Target branch
 * @param {string} params.section - Widget section key
 * @param {string} [params.period] - today | week | month | year | overall
 * @param {string} [params.search] - Search by patient name, GKS ID, or phone
 * @param {number} [params.page=1] - Current page
 * @param {number} [params.limit=20] - Records per page
 * @param {number} [params.ward_type_id] - Specific ward ID
 * @param {string} [params.module] - Module key for patient_wise_analysis
 * @param {string} [params.module_status] - completed | pending
 * @param {string} [params.patient_type] - all | discharged | not_discharged
 * @param {string} [params.source] - medical_observation | detoxification | discharge_follow_up
 * @param {string} [params.category] - severe | moderate | under_therapy for treatment_in_progress
 * @param {boolean} [params.omitPeriod=false] - Explicitly omit period (e.g. for ward_occupancy)
 * @returns {Promise<Object>} { records: Array, pagination: Object, filters: Object }
 */
export const fetchDashboardSectionList = async ({
  branchId,
  section,
  period,
  search = "",
  page = 1,
  limit = 20,
  ward_type_id,
  module,
  module_status,
  patient_type,
  source,
  category,
  omitPeriod = false,
}) => {
  const headers = getAuthHeaders();
  const queryParams = new URLSearchParams();

  if (branchId) queryParams.append("branch_id", branchId);
  if (section) queryParams.append("section", section);

  // Sections that strictly do not accept period
  const noPeriodSections = [
    "sample_to_collect",
    "samples_collected",
    "reports_not_uploaded",
    "reports_uploaded",
    "treatment_in_progress",
  ];

  if (!noPeriodSections.includes(section) && !omitPeriod && period) {
    queryParams.append("period", period);
  }

  if (search && search.trim()) {
    queryParams.append("search", search.trim());
  }

  if (page) queryParams.append("page", String(page));
  if (limit) queryParams.append("limit", String(limit));

  if (ward_type_id !== undefined && ward_type_id !== null && ward_type_id !== "") {
    queryParams.append("ward_type_id", String(ward_type_id));
  }

  if (module) queryParams.append("module", module);
  if (module_status) queryParams.append("module_status", module_status);

  // Map patient_type: "overall" maps to "all" per API spec
  if (patient_type) {
    const pt = patient_type === "overall" ? "all" : patient_type;
    queryParams.append("patient_type", pt);
  }

  if (source) queryParams.append("source", source);
  if (category) queryParams.append("category", category);

  const url = `${BASE_URL}/api/dashboard?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    const errorMsg =
      result.error ||
      result.message ||
      (result.details && result.details[0]?.message) ||
      `Section list request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return result.data;
};

/**
 * 1) Update User Profile API (Section A)
 * PUT /api/users/:userId?branch_id=...
 * @param {string|number} userId
 * @param {string|number} branchId
 * @param {Object} payload - { name, relative_name, email, gender, address }
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (userId, branchId, payload) => {
  const headers = getAuthHeaders();
  const url = `${BASE_URL}/api/users/${userId}?branch_id=${branchId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    const errorMsg =
      result.error ||
      result.message ||
      (result.details && result.details[0]?.message) ||
      `User update failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return result;
};
