import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  TabContent,
  TabPane,
  Button,
  Badge,
  Form,
  Label,
  Input,
  InputGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Table,
} from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Eye,
  GitBranch,
  RefreshCw,
  Search,
  Check,
  Lock,
  Unlock,
  Users,
  Filter,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "react-feather";

import HeaderCard from "../Common/Component/HeaderCard";
import { ActionButtonsGroup, TableActionButton } from "../Common/Component/ActionButtons";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

import {
  DEFAULT_CENTER,
  FORM_MODULES_LIST,
  generateDefaultPermissions,
  fetchAllBranches,
  createBranchApi,
  updateBranchApi,
  deleteBranchApi,
  getBranchAdmins,
  createBranchAdmin,
  updateBranchAdmin,
  deleteBranchAdmin,
  toggleBranchAdminStatus,
  getBranchOperators,
  createBranchOperator,
  updateBranchOperator,
  deleteBranchOperator,
  toggleBranchOperatorStatus,
} from "../../Services/adminManagementService";

const GlobalSettings = ({ initialTab }) => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();

  // Role detection from logged in session
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";
  const loggedInName = localStorage.getItem("Name") || (isSuperAdmin ? "Super Admin" : "Branch Admin");
  const branchDetail = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  const currentBranchName = branchDetail[0]?.Branch_name || "";

  // Tab State
  const resolveTab = useCallback(() => {
    if (!isSuperAdmin) return "branch_operators";
    if (initialTab) return initialTab;
    const path = (location.pathname || "").toLowerCase();
    if (path.includes("branch-admin")) return "branch_admins";
    if (path.includes("branch-operator")) return "branch_operators";
    if (path.includes("branche")) return "branches";
    return "branch_admins";
  }, [initialTab, isSuperAdmin, location.pathname]);

  const [activeTab, setActiveTab] = useState(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [resolveTab]);

  // Data states
  const [branches, setBranches] = useState([]);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [branchAdmins, setBranchAdmins] = useState([]);
  const [branchOperators, setBranchOperators] = useState([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  // Modal States
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);

  // Form State for Branch Admin / Operator
  const [userFormData, setUserFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    branch_id: "",
    branch_name: "",
    center_id: DEFAULT_CENTER.center_id,
    center_name: DEFAULT_CENTER.center_name,
    date_created: new Date().toISOString().split("T")[0],
    permissions: generateDefaultPermissions("full"),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isInlineNewBranch, setIsInlineNewBranch] = useState(false);
  const [inlineBranchData, setInlineBranchData] = useState({
    Branch_name: "",
    Branch_address: "",
    Branch_phone_number: "",
  });

  // Branch Form State
  const [branchFormData, setBranchFormData] = useState({
    Branch_name: "",
    Branch_address: "",
    Branch_phone_number: "",
    center_id: DEFAULT_CENTER.center_id,
    isActive: true,
  });

  // Load all initial data
  const loadBranches = useCallback(async () => {
    setIsBranchesLoading(true);
    try {
      const list = await fetchAllBranches(selectedBranch || 1);
      setBranches(list);
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setIsBranchesLoading(false);
    }
  }, [selectedBranch]);

  const loadAdminsAndOperators = useCallback(() => {
    setBranchAdmins(getBranchAdmins());
    setBranchOperators(getBranchOperators());
  }, []);

  useEffect(() => {
    loadBranches();
    loadAdminsAndOperators();
  }, [loadBranches, loadAdminsAndOperators]);

  // Synchronize default tab if role changes
  useEffect(() => {
    if (!isSuperAdmin && (activeTab === "branch_admins" || activeTab === "branches")) {
      setActiveTab("branch_operators");
    }
  }, [isSuperAdmin, activeTab]);

  // Generate random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "Gks@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // --------------------------------------------------------------------------
  // Branch Admin CRUD Handlers
  // --------------------------------------------------------------------------
  const openCreateAdminModal = () => {
    setEditingAdmin(null);
    setIsInlineNewBranch(false);
    setUserFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      address: "",
      password: generateRandomPassword(),
      branch_id: branches.length > 0 ? branches[0].id : "",
      branch_name: branches.length > 0 ? branches[0].Branch_name : "",
      center_id: DEFAULT_CENTER.center_id,
      center_name: DEFAULT_CENTER.center_name,
      date_created: new Date().toISOString().split("T")[0],
      permissions: generateDefaultPermissions("full"),
    });
    setAdminModalOpen(true);
  };

  const openEditAdminModal = (admin) => {
    setEditingAdmin(admin);
    setIsInlineNewBranch(false);
    setUserFormData({
      name: admin.name || "",
      username: admin.username || "",
      email: admin.email || "",
      phone: admin.phone || "",
      address: admin.address || "",
      password: admin.password || "",
      branch_id: admin.branch_id || (branches.length > 0 ? branches[0].id : ""),
      branch_name: admin.branch_name || "",
      center_id: admin.center_id || DEFAULT_CENTER.center_id,
      center_name: admin.center_name || DEFAULT_CENTER.center_name,
      date_created: admin.date_created || new Date().toISOString().split("T")[0],
      permissions: admin.permissions || generateDefaultPermissions("full"),
    });
    setAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();

    if (!userFormData.name.trim()) {
      toast.warning(getTranslation("Please enter Branch Admin Name / कृपया व्यवस्थापक नाम दर्ज करें", lang));
      return;
    }

    if (!userFormData.phone.trim() || userFormData.phone.length !== 10) {
      toast.warning(getTranslation("Please enter a valid 10-digit phone number / कृपया 10 अंकों का फोन नंबर दर्ज करें", lang));
      return;
    }

    let assignedBranchId = userFormData.branch_id;
    let assignedBranchName = userFormData.branch_name;

    // Handle inline new branch creation
    if (isInlineNewBranch) {
      if (!inlineBranchData.Branch_name.trim()) {
        toast.warning(getTranslation("Please enter the new Branch Name / कृपया नई शाखा का नाम दर्ज करें", lang));
        return;
      }
      try {
        const createdBranch = await createBranchApi(inlineBranchData, selectedBranch || 1);
        assignedBranchId = createdBranch.id || createdBranch.Branch_id;
        assignedBranchName = createdBranch.Branch_name;
        toast.success(getTranslation("New branch created successfully! / नई शाखा सफलतापूर्वक बनाई गई!", lang));
        await loadBranches();
      } catch (err) {
        toast.error("Failed to create branch: " + err.message);
        return;
      }
    } else {
      const found = branches.find((b) => String(b.id) === String(assignedBranchId));
      if (found) assignedBranchName = found.Branch_name;
    }

    const payload = {
      ...userFormData,
      branch_id: assignedBranchId,
      branch_name: assignedBranchName,
    };

    if (editingAdmin) {
      await updateBranchAdmin(editingAdmin.id, payload);
      toast.success(getTranslation("Branch Admin updated successfully! / शाखा व्यवस्थापक सफलतापूर्वक अपडेट किया गया!", lang));
    } else {
      await createBranchAdmin(payload);
      toast.success(getTranslation("Branch Admin created successfully! / शाखा व्यवस्थापक सफलतापूर्वक बनाया गया!", lang));
    }

    loadAdminsAndOperators();
    setAdminModalOpen(false);
  };

  const handleDeleteAdmin = async (admin) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Branch Admin? / व्यवस्थापक हटाएं?", lang),
      text: `${getTranslation("Are you sure you want to remove / क्या आप वाकई हटाना चाहते हैं", lang)} ${admin.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      await deleteBranchAdmin(admin.id);
      loadAdminsAndOperators();
      toast.info(getTranslation("Branch Admin removed / शाखा व्यवस्थापक हटा दिया गया", lang));
    }
  };

  const handleToggleAdminStatus = async (admin) => {
    await toggleBranchAdminStatus(admin.id);
    loadAdminsAndOperators();
    toast.success(
      admin.isActive
        ? getTranslation("Admin deactivated / व्यवस्थापक निष्क्रिय किया गया", lang)
        : getTranslation("Admin activated / व्यवस्थापक सक्रिय किया गया", lang)
    );
  };

  // --------------------------------------------------------------------------
  // Branch Operator CRUD Handlers
  // --------------------------------------------------------------------------
  const openCreateOperatorModal = () => {
    setEditingOperator(null);
    const defaultBranchId = isSuperAdmin
      ? branches[0]?.id || ""
      : selectedBranch || branches[0]?.id || "";
    const defaultBranchName =
      branches.find((b) => String(b.id) === String(defaultBranchId))?.Branch_name || "";

    setUserFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      address: "",
      password: generateRandomPassword(),
      branch_id: defaultBranchId,
      branch_name: defaultBranchName,
      center_id: DEFAULT_CENTER.center_id,
      center_name: DEFAULT_CENTER.center_name,
      date_created: new Date().toISOString().split("T")[0],
      permissions: generateDefaultPermissions("operator"),
    });
    setOperatorModalOpen(true);
  };

  const openEditOperatorModal = (op) => {
    setEditingOperator(op);
    setUserFormData({
      name: op.name || "",
      username: op.username || "",
      email: op.email || "",
      phone: op.phone || "",
      address: op.address || "",
      password: op.password || "",
      branch_id: op.branch_id || (branches[0]?.id || ""),
      branch_name: op.branch_name || "",
      center_id: op.center_id || DEFAULT_CENTER.center_id,
      center_name: op.center_name || DEFAULT_CENTER.center_name,
      date_created: op.date_created || new Date().toISOString().split("T")[0],
      permissions: op.permissions || generateDefaultPermissions("operator"),
    });
    setOperatorModalOpen(true);
  };

  const handleSaveOperator = async (e) => {
    e.preventDefault();

    if (!userFormData.name.trim()) {
      toast.warning(getTranslation("Please enter Operator Name / कृपया ऑपरेटर का नाम दर्ज करें", lang));
      return;
    }

    if (!userFormData.phone.trim() || userFormData.phone.length !== 10) {
      toast.warning(getTranslation("Please enter a valid 10-digit phone number / कृपया 10 अंकों का फोन नंबर दर्ज करें", lang));
      return;
    }

    const found = branches.find((b) => String(b.id) === String(userFormData.branch_id));
    const assignedBranchName = found ? found.Branch_name : userFormData.branch_name;

    const payload = {
      ...userFormData,
      branch_name: assignedBranchName,
    };

    if (editingOperator) {
      await updateBranchOperator(editingOperator.id, payload);
      toast.success(getTranslation("Branch Operator updated successfully! / शाखा ऑपरेटर सफलतापूर्वक अपडेट किया गया!", lang));
    } else {
      await createBranchOperator(payload);
      toast.success(getTranslation("Branch Operator created successfully! / शाखा ऑपरेटर सफलतापूर्वक बनाया गया!", lang));
    }

    loadAdminsAndOperators();
    setOperatorModalOpen(false);
  };

  const handleDeleteOperator = async (op) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Branch Operator? / ऑपरेटर हटाएं?", lang),
      text: `${getTranslation("Are you sure you want to remove / क्या आप वाकई हटाना चाहते हैं", lang)} ${op.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      await deleteBranchOperator(op.id);
      loadAdminsAndOperators();
      toast.info(getTranslation("Branch Operator removed / शाखा ऑपरेटर हटा दिया गया", lang));
    }
  };

  const handleToggleOperatorStatus = async (op) => {
    await toggleBranchOperatorStatus(op.id);
    loadAdminsAndOperators();
    toast.success(
      op.isActive
        ? getTranslation("Operator deactivated / ऑपरेटर निष्क्रिय किया गया", lang)
        : getTranslation("Operator activated / ऑपरेटर सक्रिय किया गया", lang)
    );
  };

  // --------------------------------------------------------------------------
  // Real Branch CRUD Handlers (SuperAdmin)
  // --------------------------------------------------------------------------
  const openCreateBranchModal = () => {
    setEditingBranch(null);
    setBranchFormData({
      Branch_name: "",
      Branch_address: "",
      Branch_phone_number: "",
      center_id: DEFAULT_CENTER.center_id,
      isActive: true,
    });
    setBranchModalOpen(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchFormData({
      Branch_name: branch.Branch_name || "",
      Branch_address: branch.Branch_address || "",
      Branch_phone_number: branch.Branch_phone_number || "",
      center_id: branch.center_id || DEFAULT_CENTER.center_id,
      isActive: branch.isActive !== undefined ? branch.isActive : true,
    });
    setBranchModalOpen(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchFormData.Branch_name.trim()) {
      toast.warning(getTranslation("Please enter Branch Name / कृपया शाखा का नाम दर्ज करें", lang));
      return;
    }

    try {
      if (editingBranch) {
        await updateBranchApi(editingBranch.id, branchFormData, selectedBranch || 1);
        toast.success(getTranslation("Branch updated successfully! / शाखा सफलतापूर्वक अपडेट की गई!", lang));
      } else {
        await createBranchApi(branchFormData, selectedBranch || 1);
        toast.success(getTranslation("New branch created successfully! / नई शाखा सफलतापूर्वक बनाई गई!", lang));
      }
      setBranchModalOpen(false);
      await loadBranches();
    } catch (err) {
      toast.error("Error saving branch: " + err.message);
    }
  };

  const handleDeleteBranch = async (branch) => {
    const confirm = await Swal.fire({
      title: getTranslation("Deactivate Branch? / शाखा निष्क्रिय करें?", lang),
      text: `${getTranslation("Are you sure you want to deactivate / क्या आप वाकई निष्क्रिय करना चाहते हैं", lang)} ${branch.Branch_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, deactivate / हाँ, निष्क्रिय करें", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      try {
        await deleteBranchApi(branch.id, selectedBranch || 1);
        toast.info(getTranslation("Branch deactivated / शाखा निष्क्रिय कर दी गई", lang));
        await loadBranches();
      } catch (err) {
        toast.error("Error: " + err.message);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Permissions Matrix Handlers
  // --------------------------------------------------------------------------
  const handlePermissionChange = (moduleId, action) => {
    setUserFormData((prev) => {
      const currentMod = prev.permissions[moduleId] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
      };
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: {
            ...currentMod,
            [action]: !currentMod[action],
          },
        },
      };
    });
  };

  const applyPermissionTemplate = (templateName) => {
    setUserFormData((prev) => ({
      ...prev,
      permissions: generateDefaultPermissions(templateName),
    }));
    toast.info(
      getTranslation(
        `Applied template: ${templateName.toUpperCase()} / टेम्पलेट लागू किया गया`,
        lang
      )
    );
  };

  const calculateGrantedModulesCount = (perms = {}) => {
    return Object.values(perms).filter(
      (p) => p && (p.view || p.create || p.edit || p.delete)
    ).length;
  };

  // Filtered lists
  const filteredAdmins = useMemo(() => {
    return branchAdmins.filter((adm) => {
      const matchesSearch =
        adm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.phone.includes(searchTerm) ||
        adm.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch =
        branchFilter === "all" || String(adm.branch_id) === String(branchFilter);
      return matchesSearch && matchesBranch;
    });
  }, [branchAdmins, searchTerm, branchFilter]);

  const filteredOperators = useMemo(() => {
    return branchOperators.filter((op) => {
      const matchesSearch =
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.phone.includes(searchTerm);
      const matchesBranch =
        isSuperAdmin
          ? branchFilter === "all" || String(op.branch_id) === String(branchFilter)
          : String(op.branch_id) === String(selectedBranch || 1);
      return matchesSearch && matchesBranch;
    });
  }, [branchOperators, searchTerm, branchFilter, isSuperAdmin, selectedBranch]);

  return (
    <Container fluid={true} className="p-3 p-md-4">
      <HeaderCard
        title={getTranslation(
          "Global Settings & Administration / वैश्विक सेटिंग्स एवं प्रशासन",
          lang
        )}
      />

      {/* Role Banner */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", background: "linear-gradient(135deg, #1E6554 0%, #24695c 100%)" }}>
        <CardBody className="py-3 px-4 text-white d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm"
              style={{ width: "46px", height: "46px", minWidth: "46px" }}
            >
              <Settings size={22} color="#24695c" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">
                {getTranslation("System Role & Authority Hub / प्रणाली भूमिका एवं अधिकार प्रबंधन", lang)}
              </h5>
              <div className="small opacity-75 mt-0.5 d-flex align-items-center flex-wrap gap-2">
                <span>{DEFAULT_CENTER.center_name} • {getTranslation("Active Center ID: 1", lang)}</span>
                {!isSuperAdmin && currentBranchName && (
                  <span className="badge bg-white bg-opacity-25 text-white fw-semibold">
                    <GitBranch size={11} className="me-1" />
                    {currentBranchName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div
            className="d-flex align-items-center shadow-sm"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              borderRadius: "30px",
              padding: "5px 14px 5px 6px",
              gap: "10px",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                backgroundColor: "#ffffff",
              }}
            >
              <User size={16} color="#24695c" />
            </div>
            <span
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "14px",
                letterSpacing: "0.2px",
              }}
            >
              {loggedInName}
            </span>
            <span
              style={{
                backgroundColor: isSuperAdmin ? "#f59e0b" : "#10b981",
                color: isSuperAdmin ? "#78350f" : "#ffffff",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginLeft: "4px",
              }}
            >
              {isSuperAdmin ? "Super Admin" : "Branch Admin"}
            </span>
            </div>

            {/* Quick Testing Role Switcher */}
            <Button
              color="light"
              size="sm"
              className="d-flex align-items-center gap-1.5 fw-bold text-dark border shadow-sm px-3 py-1.5"
              style={{ borderRadius: "20px", fontSize: "12px", backgroundColor: "#ffffff" }}
              onClick={() => {
                if (isSuperAdmin) {
                  const admins = getBranchAdmins();
                  const demoAdmin = admins[0] || {
                    name: "Rajesh Sharma",
                    username: "rajesh.admin",
                    branch_id: 1,
                    branch_name: "Bhopal Main Branch",
                  };
                  localStorage.setItem("isRoleType", "BranchAdmin");
                  localStorage.setItem("Name", demoAdmin.name);
                  localStorage.setItem(
                    "Branch_Detail",
                    JSON.stringify([{ Branch_id: demoAdmin.branch_id, Branch_name: demoAdmin.branch_name }])
                  );
                  localStorage.setItem("Selected_Branch_ID", demoAdmin.branch_id);
                  toast.info(getTranslation("Switched to Branch Admin View for testing / शाखा व्यवस्थापक दृश्य पर स्विच किया गया", lang));
                  setTimeout(() => window.location.reload(), 300);
                } else {
                  localStorage.setItem("isRoleType", "SuperAdmin");
                  localStorage.setItem("Name", "Super Admin");
                  toast.info(getTranslation("Switched to Super Admin View / सुपर एडमिन दृश्य पर स्विच किया गया", lang));
                  setTimeout(() => window.location.reload(), 300);
                }
              }}
              title="Click to toggle between Super Admin and Branch Admin UI for testing"
            >
              <RefreshCw size={13} className="text-primary me-1" />
              <span>
                {isSuperAdmin
                  ? getTranslation("Preview Branch Admin UI / व्यवस्थापक दृश्य देखें", lang)
                  : getTranslation("Back to Super Admin UI / सुपर एडमिन दृश्य", lang)}
              </span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Navigation Tab Bar matching linear/github underline design */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 bg-white px-2 rounded-3 border-bottom shadow-sm"
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "2px" }}>
          {isSuperAdmin ? (
            <>
              {/* Tab 1: Branch Admins (SuperAdmin Only) */}
              <button
                type="button"
                className="d-flex align-items-center gap-2 border-0 bg-transparent py-3 px-3 fw-bold"
                style={{
                  cursor: "pointer",
                  fontSize: "13.5px",
                  color: activeTab === "branch_admins" ? "#24695c" : "#64748b",
                  borderBottom: activeTab === "branch_admins" ? "2.5px solid #24695c" : "2.5px solid transparent",
                  marginBottom: "-1px",
                  transition: "all 0.15s ease",
                }}
                onClick={() => {
                  setActiveTab("branch_admins");
                  navigate(`${process.env.PUBLIC_URL}/settings/branch-admins`);
                }}
              >
                <Shield size={16} color={activeTab === "branch_admins" ? "#24695c" : "#64748b"} />
                <span>{getTranslation("Branch Admins / व्यवस्थापक", lang)}</span>
                <span
                  className="rounded-pill ms-1 fw-bold"
                  style={{
                    fontSize: "11px",
                    padding: "2px 7px",
                    backgroundColor: activeTab === "branch_admins" ? "#e6f4f1" : "#f1f5f9",
                    color: activeTab === "branch_admins" ? "#24695c" : "#64748b",
                  }}
                >
                  {branchAdmins.length}
                </span>
              </button>

              {/* Tab 2: Branch Management (SuperAdmin Only) */}
              <button
                type="button"
                className="d-flex align-items-center gap-2 border-0 bg-transparent py-3 px-3 fw-bold"
                style={{
                  cursor: "pointer",
                  fontSize: "13.5px",
                  color: activeTab === "branches" ? "#24695c" : "#64748b",
                  borderBottom: activeTab === "branches" ? "2.5px solid #24695c" : "2.5px solid transparent",
                  marginBottom: "-1px",
                  transition: "all 0.15s ease",
                }}
                onClick={() => {
                  setActiveTab("branches");
                  navigate(`${process.env.PUBLIC_URL}/settings/branches`);
                }}
              >
                <GitBranch size={16} color={activeTab === "branches" ? "#24695c" : "#64748b"} />
                <span>{getTranslation("Branch Management / शाखाएं (API)", lang)}</span>
                <span
                  className="rounded-pill ms-1 fw-bold"
                  style={{
                    fontSize: "11px",
                    padding: "2px 7px",
                    backgroundColor: activeTab === "branches" ? "#e6f4f1" : "#f1f5f9",
                    color: activeTab === "branches" ? "#24695c" : "#64748b",
                  }}
                >
                  {branches.length}
                </span>
              </button>
            </>
          ) : null}

          {/* Tab: Branch Operators (Both Roles) */}
          <button
            type="button"
            className="d-flex align-items-center gap-2 border-0 bg-transparent py-3 px-3 fw-bold"
            style={{
              cursor: "pointer",
              fontSize: "13.5px",
              color: activeTab === "branch_operators" ? "#24695c" : "#64748b",
              borderBottom: activeTab === "branch_operators" ? "2.5px solid #24695c" : "2.5px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s ease",
            }}
            onClick={() => {
              setActiveTab("branch_operators");
              navigate(`${process.env.PUBLIC_URL}/settings/branch-operators`);
            }}
          >
            <Users size={16} color={activeTab === "branch_operators" ? "#24695c" : "#64748b"} />
            <span>{getTranslation("Branch Operators / शाखा ऑपरेटर", lang)}</span>
            <span
              className="rounded-pill ms-1 fw-bold"
              style={{
                fontSize: "11px",
                padding: "2px 7px",
                backgroundColor: activeTab === "branch_operators" ? "#e6f4f1" : "#f1f5f9",
                color: activeTab === "branch_operators" ? "#24695c" : "#64748b",
              }}
            >
              {branchOperators.length}
            </span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="d-flex align-items-center gap-2 py-2">
          {activeTab === "branch_admins" && isSuperAdmin && (
            <Button
              color="primary"
              className="d-flex align-items-center py-1.5 px-3 shadow-sm fw-bold"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={openCreateAdminModal}
            >
              <Plus size={16} style={{ marginRight: "6px" }} />
              <span>{getTranslation("Create Branch Admin / नया व्यवस्थापक जोड़ें", lang)}</span>
            </Button>
          )}

          {activeTab === "branch_operators" && (
            <Button
              color="primary"
              className="d-flex align-items-center py-1.5 px-3 shadow-sm fw-bold"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={openCreateOperatorModal}
            >
              <Plus size={16} style={{ marginRight: "6px" }} />
              <span>{getTranslation("Create Branch Operator / नया ऑपरेटर जोड़ें", lang)}</span>
            </Button>
          )}

          {activeTab === "branches" && isSuperAdmin && (
            <Button
              color="primary"
              className="d-flex align-items-center py-1.5 px-3 shadow-sm fw-bold"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={openCreateBranchModal}
            >
              <Plus size={16} style={{ marginRight: "6px" }} />
              <span>{getTranslation("Create New Branch / नई शाखा जोड़ें", lang)}</span>
            </Button>
          )}

          <Button
            color="light"
            className="border py-1.5 px-2.5 shadow-sm text-muted"
            style={{ borderRadius: "8px" }}
            onClick={() => {
              loadBranches();
              loadAdminsAndOperators();
              toast.info(getTranslation("Refreshed all settings data / डेटा रीफ़्रेश किया गया", lang));
            }}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar for Admins / Branches / Operators only */}
      {(activeTab === "branch_admins" || activeTab === "branch_operators" || activeTab === "branches") && (
      <Card className="border shadow-sm mb-4" style={{ borderRadius: "10px" }}>
        <CardBody className="py-2.5 px-3">
          <Row className="g-2 align-items-center">
            <Col md={isSuperAdmin ? 6 : 8} sm={12}>
              <InputGroup size="sm" className="shadow-none">
                <span
                  className="input-group-text bg-white pe-2"
                  style={{ borderRadius: "8px 0 0 8px", borderColor: "#ced4da", borderRight: "none" }}
                >
                  <Search size={15} className="text-muted" />
                </span>
                <Input
                  type="text"
                  placeholder={getTranslation(
                    "Search by name, phone, email, or username... / नाम, फ़ोन, ईमेल से खोजें...",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    height: "38px",
                    fontSize: "13px",
                    borderColor: "#ced4da",
                    borderLeft: "none",
                    boxShadow: "none",
                  }}
                />
              </InputGroup>
            </Col>
            {isSuperAdmin && (
              <Col md={4} sm={6}>
                <div className="d-flex align-items-center gap-2">
                  <Label className="mb-0 small fw-semibold text-muted text-nowrap">
                    <Filter size={13} className="me-1" />
                    {getTranslation("Branch / शाखा:", lang)}
                  </Label>
                  <Input
                    type="select"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="form-select"
                    style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                  >
                    <option value="all">{getTranslation("All Branches / सभी शाखाएं", lang)}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.Branch_name}
                      </option>
                    ))}
                  </Input>
                </div>
              </Col>
            )}
            <Col md={2} sm={6} className="text-end">
              <span className="small text-muted">
                {activeTab === "branch_admins" && `${filteredAdmins.length} ${getTranslation("Admins found", lang)}`}
                {activeTab === "branch_operators" && `${filteredOperators.length} ${getTranslation("Operators found", lang)}`}
                {activeTab === "branches" && `${branches.length} ${getTranslation("Branches loaded", lang)}`}
              </span>
            </Col>
          </Row>
        </CardBody>
      </Card>
      )}

      {/* Tab Panes */}
      <TabContent activeTab={activeTab}>
        {/* ================================================================= */}
        {/* TAB 1: Branch Admins (SuperAdmin View) */}
        {/* ================================================================= */}
        {isSuperAdmin && (
          <TabPane tabId="branch_admins">
            <Card className="border shadow-sm" style={{ borderRadius: "10px" }}>
              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                    <thead className="bg-light">
                      <tr className="text-muted fw-bold" style={{ fontSize: "12px", textTransform: "uppercase" }}>
                        <th className="py-3 ps-3">#</th>
                        <th>{getTranslation("Branch Admin / व्यवस्थापक", lang)}</th>
                        <th>{getTranslation("Branch / शाखा", lang)}</th>
                        <th>{getTranslation("Contact / संपर्क", lang)}</th>
                        <th>{getTranslation("Form Authority / फॉर्म अधिकार", lang)}</th>
                        <th>{getTranslation("Date Created / तिथि", lang)}</th>
                        <th>{getTranslation("Status / स्थिति", lang)}</th>
                        <th className="text-end pe-3">{getTranslation("Actions / कार्य", lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-5 text-muted">
                            {getTranslation("No Branch Admins found. Click '+ Create Branch Admin' to add one.", lang)}
                          </td>
                        </tr>
                      ) : (
                        filteredAdmins.map((adm, index) => {
                          const grantedCount = calculateGrantedModulesCount(adm.permissions);
                          const isFull = grantedCount === FORM_MODULES_LIST.length;

                          return (
                            <tr key={adm.id} className="align-middle">
                              <td className="ps-3 fw-bold text-muted">{index + 1}</td>
                              <td style={{ minWidth: "190px" }}>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-primary shadow-sm"
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      minWidth: "36px",
                                      backgroundColor: "#e8f5e9",
                                      fontWeight: "700",
                                      fontSize: "14px",
                                      marginRight: "10px",
                                    }}
                                  >
                                    {adm.name ? adm.name.charAt(0).toUpperCase() : <User size={16} />}
                                  </div>
                                  <div className="d-flex flex-column justify-content-center">
                                    <div className="fw-bold text-dark text-nowrap">{adm.name}</div>
                                    <div className="text-muted small">@{adm.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ minWidth: "150px" }}>
                                <Badge color="light" className="text-dark border px-2 py-1.5 d-inline-flex align-items-center">
                                  <GitBranch size={11} className="text-primary" style={{ marginRight: "6px" }} />
                                  <span>{adm.branch_name}</span>
                                </Badge>
                              </td>
                              <td style={{ minWidth: "180px" }}>
                                <div className="d-flex align-items-center text-dark" style={{ fontSize: "12.5px" }}>
                                  <Phone size={13} className="text-muted" style={{ marginRight: "6px" }} />
                                  <span>{adm.phone}</span>
                                </div>
                                {adm.email && (
                                  <div className="d-flex align-items-center text-muted small mt-1">
                                    <Mail size={12} className="text-muted" style={{ marginRight: "6px" }} />
                                    <span>{adm.email}</span>
                                  </div>
                                )}
                              </td>
                              <td>
                                <Badge
                                  color={isFull ? "success" : grantedCount > 0 ? "warning" : "secondary"}
                                  className="px-2 py-1.5 cursor-pointer d-inline-flex align-items-center"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setSelectedUserForPermissions(adm);
                                    setPermissionsModalOpen(true);
                                  }}
                                  title="Click to view module authority matrix"
                                >
                                  <Shield size={12} style={{ marginRight: "6px" }} />
                                  <span>
                                    {isFull
                                      ? getTranslation("Full Access (12/12)", lang)
                                      : `${grantedCount} / ${FORM_MODULES_LIST.length} ${getTranslation("Modules", lang)}`}
                                  </span>
                                </Badge>
                              </td>
                              <td className="text-muted">{adm.date_created}</td>
                              <td>
                                <Badge
                                  color={adm.isActive ? "success" : "secondary"}
                                  className="cursor-pointer px-2 py-1"
                                  onClick={() => handleToggleAdminStatus(adm)}
                                  style={{ cursor: "pointer" }}
                                  title="Click to toggle status"
                                >
                                  {adm.isActive ? "✓ Active" : "✕ Inactive"}
                                </Badge>
                              </td>
                              <td className="text-end pe-3">
                                <ActionButtonsGroup className="justify-content-end">
                                  <TableActionButton
                                    type="view"
                                    onClick={() => {
                                      setSelectedUserForPermissions(adm);
                                      setPermissionsModalOpen(true);
                                    }}
                                    title="View Permissions"
                                  />
                                  <TableActionButton
                                    type="edit"
                                    onClick={() => openEditAdminModal(adm)}
                                    title="Edit Admin"
                                  />
                                  <TableActionButton
                                    type="delete"
                                    onClick={() => handleDeleteAdmin(adm)}
                                    title="Delete Admin"
                                  />
                                </ActionButtonsGroup>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </TabPane>
        )}

        {/* ================================================================= */}
        {/* TAB 2: Branch Operators (BranchAdmin & SuperAdmin View) */}
        {/* ================================================================= */}
        <TabPane tabId="branch_operators">
          <Card className="border shadow-sm" style={{ borderRadius: "10px" }}>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="bg-light">
                    <tr className="text-muted fw-bold" style={{ fontSize: "12px", textTransform: "uppercase" }}>
                      <th className="py-3 ps-3">#</th>
                      <th>{getTranslation("Operator / ऑपरेटर", lang)}</th>
                      <th>{getTranslation("Branch / शाखा", lang)}</th>
                      <th>{getTranslation("Contact / संपर्क", lang)}</th>
                      <th>{getTranslation("Form Authority / फॉर्म अधिकार", lang)}</th>
                      <th>{getTranslation("Date Created / तिथि", lang)}</th>
                      <th>{getTranslation("Status / स्थिति", lang)}</th>
                      <th className="text-end pe-3">{getTranslation("Actions / कार्य", lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperators.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          {getTranslation("No Branch Operators found. Click '+ Create Branch Operator' to add one.", lang)}
                        </td>
                      </tr>
                    ) : (
                      filteredOperators.map((op, index) => {
                        const grantedCount = calculateGrantedModulesCount(op.permissions);
                        const isFull = grantedCount === FORM_MODULES_LIST.length;

                        return (
                          <tr key={op.id} className="align-middle">
                            <td className="ps-3 fw-bold text-muted">{index + 1}</td>
                            <td style={{ minWidth: "190px" }}>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-primary shadow-sm"
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    minWidth: "36px",
                                    backgroundColor: "#e8f5e9",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    marginRight: "10px",
                                  }}
                                >
                                  {op.name ? op.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                                <div className="d-flex flex-column justify-content-center">
                                  <div className="fw-bold text-dark text-nowrap">{op.name}</div>
                                  <div className="text-muted small">@{op.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ minWidth: "150px" }}>
                              <Badge color="light" className="text-dark border px-2 py-1.5 d-inline-flex align-items-center">
                                <GitBranch size={11} className="text-primary" style={{ marginRight: "6px" }} />
                                <span>{op.branch_name}</span>
                              </Badge>
                            </td>
                            <td style={{ minWidth: "180px" }}>
                              <div className="d-flex align-items-center text-dark" style={{ fontSize: "12.5px" }}>
                                <Phone size={13} className="text-muted" style={{ marginRight: "6px" }} />
                                <span>{op.phone}</span>
                              </div>
                              {op.email && (
                                <div className="d-flex align-items-center text-muted small mt-1">
                                  <Mail size={12} className="text-muted" style={{ marginRight: "6px" }} />
                                  <span>{op.email}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <Badge
                                color={isFull ? "success" : grantedCount > 0 ? "info" : "secondary"}
                                className="px-2 py-1.5 cursor-pointer d-inline-flex align-items-center"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setSelectedUserForPermissions(op);
                                  setPermissionsModalOpen(true);
                                }}
                                title="Click to view module authority matrix"
                              >
                                <Shield size={12} style={{ marginRight: "6px" }} />
                                <span>
                                  {isFull
                                    ? getTranslation("Full Access (12/12)", lang)
                                    : `${grantedCount} / ${FORM_MODULES_LIST.length} ${getTranslation("Modules", lang)}`}
                                </span>
                              </Badge>
                            </td>
                            <td className="text-muted">{op.date_created}</td>
                            <td>
                              <Badge
                                color={op.isActive ? "success" : "secondary"}
                                className="cursor-pointer px-2 py-1"
                                onClick={() => handleToggleOperatorStatus(op)}
                                style={{ cursor: "pointer" }}
                                title="Click to toggle status"
                              >
                                {op.isActive ? "✓ Active" : "✕ Inactive"}
                              </Badge>
                            </td>
                            <td className="text-end pe-3">
                              <ActionButtonsGroup className="justify-content-end">
                                <TableActionButton
                                  type="view"
                                  onClick={() => {
                                    setSelectedUserForPermissions(op);
                                    setPermissionsModalOpen(true);
                                  }}
                                  title="View Permissions"
                                />
                                <TableActionButton
                                  type="edit"
                                  onClick={() => openEditOperatorModal(op)}
                                  title="Edit Operator"
                                />
                                <TableActionButton
                                  type="delete"
                                  onClick={() => handleDeleteOperator(op)}
                                  title="Delete Operator"
                                />
                              </ActionButtonsGroup>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </TabPane>

        {/* ================================================================= */}
        {/* TAB 3: Branch Management (Real API) */}
        {/* ================================================================= */}
        {isSuperAdmin && (
          <TabPane tabId="branches">
            <Card className="border shadow-sm" style={{ borderRadius: "10px" }}>
              <CardBody className="p-0">
                {isBranchesLoading ? (
                  <div className="text-center py-5 text-muted">
                    <Spinner size="sm" color="primary" className="me-2" />
                    <span>{getTranslation("Loading branches from API... / शाखाएं लोड हो रही हैं...", lang)}</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                      <thead className="bg-light">
                        <tr className="text-muted fw-bold" style={{ fontSize: "12px", textTransform: "uppercase" }}>
                          <th className="py-3 ps-3">Branch ID</th>
                          <th>{getTranslation("Branch Name / शाखा का नाम", lang)}</th>
                          <th>{getTranslation("Address / पता", lang)}</th>
                          <th>{getTranslation("Phone / फोन", lang)}</th>
                          <th>{getTranslation("Center ID", lang)}</th>
                          <th>{getTranslation("Status / स्थिति", lang)}</th>
                          <th className="text-end pe-3">{getTranslation("Actions / कार्य", lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branches.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5 text-muted">
                              {getTranslation("No branches found. Click '+ Create New Branch' to add one.", lang)}
                            </td>
                          </tr>
                        ) : (
                          branches.map((b) => (
                            <tr key={b.id}>
                              <td className="ps-3 fw-bold text-muted">#{b.id}</td>
                              <td className="fw-bold text-dark">{b.Branch_name}</td>
                              <td className="text-muted">{b.Branch_address || "—"}</td>
                              <td>{b.Branch_phone_number || "—"}</td>
                              <td>
                                <Badge color="light" className="text-dark border">
                                  Center #{b.center_id || 1}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={b.isActive ? "success" : "secondary"}>
                                  {b.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="text-end pe-3">
                                <ActionButtonsGroup className="justify-content-end">
                                  <TableActionButton
                                    type="edit"
                                    onClick={() => openEditBranchModal(b)}
                                    title="Edit Branch"
                                  />
                                  {b.isActive && (
                                    <TableActionButton
                                      type="delete"
                                      onClick={() => handleDeleteBranch(b)}
                                      title="Deactivate Branch"
                                    />
                                  )}
                                </ActionButtonsGroup>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </TabPane>
        )}
      </TabContent>

      {/* ===================================================================== */}
      {/* MODAL: Create / Edit Branch Admin & Operator */}
      {/* ===================================================================== */}
      {(adminModalOpen || operatorModalOpen) && (
        <Modal
          isOpen={adminModalOpen || operatorModalOpen}
          toggle={() => {
            setAdminModalOpen(false);
            setOperatorModalOpen(false);
          }}
          size="lg"
          backdrop="static"
        >
          <Form onSubmit={adminModalOpen ? handleSaveAdmin : handleSaveOperator}>
            <ModalHeader
              toggle={() => {
                setAdminModalOpen(false);
                setOperatorModalOpen(false);
              }}
              style={{ background: "#f8fafc" }}
            >
              <div className="d-flex align-items-center gap-2">
                <Shield size={18} color="#24695c" />
                <span className="fw-bold">
                  {adminModalOpen
                    ? editingAdmin
                      ? getTranslation("Edit Branch Admin / शाखा व्यवस्थापक संपादित करें", lang)
                      : getTranslation("Create Branch Admin / नया शाखा व्यवस्थापक बनाएं", lang)
                    : editingOperator
                    ? getTranslation("Edit Branch Operator / शाखा ऑपरेटर संपादित करें", lang)
                    : getTranslation("Create Branch Operator / नया शाखा ऑपरेटर बनाएं", lang)}
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="p-4" style={{ maxHeight: "78vh", overflowY: "auto" }}>
              {/* SECTION 1: Branch & Center Selection */}
              <div className="mb-4 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>
                    1. {getTranslation("Branch & Center Assignment / शाखा एवं केंद्र चयन", lang)}
                  </h6>
                  {adminModalOpen && (
                    <Button
                      color={isInlineNewBranch ? "danger" : "primary"}
                      outline
                      size="sm"
                      type="button"
                      className="py-0.5 px-2 small fw-bold"
                      onClick={() => setIsInlineNewBranch(!isInlineNewBranch)}
                    >
                      {isInlineNewBranch
                        ? getTranslation("✕ Select Existing Branch", lang)
                        : getTranslation("+ Create New Branch", lang)}
                    </Button>
                  )}
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <Label className="small fw-semibold text-muted">
                      {getTranslation("Center Name (Auto-Assigned) / केंद्र का नाम", lang)}
                    </Label>
                    <Input
                      type="text"
                      disabled
                      value={`${DEFAULT_CENTER.center_name} (ID: ${DEFAULT_CENTER.center_id})`}
                      className="form-control bg-white"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>

                  <Col md={6}>
                    {!isInlineNewBranch ? (
                      <div>
                        <Label className="small fw-semibold text-dark">
                          {getTranslation("Assigned Branch / संबद्ध शाखा", lang)} <span className="text-danger">*</span>
                        </Label>
                        <Input
                          type="select"
                          value={userFormData.branch_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            const b = branches.find((item) => String(item.id) === String(val));
                            setUserFormData((prev) => ({
                              ...prev,
                              branch_id: val,
                              branch_name: b ? b.Branch_name : "",
                            }));
                          }}
                          className="form-select"
                          style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                          disabled={!isSuperAdmin && operatorModalOpen}
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.Branch_name}
                            </option>
                          ))}
                        </Input>
                      </div>
                    ) : (
                      <div>
                        <Label className="small fw-semibold text-primary">
                          {getTranslation("New Branch Name / नई शाखा का नाम", lang)} <span className="text-danger">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Downtown Center"
                          value={inlineBranchData.Branch_name}
                          onChange={(e) =>
                            setInlineBranchData({ ...inlineBranchData, Branch_name: e.target.value })
                          }
                          className="form-control border-primary"
                          style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                        />
                      </div>
                    )}
                  </Col>

                  {isInlineNewBranch && (
                    <>
                      <Col md={6}>
                        <Label className="small fw-semibold text-muted">
                          {getTranslation("New Branch Address / शाखा का पता", lang)}
                        </Label>
                        <Input
                          type="text"
                          placeholder="123 Main St, City"
                          value={inlineBranchData.Branch_address}
                          onChange={(e) =>
                            setInlineBranchData({ ...inlineBranchData, Branch_address: e.target.value })
                          }
                          className="form-control"
                          style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                        />
                      </Col>
                      <Col md={6}>
                        <Label className="small fw-semibold text-muted">
                          {getTranslation("New Branch Phone / शाखा का फोन", lang)}
                        </Label>
                        <Input
                          type="text"
                          maxLength={10}
                          placeholder="9876543210"
                          value={inlineBranchData.Branch_phone_number}
                          onChange={(e) =>
                            setInlineBranchData({ ...inlineBranchData, Branch_phone_number: e.target.value })
                          }
                          className="form-control"
                          style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                        />
                      </Col>
                    </>
                  )}
                </Row>
              </div>

              {/* SECTION 2: Personal & Login Credentials */}
              <div className="mb-4 p-3 bg-light rounded-3 border">
                <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "14px" }}>
                  2. {getTranslation("Personal & Login Credentials / व्यक्तिगत एवं लॉगिन विवरण", lang)}
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Label className="small fw-semibold text-dark">
                      {getTranslation("Full Name / पूरा नाम", lang)} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={userFormData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUserFormData((prev) => ({
                          ...prev,
                          name: val,
                          username: prev.username || val.toLowerCase().replace(/\s+/g, "."),
                        }));
                      }}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>

                  <Col md={6}>
                    <Label className="small fw-semibold text-dark">
                      {getTranslation("Username / उपयोगकर्ता नाम", lang)} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. ramesh.kumar"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>

                  <Col md={6}>
                    <Label className="small fw-semibold text-dark">
                      {getTranslation("Phone Number / फ़ोन नंबर", lang)} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={userFormData.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,10}$/.test(val)) {
                          setUserFormData({ ...userFormData, phone: val });
                        }
                      }}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>

                  <Col md={6}>
                    <Label className="small fw-semibold text-dark">
                      {getTranslation("Email Address / ईमेल पता (वैकल्पिक)", lang)}
                    </Label>
                    <Input
                      type="email"
                      placeholder="admin@gksrehab.com"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>

                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Label className="small fw-semibold text-dark mb-0">
                        {getTranslation("Password / पासवर्ड", lang)} <span className="text-danger">*</span>
                      </Label>
                      <span
                        className="text-primary small fw-semibold cursor-pointer"
                        style={{ cursor: "pointer", fontSize: "12px" }}
                        onClick={() =>
                          setUserFormData({ ...userFormData, password: generateRandomPassword() })
                        }
                      >
                        ✨ {getTranslation("Generate / बनाएं", lang)}
                      </span>
                    </div>
                    <div className="position-relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        className="form-control pe-5"
                        style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="position-absolute text-muted cursor-pointer"
                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                      >
                        {showPassword ? <Lock size={15} /> : <Unlock size={15} />}
                      </span>
                    </div>
                  </Col>

                  <Col md={6}>
                    <Label className="small fw-semibold text-dark">
                      {getTranslation("Address / पता", lang)}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Residential address"
                      value={userFormData.address}
                      onChange={(e) => setUserFormData({ ...userFormData, address: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "38px", fontSize: "13px" }}
                    />
                  </Col>
                </Row>
              </div>

              {/* SECTION 3: Form Module Authority (Permissions Matrix) - Temporarily hidden per user request */}
              {false && (
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>
                        3. {getTranslation("Form Modules Authority / फॉर्म मॉड्यूल अधिकार", lang)}
                      </h6>
                      <small className="text-muted">
                        {getTranslation("Select specific read, create, edit, or delete authority for each clinical form.", lang)}
                      </small>
                    </div>
                    <div className="d-flex align-items-center flex-wrap" style={{ gap: "8px" }}>
                      <Button
                        color="success"
                        outline
                        size="sm"
                        type="button"
                        className="py-1 px-2.5 small fw-bold shadow-sm"
                        style={{ borderRadius: "6px" }}
                        onClick={() => applyPermissionTemplate("full")}
                      >
                        ✓ {getTranslation("Full Access / सभी अधिकार", lang)}
                      </Button>
                      <Button
                        color="secondary"
                        outline
                        size="sm"
                        type="button"
                        className="py-1 px-2.5 small fw-bold shadow-sm"
                        style={{ borderRadius: "6px" }}
                        onClick={() => applyPermissionTemplate("view_only")}
                      >
                        👁 {getTranslation("View Only / केवल देखना", lang)}
                      </Button>
                      <Button
                        color="danger"
                        outline
                        size="sm"
                        type="button"
                        className="py-1 px-2.5 small fw-bold shadow-sm"
                        style={{ borderRadius: "6px" }}
                        onClick={() => applyPermissionTemplate("none")}
                      >
                        ✕ {getTranslation("Clear All / साफ़ करें", lang)}
                      </Button>
                    </div>
                  </div>

                  <div className="table-responsive bg-white rounded-3 border">
                    <Table size="sm" className="mb-0 align-middle" style={{ fontSize: "12.5px" }}>
                      <thead className="bg-light text-muted">
                        <tr>
                          <th className="ps-3 py-2">{getTranslation("Module / मॉड्यूल", lang)}</th>
                          <th className="text-center">{getTranslation("View / देखें", lang)}</th>
                          <th className="text-center">{getTranslation("Create / जोड़ें", lang)}</th>
                          <th className="text-center">{getTranslation("Edit / बदलें", lang)}</th>
                          <th className="text-center">{getTranslation("Delete / हटाएं", lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FORM_MODULES_LIST.map((mod) => {
                          const perm = userFormData.permissions[mod.id] || {
                            view: false,
                            create: false,
                            edit: false,
                            delete: false,
                          };

                          return (
                            <tr key={mod.id}>
                              <td className="ps-3 py-2">
                                <div className="fw-semibold text-dark">{mod.name}</div>
                                <div className="text-muted extra-small" style={{ fontSize: "11px" }}>
                                  {mod.description}
                                </div>
                              </td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={!!perm.view}
                                  onChange={() => handlePermissionChange(mod.id, "view")}
                                  className="cursor-pointer"
                                />
                              </td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={!!perm.create}
                                  onChange={() => handlePermissionChange(mod.id, "create")}
                                  className="cursor-pointer"
                                />
                              </td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={!!perm.edit}
                                  onChange={() => handlePermissionChange(mod.id, "edit")}
                                  className="cursor-pointer"
                                />
                              </td>
                              <td className="text-center">
                                <Input
                                  type="checkbox"
                                  checked={!!perm.delete}
                                  onChange={() => handlePermissionChange(mod.id, "delete")}
                                  className="cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter style={{ background: "#f8fafc" }}>
              <Button
                color="secondary"
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setOperatorModalOpen(false);
                }}
              >
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button color="primary" type="submit" className="fw-bold px-4">
                {editingAdmin || editingOperator
                  ? getTranslation("Save Changes / बदलाव सहेजें", lang)
                  : getTranslation("Create Account / खाता बनाएं", lang)}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL: View Permissions Details */}
      {/* ===================================================================== */}
      {permissionsModalOpen && selectedUserForPermissions && (
        <Modal
          isOpen={permissionsModalOpen}
          toggle={() => setPermissionsModalOpen(false)}
          size="lg"
          style={{ maxWidth: "860px" }}
        >
          <ModalHeader toggle={() => setPermissionsModalOpen(false)} style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
            <div className="d-flex align-items-center gap-2">
              <Shield size={19} color="#24695c" />
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "16px" }}>
                {getTranslation("User Profile & Module Authorities / उपयोगकर्ता विवरण एवं अधिकार", lang)}
              </h5>
            </div>
          </ModalHeader>
          <ModalBody style={{ maxHeight: "75vh", overflowY: "auto", backgroundColor: "#f8fafc", padding: "24px" }}>
            {/* User Profile Card */}
            <div
              className="bg-white rounded-3 border mb-4 shadow-sm"
              style={{
                borderRadius: "12px",
                padding: "20px 24px",
              }}
            >
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2.5 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: "44px",
                      height: "44px",
                      minWidth: "44px",
                      backgroundColor: "#24695c",
                      fontSize: "18px",
                    }}
                  >
                    {selectedUserForPermissions.name ? selectedUserForPermissions.name.charAt(0).toUpperCase() : <User size={20} />}
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "16.5px" }}>
                        {selectedUserForPermissions.name}
                      </h6>
                      <span className="badge bg-light text-muted border px-2 py-0.5" style={{ fontSize: "11px" }}>
                        @{selectedUserForPermissions.username}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Badge
                    color={selectedUserForPermissions.role === "BranchAdmin" ? "primary" : "info"}
                    className="px-2.5 py-1.5 fw-bold text-uppercase"
                  >
                    {selectedUserForPermissions.role === "BranchAdmin" ? "Branch Admin" : "Branch Operator"}
                  </Badge>
                  <Badge
                    color={selectedUserForPermissions.isActive ? "success" : "secondary"}
                    className="px-2.5 py-1.5 fw-bold"
                  >
                    {selectedUserForPermissions.isActive ? "✓ Active" : "✕ Inactive"}
                  </Badge>
                </div>
              </div>

              {/* 6 Structured Key-Value Tiles */}
              <Row className="g-3">
                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <GitBranch size={12} className="text-primary me-1" />
                      {getTranslation("Branch / शाखा", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13px" }}>
                      {selectedUserForPermissions.branch_name || "N/A"}
                    </div>
                  </div>
                </Col>

                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <Phone size={12} className="text-primary me-1" />
                      {getTranslation("Phone / फ़ोन", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13px" }}>
                      {selectedUserForPermissions.phone || "N/A"}
                    </div>
                  </div>
                </Col>

                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <Mail size={12} className="text-primary me-1" />
                      {getTranslation("Email / ईमेल", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13.5px", wordBreak: "break-word" }} title={selectedUserForPermissions.email}>
                      {selectedUserForPermissions.email || "Not specified"}
                    </div>
                  </div>
                </Col>

                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <Shield size={12} className="text-primary me-1" />
                      {getTranslation("Center / केंद्र", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13.5px", wordBreak: "break-word" }}>
                      Shri G.K.S. Rehab Center (ID: 1)
                    </div>
                  </div>
                </Col>

                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <MapPin size={12} className="text-primary me-1" />
                      {getTranslation("Address / पता", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13.5px", wordBreak: "break-word" }} title={selectedUserForPermissions.address}>
                      {selectedUserForPermissions.address || "Not specified"}
                    </div>
                  </div>
                </Col>

                <Col md={6} sm={12}>
                  <div className="p-3 rounded-2 border bg-light h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      <Calendar size={12} className="text-primary me-1" />
                      {getTranslation("Date Created / तिथि", lang)}
                    </div>
                    <div className="fw-bold text-dark mt-1" style={{ fontSize: "13.5px", wordBreak: "break-word" }}>
                      {selectedUserForPermissions.date_created || "N/A"}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Authority Section Header */}
            <div className="d-flex align-items-center justify-content-between mb-2 mt-3 pt-1">
              <div>
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>
                  {getTranslation("Form Modules Authority / फॉर्म मॉड्यूल अधिकार विवरण", lang)}
                </h6>
                <small className="text-muted">
                  {getTranslation("Access rights granted across all 12 clinical & administrative modules.", lang)}
                </small>
              </div>
              <Badge color="light" className="text-primary border px-2.5 py-1.5 fw-bold shadow-sm" style={{ fontSize: "12px" }}>
                <Shield size={12} className="me-1" />
                {calculateGrantedModulesCount(selectedUserForPermissions.permissions)} / {FORM_MODULES_LIST.length} {getTranslation("Modules Granted", lang)}
              </Badge>
            </div>

            {/* Permissions Matrix Table */}
            <div className="table-responsive bg-white rounded-3 border shadow-sm">
              <Table size="sm" className="align-middle mb-0" style={{ fontSize: "12.5px" }}>
                <thead style={{ backgroundColor: "#f1f5f9" }} className="text-muted">
                  <tr>
                    <th className="ps-3 py-2.5 fw-bold" style={{ textTransform: "uppercase", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                      {getTranslation("Module / फॉर्म", lang)}
                    </th>
                    <th className="text-center py-2.5 fw-bold" style={{ width: "90px", textTransform: "uppercase", fontSize: "11.5px" }}>
                      {getTranslation("View", lang)}
                    </th>
                    <th className="text-center py-2.5 fw-bold" style={{ width: "90px", textTransform: "uppercase", fontSize: "11.5px" }}>
                      {getTranslation("Create", lang)}
                    </th>
                    <th className="text-center py-2.5 fw-bold" style={{ width: "90px", textTransform: "uppercase", fontSize: "11.5px" }}>
                      {getTranslation("Edit", lang)}
                    </th>
                    <th className="text-center py-2.5 fw-bold" style={{ width: "90px", textTransform: "uppercase", fontSize: "11.5px" }}>
                      {getTranslation("Delete", lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FORM_MODULES_LIST.map((mod) => {
                    const p = selectedUserForPermissions.permissions?.[mod.id] || {};
                    return (
                      <tr key={mod.id}>
                        <td className="ps-3 py-2 fw-semibold text-dark">{mod.name}</td>
                        <td className="text-center">
                          {p.view ? (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-success rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#dcfce7" }}
                              title="Granted"
                            >
                              <Check size={14} strokeWidth={2.8} />
                            </span>
                          ) : (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-muted rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#f1f5f9" }}
                              title="Not Granted"
                            >
                              <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", lineHeight: 1 }}>—</span>
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          {p.create ? (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-success rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#dcfce7" }}
                              title="Granted"
                            >
                              <Check size={14} strokeWidth={2.8} />
                            </span>
                          ) : (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-muted rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#f1f5f9" }}
                              title="Not Granted"
                            >
                              <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", lineHeight: 1 }}>—</span>
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          {p.edit ? (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-success rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#dcfce7" }}
                              title="Granted"
                            >
                              <Check size={14} strokeWidth={2.8} />
                            </span>
                          ) : (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-muted rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#f1f5f9" }}
                              title="Not Granted"
                            >
                              <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", lineHeight: 1 }}>—</span>
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          {p.delete ? (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-success rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#dcfce7" }}
                              title="Granted"
                            >
                              <Check size={14} strokeWidth={2.8} />
                            </span>
                          ) : (
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-muted rounded-circle"
                              style={{ width: "24px", height: "24px", backgroundColor: "#f1f5f9" }}
                              title="Not Granted"
                            >
                              <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", lineHeight: 1 }}>—</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </ModalBody>
          <ModalFooter style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }} className="d-flex justify-content-between align-items-center">
            <Button
              type="button"
              onClick={() => setPermissionsModalOpen(false)}
              className="px-4 py-2 fw-semibold text-muted border bg-white shadow-sm"
              style={{ borderRadius: "8px" }}
            >
              {getTranslation("Close / बंद करें", lang)}
            </Button>
            <Button
              type="button"
              className="d-flex align-items-center gap-2 px-4 py-2 fw-bold text-white shadow-sm"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={() => {
                const user = selectedUserForPermissions;
                setPermissionsModalOpen(false);
                if (user.role === "BranchAdmin") {
                  openEditAdminModal(user);
                } else {
                  openEditOperatorModal(user);
                }
              }}
            >
              <Edit2 size={15} />
              <span>{getTranslation("Edit Details / विवरण संपादित करें", lang)}</span>
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Create / Edit Branch (Real API) */}
      {/* ===================================================================== */}
      {branchModalOpen && (
        <Modal isOpen={branchModalOpen} toggle={() => setBranchModalOpen(false)}>
          <Form onSubmit={handleSaveBranch}>
            <ModalHeader toggle={() => setBranchModalOpen(false)} style={{ background: "#f8fafc" }}>
              <div className="d-flex align-items-center gap-2">
                <GitBranch size={18} color="#24695c" />
                <span className="fw-bold">
                  {editingBranch
                    ? getTranslation("Edit Branch / शाखा विवरण बदलें", lang)
                    : getTranslation("Create New Branch / नई शाखा जोड़ें", lang)}
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="p-3">
              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Branch Name / शाखा का नाम", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Downtown Center"
                  value={branchFormData.Branch_name}
                  onChange={(e) => setBranchFormData({ ...branchFormData, Branch_name: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Branch Address / शाखा का पता", lang)}
                </Label>
                <Input
                  type="text"
                  placeholder="123 Main Street, City"
                  value={branchFormData.Branch_address}
                  onChange={(e) => setBranchFormData({ ...branchFormData, Branch_address: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Phone Number / फ़ोन नंबर", lang)}
                </Label>
                <Input
                  type="text"
                  maxLength={10}
                  placeholder="9876543210"
                  value={branchFormData.Branch_phone_number}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d{0,10}$/.test(val)) {
                      setBranchFormData({ ...branchFormData, Branch_phone_number: val });
                    }
                  }}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              <div className="mb-2">
                <Label className="small fw-semibold text-muted">
                  {getTranslation("Center ID", lang)}
                </Label>
                <Input
                  type="text"
                  disabled
                  value={`${DEFAULT_CENTER.center_id} (${DEFAULT_CENTER.center_name})`}
                  className="form-control bg-light"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>
            </ModalBody>
            <ModalFooter style={{ background: "#f8fafc" }}>
              <Button color="secondary" onClick={() => setBranchModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button color="primary" type="submit" className="fw-bold px-4">
                {editingBranch
                  ? getTranslation("Save Branch / शाखा सहेजें", lang)
                  : getTranslation("Create Branch / शाखा बनाएं", lang)}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      )}
    </Container>
  );
};

export default GlobalSettings;
