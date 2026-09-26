/**
 * Billing Master Service
 * Implements official Item Types (/api/item-types) and Items (/api/items) APIs
 * from the GKS Rehab Portal Accounting & Billing Postman Collection.
 * Includes local storage caching & fallback for resilient offline operation.
 */

const BASE_URL = "https://gks-yjdc.onrender.com";

// Storage Keys
const ITEM_TYPES_KEY = "gks_billing_item_types";
const ITEMS_MASTER_KEY = "gks_billing_items_master";

// Helper: HTTP Headers with Auth
export const getAuthHeaders = () => {
  const token = localStorage.getItem("Authorization") || "";
  const rawToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  return {
    "Content-Type": "application/json",
    ...(rawToken ? { Authorization: rawToken } : {}),
  };
};

// Helper: Build query URL with branch_id
export const buildApiUrl = (endpoint, branchId = null, extraParams = {}) => {
  let url = `${BASE_URL}${endpoint}`;
  const params = new URLSearchParams();

  if (branchId !== null && branchId !== undefined && branchId !== "all" && branchId !== "") {
    params.set("branch_id", branchId);
  }

  Object.entries(extraParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, val);
    }
  });

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

// Seed Data for offline fallback
export const INITIAL_ITEM_TYPES = [
  {
    id: 1,
    item_type_name: "Ward Charges",
    name: "Ward Charges",
    description: "Charges for bed, room occupancy, and daily inpatient ward care",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 2,
    item_type_name: "Blood Packages",
    name: "Blood Packages",
    description: "Diagnostic hematology, pathology, and complete blood test packages",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 3,
    item_type_name: "Consultation & OPD",
    name: "Consultation & OPD",
    description: "Specialist physician, psychiatrist, and doctor consultation fees",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 4,
    item_type_name: "Physiotherapy & Rehab",
    name: "Physiotherapy & Rehab",
    description: "Neuro, ortho, and mobility physical rehabilitation therapy sessions",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 5,
    item_type_name: "Pharmacy & Medications",
    name: "Pharmacy & Medications",
    description: "Prescribed medicines, injectables, IV fluids, and medical consumables",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 6,
    item_type_name: "Laboratory & Diagnostics",
    name: "Laboratory & Diagnostics",
    description: "Urine routine, ECG, diagnostic radiology, and clinical pathology tests",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 7,
    item_type_name: "Nursing & Clinical Care",
    name: "Nursing & Clinical Care",
    description: "24x7 nursing care, vitals monitoring, and inpatient assistance",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
];

export const INITIAL_ITEMS_MASTER = [
  {
    id: 1,
    item_type_id: 1,
    item_type_name: "Ward Charges",
    item_name: "Private Ward Room (AC)",
    original_amount: 1500,
    amount: 1500,
    description: "Private single room with AC, attached bathroom, and visitor couch.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 2,
    item_type_id: 1,
    item_type_name: "Ward Charges",
    item_name: "Semi-Private Ward Bed",
    original_amount: 800,
    amount: 800,
    description: "Two-sharing room with curtain partition and 24h nurse calling.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 3,
    item_type_id: 1,
    item_type_name: "Ward Charges",
    item_name: "General Ward Bed",
    original_amount: 400,
    amount: 400,
    description: "Multi-bed ward facility with basic clinical care and shared washroom.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 4,
    item_type_id: 2,
    item_type_name: "Blood Packages",
    item_name: "Routine Blood Package (CBC + ESR)",
    original_amount: 450,
    amount: 450,
    description: "Comprehensive hemogram test covering 24 blood parameters.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 5,
    item_type_id: 2,
    item_type_name: "Blood Packages",
    item_name: "Liver Function Test (LFT) Package",
    original_amount: 750,
    amount: 750,
    description: "Covers Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Total Protein.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 6,
    item_type_id: 3,
    item_type_name: "Consultation & OPD",
    item_name: "Senior Consultant Doctor Visit",
    original_amount: 500,
    amount: 500,
    description: "Specialist physician consultation & evaluation.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
  {
    id: 7,
    item_type_id: 4,
    item_type_name: "Physiotherapy & Rehab",
    item_name: "Neuro Rehabilitation Session (45 min)",
    original_amount: 600,
    amount: 600,
    description: "Physiotherapy for neurological & mobility rehabilitation.",
    branch_id: null,
    branch_name: "All Branches",
    isActive: true,
  },
];

// Normalize Item Type helper
const normalizeItemType = (t) => ({
  id: t.id || t.item_type_id,
  name: t.item_type_name || t.name || "",
  item_type_name: t.item_type_name || t.name || "",
  description: t.description || "",
  branch_id: t.branch_id ?? null,
  branch_name: t.branch_name || "All Branches",
  isActive: t.isActive !== undefined ? Boolean(t.isActive) : true,
  date_created: t.date_created || t.created_at || new Date().toISOString().split("T")[0],
});

// Normalize Item helper
const normalizeItem = (it, typeLookup = {}) => {
  const typeId = it.item_type_id || it.type_id;
  const typeName =
    it.item_type_name ||
    typeLookup[typeId] ||
    "General";

  const origAmt = Number(
    it.original_amount !== undefined
      ? it.original_amount
      : it.amount !== undefined
      ? it.amount
      : 0
  );

  return {
    id: it.id || it.item_id,
    item_id: it.id || it.item_id,
    item_name: it.item_name || "",
    item_type_id: Number(typeId) || 1,
    item_type_name: typeName,
    original_amount: origAmt,
    amount: origAmt,
    description: it.description || "",
    branch_id: it.branch_id ?? null,
    branch_name: it.branch_name || "All Branches",
    isActive: it.isActive !== undefined ? Boolean(it.isActive) : true,
    date_created: it.date_created || it.created_at || new Date().toISOString().split("T")[0],
  };
};

// ============================================================================
// 1. ASYNC ITEM TYPE APIS (/api/item-types)
// ============================================================================

/**
 * 2) Get All Active Item Types
 * GET /api/item-types?branch_id=1[&search=...]
 */
export const fetchActiveItemTypes = async (branchId = 1, search = "") => {
  try {
    const url = buildApiUrl("/api/item-types", branchId, search ? { search } : {});
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeItemType);
      saveItemTypes(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchActiveItemTypes failed, fallback to local:", err);
  }
  return getItemTypes(branchId);
};

/**
 * 3) Get All Item Types (Including Inactive)
 * GET /api/item-types/all?branch_id=1
 */
export const fetchAllItemTypes = async (branchId = 1) => {
  try {
    const url = buildApiUrl("/api/item-types/all", branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeItemType);
      saveItemTypes(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchAllItemTypes failed, fallback to local:", err);
  }
  return getItemTypes(branchId);
};

/**
 * 4) Get Item Type By ID
 * GET /api/item-types/:id?branch_id=1
 */
export const fetchItemTypeById = async (id, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/item-types/${id}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const item = data.data || data;
      return normalizeItemType(item);
    }
  } catch (err) {
    console.warn("fetchItemTypeById failed:", err);
  }
  const localList = getItemTypes(branchId);
  return localList.find((t) => Number(t.id) === Number(id)) || null;
};

/**
 * 1) Create Item Type
 * POST /api/item-types?branch_id=1
 * Payload: { "item_type_name": "Room Charges" }
 */
export const createItemTypeApi = async (payload, branchId = 1) => {
  const name = (payload.item_type_name || payload.name || "").trim();
  try {
    const url = buildApiUrl("/api/item-types", branchId);
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ item_type_name: name }),
    });

    if (res.ok) {
      const resData = await res.json();
      const created = resData.data || resData;
      return normalizeItemType(created);
    }
  } catch (err) {
    console.warn("createItemTypeApi failed, saving locally:", err);
  }
  return createItemType({ ...payload, name, item_type_name: name });
};

