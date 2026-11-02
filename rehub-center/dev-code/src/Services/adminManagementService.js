// Admin Management Service: Real Branch APIs + Branch Admin & Operator CRUD with Granular Module Authority
// Backend Base URL
const BASE_URL = "https://gks-yjdc.onrender.com";

// Default Center
export const DEFAULT_CENTER = {
  center_id: 1,
  center_name: "Shri G.K.S. Rehab Center / श्री जी.के.एस. पुनर्वास केंद्र",
  address: "Bhopal, Madhya Pradesh",
};

// Role Definitions
export const ROLES = {
  SUPER_ADMIN: 1,
  BRANCH_ADMIN: 2,
  BRANCH_OPERATOR: 3,
  PATIENT: 4,
  LAB_OPERATOR: 5,
};

// Form Modules List for Permissions Matrix
export const FORM_MODULES_LIST = [
  {
    id: "registration",
    name: "Patient Registration / रोगी पंजीकरण",
    path: "/registeration/register",
    description: "New patient entry, basic details, relative contacts, IPD entry",
  },
  {
    id: "pfa",
    name: "Patient First Assessment (PFA) / रोगी प्रथम मूल्यांकन",
    path: "/PFA-Menu/pfa",
    description: "Initial clinical and psychological assessment",
  },
  {
    id: "gen_family",
    name: "Gen Family / जनरल परिवार विवरण",
    path: "/Gen-Family/gen-family",
    description: "Family background, pedigree, socio-economic profile",
  },
  {
    id: "first_examination",
    name: "First Examination / प्रथम शारीरिक परीक्षण",
    path: "/First-Examination/first-examination",
    description: "Physical and systemic medical examination",
  },
  {
    id: "blood_analysis",
    name: "Medical Observations / चिकित्सा अवलोकन (Blood Analysis)",
    path: "/BA/Blood-Analysis",
    description: "Laboratory investigations, sample collection, pathology reports",
  },
  {
    id: "detoxification",
    name: "Detoxification / विषहरण प्रोटोकॉल",
    path: "/Detoxification/Detoxification",
    description: "Withdrawal management, medications, vital chart",
  },
  {
    id: "fda",
    name: "First Dependency Assessment (FDA) / निर्भरता मूल्यांकन",
    path: "/FDA/first-dependency-assessment",
    description: "Substance dependency severity and history",
  },
  {
    id: "sud",
    name: "Substance Use Dependency (SUD) / मादक पदार्थ निर्भरता",
    path: "/SUD/substance-use-dependency",
    description: "Detailed addiction tracking and behavioral diagnosis",
  },
  {
    id: "cbt_intake_sex_d",
    name: "CBT & Intake Assessment / सीबीटी एवं सेवन मूल्यांकन",
    path: "/CBT_Intake_Sex_D/CbtIntakeSexD",
    description: "Cognitive behavioral therapy, legal, childhood, sexual health",
  },
  {
    id: "brief_intervention",
    name: "Brief Intervention / संक्षिप्त परामर्श",
    path: "/Brief_Intervation/BriefIntervation",
    description: "Counseling sessions, motivational interviewing",
  },
  {
    id: "discharge_followup",
    name: "Discharge & Follow Up / डिस्चार्ज एवं फ़ॉलोअप",
    path: "/Discharge_followup/DischargeFollowUp",
    description: "Discharge summary, followup dates, recovery remarks",
  },
  {
    id: "reports",
    name: "Combined Forms Reports / संयुक्त फॉर्म रिपोर्ट",
    path: "/Reports/Combined-Forms-Report",
    description: "Master multi-module analytics and patient status summary",
  },
];

// Permission templates generator
export const generateDefaultPermissions = (mode = "full") => {
  const permissions = {};
  FORM_MODULES_LIST.forEach((mod) => {
    if (mode === "full") {
      permissions[mod.id] = { view: true, create: true, edit: true, delete: true };
    } else if (mode === "view_only") {
      permissions[mod.id] = { view: true, create: false, edit: false, delete: false };
    } else if (mode === "operator") {
      permissions[mod.id] = { view: true, create: true, edit: true, delete: false };
    } else {
      permissions[mod.id] = { view: false, create: false, edit: false, delete: false };
    }
  });
  return permissions;
};

