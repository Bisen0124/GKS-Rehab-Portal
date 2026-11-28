import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Form,
  Label,
  
  InputGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Table,
} from "reactstrap";
import Input from "../Common/BilingualInput";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  FileText,
  Activity,
  AlertTriangle,
} from "react-feather";

import HeaderCard from "../Common/Component/HeaderCard";
import { ActionButtonsGroup, TableActionButton } from "../Common/Component/ActionButtons";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { fetchActiveDetoxSubstances } from "../../Services/detoxSubstanceService";
import {
  fetchDetoxSeverities,
  createDetoxSeverity,
  updateDetoxSeverity,
  deleteDetoxSeverity,
} from "../../Services/detoxSeverityService";

const QUICK_SEVERITY_SUGGESTIONS = [
  "Mild Alcohol Withdrawal",
  "Moderate Alcohol Withdrawal",
  "Severe Alcohol Withdrawal",
  "Very Severe Alcohol Withdrawal",
];

const DetoxSeverity = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  // Role detection
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";

  // Data States
  const [severities, setSeverities] = useState([]);
  const [substances, setSubstances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubstanceFilter, setSelectedSubstanceFilter] = useState("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sub_id: "",
    min_score: "",
    max_score: "",
    severity: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Data directly from DB API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      const [subsList, sevList] = await Promise.all([
        fetchActiveDetoxSubstances(branchId, ""),
        fetchDetoxSeverities(branchId, selectedSubstanceFilter, searchTerm),
      ]);
      setSubstances(subsList || []);
      setSeverities(sevList || []);
    } catch {
      toast.error(
        getTranslation("Failed to load severity benchmarks from DB API", lang)
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch, selectedSubstanceFilter, searchTerm, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered List
  const filteredSeverities = useMemo(() => {
    let list = severities;
    if (selectedSubstanceFilter && selectedSubstanceFilter !== "all") {
      list = list.filter((s) => String(s.sub_id) === String(selectedSubstanceFilter));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.severity.toLowerCase().includes(q) ||
          s.substance_name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          String(s.min_score).includes(q) ||
          String(s.max_score).includes(q) ||
          String(s.id).includes(q)
      );
    }
    return list;
  }, [severities, selectedSubstanceFilter, searchTerm]);

  // Open Create Modal
  const openCreateModal = () => {
    const defaultSubId = substances.length > 0 ? substances[0].id : "";
    setFormData({
      sub_id: defaultSubId,
      min_score: "",
      max_score: "",
      severity: "",
      description: "",
    });
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setCurrentSeverity(item);
    setFormData({
      sub_id: item.sub_id || "",
      min_score: String(item.min_score),
      max_score: String(item.max_score),
      severity: item.severity || "",
      description: item.description || "",
    });
    setEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item) => {
    setCurrentSeverity(item);
    setViewModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sub_id) {
      toast.warning(getTranslation("Please select a substance / कृपया पदार्थ चुनें", lang));
      return;
    }
    if (formData.min_score === "" || formData.max_score === "") {
      toast.warning(getTranslation("Min and Max score are required", lang));
      return;
    }
    const minNum = Number(formData.min_score);
    const maxNum = Number(formData.max_score);
    if (minNum < 0 || maxNum < minNum) {
      toast.warning(getTranslation("Max score must be greater than or equal to Min score", lang));
      return;
    }
    if (!formData.severity.trim()) {
      toast.warning(getTranslation("Severity is required (e.g. Mild Alcohol Withdrawal)", lang));
      return;
    }

    setIsSubmitting(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      await createDetoxSeverity(
        {
          sub_id: formData.sub_id,
          min_score: minNum,
          max_score: maxNum,
          severity: formData.severity.trim(),
          description: formData.description.trim(),
        },
        branchId
      );

      toast.success(
        getTranslation("Severity benchmark created successfully", lang)
      );
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create severity benchmark in DB");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentSeverity) return;

    const minNum = Number(formData.min_score);
    const maxNum = Number(formData.max_score);
    if (minNum < 0 || maxNum < minNum) {
      toast.warning(getTranslation("Max score must be greater than or equal to Min score", lang));
      return;
    }
    if (!formData.severity.trim()) {
      toast.warning(getTranslation("Severity is required", lang));
      return;
    }

    setIsSubmitting(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      await updateDetoxSeverity(
        currentSeverity.id,
        {
          min_score: minNum,
          max_score: maxNum,
          severity: formData.severity.trim(),
          description: formData.description.trim(),
        },
        branchId
      );

      toast.success(getTranslation("Severity benchmark updated successfully", lang));
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update severity benchmark in DB");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (item) => {
    Swal.fire({
      title: getTranslation("Are you sure? / क्या आप निश्चित हैं?", lang),
      text: `${getTranslation("Delete Severity benchmark", lang)} "${item.severity}" (${item.min_score} - ${item.max_score})?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
          await deleteDetoxSeverity(item.id, branchId);
          toast.success(getTranslation("Severity benchmark deleted successfully", lang));
          loadData();
        } catch (err) {
          toast.error(err.message || "Failed to delete from DB");
        }
      }
    });
  };

  // Helper for Severity Badge color
  const getSeverityBadgeClass = (sev = "") => {
    const s = sev.toLowerCase();
    if (s.includes("very severe") || s.includes("extreme")) return "bg-danger text-white";
    if (s.includes("severe")) return "bg-danger text-white";
    if (s.includes("moderate")) return "bg-warning text-dark";
    if (s.includes("mild")) return "bg-info text-dark";
    return "bg-secondary text-white";
  };

  return (
    <Container fluid={true} className="p-3 p-md-4">
      {/* Title Header */}
      <HeaderCard
        title={getTranslation(
          "Detoxification Severity Benchmarks / गंभीरता बेंचमार्क (CIWA-Ar)",
          lang
        )}
      />

      {/* Top Action Bar (matching Image 1 handwritten sketch) */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Activity size={20} color="#24695c" />
            <span>{getTranslation("Severity / गंभीरता", lang)}</span>
            <Badge color="primary" pill className="ms-1" style={{ backgroundColor: "#24695c" }}>
              {severities.length}
            </Badge>
          </h5>
          <small className="text-muted">
            {getTranslation(
              "Define score range benchmarks (e.g. 0-9: Mild Alcohol Withdrawal, 10-15: Moderate, 16-20: Severe).",
              lang
            )}
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* [Add new] Button (Image 1) */}
          <Button
            color="primary"
            className="d-flex align-items-center py-2 px-3 shadow-sm fw-bold"
            style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
            onClick={openCreateModal}
          >
            <Plus size={16} className="me-1.5" />
            <span>{getTranslation("Add New / नया जोड़ें", lang)}</span>
          </Button>

          <Button
            color="light"
            className="border py-2 px-2.5 shadow-sm text-muted"
            style={{ borderRadius: "8px" }}
            onClick={loadData}
            title={getTranslation("Refresh / रीफ़्रेश करें", lang)}
          >
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white">
        <CardBody className="py-2.5 px-3">
          <Row className="g-2 align-items-center">
            {/* Search */}
            <Col md={6} sm={12}>
              <InputGroup size="sm">
                <span
                  className="input-group-text bg-white pe-2 border-end-0"
                  style={{ borderRadius: "8px 0 0 8px", borderColor: "#ced4da" }}
                >
                  <Search size={15} className="text-muted" />
                </span>
                <Input
                  type="text"
                  placeholder={getTranslation(
                    "Search by severity, substance, min/max score... / खोजें...",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 ps-0"
                  style={{ borderRadius: "0 8px 8px 0" }}
                />
              </InputGroup>
            </Col>

            {/* Filter by Substance */}
            <Col md={4} sm={8}>
              <Input
                type="select"
                size="sm"
                value={selectedSubstanceFilter}
                onChange={(e) => setSelectedSubstanceFilter(e.target.value)}
                style={{ borderRadius: "8px" }}
              >
                <option value="all">
                  {getTranslation("All Substances / सभी पदार्थ", lang)}
                </option>
                {substances.map((s) => (
                  <option key={s.id || s.sub_id} value={s.id || s.sub_id}>
                    {s.name}
                  </option>
                ))}
              </Input>
            </Col>

            <Col md={2} sm={4} className="text-md-end text-muted small">
              {filteredSeverities.length}{" "}
              {getTranslation("records found / रिकॉर्ड", lang)}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Severity Benchmarks Table (matching Image 1: id, subs, min, max, severity, description, Action) */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2 text-muted">
                {getTranslation("Loading from DB API... / लोड हो रहा है...", lang)}
              </div>
            </div>
          ) : filteredSeverities.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={40} className="text-muted mb-2" />
              <h6 className="text-muted fw-bold">
                {getTranslation("No Severity Benchmarks Found", lang)}
              </h6>
              <p className="text-muted small mb-3">
                {getTranslation(
                  "Click '+ Add New' above to define score ranges (e.g. 0-9: Mild Alcohol Withdrawal).",
                  lang
                )}
              </p>
              <Button
                color="primary"
                size="sm"
                style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
                onClick={openCreateModal}
              >
                <Plus size={14} className="me-1" />
                {getTranslation("Add New / नया जोड़ें", lang)}
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ width: "80px", padding: "14px 16px", color: "#475569" }}>
                      # ID
                    </th>
                    <th style={{ width: "160px", padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Substance / पदार्थ", lang)}
                    </th>
                    <th style={{ width: "90px", padding: "14px 16px", color: "#475569", textAlign: "center" }}>
                      Min
                    </th>
                    <th style={{ width: "90px", padding: "14px 16px", color: "#475569", textAlign: "center" }}>
                      Max
                    </th>
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Severity (Clinical Benchmark) / गंभीरता", lang)}
                    </th>
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Description / विवरण", lang)}
                    </th>
                    <th
                      style={{
                        width: "160px",
                        padding: "14px 16px",
                        textAlign: "center",
                        color: "#475569",
                      }}
                    >
                      {getTranslation("Action / कार्रवाई", lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSeverities.map((item, index) => (
                    <tr key={item.id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* ID */}
                      <td className="ps-3">
                        <span
                          className="badge bg-light text-dark px-2 py-1"
                          style={{ fontSize: "12px", border: "1px solid #e2e8f0" }}
                        >
                          {item.id}
                        </span>
                      </td>

                      {/* Substance (subs) */}
                      <td>
                        <span
                          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 fw-bold"
                          style={{
                            backgroundColor: "#e6f4f1",
                            color: "#24695c",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                          }}
                        >
                          🌿 {item.substance_name}
                        </span>
                      </td>

                      {/* Min Score */}
                      <td style={{ textAlign: "center" }}>
                        <span className="fw-bold px-2 py-0.5 rounded bg-light border">
                          {item.min_score}
                        </span>
                      </td>

                      {/* Max Score */}
                      <td style={{ textAlign: "center" }}>
                        <span className="fw-bold px-2 py-0.5 rounded bg-light border">
                          {item.max_score}
                        </span>
                      </td>

                      {/* Severity (Image 2 benchmark) */}
                      <td>
                        <span
                          className={`badge px-2.5 py-1 ${getSeverityBadgeClass(item.severity)}`}
                          style={{ borderRadius: "6px", fontSize: "12.5px" }}
                        >
                          {item.severity}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="text-muted" style={{ fontSize: "13.5px" }}>
                        {item.description || "—"}
                      </td>

                      {/* Action: [e] Edit, [v] View, [d] Delete */}
                      <td style={{ textAlign: "center" }}>
                        <ActionButtonsGroup>
                          <TableActionButton
                            type="view"
                            title={getTranslation("View Details / विवरण देखें", lang)}
                            onClick={() => openViewModal(item)}
                          />
                          <TableActionButton
                            type="edit"
                            title={getTranslation("Edit Benchmark / संपादित करें", lang)}
                            onClick={() => openEditModal(item)}
                          />
                          <TableActionButton
                            type="delete"
                            title={getTranslation("Delete Benchmark / हटाएं", lang)}
                            onClick={() => handleDelete(item)}
                          />
                        </ActionButtonsGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ===================================================================== */}
      {/* MODAL 1: Add New Severity Benchmark */}
      {/* ===================================================================== */}
      <Modal
        isOpen={createModalOpen}
        toggle={() => !isSubmitting && setCreateModalOpen(false)}
        centered
      >
        <Form onSubmit={handleCreateSubmit}>
          <ModalHeader
            toggle={() => !isSubmitting && setCreateModalOpen(false)}
            style={{ background: "#f8fafc" }}
          >
            <div className="d-flex align-items-center gap-2">
              <Plus size={18} color="#24695c" />
              <span className="fw-bold">
                {getTranslation("Add Severity Benchmark / नया गंभीरता बेंचमार्क जोड़ें", lang)}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="p-4">
            {/* Substance Select */}
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Substance / पदार्थ", lang)} <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                required
                value={formData.sub_id}
                onChange={(e) => setFormData({ ...formData, sub_id: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              >
                <option value="">{getTranslation("-- Select Substance --", lang)}</option>
                {substances.map((s) => (
                  <option key={s.id || s.sub_id} value={s.id || s.sub_id}>
                    {s.name}
                  </option>
                ))}
              </Input>
            </div>

            {/* Min and Max Score */}
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Label className="fw-bold text-dark">
                  {getTranslation("Min Score / न्यूनतम अंक", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 0, 10, 16"
                  value={formData.min_score}
                  onChange={(e) => setFormData({ ...formData, min_score: e.target.value })}
                  style={{ borderRadius: "8px", height: "42px" }}
                />
              </Col>
              <Col xs={6}>
                <Label className="fw-bold text-dark">
                  {getTranslation("Max Score / अधिकतम अंक", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 9, 15, 20"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                  style={{ borderRadius: "8px", height: "42px" }}
                />
              </Col>
            </Row>

            {/* Severity Input */}
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Severity (Clinical Benchmark) / गंभीरता", lang)}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. Mild Alcohol Withdrawal"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />

              {/* Quick Suggestion Pills (Image 2) */}
              <div className="d-flex flex-wrap gap-1 mt-2">
                <small className="text-muted w-100 mb-1">Quick Select:</small>
                {QUICK_SEVERITY_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0.5 px-2 text-nowrap"
                    style={{ fontSize: "11px", borderRadius: "12px" }}
                    onClick={() => setFormData({ ...formData, severity: sugg })}
                  >
                    + {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-2">
              <Label className="fw-bold text-dark">
                {getTranslation("Description / विवरण (वैकल्पिक)", lang)}
              </Label>
              <Input
                type="textarea"
                rows="3"
                placeholder="Clinical observation notes or recommended intervention..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ borderRadius: "8px" }}
              />
            </div>
          </ModalBody>

          <ModalFooter style={{ background: "#f8fafc" }}>
            <Button
              color="light"
              onClick={() => setCreateModalOpen(false)}
              disabled={isSubmitting}
              style={{ borderRadius: "8px" }}
            >
              {getTranslation("Cancel / रद्द करें", lang)}
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#24695c",
                borderColor: "#24695c",
                borderRadius: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {getTranslation("Saving... / सहेजा जा रहा है...", lang)}
                </>
              ) : (
                getTranslation("Save Benchmark / सहेजें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: Edit Severity Benchmark */}
      {/* ===================================================================== */}
      <Modal
        isOpen={editModalOpen}
        toggle={() => !isSubmitting && setEditModalOpen(false)}
        centered
      >
        <Form onSubmit={handleEditSubmit}>
          <ModalHeader
            toggle={() => !isSubmitting && setEditModalOpen(false)}
            style={{ background: "#f8fafc" }}
          >
            <div className="d-flex align-items-center gap-2">
              <Edit2 size={18} color="#24695c" />
              <span className="fw-bold">
                {getTranslation("Edit Severity Benchmark / बेंचमार्क संपादित करें", lang)}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="p-4">
            {/* Substance Display */}
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Substance / पदार्थ", lang)}
              </Label>
              <Input
                type="text"
                disabled
                value={currentSeverity ? currentSeverity.substance_name : ""}
                style={{ borderRadius: "8px", height: "42px" }}
              />
              <small className="text-muted">
                (Substance cannot be changed on an existing benchmark)
              </small>
            </div>

            {/* Min and Max Score */}
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Label className="fw-bold text-dark">
                  {getTranslation("Min Score", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.min_score}
                  onChange={(e) => setFormData({ ...formData, min_score: e.target.value })}
                  style={{ borderRadius: "8px", height: "42px" }}
                />
              </Col>
              <Col xs={6}>
                <Label className="fw-bold text-dark">
                  {getTranslation("Max Score", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                  style={{ borderRadius: "8px", height: "42px" }}
                />
              </Col>
            </Row>

            {/* Severity Input */}
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Severity / गंभीरता", lang)} <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />
            </div>

            {/* Description */}
            <div className="mb-2">
              <Label className="fw-bold text-dark">
                {getTranslation("Description / विवरण", lang)}
              </Label>
              <Input
                type="textarea"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ borderRadius: "8px" }}
              />
            </div>
          </ModalBody>

          <ModalFooter style={{ background: "#f8fafc" }}>
            <Button
              color="light"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
              style={{ borderRadius: "8px" }}
            >
              {getTranslation("Cancel / रद्द करें", lang)}
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#24695c",
                borderColor: "#24695c",
                borderRadius: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {getTranslation("Updating... / अपडेट हो रहा है...", lang)}
                </>
              ) : (
                getTranslation("Update Benchmark / अपडेट करें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: View Severity Details */}
      {/* ===================================================================== */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(false)} centered>
        <ModalHeader toggle={() => setViewModalOpen(false)} style={{ background: "#f8fafc" }}>
          <div className="d-flex align-items-center gap-2">
            <Eye size={18} color="#24695c" />
            <span className="fw-bold">
              {getTranslation("Severity Benchmark Details / बेंचमार्क विवरण", lang)}
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {currentSeverity && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <small className="text-muted d-block">Substance</small>
                  <span
                    className="badge mt-1 px-2.5 py-1 fw-bold fs-6"
                    style={{ backgroundColor: "#e6f4f1", color: "#24695c" }}
                  >
                    🌿 {currentSeverity.substance_name}
                  </span>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Benchmark ID</small>
                  <span className="fw-bold">#{currentSeverity.id}</span>
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">Score Range</small>
                <h4 className="fw-bold text-dark mt-1">
                  {currentSeverity.min_score} – {currentSeverity.max_score}
                </h4>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">Severity Benchmark Label</small>
                <div className="mt-1">
                  <span
                    className={`badge px-3 py-1.5 fs-6 ${getSeverityBadgeClass(
                      currentSeverity.severity
                    )}`}
                  >
                    <AlertTriangle size={14} className="me-1.5" />
                    {currentSeverity.severity}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <small className="text-muted d-block">Description / Protocol Notes</small>
                <p className="text-secondary mt-1 mb-0" style={{ fontSize: "14px" }}>
                  {currentSeverity.description || "No description provided."}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter style={{ background: "#f8fafc" }}>
          <Button
            color="secondary"
            onClick={() => setViewModalOpen(false)}
            style={{ borderRadius: "8px" }}
          >
            {getTranslation("Close / बंद करें", lang)}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default DetoxSeverity;
