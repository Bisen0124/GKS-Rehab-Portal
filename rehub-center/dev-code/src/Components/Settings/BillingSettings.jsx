import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardBody,
  Row,
  Col,
  Table,
  Button,
  Badge,
  Input,
  InputGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
} from "reactstrap";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  FileText,
  GitBranch,
  CheckCircle,
  Filter,
  Eye,
} from "react-feather";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { getTranslation } from "../../utils/translator";
import {
  getItemTypes,
  toggleItemTypeStatus,
  getItemsMaster,
  toggleItemMasterStatus,
  fetchAllItemTypes,
  createItemTypeApi,
  updateItemTypeApi,
  deleteItemTypeApi,
  fetchAllItems,
  createItemApi,
  updateItemApi,
  deleteItemApi,
} from "../../Services/billingMasterService";

const BillingSettings = ({
  isSuperAdmin,
  branches = [],
  selectedBranch,
  currentBranchName = "",
  lang = "en",
  viewMode = "all",
  onSwitchToMaster,
  defaultTypeFilter = "all",
}) => {
  // --------------------------------------------------------------------------
  // States: Data
  // --------------------------------------------------------------------------
  const [itemTypes, setItemTypes] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);

  // States: Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [typeSearchTerm, setTypeSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(defaultTypeFilter || "all");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(
    isSuperAdmin ? "all" : selectedBranch || "all"
  );

  // States: Modals
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
    branch_id: "",
    branch_name: "All Branches",
    isActive: true,
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    item_type_id: "",
    item_type_name: "",
    item_name: "",
    amount: "",
    description: "",
    branch_id: "",
    branch_name: "All Branches",
    isActive: true,
  });

  // --------------------------------------------------------------------------
  // Load Data
  // --------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    const branchScope = isSuperAdmin ? null : selectedBranch;
    try {
      const types = await fetchAllItemTypes(branchScope || 1);
      setItemTypes(types && types.length > 0 ? types : getItemTypes(branchScope));

      const items = await fetchAllItems(branchScope || 1);
      setItemsMaster(items && items.length > 0 ? items : getItemsMaster(branchScope));
    } catch {
      setItemTypes(getItemTypes(branchScope));
      setItemsMaster(getItemsMaster(branchScope));
    }
  }, [isSuperAdmin, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (defaultTypeFilter !== undefined) {
      setSelectedTypeFilter(defaultTypeFilter);
    }
  }, [defaultTypeFilter]);

  const filteredItemTypes = useMemo(() => {
    if (!typeSearchTerm.trim()) return itemTypes;
    const q = typeSearchTerm.toLowerCase();
    return itemTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [itemTypes, typeSearchTerm]);

  // --------------------------------------------------------------------------
  // Calculations & Counts
  // --------------------------------------------------------------------------
  const typeCounts = useMemo(() => {
    const counts = {};
    itemsMaster.forEach((it) => {
      counts[it.item_type_id] = (counts[it.item_type_id] || 0) + 1;
    });
    return counts;
  }, [itemsMaster]);

  const filteredItemsMaster = useMemo(() => {
    return itemsMaster.filter((item) => {
      // Branch filter
      if (
        selectedBranchFilter !== "all" &&
        item.branch_id !== null &&
        item.branch_id !== undefined &&
        String(item.branch_id) !== String(selectedBranchFilter)
      ) {
        return false;
      }

      // Type filter
      if (
        selectedTypeFilter !== "all" &&
        String(item.item_type_id) !== String(selectedTypeFilter)
      ) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.item_name.toLowerCase().includes(q);
        const matchType = item.item_type_name.toLowerCase().includes(q);
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        const matchAmt = String(item.amount).includes(q);
        return matchName || matchType || matchDesc || matchAmt;
      }

      return true;
    });
  }, [itemsMaster, selectedBranchFilter, selectedTypeFilter, searchTerm]);

  // --------------------------------------------------------------------------
  // Item Type CRUD
  // --------------------------------------------------------------------------
  const openCreateTypeModal = () => {
    setEditingType(null);
    const defaultBranchId = isSuperAdmin
      ? ""
      : selectedBranch || branches[0]?.id || "";
    const defaultBranchName = isSuperAdmin
      ? "All Branches"
      : currentBranchName ||
        branches.find((b) => String(b.id) === String(defaultBranchId))?.Branch_name ||
        "Assigned Branch";

    setTypeFormData({
      name: "",
      description: "",
      branch_id: defaultBranchId,
      branch_name: defaultBranchName,
      isActive: true,
    });
    setTypeModalOpen(true);
  };

  const openEditTypeModal = (type) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name || "",
      description: type.description || "",
      branch_id: type.branch_id || "",
      branch_name: type.branch_name || "All Branches",
      isActive: type.isActive !== undefined ? type.isActive : true,
    });
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeFormData.name.trim()) {
      toast.warning(
        getTranslation(
          "Please enter Item Type name / कृपया आइटम प्रकार का नाम दर्ज करें",
          lang
        )
      );
      return;
    }

    let bName = "All Branches";
    if (typeFormData.branch_id) {
      const found = branches.find(
        (b) => String(b.id) === String(typeFormData.branch_id)
      );
      if (found) bName = found.Branch_name;
    }

    const payload = {
      ...typeFormData,
      item_type_name: typeFormData.name.trim(),
      branch_name: bName,
    };

    const targetBranch = typeFormData.branch_id || selectedBranch || 1;

    if (editingType) {
      await updateItemTypeApi(editingType.id, payload, targetBranch);
      toast.success(
        getTranslation(
          "Item Type updated successfully! / आइटम प्रकार अपडेट किया गया!",
          lang
        )
      );
    } else {
      await createItemTypeApi(payload, targetBranch);
      toast.success(
        getTranslation(
          "Item Type created successfully! / नया आइटम प्रकार बनाया गया!",
          lang
        )
      );
    }

    loadData();
    setTypeModalOpen(false);
  };

  const handleDeleteType = async (type) => {
    const count = typeCounts[type.id] || 0;
    const confirm = await Swal.fire({
      title: getTranslation("Delete Item Type? / आइटम प्रकार हटाएं?", lang),
      html: `
        <div style="font-size: 14px; text-align: left; padding: 6px;">
          <p><strong>${getTranslation("Type Name / प्रकार", lang)}:</strong> ${type.name}</p>
          ${
            count > 0
              ? `<div class="alert alert-warning p-2 small mb-0"><strong>Warning:</strong> ${count} billing items belong to this category and will also be deleted!</div>`
              : ""
          }
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      await deleteItemTypeApi(type.id, type.branch_id || selectedBranch || 1);
      loadData();
      toast.info(
        getTranslation("Item Type deleted / आइटम प्रकार हटा दिया गया", lang)
      );
    }
  };

  const handleToggleTypeStatus = (type) => {
    toggleItemTypeStatus(type.id);
    loadData();
    toast.success(
      type.isActive
        ? getTranslation("Item Type deactivated / निष्क्रिय किया गया", lang)
        : getTranslation("Item Type activated / सक्रिय किया गया", lang)
    );
  };

  // --------------------------------------------------------------------------
  // Item Master CRUD
  // --------------------------------------------------------------------------
  const openCreateItemModal = (preselectedTypeId = null) => {
    setEditingItem(null);
    const activeTypes = itemTypes.filter((t) => t.isActive);
    const initialTypeId =
      preselectedTypeId || (activeTypes.length > 0 ? activeTypes[0].id : "");
    const initialTypeName =
      activeTypes.find((t) => String(t.id) === String(initialTypeId))?.name || "";

    const defaultBranchId = isSuperAdmin
      ? ""
      : selectedBranch || branches[0]?.id || "";
    const defaultBranchName = isSuperAdmin
      ? "All Branches"
      : currentBranchName ||
        branches.find((b) => String(b.id) === String(defaultBranchId))?.Branch_name ||
        "Assigned Branch";

    setItemFormData({
      item_type_id: initialTypeId,
      item_type_name: initialTypeName,
      item_name: "",
      amount: "",
      description: "",
      branch_id: defaultBranchId,
      branch_name: defaultBranchName,
      isActive: true,
    });
    setItemModalOpen(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemFormData({
      item_type_id: item.item_type_id || "",
      item_type_name: item.item_type_name || "",
      item_name: item.item_name || "",
      amount: item.amount || 0,
      description: item.description || "",
      branch_id: item.branch_id || "",
      branch_name: item.branch_name || "All Branches",
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemFormData.item_type_id) {
      toast.warning(
        getTranslation(
          "Please select an Item Type / कृपया आइटम प्रकार चुनें",
          lang
        )
      );
      return;
    }

    if (!itemFormData.item_name.trim()) {
      toast.warning(
        getTranslation(
          "Please enter Item Name / कृपया आइटम का नाम दर्ज करें",
          lang
        )
      );
      return;
    }

    if (itemFormData.amount === "" || Number(itemFormData.amount) < 0) {
      toast.warning(
        getTranslation(
          "Please enter a valid amount / कृपया मान्य राशि दर्ज करें",
          lang
        )
      );
      return;
    }

    const matchedType = itemTypes.find(
      (t) => String(t.id) === String(itemFormData.item_type_id)
    );
    const typeName = matchedType ? matchedType.name : itemFormData.item_type_name;

    let bName = "All Branches";
    if (itemFormData.branch_id) {
      const found = branches.find(
        (b) => String(b.id) === String(itemFormData.branch_id)
      );
      if (found) bName = found.Branch_name;
    }

    const payload = {
      ...itemFormData,
      original_amount: Number(itemFormData.amount),
      item_type_name: typeName,
      branch_name: bName,
    };

    const targetBranch = itemFormData.branch_id || selectedBranch || 1;

    if (editingItem) {
      await updateItemApi(editingItem.id, payload, targetBranch);
      toast.success(
        getTranslation(
          "Billing Item updated successfully! / बिल आइटम अपडेट किया गया!",
          lang
        )
      );
    } else {
      await createItemApi(payload, targetBranch);
      toast.success(
        getTranslation(
          "Billing Item created successfully! / नया बिल आइटम बनाया गया!",
          lang
        )
      );
    }

    loadData();
    setItemModalOpen(false);
  };

  const handleDeleteItem = async (item) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Billing Item? / बिल आइटम हटाएं?", lang),
      text: `${getTranslation(
        "Are you sure you want to remove / क्या आप वाकई हटाना चाहते हैं",
        lang
      )} "${item.item_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      await deleteItemApi(item.id, item.branch_id || selectedBranch || 1);
      loadData();
      toast.info(
        getTranslation("Billing Item removed / बिल आइटम हटा दिया गया", lang)
      );
    }
  };

  const handleToggleItemStatus = (item) => {
    toggleItemMasterStatus(item.id);
    loadData();
    toast.success(
      item.isActive
        ? getTranslation("Item deactivated / आइटम निष्क्रिय किया गया", lang)
        : getTranslation("Item activated / आइटम सक्रिय किया गया", lang)
    );
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div>
      {/* Summary Stat Cards */}
      <Row className="g-3 mb-4">
        {/* Item Types Count (Shown in 'all' or 'types') */}
        {(viewMode === "all" || viewMode === "types") && (
          <Col sm={6} lg={viewMode === "types" ? 6 : 3}>
            <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
              <CardBody className="p-3.5 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 text-primary"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(36, 105, 92, 0.1)",
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Item Types / कुल प्रकार", lang)}
                  </div>
                  <h4 className="fw-bold mb-0 text-dark">{itemTypes.length}</h4>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Active Types (Shown in 'types') */}
        {viewMode === "types" && (
          <Col sm={6} lg={6}>
            <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
              <CardBody className="p-3.5 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 text-success"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Active Categories / सक्रिय श्रेणियां", lang)}
                  </div>
                  <h4 className="fw-bold mb-0 text-dark">
                    {itemTypes.filter((t) => t.isActive).length}
                  </h4>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Billable Items (Shown in 'all' or 'master') */}
        {(viewMode === "all" || viewMode === "master") && (
          <Col sm={6} lg={viewMode === "master" ? 4 : 3}>
            <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
              <CardBody className="p-3.5 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 text-success"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Billable Items / दर सूची", lang)}
                  </div>
                  <h4 className="fw-bold mb-0 text-dark">{itemsMaster.length}</h4>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Active Services (Shown in 'all' or 'master') */}
        {(viewMode === "all" || viewMode === "master") && (
          <Col sm={6} lg={viewMode === "master" ? 4 : 3}>
            <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
              <CardBody className="p-3.5 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 text-info"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                  }}
                >
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Active Services / सक्रिय सेवाएं", lang)}
                  </div>
                  <h4 className="fw-bold mb-0 text-dark">
                    {itemsMaster.filter((i) => i.isActive).length}
                  </h4>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Assigned Scope (Shown in 'all' or 'master') */}
        {(viewMode === "all" || viewMode === "master") && (
          <Col sm={6} lg={viewMode === "master" ? 4 : 3}>
            <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
              <CardBody className="p-3.5 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 text-warning"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                  }}
                >
                  <GitBranch size={22} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Assigned Scope / शाखा दायरा", lang)}
                  </div>
                  <h6 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: "13px" }}>
                    {isSuperAdmin
                      ? getTranslation("All Branches (Global) / सभी शाखाएं", lang)
                      : currentBranchName || "Current Branch"}
                  </h6>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}
      </Row>

      {/* ===================================================================== */}
      {/* SECTION 1: Item Types Table */}
      {/* ===================================================================== */}
      {(viewMode === "all" || viewMode === "types") && (
      <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white">
        <CardBody className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <Layers size={18} color="#24695c" />
                <span>{getTranslation("Bill Item Types / बिल आइटम प्रकार (श्रेणियां)", lang)}</span>
              </h5>
              <small className="text-muted">
                {getTranslation(
                  "Define service categories like Ward Charges, Blood Packages, Lab Tests, Consultation, etc.",
                  lang
                )}
              </small>
            </div>
            <Button
              color="primary"
              className="d-flex align-items-center py-1.5 px-3 shadow-sm fw-bold"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={openCreateTypeModal}
            >
              <Plus size={16} style={{ marginRight: "6px" }} />
              <span>{getTranslation("Add Item Type / नया प्रकार जोड़ें", lang)}</span>
            </Button>
          </div>

          {/* Search bar for Item Types */}
          <div className="mb-3" style={{ maxWidth: "340px" }}>
            <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <Input
                type="text"
                placeholder={getTranslation("Search item types... / प्रकार खोजें...", lang)}
                value={typeSearchTerm}
                onChange={(e) => setTypeSearchTerm(e.target.value)}
                className="border-start-0"
                style={{ height: "36px", fontSize: "13px" }}
              />
            </InputGroup>
          </div>

          <div className="table-responsive rounded-3 border">
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  <th className="ps-3 py-2.5 fw-bold" style={{ width: "60px" }}>#</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Item Type / श्रेणी का नाम", lang)}</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Description / विवरण", lang)}</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Branch / शाखा", lang)}</th>
                  <th className="py-2.5 fw-bold text-center">{getTranslation("Items Count / कुल आइटम", lang)}</th>
                  <th className="py-2.5 fw-bold text-center">{getTranslation("Status / स्थिति", lang)}</th>
                  <th className="py-2.5 fw-bold text-end pe-3">{getTranslation("Actions / क्रियाएं", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      {getTranslation("No item types found. Click '+ Add Item Type' to create one.", lang)}
                    </td>
                  </tr>
                ) : (
                  filteredItemTypes.map((type, idx) => {
                    const count = typeCounts[type.id] || 0;
                    const isSelected = selectedTypeFilter === String(type.id);
                    return (
                      <tr
                        key={type.id}
                        style={{
                          backgroundColor: isSelected ? "rgba(36, 105, 92, 0.05)" : "transparent",
                        }}
                      >
                        <td className="ps-3 fw-bold text-muted">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="d-inline-flex align-items-center justify-content-center text-primary rounded-circle"
                              style={{ width: "26px", height: "26px", backgroundColor: "#e6f4f1" }}
                            >
                              <Layers size={13} />
                            </span>
                            <span className="fw-bold text-dark">{type.name}</span>
                          </div>
                        </td>
                        <td className="text-muted" style={{ maxWidth: "300px" }}>
                          {type.description || <span className="text-muted fst-italic">No description</span>}
                        </td>
                        <td>
                          <Badge color="light" className="text-dark border px-2 py-1">
                            <GitBranch size={10} className="me-1 text-primary" />
                            {type.branch_name || "All Branches"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button
                            color="light"
                            size="sm"
                            className="d-inline-flex align-items-center py-1 px-2.5 text-primary border shadow-sm"
                            style={{ borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                            onClick={() => {
                              if (onSwitchToMaster) {
                                onSwitchToMaster(type.id);
                              } else {
                                setSelectedTypeFilter(isSelected ? "all" : String(type.id));
                              }
                            }}
                            title={getTranslation("Click to view services under this category in Master", lang)}
                          >
                            <Eye size={12} className="me-1" />
                            <span className="fw-bold">{count} {getTranslation("Items", lang)}</span>
                          </Button>
                        </td>
                        <td className="text-center">
                          <Badge
                            color={type.isActive ? "success" : "secondary"}
                            className="cursor-pointer px-2 py-1"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleToggleTypeStatus(type)}
                            title="Click to toggle status"
                          >
                            {type.isActive ? "✓ Active" : "✕ Inactive"}
                          </Badge>
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <Button
                              color="light"
                              size="sm"
                              className="p-1.5 text-primary border"
                              onClick={() => openEditTypeModal(type)}
                              title="Edit item type"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              color="light"
                              size="sm"
                              className="p-1.5 text-danger border"
                              onClick={() => handleDeleteType(type)}
                              title="Delete item type"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
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
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: Item Master Table */}
      {/* ===================================================================== */}
      {(viewMode === "all" || viewMode === "master") && (
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <CardBody className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FileText size={18} color="#24695c" />
                <span>{getTranslation("Bill Items Master / बिलिंग आइटम मास्टर (दर सूची)", lang)}</span>
              </h5>
              <small className="text-muted">
                {getTranslation(
                  "Configure billable items, rates, and descriptions under each item type.",
                  lang
                )}
              </small>
            </div>
            <Button
              color="primary"
              className="d-flex align-items-center py-1.5 px-3 shadow-sm fw-bold"
              style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={() => openCreateItemModal()}
            >
              <Plus size={16} style={{ marginRight: "6px" }} />
              <span>{getTranslation("Add Item Master / नया बिल आइटम जोड़ें", lang)}</span>
            </Button>
          </div>

          {/* Filter Bar */}
          <Row className="g-2 mb-3">
            {/* Search Input */}
            <Col md={5} sm={12}>
              <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <Input
                  type="text"
                  placeholder={getTranslation(
                    "Search by item name, rate, or description... / खोजें...",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                  style={{ height: "36px", fontSize: "13px" }}
                />
              </InputGroup>
            </Col>

            {/* Filter by Item Type */}
            <Col md={4} sm={6}>
              <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-white text-muted px-2.5 border-end-0">
                  <Filter size={13} className="text-secondary me-1" />
                  <span className="fw-semibold small" style={{ fontSize: "12px", color: "#475569" }}>
                    {getTranslation("Type", lang)}:
                  </span>
                </span>
                <select
                  className="form-select border-start-0 ps-2"
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  style={{ height: "36px", fontSize: "13px" }}
                >
                  <option value="all">
                    {getTranslation("All Item Types", lang)} ({itemTypes.length})
                  </option>
                  {itemTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.item_type_name || t.name} ({typeCounts[t.id] || 0})
                    </option>
                  ))}
                </select>
              </InputGroup>
            </Col>

            {/* Filter by Branch (Super Admin only) */}
            {isSuperAdmin && (
              <Col md={3} sm={6}>
                <select
                  className="form-select form-select-sm shadow-sm"
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  style={{ height: "36px", fontSize: "13px", borderRadius: "8px" }}
                >
                  <option value="all">
                    {getTranslation("All Branches / सभी शाखाएं", lang)}
                  </option>
                  {branches.map((b) => (
                    <option key={b.id || b.Branch_id} value={b.id || b.Branch_id}>
                      {b.Branch_name}
                    </option>
                  ))}
                </select>
              </Col>
            )}
          </Row>

          {/* Active Filter Pill */}
          {selectedTypeFilter !== "all" && (
            <div className="mb-2.5 d-flex align-items-center gap-2">
              <span className="small text-muted">{getTranslation("Filtering by Type:", lang)}</span>
              <Badge color="primary" className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1">
                <span>{itemTypes.find((t) => String(t.id) === String(selectedTypeFilter))?.name}</span>
                <span
                  style={{ cursor: "pointer", fontWeight: "bold", marginLeft: "4px" }}
                  onClick={() => setSelectedTypeFilter("all")}
                  title="Clear filter"
                >
                  ✕
                </span>
              </Badge>
            </div>
          )}

          {/* Items Master Table */}
          <div className="table-responsive rounded-3 border">
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  <th className="ps-3 py-2.5 fw-bold" style={{ width: "50px" }}>#</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Item Name / सेवा या आइटम", lang)}</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Item Type / श्रेणी", lang)}</th>
                  <th className="py-2.5 fw-bold text-end">{getTranslation("Amount / दर (₹)", lang)}</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Description / विवरण", lang)}</th>
                  <th className="py-2.5 fw-bold">{getTranslation("Branch / शाखा", lang)}</th>
                  <th className="py-2.5 fw-bold text-center">{getTranslation("Status / स्थिति", lang)}</th>
                  <th className="py-2.5 fw-bold text-end pe-3">{getTranslation("Actions / क्रियाएं", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemsMaster.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      {getTranslation("No billing items match your filter. Click '+ Add Item Master' to add one.", lang)}
                    </td>
                  </tr>
                ) : (
                  filteredItemsMaster.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="ps-3 fw-bold text-muted">{idx + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.item_name}</div>
                      </td>
                      <td>
                        <Badge color="light" className="text-primary border px-2 py-1 fw-semibold">
                          <Layers size={10} className="me-1" />
                          {item.item_type_name}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <span
                          style={{
                            display: "inline-block",
                            backgroundColor: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            borderRadius: "6px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            fontSize: "12.5px",
                            letterSpacing: "0.2px",
                          }}
                        >
                          ₹ {Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="text-muted" style={{ maxWidth: "280px" }}>
                        {item.description || <span className="text-muted fst-italic">No description</span>}
                      </td>
                      <td>
                        <Badge color="light" className="text-dark border px-2 py-1">
                          <GitBranch size={10} className="me-1 text-primary" />
                          {item.branch_name || "All Branches"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge
                          color={item.isActive ? "success" : "secondary"}
                          className="cursor-pointer px-2 py-1"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleToggleItemStatus(item)}
                          title="Click to toggle status"
                        >
                          {item.isActive ? "✓ Active" : "✕ Inactive"}
                        </Badge>
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            color="light"
                            size="sm"
                            className="p-1.5 text-primary border"
                            onClick={() => openEditItemModal(item)}
                            title="Edit billing item"
                          >
                            <Edit2 size={13} />
                          </Button>
                          <Button
                            color="light"
                            size="sm"
                            className="p-1.5 text-danger border"
                            onClick={() => handleDeleteItem(item)}
                            title="Delete billing item"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: Create / Edit Item Type */}
      {/* ===================================================================== */}
      {typeModalOpen && (
        <Modal isOpen={typeModalOpen} toggle={() => setTypeModalOpen(false)}>
          <Form onSubmit={handleSaveType}>
            <ModalHeader toggle={() => setTypeModalOpen(false)} style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
              <div className="d-flex align-items-center gap-2">
                <Layers size={18} color="#24695c" />
                <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "16px" }}>
                  {editingType
                    ? getTranslation("Edit Bill Item Type / आइटम प्रकार संपादित करें", lang)
                    : getTranslation("Add Bill Item Type / नया आइटम प्रकार जोड़ें", lang)}
                </h5>
              </div>
            </ModalHeader>
            <ModalBody className="p-4" style={{ backgroundColor: "#f8fafc" }}>
              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Item Type Name / प्रकार का नाम", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Ward Charges, Blood Packages, Lab Tests"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                  required
                />
                <small className="text-muted">
                  {getTranslation("Common examples: Ward, Blood Packages, OPD Consultation, Physiotherapy, Lab", lang)}
                </small>
              </div>

              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Description / विवरण", lang)}
                </Label>
                <Input
                  type="textarea"
                  rows={3}
                  placeholder="Briefly describe what services or items belong to this category..."
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: "8px" }}
                />
              </div>

              {/* Branch Assignment */}
              <div className="mb-3">
                <Label className="small fw-semibold text-dark">
                  {getTranslation("Branch Assignment / शाखा का चयन", lang)}
                </Label>
                {isSuperAdmin ? (
                  <select
                    className="form-select"
                    value={typeFormData.branch_id}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        branch_id: e.target.value,
                      })
                    }
                    style={{ borderRadius: "8px", height: "40px" }}
                  >
                    <option value="">{getTranslation("All Branches (Global) / सभी शाखाएं", lang)}</option>
                    {branches.map((b) => (
                      <option key={b.id || b.Branch_id} value={b.id || b.Branch_id}>
                        {b.Branch_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    disabled
                    value={currentBranchName || "Current Branch"}
                    className="form-control bg-light"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                )}
              </div>

              {/* Active Toggle */}
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input cursor-pointer"
                  type="checkbox"
                  id="typeActiveSwitch"
                  checked={typeFormData.isActive}
                  onChange={(e) => setTypeFormData({ ...typeFormData, isActive: e.target.checked })}
                />
                <Label className="form-check-label small fw-semibold cursor-pointer" for="typeActiveSwitch">
                  {typeFormData.isActive
                    ? getTranslation("Active (Available for billing items)", lang)
                    : getTranslation("Inactive (Hidden)", lang)}
                </Label>
              </div>
            </ModalBody>
            <ModalFooter style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              <Button color="secondary" type="button" onClick={() => setTypeModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button
                color="primary"
                type="submit"
                className="fw-bold px-4 shadow-sm"
                style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
              >
                {editingType
                  ? getTranslation("Update Type / सहेजें", lang)
                  : getTranslation("Save Type / जोड़ें", lang)}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Create / Edit Item Master */}
      {/* ===================================================================== */}
      {itemModalOpen && (
        <Modal isOpen={itemModalOpen} toggle={() => setItemModalOpen(false)} size="lg">
          <Form onSubmit={handleSaveItem}>
            <ModalHeader toggle={() => setItemModalOpen(false)} style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
              <div className="d-flex align-items-center gap-2">
                <FileText size={18} color="#24695c" />
                <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "16px" }}>
                  {editingItem
                    ? getTranslation("Edit Billing Item Master / बिल आइटम विवरण बदलें", lang)
                    : getTranslation("Add New Billing Item Master / नया बिल आइटम जोड़ें", lang)}
                </h5>
              </div>
            </ModalHeader>
            <ModalBody className="p-4" style={{ backgroundColor: "#f8fafc" }}>
              <Row className="g-3">
                {/* Item Type Selector */}
                <Col md={6}>
                  <Label className="small fw-semibold text-dark">
                    {getTranslation("Item Type (Category) / प्रकार", lang)} <span className="text-danger">*</span>
                  </Label>
                  <select
                    className="form-select"
                    value={itemFormData.item_type_id}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const match = itemTypes.find((t) => String(t.id) === String(tId));
                      setItemFormData({
                        ...itemFormData,
                        item_type_id: tId,
                        item_type_name: match ? match.name : "",
                      });
                    }}
                    style={{ borderRadius: "8px", height: "40px" }}
                    required
                  >
                    <option value="">-- {getTranslation("Select Item Type", lang)} --</option>
                    {itemTypes
                      .filter((t) => t.isActive || String(t.id) === String(itemFormData.item_type_id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </Col>

                {/* Amount / Rate */}
                <Col md={6}>
                  <Label className="small fw-semibold text-dark">
                    {getTranslation("Amount / दर (₹)", lang)} <span className="text-danger">*</span>
                  </Label>
                  <InputGroup>
                    <span className="input-group-text bg-white fw-bold text-muted">₹</span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="e.g. 500, 1200"
                      value={itemFormData.amount}
                      onChange={(e) => setItemFormData({ ...itemFormData, amount: e.target.value })}
                      className="form-control"
                      style={{ borderRadius: "0 8px 8px 0", height: "40px" }}
                      required
                    />
                  </InputGroup>
                </Col>

                {/* Item Name */}
                <Col md={12}>
                  <Label className="small fw-semibold text-dark">
                    {getTranslation("Item Master Name / आइटम का नाम", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Private Ward Room (AC), Complete Hemogram (CBC), Rehab Physiotherapy"
                    value={itemFormData.item_name}
                    onChange={(e) => setItemFormData({ ...itemFormData, item_name: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                    required
                  />
                </Col>

                {/* Description */}
                <Col md={12}>
                  <Label className="small fw-semibold text-dark">
                    {getTranslation("Description / विवरण", lang)}
                  </Label>
                  <Input
                    type="textarea"
                    rows={3}
                    placeholder="Enter detailed description of what is included in this billing item or package..."
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: "8px" }}
                  />
                </Col>

                {/* Branch Assignment */}
                <Col md={12}>
                  <Label className="small fw-semibold text-dark">
                    {getTranslation("Branch Assignment / शाखा चयन", lang)}
                  </Label>
                  {isSuperAdmin ? (
                    <div>
                      <select
                        className="form-select"
                        value={itemFormData.branch_id}
                        onChange={(e) =>
                          setItemFormData({
                            ...itemFormData,
                            branch_id: e.target.value,
                          })
                        }
                        style={{ borderRadius: "8px", height: "40px" }}
                      >
                        <option value="">{getTranslation("All Branches (Global) / सभी शाखाएं", lang)}</option>
                        {branches.map((b) => (
                          <option key={b.id || b.Branch_id} value={b.id || b.Branch_id}>
                            {b.Branch_name}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        {getTranslation("Super Admin can assign this item to a specific branch or make it globally available.", lang)}
                      </small>
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="text"
                        disabled
                        value={`${currentBranchName || "Current Branch"} (Auto-Assigned)`}
                        className="form-control bg-light"
                        style={{ borderRadius: "8px", height: "40px" }}
                      />
                      <small className="text-muted">
                        {getTranslation("Branch Admins automatically create items for their assigned branch.", lang)}
                      </small>
                    </div>
                  )}
                </Col>

                {/* Active Toggle */}
                <Col md={12}>
                  <div className="form-check form-switch mt-1">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      id="itemActiveSwitch"
                      checked={itemFormData.isActive}
                      onChange={(e) => setItemFormData({ ...itemFormData, isActive: e.target.checked })}
                    />
                    <Label className="form-check-label small fw-semibold cursor-pointer" for="itemActiveSwitch">
                      {itemFormData.isActive
                        ? getTranslation("Active (Item will appear on billing forms and patient invoices)", lang)
                        : getTranslation("Inactive (Hidden from invoices)", lang)}
                    </Label>
                  </div>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              <Button color="secondary" type="button" onClick={() => setItemModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button
                color="primary"
                type="submit"
                className="fw-bold px-4 shadow-sm"
                style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
              >
                {editingItem
                  ? getTranslation("Update Item / सहेजें", lang)
                  : getTranslation("Save Item / जोड़ें", lang)}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default BillingSettings;