// Initial Seed Data for Branch Admins (Dummy JSON)
const INITIAL_BRANCH_ADMINS = [
  {
    id: 101,
    name: "Rajesh Sharma",
    username: "rajesh.admin",
    email: "rajesh.sharma@gksrehab.com",
    phone: "9826012345",
    password: "Gks@12345",
    address: "Plot 14, MP Nagar Zone 2, Bhopal",
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    center_id: 1,
    center_name: "Shri G.K.S. Rehab Center",
    role: "BranchAdmin",
    isRole: 2,
    date_created: "2026-08-10",
    isActive: true,
    permissions: generateDefaultPermissions("full"),
  },
  {
    id: 102,
    name: "Pooja Verma",
    username: "pooja.indore",
    email: "pooja.verma@gksrehab.com",
    phone: "9827054321",
    password: "Gks@12345",
    address: "Sector B, Vijay Nagar, Indore",
    branch_id: 2,
    branch_name: "Indore Center Branch",
    center_id: 1,
    center_name: "Shri G.K.S. Rehab Center",
    role: "BranchAdmin",
    isRole: 2,
    date_created: "2026-08-18",
    isActive: true,
    permissions: generateDefaultPermissions("full"),
  },
];

// Initial Seed Data for Branch Operators (Dummy JSON)
const INITIAL_BRANCH_OPERATORS = [
  {
    id: 201,
    name: "Amit Patel",
    username: "amit.operator",
    email: "amit.patel@gksrehab.com",
    phone: "9826112233",
    address: "Hoshangabad Road, Bhopal",
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    center_id: 1,
    center_name: "Shri G.K.S. Rehab Center",
    role: "BranchOperator",
    isRole: 3,
    created_by_admin: "Rajesh Sharma",
    date_created: "2026-08-20",
    isActive: true,
    permissions: generateDefaultPermissions("operator"),
  },
  {
    id: 202,
    name: "Sneha Jain",
    username: "sneha.operator",
    email: "sneha.jain@gksrehab.com",
    phone: "9827998877",
    address: "Palasia Square, Indore",
    branch_id: 2,
    branch_name: "Indore Center Branch",
    center_id: 1,
    center_name: "Shri G.K.S. Rehab Center",
    role: "BranchOperator",
    isRole: 3,
    created_by_admin: "Pooja Verma",
    date_created: "2026-08-25",
    isActive: true,
    permissions: generateDefaultPermissions("operator"),
  },
];

// Helpers for Authorization headers
const getAuthHeaders = (targetBranch = 1) => {
  const token = localStorage.getItem("Authorization") || "";
  // GKS Rehab Portal backend expects raw JWT token without "Bearer " prefix
  const rawToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  return {
    "Content-Type": "application/json",
    ...(rawToken ? { Authorization: rawToken } : {}),
    "x-target-branch": String(targetBranch || 1),
  };
};

// ============================================================================
// 1. REAL BRANCH APIs
// ============================================================================

/**
 * Fetch all branches (active or including inactive)
 */
export const fetchAllBranches = async (targetBranch = 1) => {
  // 1. Use existing cached branches if already available
  const cached = localStorage.getItem("gks_cached_branches");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore parse error
    }
  }

  // 2. Check authoritative login branch details stored in localStorage
  const storedBranches = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  if (Array.isArray(storedBranches) && storedBranches.length > 0) {
    const normalized = storedBranches.map((b) => ({
      id: b.Branch_id || b.id,
      Branch_id: b.Branch_id || b.id,
      Branch_name: b.Branch_name || b.name || `Branch #${b.Branch_id || b.id}`,
      Branch_address: b.Branch_address || b.address || "",
      Branch_phone_number: b.Branch_phone_number || b.phone || "",
      center_id: b.center_id || 1,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
    }));

    localStorage.setItem("gks_cached_branches", JSON.stringify(normalized));
    return normalized;
  }

  // 3. Fallback to API if not cached or stored locally
  try {
    const headers = getAuthHeaders(targetBranch);
    const response = await fetch(`${BASE_URL}/api/branches?branch_id=${targetBranch || 1}`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      const rawList = Array.isArray(data)
        ? data
        : data.data || data.branches || [];

      if (rawList.length > 0) {
        // Normalize branch fields
        const normalized = rawList.map((b) => ({
          id: b.Branch_id || b.id || b.branch_id,
          Branch_id: b.Branch_id || b.id || b.branch_id,
          Branch_name: b.Branch_name || b.name || `Branch #${b.Branch_id || b.id}`,
          Branch_address: b.Branch_address || b.address || "",
          Branch_phone_number: b.Branch_phone_number || b.phone || "",
          center_id: b.center_id || 1,
          isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
        }));

        // Cache branches in localStorage
        localStorage.setItem("gks_cached_branches", JSON.stringify(normalized));
        localStorage.setItem("Branch_Detail", JSON.stringify(normalized));
        return normalized;
      }
    }
  } catch (err) {
    console.warn("Error fetching branches from API, using fallback:", err);
  }

  // 4. Final fallback dummy branches
  return [
    {
      id: 1,
      Branch_id: 1,
      Branch_name: "Bhopal Main Branch",
      Branch_address: "12 MP Nagar, Bhopal",
      Branch_phone_number: "9876543210",
      center_id: 1,
      isActive: true,
    },
    {
      id: 2,
      Branch_id: 2,
      Branch_name: "Indore Center Branch",
      Branch_address: "Sector B, Vijay Nagar, Indore",
      Branch_phone_number: "9876543211",
      center_id: 1,
      isActive: true,
    },
  ];
};