/**
 * 5) Update Item Type
 * PUT /api/item-types/:id?branch_id=1
 * Payload: { "item_type_name": "...", "isActive": true }
 */
export const updateItemTypeApi = async (id, payload, branchId = 1) => {
  const body = {};
  if (payload.item_type_name || payload.name) {
    body.item_type_name = (payload.item_type_name || payload.name).trim();
  }
  if (payload.isActive !== undefined) {
    body.isActive = Boolean(payload.isActive);
  }

  try {
    const url = buildApiUrl(`/api/item-types/${id}`, branchId);
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resData = await res.json();
      return resData;
    }
  } catch (err) {
    console.warn("updateItemTypeApi failed, saving locally:", err);
  }
  return updateItemType(id, payload);
};

/**
 * 6) Delete Item Type (soft delete)
 * DELETE /api/item-types/:id?branch_id=1
 */
export const deleteItemTypeApi = async (id, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/item-types/${id}`, branchId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("deleteItemTypeApi failed, deleting locally:", err);
  }
  return deleteItemType(id);
};

// ============================================================================
// 2. ASYNC ITEM APIS (/api/items)
// ============================================================================

/**
 * 8) Get All Active Items
 * GET /api/items?branch_id=1[&item_type_id=1&search=Ward]
 */
export const fetchActiveItems = async (branchId = 1, typeId = null, search = "") => {
  try {
    const extra = {};
    if (typeId && typeId !== "all") extra.item_type_id = typeId;
    if (search) extra.search = search;

    const url = buildApiUrl("/api/items", branchId, extra);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map((it) => normalizeItem(it));
      saveItemsMaster(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchActiveItems failed, fallback to local:", err);
  }
  return getItemsMaster(branchId, typeId);
};

/**
 * 9) Get All Items (Including Inactive)
 * GET /api/items/all?branch_id=1
 */
export const fetchAllItems = async (branchId = 1) => {
  try {
    const url = buildApiUrl("/api/items/all", branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map((it) => normalizeItem(it));
      saveItemsMaster(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchAllItems failed, fallback to local:", err);
  }
  return getItemsMaster(branchId);
};

/**
 * 10) Get Items By Item Type (Billing dropdown)
 * GET /api/items/type/:type_id?branch_id=1
 */
export const fetchItemsByType = async (typeId, branchId = 1) => {
  if (!typeId) return [];
  try {
    const url = buildApiUrl(`/api/items/type/${typeId}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      return list.map((it) => normalizeItem(it));
    }
  } catch (err) {
    console.warn("fetchItemsByType failed, fallback to local:", err);
  }
  return getItemsMaster(branchId, typeId);
};

