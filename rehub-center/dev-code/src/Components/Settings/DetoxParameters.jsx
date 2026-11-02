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
  Input,
  InputGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Table,
} from "reactstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  Plus,
  Minus,
  Edit2,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  FileText,
  Sliders,
} from "react-feather";

import HeaderCard from "../Common/Component/HeaderCard";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { fetchActiveDetoxSubstances } from "../../Services/detoxSubstanceService";
import {
  fetchAssessmentParameters,
  createAssessmentParameter,
  updateAssessmentParameter,
  deleteAssessmentParameter,
  getScoreSeverity,
} from "../../Services/detoxParameterService";

const DetoxParameters = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  // Role detection
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";

  // Data States
  const [parameters, setParameters] = useState([]);
  const [substances, setSubstances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubstanceFilter, setSelectedSubstanceFilter] = useState("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentParam, setCurrentParam] = useState(null);

  // Form State (matching Image 2 handwritten layout)
  const [formData, setFormData] = useState({
    sub_id: "",
    parameter_name: "",
    scores: [
      { score: "0", description: "" },
      { score: "1", description: "" },
      { score: "2", description: "" },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Substances & Parameters
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      const [subsList, paramsList] = await Promise.all([
        fetchActiveDetoxSubstances(branchId, ""),
        fetchAssessmentParameters(branchId, selectedSubstanceFilter, searchTerm),
      ]);
      setSubstances(subsList || []);
      setParameters(paramsList || []);
    } catch {
      toast.error(
        getTranslation("Failed to load parameters / पैरामीटर लोड करने में विफल", lang)
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch, selectedSubstanceFilter, searchTerm, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered List
  const filteredParameters = useMemo(() => {
    let list = parameters;
    if (selectedSubstanceFilter && selectedSubstanceFilter !== "all") {
      list = list.filter((p) => String(p.sub_id) === String(selectedSubstanceFilter));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.parameter_name.toLowerCase().includes(q) ||
          (p.substance_name && p.substance_name.toLowerCase().includes(q)) ||
          p.scores.some((sc) => sc.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parameters, selectedSubstanceFilter, searchTerm]);

  // Open Create Modal
  const openCreateModal = () => {
    const defaultSubId = substances.length > 0 ? substances[0].id : "";
    setFormData({
      sub_id: defaultSubId,
      parameter_name: "",
      scores: [
        { score: "0", description: "None / Normal" },
        { score: "1", description: "Mild symptoms" },
        { score: "2", description: "Moderate symptoms" },
        { score: "4", description: "Severe symptoms" },
        { score: "7", description: "Extreme symptoms" },
      ],
    });
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (param) => {
    setCurrentParam(param);
    setFormData({
      sub_id: param.sub_id || "",
      parameter_name: param.parameter_name || "",
      scores:
        param.scores && param.scores.length > 0
          ? param.scores.map((s) => ({
              score: String(s.score !== undefined ? s.score : s.min_score || 0),
              description: s.description || "",
            }))
          : [{ score: "0", description: "" }],
    });
    setEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (param) => {
    setCurrentParam(param);
    setViewModalOpen(true);
  };

  // Handle Score Row Add (+)
  const handleAddScoreRow = () => {
    setFormData((prev) => {
      const lastScore = prev.scores.length > 0 ? Number(prev.scores[prev.scores.length - 1].score) : 0;
      const nextScore = isNaN(lastScore) ? prev.scores.length : lastScore + 1;
      return {
        ...prev,
        scores: [...prev.scores, { score: String(nextScore), description: "" }],
      };
    });
  };

  // Handle Score Row Remove (-)
  const handleRemoveScoreRow = (index) => {
    if (formData.scores.length <= 1) {
      toast.warning(
        getTranslation("At least one score criteria row is required.", lang)
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      scores: prev.scores.filter((_, idx) => idx !== index),
    }));
  };

  // Handle Score Field Change
  const handleScoreChange = (index, field, value) => {
    setFormData((prev) => {
      const nextScores = [...prev.scores];
      nextScores[index] = { ...nextScores[index], [field]: value };
      return { ...prev, scores: nextScores };
    });
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sub_id) {
      toast.warning(getTranslation("Please select a substance / कृपया पदार्थ चुनें", lang));
      return;
    }
    if (!formData.parameter_name.trim()) {
      toast.warning(
        getTranslation("Assessment Parameter name is required / पैरामीटर का नाम आवश्यक है", lang)
      );
      return;
    }

    // Validate score rows
    const validScores = formData.scores.filter(
      (s) => s.score !== "" && s.description.trim() !== ""
    );
    if (validScores.length === 0) {
      toast.warning(
        getTranslation("Please provide at least one score value and description.", lang)
      );
      return;
    }

    setIsSubmitting(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      await createAssessmentParameter(
        {
          sub_id: formData.sub_id,
          parameter_name: formData.parameter_name.trim(),
          scores: validScores,
        },
        branchId
      );

      toast.success(
        getTranslation(
          "Assessment Parameter created successfully / मूल्यांकन पैरामीटर सफलतापूर्वक जोड़ा गया",
          lang
        )
      );
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(
        err.message ||
          getTranslation("Failed to create parameter / पैरामीटर बनाने में विफल", lang)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sub_id || !formData.parameter_name.trim()) {
      toast.warning(
        getTranslation("Substance and Parameter name are required", lang)
      );
      return;
    }
    if (!currentParam) return;

    const validScores = formData.scores.filter(
      (s) => s.score !== "" && s.description.trim() !== ""
    );
    if (validScores.length === 0) {
      toast.warning(getTranslation("Please provide at least one score criteria.", lang));
      return;
    }

    setIsSubmitting(true);
    const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
    try {
      await updateAssessmentParameter(
        currentParam.id,
        {
          sub_id: formData.sub_id,
          parameter_name: formData.parameter_name.trim(),
          scores: validScores,
        },
        branchId
      );

      toast.success(
        getTranslation("Parameter updated successfully / पैरामीटर सफलतापूर्वक अपडेट किया गया", lang)
      );
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update parameter");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Parameter
  const handleDelete = (param) => {
    Swal.fire({
      title: getTranslation("Are you sure? / क्या आप निश्चित हैं?", lang),
      text: `${getTranslation("Delete Assessment Parameter", lang)} "${param.parameter_name}"?`,
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
          await deleteAssessmentParameter(param, branchId);
          toast.success(getTranslation("Parameter deleted successfully", lang));
          loadData();
        } catch {
          toast.error("Failed to delete parameter");
        }
      }
    });
  };

  return (
    <Container fluid={true} className="p-3 p-md-4">
      {/* Page Title Header */}
      <HeaderCard
        title={getTranslation(
          "Assessment Parameters / मूल्यांकन पैरामीटर (CIWA-Ar)",
          lang
        )}
      />

      {/* Top Action Bar (matching Image 1 handwritten sketch) */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Sliders size={20} color="#24695c" />
            <span>{getTranslation("Assessment Parameters / मूल्यांकन पैरामीटर", lang)}</span>
            <Badge color="primary" pill className="ms-1" style={{ backgroundColor: "#24695c" }}>
              {parameters.length}
            </Badge>
          </h5>
          <small className="text-muted">
            {getTranslation(
              "Configure assessment parameters, score rating values, and clinical criteria per substance.",
              lang
            )}
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* [+ Add] Button */}
          <Button
            color="primary"
            className="d-flex align-items-center py-2 px-3 shadow-sm fw-bold"
            style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
            onClick={openCreateModal}
          >
            <Plus size={16} className="me-1.5" />
            <span>{getTranslation("Add Parameter / नया पैरामीटर जोड़ें", lang)}</span>
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
                    "Search parameters by name, description, criteria... / खोजें...",
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
              {filteredParameters.length}{" "}
              {getTranslation("parameters found / पैरामीटर", lang)}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Assessment Parameters Table (matching Image 1) */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2 text-muted">
                {getTranslation("Loading parameters... / लोड हो रहा है...", lang)}
              </div>
            </div>
          ) : filteredParameters.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={40} className="text-muted mb-2" />
              <h6 className="text-muted fw-bold">
                {getTranslation("No Assessment Parameters Found", lang)}
              </h6>
              <p className="text-muted small mb-3">
                {getTranslation(
                  "Click '+ Add Parameter' above to configure parameters and score values.",
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
                {getTranslation("Add Parameter / पैरामीटर जोड़ें", lang)}
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ width: "70px", padding: "14px 16px", color: "#475569" }}>
                      # ID
                    </th>
                    <th style={{ width: "160px", padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Substance / पदार्थ", lang)}
                    </th>
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Assessment Parameter / मूल्यांकन पैरामीटर", lang)}
                    </th>
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Score Values & Criteria / स्कोर एवं मानदंड", lang)}
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
                  {filteredParameters.map((param, index) => (
                    <tr key={param.id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* # ID */}
                      <td className="ps-3">
                        <span
                          className="badge bg-light text-dark px-2 py-1"
                          style={{ fontSize: "12px", border: "1px solid #e2e8f0" }}
                        >
                          {param.id || index + 1}
                        </span>
                      </td>

                      {/* Substance Badge */}
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
                          🌿 {param.substance_name || "Alcohol"}
                        </span>
                      </td>

                      {/* Assessment Parameter Name */}
                      <td>
                        <div className="fw-bold text-dark" style={{ fontSize: "14px" }}>
                          {param.parameter_name}
                        </div>
                        <small className="text-muted">
                          {param.scores ? `${param.scores.length} score criteria defined` : ""}
                        </small>
                      </td>

                      {/* Score Values & Criteria pills */}
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {param.scores &&
                            param.scores.map((sc, scIdx) => (
                              <span
                                key={scIdx}
                                className="badge bg-light text-dark px-2 py-1 border d-inline-flex align-items-center gap-1"
                                style={{ fontSize: "11px", fontWeight: "normal" }}
                                title={sc.description}
                              >
                                <strong style={{ color: "#24695c" }}>{sc.score}:</strong>{" "}
                                {sc.description.length > 25
                                  ? `${sc.description.substring(0, 25)}...`
                                  : sc.description}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Actions: [e] Edit, [v] View, [d] Delete */}
                      <td style={{ textAlign: "center" }}>
                        <div className="d-inline-flex align-items-center gap-1.5">
                          {/* [e] Edit */}
                          <Button
                            color="light"
                            size="sm"
                            className="border p-1.5 text-primary shadow-sm"
                            style={{ borderRadius: "6px" }}
                            title={getTranslation("Edit Parameter / संपादित करें", lang)}
                            onClick={() => openEditModal(param)}
                          >
                            <Edit2 size={14} />
                          </Button>

                          {/* [v] View */}
                          <Button
                            color="light"
                            size="sm"
                            className="border p-1.5 text-secondary shadow-sm"
                            style={{ borderRadius: "6px" }}
                            title={getTranslation("View Details / विवरण देखें", lang)}
                            onClick={() => openViewModal(param)}
                          >
                            <Eye size={14} />
                          </Button>

                          {/* [d] Delete */}
                          <Button
                            color="light"
                            size="sm"
                            className="border p-1.5 text-danger shadow-sm"
                            style={{ borderRadius: "6px" }}
                            title={getTranslation("Delete Parameter / हटाएं", lang)}
                            onClick={() => handleDelete(param)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
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
      {/* MODAL 1: Create Assessment Parameter (Exact match to Image 2) */}
      {/* ===================================================================== */}
      <Modal
        isOpen={createModalOpen}
        toggle={() => !isSubmitting && setCreateModalOpen(false)}
        size="lg"
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
                {getTranslation("Add Assessment Parameter / नया मूल्यांकन पैरामीटर जोड़ें", lang)}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="p-4">
            {/* 1. Substance Input (Dropdown) */}
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
                    {s.name} {s.description ? `(${s.description})` : ""}
                  </option>
                ))}
              </Input>
            </div>

            {/* 2. Assessment Parameter Input */}
            <div className="mb-4">
              <Label className="fw-bold text-dark">
                {getTranslation("Assessment Parameter (Ass. Param) / मूल्यांकन पैरामीटर", lang)}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. Nausea and Vomiting (Over last 1/2 hour), Tremor, Anxiety..."
                value={formData.parameter_name}
                onChange={(e) => setFormData({ ...formData, parameter_name: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />
            </div>

            {/* 3. Score Value & Description Dynamic List with [+] and [-] (Image 2) */}
            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label className="fw-bold text-dark mb-0">
                  {getTranslation("Score Values & Criteria Description / स्कोर एवं विवरण", lang)}
                </Label>
                <Button
                  color="success"
                  size="sm"
                  type="button"
                  onClick={handleAddScoreRow}
                  className="d-flex align-items-center gap-1 shadow-sm fw-bold px-2.5 py-1"
                  style={{ borderRadius: "6px", backgroundColor: "#24695c", borderColor: "#24695c" }}
                >
                  <Plus size={14} />
                  <span>{getTranslation("Add Score Row", lang)}</span>
                </Button>
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <Row className="g-2 text-muted small fw-bold mb-2">
                  <Col xs={3} sm={2}>
                    Score Value
                  </Col>
                  <Col xs={7} sm={8}>
                    Criteria Description
                  </Col>
                  <Col xs={2} sm={2} className="text-center">
                    Action
                  </Col>
                </Row>

                {formData.scores.map((row, idx) => (
                  <Row key={idx} className="g-2 mb-2 align-items-center">
                    {/* Score Value Input */}
                    <Col xs={3} sm={2}>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        required
                        placeholder="0, 1, 2..."
                        value={row.score}
                        onChange={(e) => handleScoreChange(idx, "score", e.target.value)}
                        style={{ borderRadius: "6px", fontWeight: "bold" }}
                      />
                    </Col>

                    {/* Description Input */}
                    <Col xs={7} sm={8}>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Mild nausea with no vomiting"
                        value={row.description}
                        onChange={(e) => handleScoreChange(idx, "description", e.target.value)}
                        style={{ borderRadius: "6px" }}
                      />
                    </Col>

                    {/* Plus & Remove Action Buttons (Image 2) */}
                    <Col xs={2} sm={2} className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        {/* Plus button on last row */}
                        {idx === formData.scores.length - 1 && (
                          <Button
                            color="success"
                            size="sm"
                            type="button"
                            className="p-1"
                            style={{ borderRadius: "6px", backgroundColor: "#24695c", borderColor: "#24695c" }}
                            onClick={handleAddScoreRow}
                            title="Add row"
                          >
                            <Plus size={14} />
                          </Button>
                        )}

                        {/* Minus / Remove button */}
                        <Button
                          color="danger"
                          size="sm"
                          type="button"
                          className="p-1"
                          style={{ borderRadius: "6px" }}
                          onClick={() => handleRemoveScoreRow(idx)}
                          disabled={formData.scores.length <= 1}
                          title="Remove row"
                        >
                          <Minus size={14} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                ))}
              </div>
            </div>
          </ModalBody>

          {/* 4. Save Button (Image 2) */}
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
                getTranslation("Save / सहेजें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: Edit Assessment Parameter */}
      {/* ===================================================================== */}
      <Modal
        isOpen={editModalOpen}
        toggle={() => !isSubmitting && setEditModalOpen(false)}
        size="lg"
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
                {getTranslation("Edit Assessment Parameter / पैरामीटर संपादित करें", lang)}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="p-4">
            {/* Substance */}
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
                {substances.map((s) => (
                  <option key={s.id || s.sub_id} value={s.id || s.sub_id}>
                    {s.name}
                  </option>
                ))}
              </Input>
            </div>

            {/* Assessment Parameter */}
            <div className="mb-4">
              <Label className="fw-bold text-dark">
                {getTranslation("Assessment Parameter / मूल्यांकन पैरामीटर", lang)}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                value={formData.parameter_name}
                onChange={(e) => setFormData({ ...formData, parameter_name: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />
            </div>

            {/* Scores with [+] and [-] */}
            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label className="fw-bold text-dark mb-0">
                  {getTranslation("Score Values & Criteria / स्कोर एवं विवरण", lang)}
                </Label>
                <Button
                  color="success"
                  size="sm"
                  type="button"
                  onClick={handleAddScoreRow}
                  className="d-flex align-items-center gap-1 shadow-sm fw-bold px-2.5 py-1"
                  style={{ borderRadius: "6px", backgroundColor: "#24695c", borderColor: "#24695c" }}
                >
                  <Plus size={14} />
                  <span>{getTranslation("Add Row", lang)}</span>
                </Button>
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <Row className="g-2 text-muted small fw-bold mb-2">
                  <Col xs={3} sm={2}>
                    Score
                  </Col>
                  <Col xs={7} sm={8}>
                    Criteria Description
                  </Col>
                  <Col xs={2} sm={2} className="text-center">
                    Action
                  </Col>
                </Row>

                {formData.scores.map((row, idx) => (
                  <Row key={idx} className="g-2 mb-2 align-items-center">
                    <Col xs={3} sm={2}>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        required
                        value={row.score}
                        onChange={(e) => handleScoreChange(idx, "score", e.target.value)}
                        style={{ borderRadius: "6px", fontWeight: "bold" }}
                      />
                    </Col>
                    <Col xs={7} sm={8}>
                      <Input
                        type="text"
                        required
                        value={row.description}
                        onChange={(e) => handleScoreChange(idx, "description", e.target.value)}
                        style={{ borderRadius: "6px" }}
                      />
                    </Col>
                    <Col xs={2} sm={2} className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        {idx === formData.scores.length - 1 && (
                          <Button
                            color="success"
                            size="sm"
                            type="button"
                            className="p-1"
                            style={{ borderRadius: "6px", backgroundColor: "#24695c", borderColor: "#24695c" }}
                            onClick={handleAddScoreRow}
                            title="Add row"
                          >
                            <Plus size={14} />
                          </Button>
                        )}
                        <Button
                          color="danger"
                          size="sm"
                          type="button"
                          className="p-1"
                          style={{ borderRadius: "6px" }}
                          onClick={() => handleRemoveScoreRow(idx)}
                          disabled={formData.scores.length <= 1}
                          title="Remove row"
                        >
                          <Minus size={14} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                ))}
              </div>
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
                getTranslation("Update / अपडेट करें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: View Parameter Details */}
      {/* ===================================================================== */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(false)} size="lg" centered>
        <ModalHeader toggle={() => setViewModalOpen(false)} style={{ background: "#f8fafc" }}>
          <div className="d-flex align-items-center gap-2">
            <Eye size={18} color="#24695c" />
            <span className="fw-bold">
              {getTranslation("Parameter Breakdown / पैरामीटर विवरण", lang)}
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {currentParam && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <small className="text-muted d-block">Substance</small>
                  <span
                    className="badge mt-1 px-2.5 py-1 fw-bold fs-6"
                    style={{ backgroundColor: "#e6f4f1", color: "#24695c" }}
                  >
                    🌿 {currentParam.substance_name || "Alcohol"}
                  </span>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Parameter ID</small>
                  <span className="fw-bold">#{currentParam.id}</span>
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted d-block">Assessment Parameter Name</small>
                <h5 className="fw-bold text-dark mt-1">{currentParam.parameter_name}</h5>
              </div>

              <div>
                <h6 className="fw-bold text-dark mb-2">
                  {getTranslation("Configured Score Criteria (CIWA-Ar Adaptation)", lang)}
                </h6>
                <div className="table-responsive">
                  <Table bordered hover size="sm" className="align-middle">
                    <thead style={{ backgroundColor: "#f8fafc" }}>
                      <tr>
                        <th style={{ width: "90px" }}>Score</th>
                        <th style={{ width: "120px" }}>Severity</th>
                        <th>Criteria Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentParam.scores &&
                        currentParam.scores.map((sc, idx) => {
                          const severity = sc.severity || getScoreSeverity(sc.score);
                          return (
                            <tr key={idx}>
                              <td className="fw-bold text-center">
                                <span className="badge bg-light text-dark px-2.5 py-1 border">
                                  {sc.score}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    severity === "Severe"
                                      ? "bg-danger"
                                      : severity === "Moderate"
                                      ? "bg-warning text-dark"
                                      : severity === "Mild"
                                      ? "bg-info text-dark"
                                      : "bg-success"
                                  }`}
                                >
                                  {severity}
                                </span>
                              </td>
                              <td className="text-secondary">{sc.description}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </div>
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

export default DetoxParameters;