/**
 * Create a new branch via POST /api/branches
 */
export const createBranchApi = async (payload, targetBranch = 1) => {
  const body = {
    center_id: payload.center_id || 1,
    Branch_name: payload.Branch_name,
    Branch_address: payload.Branch_address || "",
    Branch_phone_number: payload.Branch_phone_number || "",
    created_by: payload.created_by || 1,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/branches?branch_id=${targetBranch || 1}`, {
      method: "POST",
      headers: getAuthHeaders(targetBranch),
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || "Failed to create branch");
    }

    const created = result.data || result;
    const newBranch = {
      id: created.Branch_id || created.id || Date.now(),
      Branch_id: created.Branch_id || created.id || Date.now(),
      Branch_name: created.Branch_name || payload.Branch_name,
      Branch_address: created.Branch_address || payload.Branch_address || "",
      Branch_phone_number: created.Branch_phone_number || payload.Branch_phone_number || "",
      center_id: created.center_id || payload.center_id || 1,
      isActive: true,
    };
    const cached = await fetchAllBranches(targetBranch);
    const updated = [newBranch, ...cached.filter((b) => b.id !== newBranch.id)];
    localStorage.setItem("gks_cached_branches", JSON.stringify(updated));
    localStorage.setItem("Branch_Detail", JSON.stringify(updated));
    return newBranch;
  } catch (err) {
    console.warn("Failed to reach branch create API, saving to local cache:", err);
    const cached = await fetchAllBranches(targetBranch);
    const newId = Date.now();
    const newBranch = {
      id: newId,
      Branch_id: newId,
      ...body,
      isActive: true,
    };
    const updated = [newBranch, ...cached];
    localStorage.setItem("gks_cached_branches", JSON.stringify(updated));
    localStorage.setItem("Branch_Detail", JSON.stringify(updated));
    return newBranch;
  }
};

/**
 * Update branch via PUT /api/branches/:id
 */
export const updateBranchApi = async (branchId, payload, targetBranch = 1) => {
  const body = {
    Branch_name: payload.Branch_name,
    Branch_address: payload.Branch_address || "",
    Branch_phone_number: payload.Branch_phone_number || "",
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/branches/${branchId}?branch_id=${targetBranch || 1}`, {
      method: "PUT",
      headers: getAuthHeaders(targetBranch),
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || "Failed to update branch");
    }
  } catch (err) {
    console.warn("Failed to reach branch update API, updating local cache:", err);
  }

  const cached = await fetchAllBranches(targetBranch);
  const updated = cached.map((b) =>
    b.id === branchId || b.Branch_id === branchId ? { ...b, ...body } : b
  );
  localStorage.setItem("gks_cached_branches", JSON.stringify(updated));
  localStorage.setItem("Branch_Detail", JSON.stringify(updated));
  return { success: true };
};

/**
 * Soft delete branch via DELETE /api/branches/:id
 */