/**
 * 11) Get Item By ID
 * GET /api/items/:id?branch_id=1
 */
export const fetchItemById = async (id, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/items/${id}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeItem(data.data || data);
    }
  } catch (err) {
    console.warn("fetchItemById failed:", err);
  }
  const localList = getItemsMaster(branchId);
  return localList.find((i) => Number(i.id) === Number(id)) || null;
};

/**
 * 7) Create Item
 * POST /api/items?branch_id=1
 * Payload: { "item_name": "General Ward - Monthly", "item_type_id": 1, "original_amount": 15000.00 }
 */
export const createItemApi = async (payload, branchId = 1) => {
  const body = {
    item_name: (payload.item_name || "").trim(),
    item_type_id: Number(payload.item_type_id),
    original_amount: Number(payload.original_amount !== undefined ? payload.original_amount : payload.amount) || 0,
  };

  try {
    const url = buildApiUrl("/api/items", branchId);
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resData = await res.json();
      return normalizeItem(resData.data || resData);
    }
  } catch (err) {
    console.warn("createItemApi failed, saving locally:", err);
  }
  return createItemMaster({ ...payload, ...body });
};

/**
 * 12) Update Item
 * PUT /api/items/:id?branch_id=1
 * Payload: { "item_name": "...", "item_type_id": 1, "original_amount": 16000.00, "isActive": true }
 */
