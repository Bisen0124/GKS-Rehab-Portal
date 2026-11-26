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
  Edit2,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  FileText,
  Activity,
} from "react-feather";

import HeaderCard from "../Common/Component/HeaderCard";
import { ActionButtonsGroup, TableActionButton } from "../Common/Component/ActionButtons";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import {
  fetchActiveDetoxSubstances,
  createDetoxSubstance,
  updateDetoxSubstance,
  deleteDetoxSubstance,
} from "../../Services/detoxSubstanceService";

const DetoxSubstances = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  // Role detection
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";

  // Data State
  const [substances, setSubstances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Selected Substance for Edit / View
  const [currentSubstance, setCurrentSubstance] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Substances
  const loadSubstances = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
      const data = await fetchActiveDetoxSubstances(branchId, "");
      setSubstances(data || []);
    } catch (err) {
      toast.error(
        getTranslation("Failed to load substances / पदार्थ लोड करने में विफल", lang)
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch, lang]);

  useEffect(() => {
    loadSubstances();
  }, [loadSubstances]);

  // Filtered List
  const filteredSubstances = useMemo(() => {
    if (!searchTerm.trim()) return substances;
    const q = searchTerm.toLowerCase();
    return substances.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        String(s.id).includes(q)
    );
  }, [substances, searchTerm]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (sub) => {
    setCurrentSubstance(sub);
    setFormData({
      name: sub.name || "",
      description: sub.description || "",
      isActive: sub.isActive !== false,
    });
    setEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (sub) => {
    setCurrentSubstance(sub);
    setViewModalOpen(true);
  };

  // Handle Create Substance
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning(
        getTranslation("Substance name is required / पदार्थ का नाम आवश्यक है", lang)
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
      await createDetoxSubstance(
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
        branchId
      );

      toast.success(
        getTranslation("Substance created successfully / पदार्थ सफलतापूर्वक जोड़ा गया", lang)
      );
      setCreateModalOpen(false);
      loadSubstances();
    } catch (err) {
      toast.error(
        err.message ||
          getTranslation("Failed to create substance / पदार्थ बनाने में विफल", lang)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Substance
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning(
        getTranslation("Substance name is required / पदार्थ का नाम आवश्यक है", lang)
      );
      return;
    }

    if (!currentSubstance) return;

    setIsSubmitting(true);
    try {
      const branchId = isSuperAdmin ? selectedBranch || 1 : selectedBranch;
      await updateDetoxSubstance(
        currentSubstance.id,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        },
        branchId
      );

      toast.success(
        getTranslation("Substance updated successfully / पदार्थ सफलतापूर्वक अपडेट किया गया", lang)
      );
      setEditModalOpen(false);
      loadSubstances();
    } catch (err) {
      toast.error(
        err.message ||
          getTranslation("Failed to update substance / पदार्थ अपडेट करने में विफल", lang)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Substance
  const handleDelete = (sub) => {
    Swal.fire({
      title: getTranslation("Are you sure? / क्या आप निश्चित हैं?", lang),
      text: `${getTranslation("Delete substance / पदार्थ हटाएं", lang)} "${sub.name}"?`,
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
          await deleteDetoxSubstance(sub.id, branchId);
          toast.success(
            getTranslation("Substance deleted successfully / पदार्थ हटा दिया गया", lang)
          );
          loadSubstances();
        } catch (err) {
          toast.error(
            err.message ||
              getTranslation(
                "Cannot delete: substance has active scoring bands or assessments / नहीं हटा सकते: सक्रिय स्कोरिंग बैंड मौजूद हैं",
                lang
              )
          );
        }
      }
    });
  };

  return (
    <Container fluid={true} className="p-3 p-md-4">
      {/* Page Header */}
      <HeaderCard
        title={getTranslation(
          "Detoxification Substance Master / डिटॉक्स पदार्थ मास्टर",
          lang
        )}
      />

      {/* Top Controls Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Activity size={20} color="#24695c" />
            <span>{getTranslation("Substances / पदार्थ", lang)}</span>
            <Badge color="primary" pill className="ms-1" style={{ backgroundColor: "#24695c" }}>
              {substances.length}
            </Badge>
          </h5>
          <small className="text-muted">
            {getTranslation(
              "Substances configured here auto-populate in the Detoxification (CIWA-Ar) assessment form.",
              lang
            )}
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            color="primary"
            className="d-flex align-items-center py-2 px-3 shadow-sm fw-bold"
            style={{ borderRadius: "8px", backgroundColor: "#24695c", borderColor: "#24695c" }}
            onClick={openCreateModal}
          >
            <Plus size={16} className="me-1.5" />
            <span>{getTranslation("Add Substance / नया पदार्थ जोड़ें", lang)}</span>
          </Button>

          <Button
            color="light"
            className="border py-2 px-2.5 shadow-sm text-muted"
            style={{ borderRadius: "8px" }}
            onClick={loadSubstances}
            title={getTranslation("Refresh / रीफ़्रेश करें", lang)}
          >
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Search & Filter Card */}
      <Card className="border-0 shadow-sm rounded-3 mb-4 bg-white">
        <CardBody className="py-2.5 px-3">
          <Row className="g-2 align-items-center">
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
                    "Search by substance name, description, ID... / खोजें...",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 ps-0"
                  style={{ borderRadius: "0 8px 8px 0" }}
                />
              </InputGroup>
            </Col>
            <Col md={6} sm={12} className="text-md-end text-muted small">
              {filteredSubstances.length}{" "}
              {getTranslation("substances found / पदार्थ पाए गए", lang)}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Substances Table (as requested in handwritten diagram) */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2 text-muted">
                {getTranslation("Loading substances... / लोड हो रहा है...", lang)}
              </div>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={40} className="text-muted mb-2" />
              <h6 className="text-muted fw-bold">
                {getTranslation("No Substances Found / कोई पदार्थ नहीं मिला", lang)}
              </h6>
              <p className="text-muted small mb-3">
                {getTranslation(
                  "Click '+ Add Substance' above to register a new detoxification substance.",
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
                {getTranslation("Add Substance / पदार्थ जोड़ें", lang)}
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
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Name / पदार्थ का नाम", lang)}
                    </th>
                    <th style={{ padding: "14px 16px", color: "#475569" }}>
                      {getTranslation("Description / विवरण", lang)}
                    </th>
                    <th
                      style={{
                        width: "180px",
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
                  {filteredSubstances.map((sub, index) => (
                    <tr key={sub.id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* ID */}
                      <td className="fw-bold text-muted ps-3">
                        <span
                          className="badge bg-light text-dark px-2 py-1"
                          style={{ fontSize: "12px", border: "1px solid #e2e8f0" }}
                        >
                          {sub.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td>
                        <span className="fw-bold text-dark" style={{ fontSize: "14.5px" }}>
                          {sub.name}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="text-muted" style={{ fontSize: "13.5px" }}>
                        {sub.description || "—"}
                      </td>

                      {/* Action Buttons: [E] Edit, [V] View, [D] Delete */}
                      <td style={{ textAlign: "center" }}>
                        <ActionButtonsGroup>
                          <TableActionButton
                            type="view"
                            title={getTranslation("View Details / विवरण देखें", lang)}
                            onClick={() => openViewModal(sub)}
                          />
                          <TableActionButton
                            type="edit"
                            title={getTranslation("Edit Substance / संपादित करें", lang)}
                            onClick={() => openEditModal(sub)}
                          />
                          <TableActionButton
                            type="delete"
                            title={getTranslation("Delete Substance / हटाएं", lang)}
                            onClick={() => handleDelete(sub)}
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
      {/* MODAL 1: Create Substance */}
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
                {getTranslation("Add Detoxification Substance / नया पदार्थ जोड़ें", lang)}
              </span>
            </div>
          </ModalHeader>
          <ModalBody className="p-4">
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Substance Name / पदार्थ का नाम", lang)}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. Alcohol, Drugs, Nausea, Tremors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />
              <small className="text-muted">
                {getTranslation(
                  "Must be unique. This substance will immediately appear in the Detoxification form dropdown.",
                  lang
                )}
              </small>
            </div>

            <div className="mb-2">
              <Label className="fw-bold text-dark">
                {getTranslation("Description / विवरण (वैकल्पिक)", lang)}
              </Label>
              <Input
                type="textarea"
                rows="3"
                placeholder="e.g. Alcohol withdrawal syndrome and monitoring"
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
                getTranslation("Save Substance / पदार्थ सहेजें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: Edit Substance */}
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
                {getTranslation("Edit Substance / पदार्थ संपादित करें", lang)}
              </span>
            </div>
          </ModalHeader>
          <ModalBody className="p-4">
            <div className="mb-3">
              <Label className="fw-bold text-dark">
                {getTranslation("Substance Name / पदार्थ का नाम", lang)}{" "}
                <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ borderRadius: "8px", height: "42px" }}
              />
            </div>

            <div className="mb-3">
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

            <div className="form-check form-switch mt-2">
              <Input
                className="form-check-input"
                type="checkbox"
                id="editSubstanceActiveSwitch"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label
                className="form-check-label fw-bold"
                htmlFor="editSubstanceActiveSwitch"
              >
                {formData.isActive
                  ? getTranslation("Active / सक्रिय", lang)
                  : getTranslation("Inactive / निष्क्रिय", lang)}
              </Label>
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
                getTranslation("Update Substance / पदार्थ अपडेट करें", lang)
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: View Substance Details */}
      {/* ===================================================================== */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(false)} centered>
        <ModalHeader toggle={() => setViewModalOpen(false)} style={{ background: "#f8fafc" }}>
          <div className="d-flex align-items-center gap-2">
            <Eye size={18} color="#24695c" />
            <span className="fw-bold">
              {getTranslation("Substance Details / पदार्थ विवरण", lang)}
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {currentSubstance && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <small className="text-muted d-block">Substance ID</small>
                  <span className="fw-bold fs-6">#{currentSubstance.id}</span>
                </div>
                <div>
                  <small className="text-muted d-block">Status</small>
                  {currentSubstance.isActive !== false ? (
                    <Badge color="success" pill>
                      Active
                    </Badge>
                  ) : (
                    <Badge color="danger" pill>
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">Substance Name</small>
                <h6 className="fw-bold text-dark mt-1">{currentSubstance.name}</h6>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block">Description</small>
                <p className="text-secondary mt-1 mb-0" style={{ fontSize: "14px" }}>
                  {currentSubstance.description || "No description provided."}
                </p>
              </div>

              {currentSubstance.active_scoring_count !== undefined && (
                <div className="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Configured CIWA Scoring Bands</span>
                  <Badge color="primary" pill style={{ backgroundColor: "#24695c" }}>
                    {currentSubstance.active_scoring_count} bands
                  </Badge>
                </div>
              )}
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

export default DetoxSubstances;