export const deleteBranchApi = async (branchId, targetBranch = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/api/branches/${branchId}?branch_id=${targetBranch || 1}`, {
      method: "DELETE",
      headers: getAuthHeaders(targetBranch),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || "Failed to delete branch");
    }
  } catch (err) {
    console.warn("Failed to reach branch delete API, soft-deleting in local cache:", err);
  }

  const cached = await fetchAllBranches(targetBranch);
  const updated = cached.map((b) =>
    b.id === branchId || b.Branch_id === branchId ? { ...b, isActive: false } : b
  );
  localStorage.setItem("gks_cached_branches", JSON.stringify(updated));
  localStorage.setItem("Branch_Detail", JSON.stringify(updated));
  return { success: true };
};

// ============================================================================
// 2. BRANCH ADMIN CRUD (Dummy JSON + LocalStorage State)
// ============================================================================

export const getBranchAdmins = () => {
  const data = localStorage.getItem("gks_branch_admins");
  if (!data) {
    localStorage.setItem("gks_branch_admins", JSON.stringify(INITIAL_BRANCH_ADMINS));
    return INITIAL_BRANCH_ADMINS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_BRANCH_ADMINS;
  }
};

export const saveBranchAdmins = (admins) => {
  localStorage.setItem("gks_branch_admins", JSON.stringify(admins));
};

export const createBranchAdmin = async (adminData) => {
  const current = getBranchAdmins();
  const newAdmin = {
    id: Date.now(),
    name: adminData.name,
    username: adminData.username || adminData.email?.split("@")[0] || `admin_${Date.now()}`,
    email: adminData.email || "",
    phone: adminData.phone || "",
    address: adminData.address || "",
    password: adminData.password || "Gks@12345",
    branch_id: Number(adminData.branch_id),
    branch_name: adminData.branch_name || "Assigned Branch",
    center_id: adminData.center_id || 1,
    center_name: adminData.center_name || DEFAULT_CENTER.center_name,
    role: "BranchAdmin",
    isRole: 2,
    date_created: adminData.date_created || new Date().toISOString().split("T")[0],
    isActive: true,
    permissions: adminData.permissions || generateDefaultPermissions("full"),
  };

  const updated = [newAdmin, ...current];
  saveBranchAdmins(updated);
  return newAdmin;
};

export const updateBranchAdmin = async (id, adminData) => {
  const current = getBranchAdmins();
  const updated = current.map((adm) => {
    if (adm.id === Number(id)) {
      return {
        ...adm,
        ...adminData,
        branch_id: Number(adminData.branch_id || adm.branch_id),
      };
    }
    return adm;
  });
  saveBranchAdmins(updated);
  return true;
};

export const deleteBranchAdmin = async (id) => {
  const current = getBranchAdmins();
  const updated = current.filter((adm) => adm.id !== Number(id));
  saveBranchAdmins(updated);
  return true;
};

export const toggleBranchAdminStatus = async (id) => {
  const current = getBranchAdmins();
  const updated = current.map((adm) => {
    if (adm.id === Number(id)) {
      return { ...adm, isActive: !adm.isActive };
    }
    return adm;
  });
  saveBranchAdmins(updated);
  return true;
};

// ============================================================================
// 3. BRANCH OPERATOR CRUD (Dummy JSON + LocalStorage State)
// ============================================================================

export const getBranchOperators = (branchId = null) => {
  const data = localStorage.getItem("gks_branch_operators");
  let operators = INITIAL_BRANCH_OPERATORS;
  if (data) {
    try {
      operators = JSON.parse(data);
    } catch {
      operators = INITIAL_BRANCH_OPERATORS;
    }
  } else {
    localStorage.setItem("gks_branch_operators", JSON.stringify(INITIAL_BRANCH_OPERATORS));
  }

  if (branchId) {
    return operators.filter((op) => String(op.branch_id) === String(branchId));
  }
  return operators;
};

export const saveBranchOperators = (operators) => {
  localStorage.setItem("gks_branch_operators", JSON.stringify(operators));
};

export const createBranchOperator = async (operatorData) => {
  const current = getBranchOperators();
  const newOp = {
    id: Date.now(),
    name: operatorData.name,
    username: operatorData.username || operatorData.email?.split("@")[0] || `op_${Date.now()}`,
    email: operatorData.email || "",
    phone: operatorData.phone || "",
    address: operatorData.address || "",
    password: operatorData.password || "Gks@12345",
    branch_id: Number(operatorData.branch_id),
    branch_name: operatorData.branch_name || "Assigned Branch",
    center_id: operatorData.center_id || 1,
    center_name: operatorData.center_name || DEFAULT_CENTER.center_name,
    role: "BranchOperator",
    isRole: 3,
    created_by_admin: operatorData.created_by_admin || "Branch Admin",
    date_created: operatorData.date_created || new Date().toISOString().split("T")[0],
    isActive: true,
    permissions: operatorData.permissions || generateDefaultPermissions("operator"),
  };

  const updated = [newOp, ...current];
  saveBranchOperators(updated);
  return newOp;
};

export const updateBranchOperator = async (id, operatorData) => {
  const current = getBranchOperators();
  const updated = current.map((op) => {
    if (op.id === Number(id)) {
      return {
        ...op,
        ...operatorData,
        branch_id: Number(operatorData.branch_id || op.branch_id),
      };
    }
    return op;
  });
  saveBranchOperators(updated);
  return true;
};

export const deleteBranchOperator = async (id) => {
  const current = getBranchOperators();
  const updated = current.filter((op) => op.id !== Number(id));
  saveBranchOperators(updated);
  return true;
};

export const toggleBranchOperatorStatus = async (id) => {
  const current = getBranchOperators();
  const updated = current.map((op) => {
    if (op.id === Number(id)) {
      return { ...op, isActive: !op.isActive };
    }
    return op;
  });
  saveBranchOperators(updated);
  return true;
};

// ============================================================================
// 4. LAB OPERATOR CRUD (Role 5 - Responsible for Sample Collection & Reports)
// ============================================================================
const INITIAL_LAB_OPERATORS = [
  {
    id: 301,
    name: "Ramesh Kumar (Lab)",
    username: "ramesh.lab",
    email: "ramesh.lab@gksrehab.com",
    phone: "9876543210",
    address: "Bhopal, Madhya Pradesh",
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    center_id: 1,
    center_name: DEFAULT_CENTER.center_name,
    role: "LabOperator",
    isRole: 5,
    created_by_admin: "SuperAdmin",
    date_created: "2026-10-01",
    isActive: true,
  },
];

export const getLabOperators = (branchId = null) => {
  const data = localStorage.getItem("gks_lab_operators");
  let operators = INITIAL_LAB_OPERATORS;
  if (data) {
    try {
      operators = JSON.parse(data);
    } catch {
      operators = INITIAL_LAB_OPERATORS;
    }
  } else {
    localStorage.setItem("gks_lab_operators", JSON.stringify(INITIAL_LAB_OPERATORS));
  }

  if (branchId) {
    return operators.filter((op) => String(op.branch_id) === String(branchId));
  }
  return operators;
};

export const saveLabOperators = (operators) => {
  localStorage.setItem("gks_lab_operators", JSON.stringify(operators));
};

export const createLabOperator = async (operatorData) => {
  const current = getLabOperators();
  const newOp = {
    id: Date.now(),
    name: operatorData.name,
    username: operatorData.username || operatorData.email?.split("@")[0] || `lab_${Date.now()}`,
    email: operatorData.email || "",
    phone: operatorData.phone || "",
    address: operatorData.address || "",
    password: operatorData.password || "Lab@1234",
    branch_id: Number(operatorData.branch_id),
    branch_name: operatorData.branch_name || "Assigned Branch",
    center_id: operatorData.center_id || 1,
    center_name: operatorData.center_name || DEFAULT_CENTER.center_name,
    role: "LabOperator",
    isRole: 5,
    created_by_admin: operatorData.created_by_admin || "Branch Admin",
    date_created: operatorData.date_created || new Date().toISOString().split("T")[0],
    isActive: true,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/users?branch_id=${newOp.branch_id}`, {
      method: "POST",
      headers: getAuthHeaders(newOp.branch_id),
      body: JSON.stringify({
        name: newOp.name,
        relative_name: operatorData.relative_name || "N/A",
        email: newOp.email,
        gender: operatorData.gender || "Male",
        address: newOp.address,
        dob: operatorData.dob || "1995-01-01",
        phone: newOp.phone,
        password: newOp.password,
        isRole: 5,
      }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data?.id) {
      newOp.id = json.data.id;
    }
  } catch (err) {
    console.warn("Real API create lab operator fallback to local storage:", err);
  }

  const updated = [newOp, ...current];
  saveLabOperators(updated);
  return newOp;
};