export const updateItemApi = async (id, payload, branchId = 1) => {
  const body = {};
  if (payload.item_name) body.item_name = payload.item_name.trim();
  if (payload.item_type_id !== undefined) body.item_type_id = Number(payload.item_type_id);
  if (payload.original_amount !== undefined || payload.amount !== undefined) {
    body.original_amount = Number(payload.original_amount !== undefined ? payload.original_amount : payload.amount);
  }
  if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive);

  try {
    const url = buildApiUrl(`/api/items/${id}`, branchId);
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("updateItemApi failed, saving locally:", err);
  }
  return updateItemMaster(id, payload);
};

/**
 * 13) Delete Item (soft delete)
 * DELETE /api/items/:id?branch_id=1
 */
export const deleteItemApi = async (id, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/items/${id}`, branchId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("deleteItemApi failed, deleting locally:", err);
  }
  return deleteItemMaster(id);
};

// ============================================================================
// 3. SYNCHRONOUS LOCALSTORAGE UTILITIES (FOR BACKWARDS COMPATIBILITY)
// ============================================================================

export const getItemTypes = (branchId = null) => {
  const data = localStorage.getItem(ITEM_TYPES_KEY);
  let list = [];
  if (!data) {
    localStorage.setItem(ITEM_TYPES_KEY, JSON.stringify(INITIAL_ITEM_TYPES));
    list = INITIAL_ITEM_TYPES;
  } else {
    try {
      list = JSON.parse(data);
    } catch {
      list = INITIAL_ITEM_TYPES;
    }
  }

  if (branchId !== null && branchId !== undefined && branchId !== "all" && branchId !== "") {
    const bId = Number(branchId);
    return list.filter((item) => item.branch_id === null || item.branch_id === undefined || Number(item.branch_id) === bId);
  }
  return list;
};

export const saveItemTypes = (list) => {
  localStorage.setItem(ITEM_TYPES_KEY, JSON.stringify(list));
};

export const createItemType = (payload) => {
  const current = getItemTypes();
  const name = (payload.item_type_name || payload.name || "").trim();
  const newType = {
    id: Date.now(),
    name: name,
    item_type_name: name,
    description: payload.description ? payload.description.trim() : "",
    branch_id: payload.branch_id ? Number(payload.branch_id) : null,
    branch_name: payload.branch_name || "All Branches",
    date_created: new Date().toISOString().split("T")[0],
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };
  const updated = [newType, ...current];
  saveItemTypes(updated);
  return newType;
};

export const updateItemType = (id, payload) => {
  const current = getItemTypes();
  const updated = current.map((item) => {
    if (Number(item.id) === Number(id)) {
      const name = payload.item_type_name || payload.name || item.name;
      return {
        ...item,
        name: name.trim(),
        item_type_name: name.trim(),
        description: payload.description !== undefined ? payload.description.trim() : item.description,
        branch_id: payload.branch_id !== undefined ? (payload.branch_id ? Number(payload.branch_id) : null) : item.branch_id,
        branch_name: payload.branch_name || item.branch_name,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : item.isActive,
      };
    }
    return item;
  });
  saveItemTypes(updated);

  if (payload.item_type_name || payload.name) {
    const newName = (payload.item_type_name || payload.name).trim();
    const items = getItemsMaster();
    const itemsUpdated = items.map((it) => {
      if (Number(it.item_type_id) === Number(id)) {
        return { ...it, item_type_name: newName };
      }
      return it;
    });
    saveItemsMaster(itemsUpdated);
  }
  return { success: true };
};

export const deleteItemType = (id) => {
  const current = getItemTypes();
  const filtered = current.filter((item) => Number(item.id) !== Number(id));
  saveItemTypes(filtered);

  const items = getItemsMaster();
  const itemsUpdated = items.filter((it) => Number(it.item_type_id) !== Number(id));
  saveItemsMaster(itemsUpdated);
  return { success: true };
};

export const toggleItemTypeStatus = (id) => {
  const current = getItemTypes();
  const updated = current.map((item) => {
    if (Number(item.id) === Number(id)) {
      return { ...item, isActive: !item.isActive };
    }
    return item;
  });
  saveItemTypes(updated);
  return { success: true };
};

export const getItemsMaster = (branchId = null, typeId = null) => {
  const data = localStorage.getItem(ITEMS_MASTER_KEY);
  let list = [];
  if (!data) {
    localStorage.setItem(ITEMS_MASTER_KEY, JSON.stringify(INITIAL_ITEMS_MASTER));
    list = INITIAL_ITEMS_MASTER;
  } else {
    try {
      list = JSON.parse(data);
    } catch {
      list = INITIAL_ITEMS_MASTER;
    }
  }

  if (branchId !== null && branchId !== undefined && branchId !== "all" && branchId !== "") {
    const bId = Number(branchId);
    list = list.filter((item) => item.branch_id === null || item.branch_id === undefined || Number(item.branch_id) === bId);
  }

  if (typeId !== null && typeId !== undefined && typeId !== "all" && typeId !== "") {
    const tId = Number(typeId);
    list = list.filter((item) => Number(item.item_type_id) === tId);
  }

  return list;
};

export const saveItemsMaster = (list) => {
  localStorage.setItem(ITEMS_MASTER_KEY, JSON.stringify(list));
};

export const createItemMaster = (payload) => {
  const current = getItemsMaster();
  const origAmt = Number(payload.original_amount !== undefined ? payload.original_amount : payload.amount) || 0;
  const newItem = {
    id: Date.now(),
    item_id: Date.now(),
    item_type_id: Number(payload.item_type_id),
    item_type_name: payload.item_type_name || "General",
    item_name: payload.item_name.trim(),
    original_amount: origAmt,
    amount: origAmt,
    description: payload.description ? payload.description.trim() : "",
    branch_id: payload.branch_id ? Number(payload.branch_id) : null,
    branch_name: payload.branch_name || "All Branches",
    date_created: new Date().toISOString().split("T")[0],
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };
  const updated = [newItem, ...current];
  saveItemsMaster(updated);
  return newItem;
};

export const updateItemMaster = (id, payload) => {
  const current = getItemsMaster();
  const updated = current.map((item) => {
    if (Number(item.id) === Number(id)) {
      const origAmt = Number(
        payload.original_amount !== undefined
          ? payload.original_amount
          : payload.amount !== undefined
          ? payload.amount
          : item.original_amount || item.amount
      );
      return {
        ...item,
        item_type_id: payload.item_type_id !== undefined ? Number(payload.item_type_id) : item.item_type_id,
        item_type_name: payload.item_type_name || item.item_type_name,
        item_name: payload.item_name ? payload.item_name.trim() : item.item_name,
        original_amount: origAmt,
        amount: origAmt,
        description: payload.description !== undefined ? payload.description.trim() : item.description,
        branch_id: payload.branch_id !== undefined ? (payload.branch_id ? Number(payload.branch_id) : null) : item.branch_id,
        branch_name: payload.branch_name || item.branch_name,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : item.isActive,
      };
    }
    return item;
  });
  saveItemsMaster(updated);
  return { success: true };
};

export const deleteItemMaster = (id) => {
  const current = getItemsMaster();
  const filtered = current.filter((item) => Number(item.id) !== Number(id));
  saveItemsMaster(filtered);
  return { success: true };
};

export const toggleItemMasterStatus = (id) => {
  const current = getItemsMaster();
  const updated = current.map((item) => {
    if (Number(item.id) === Number(id)) {
      return { ...item, isActive: !item.isActive };
    }
    return item;
  });
  saveItemsMaster(updated);
  return { success: true };
};