export const updateLabOperator = async (id, operatorData) => {
  const current = getLabOperators();
  const updated = current.map((op) => {
    if (op.id === Number(id)) {
      return {
        ...op,
        ...operatorData,
        branch_id: Number(operatorData.branch_id || op.branch_id),
      };
    }
    return op;
  });

  try {
    await fetch(`${BASE_URL}/api/users/${id}?branch_id=${operatorData.branch_id || 1}`, {
      method: "PUT",
      headers: getAuthHeaders(operatorData.branch_id || 1),
      body: JSON.stringify({
        name: operatorData.name,
        relative_name: operatorData.relative_name || "N/A",
        email: operatorData.email,
        gender: operatorData.gender || "Male",
        address: operatorData.address,
        isRole: 5,
      }),
    });
  } catch (err) {
    console.warn("Real API update lab operator fallback to local storage:", err);
  }

  saveLabOperators(updated);
  return true;
};

export const deleteLabOperator = async (id) => {
  const current = getLabOperators();
  const updated = current.filter((op) => op.id !== Number(id));
  saveLabOperators(updated);
  return true;
};

export const toggleLabOperatorStatus = async (id) => {
  const current = getLabOperators();
  const updated = current.map((op) => {
    if (op.id === Number(id)) {
      return { ...op, isActive: !op.isActive };
    }
    return op;
  });
  saveLabOperators(updated);
  return true;
};
