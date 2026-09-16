import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
  Badge,
  Spinner,
  Row,
  Col,
  Card,
  CardBody,
} from "reactstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useLang } from "../../contexts/LangContext";
import { useBranch } from "../../contexts/BranchContext";
import { getTranslation } from "../../utils/translator";

const BASE_URL = "https://gks-yjdc.onrender.com";

const WardManagementModal = ({ isOpen, toggle, branchId: propBranchId, onWardsUpdated }) => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const branchId =
    propBranchId ||
    selectedBranch?.branch_id ||
    selectedBranch?.id ||
    selectedBranch ||
    "";

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wards, setWards] = useState([]);

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWard, setNewWard] = useState({
    ward_name: "",
    price_rate: "",
    description: "",
  });

  // Edit State
  const [editingWardId, setEditingWardId] = useState(null);
  const [editWard, setEditWard] = useState({
    ward_name: "",
    price_rate: "",
    description: "",
  });

  // Fetch all wards (including inactive for admin management)
  const fetchWards = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const token = localStorage.getItem("Authorization");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `${token}`,
      "x-target-branch": String(branchId),
    };

    try {
      // Try /api/wards/all first, fallback to /api/wards
      let res = await fetch(`${BASE_URL}/api/wards/all?branch_id=${branchId}`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        res = await fetch(`${BASE_URL}/api/wards?branch_id=${branchId}`, {
          method: "GET",
          headers,
        });
      }

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.wards)
          ? data.wards
          : Array.isArray(data)
          ? data
          : [];
        setWards(list);
      } else {
        toast.error(getTranslation("Failed to load wards / वार्ड लोड करने में विफल", lang));
      }
    } catch (err) {
      console.error("Error fetching wards:", err);
      toast.error(getTranslation("Error fetching wards / वार्ड डेटा प्राप्त करने में त्रुटि", lang));
    } finally {
      setLoading(false);
    }
  }, [branchId, lang]);

  useEffect(() => {
    if (isOpen) {
      fetchWards();
      setShowAddForm(false);
      setEditingWardId(null);
    }
  }, [isOpen, fetchWards]);

  // Handle Add Ward
  const handleCreateWard = async (e) => {
    e.preventDefault();
    if (!newWard.ward_name.trim()) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Required Field / आवश्यक फ़ील्ड", lang),
        text: getTranslation("Please enter Ward Name / कृपया वार्ड का नाम दर्ज करें", lang),
      });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("Authorization");
    const payload = {
      ward_name: newWard.ward_name.trim(),
      price_rate: newWard.price_rate ? parseFloat(newWard.price_rate) : 0,
      description: newWard.description.trim(),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/wards?branch_id=${branchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          "x-target-branch": String(branchId),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Success! / सफल!", lang),
          text: getTranslation("Ward created successfully / वार्ड सफलतापूर्वक बनाया गया", lang),
          timer: 1600,
          showConfirmButton: false,
        });
        setNewWard({ ward_name: "", price_rate: "", description: "" });
        setShowAddForm(false);
        fetchWards();
        if (onWardsUpdated) onWardsUpdated();
      } else {
        const errorMsg = data?.message || data?.error || getTranslation("Failed to create ward / वार्ड बनाने में विफल", lang);
        Swal.fire({
          icon: "error",
          title: getTranslation("Error / त्रुटि", lang),
          text: errorMsg,
        });
      }
    } catch (err) {
      console.error("Error creating ward:", err);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error / त्रुटि", lang),
        text: getTranslation("Network error while creating ward / वार्ड बनाते समय नेटवर्क त्रुटि", lang),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Start Edit Mode
  const startEdit = (ward) => {
    setEditingWardId(ward.ward_type_id || ward.id);
    setEditWard({
      ward_name: ward.ward_name || ward.name || "",
      price_rate: ward.price_rate !== undefined ? ward.price_rate : "",
      description: ward.description || "",
    });
  };

  // Handle Update Ward
  const handleUpdateWard = async (wardId) => {
    if (!editWard.ward_name.trim()) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Required Field / आवश्यक फ़ील्ड", lang),
        text: getTranslation("Please enter Ward Name / कृपया वार्ड का नाम दर्ज करें", lang),
      });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("Authorization");
    const payload = {
      ward_name: editWard.ward_name.trim(),
      price_rate: editWard.price_rate ? parseFloat(editWard.price_rate) : 0,
      description: editWard.description.trim(),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/wards/${wardId}?branch_id=${branchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          "x-target-branch": String(branchId),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Updated! / अद्यतन किया गया!", lang),
          text: getTranslation("Ward updated successfully / वार्ड सफलतापूर्वक अद्यतन किया गया", lang),
          timer: 1600,
          showConfirmButton: false,
        });
        setEditingWardId(null);
        fetchWards();
        if (onWardsUpdated) onWardsUpdated();
      } else {
        const errorMsg = data?.message || data?.error || getTranslation("Failed to update ward / वार्ड अपडेट करने में विफल", lang);
        Swal.fire({
          icon: "error",
          title: getTranslation("Error / त्रुटि", lang),
          text: errorMsg,
        });
      }
    } catch (err) {
      console.error("Error updating ward:", err);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error / त्रुटि", lang),
        text: getTranslation("Network error while updating ward / वार्ड अपडेट करते समय नेटवर्क त्रुटि", lang),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Soft Delete Ward
  const handleDeleteWard = async (ward) => {
    const wardId = ward.ward_type_id || ward.id;
    const wardName = ward.ward_name || ward.name || "this ward";

    const confirm = await Swal.fire({
      title: getTranslation("Are you sure? / क्या आप सुनिश्चित हैं?", lang),
      text: getTranslation(
        `Do you want to delete "${wardName}"? This will soft-delete (deactivate) the ward so it will no longer be available for new registrations. / क्या आप "${wardName}" को हटाना चाहते हैं? यह वार्ड को निष्क्रिय कर देगा ताकि यह नए पंजीकरण के लिए उपलब्ध न हो।`,
        lang
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    const token = localStorage.getItem("Authorization");

    try {
      const res = await fetch(`${BASE_URL}/api/wards/${wardId}?branch_id=${branchId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          "x-target-branch": String(branchId),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Deleted! / हटा दिया गया!", lang),
          text: getTranslation("Ward deleted (deactivated) successfully / वार्ड सफलतापूर्वक हटा दिया गया", lang),
          timer: 1600,
          showConfirmButton: false,
        });
        fetchWards();
        if (onWardsUpdated) onWardsUpdated();
      } else {
        const errorMsg = data?.message || data?.error || getTranslation("Cannot delete ward. Active patients may be admitted in this ward. / वार्ड हटाया नहीं जा सकता। सक्रिय मरीज़ इस वार्ड में भर्ती हो सकते हैं।", lang);
        Swal.fire({
          icon: "error",
          title: getTranslation("Cannot Delete / हटाया नहीं जा सकता", lang),
          text: errorMsg,
        });
      }
    } catch (err) {
      console.error("Error deleting ward:", err);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error / त्रुटि", lang),
        text: getTranslation("Network error while deleting ward / वार्ड हटाते समय नेटवर्क त्रुटि", lang),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reactivate Ward
  const handleReactivateWard = async (wardId) => {
    setSubmitting(true);
    const token = localStorage.getItem("Authorization");

    try {
      const res = await fetch(`${BASE_URL}/api/wards/${wardId}?branch_id=${branchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          "x-target-branch": String(branchId),
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Reactivated! / पुनः सक्रिय!", lang),
          text: getTranslation("Ward reactivated successfully / वार्ड सफलतापूर्वक पुनः सक्रिय किया गया", lang),
          timer: 1600,
          showConfirmButton: false,
        });
        fetchWards();
        if (onWardsUpdated) onWardsUpdated();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || "Failed to reactivate ward");
      }
    } catch (err) {
      console.error("Error reactivating ward:", err);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" backdrop="static" centered>
      <ModalHeader toggle={toggle} className="bg-light py-3">
        <div className="d-flex align-items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#24695c" }}
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span className="fw-bold" style={{ color: "#0f172a" }}>
            {getTranslation("Ward Types Management / वार्ड प्रकार प्रबंधन", lang)}
          </span>
        </div>
      </ModalHeader>

      <ModalBody className="p-4" style={{ maxHeight: "72vh", overflowY: "auto" }}>
        {/* Top Action Bar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="text-muted small">
            {getTranslation("Manage patient admission ward categories and daily tariff rates./मरीज़ प्रवेश वार्ड श्रेणियों और दैनिक शुल्क दरों का प्रबंधन करें।", lang)}
          </div>
          <Button
            size="sm"
            color={showAddForm ? "secondary" : "primary"}
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: showAddForm ? "#64748b" : "#24695c",
              borderColor: showAddForm ? "#64748b" : "#24695c",
              fontWeight: 600,
              borderRadius: "8px",
            }}
          >
            {showAddForm
              ? getTranslation("Cancel / रद्द करें", lang)
              : `+ ${getTranslation("Add New Ward / नया वार्ड जोड़ें", lang)}`}
          </Button>
        </div>

        {/* Add Ward Form */}
        {showAddForm && (
          <Card className="border shadow-sm mb-4" style={{ borderRadius: "12px", backgroundColor: "#f8fafc" }}>
            <CardBody className="p-3">
              <h6 className="fw-bold mb-3 text-dark">
                {getTranslation("Create New Ward Type / नया वार्ड प्रकार बनाएँ", lang)}
              </h6>
              <Form onSubmit={handleCreateWard}>
                <Row className="g-2">
                  <Col md="5" sm="12">
                    <FormGroup className="mb-2">
                      <Label className="fw-semibold small text-dark mb-1">
                        {getTranslation("Ward Name / वार्ड का नाम", lang)} <span className="text-danger">*</span>
                      </Label>
                      <Input
                        bsSize="sm"
                        type="text"
                        placeholder={getTranslation("e.g. Deluxe AC, ICU, General.../उदा. डीलक्स एसी...", lang)}
                        value={newWard.ward_name}
                        onChange={(e) => setNewWard({ ...newWard, ward_name: e.target.value })}
                        required
                        style={{ borderRadius: "6px" }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3" sm="6">
                    <FormGroup className="mb-2">
                      <Label className="fw-semibold small text-dark mb-1">
                        {getTranslation("Price Rate (₹) / दर (₹)", lang)}
                      </Label>
                      <Input
                        bsSize="sm"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 2500"
                        value={newWard.price_rate}
                        onChange={(e) => setNewWard({ ...newWard, price_rate: e.target.value })}
                        style={{ borderRadius: "6px" }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4" sm="6">
                    <FormGroup className="mb-2">
                      <Label className="fw-semibold small text-dark mb-1">
                        {getTranslation("Description / विवरण", lang)}
                      </Label>
                      <Input
                        bsSize="sm"
                        type="text"
                        placeholder={getTranslation("Optional remarks/वैकल्पिक विवरण", lang)}
                        value={newWard.description}
                        onChange={(e) => setNewWard({ ...newWard, description: e.target.value })}
                        style={{ borderRadius: "6px" }}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-2">
                  <Button
                    size="sm"
                    color="light"
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{ borderRadius: "6px" }}
                  >
                    {getTranslation("Cancel / रद्द करें", lang)}
                  </Button>
                  <Button
                    size="sm"
                    color="success"
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: "#24695c", borderColor: "#24695c", borderRadius: "6px", fontWeight: 600 }}
                  >
                    {submitting ? (
                      <Spinner size="sm" />
                    ) : (
                      getTranslation("Save Ward / वार्ड सहेजें", lang)
                    )}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {/* Wards List Table */}
        {loading ? (
          <div className="py-5 text-center text-muted">
            <Spinner color="primary" />
            <div className="mt-2 small">{getTranslation("Loading ward types... / वार्ड प्रकार लोड हो रहे हैं...", lang)}</div>
          </div>
        ) : wards.length === 0 ? (
          <div className="py-5 text-center text-muted small border rounded-3 bg-light">
            {getTranslation("No ward types configured yet. Click '+ Add New Ward' to create one. / अभी तक कोई वार्ड प्रकार कॉन्फ़िगर नहीं किया गया है।", lang)}
          </div>
        ) : (
          <div className="table-responsive border rounded-3">
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>{getTranslation("Ward Name / वार्ड का नाम", lang)}</th>
                  <th style={{ width: "130px" }}>{getTranslation("Price Rate / दर", lang)}</th>
                  <th>{getTranslation("Description / विवरण", lang)}</th>
                  <th style={{ width: "100px" }} className="text-center">{getTranslation("Status / स्थिति", lang)}</th>
                  <th style={{ width: "110px" }} className="text-center">{getTranslation("Actions / क्रियाएँ", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {wards.map((ward, idx) => {
                  const wardId = ward.ward_type_id || ward.id;
                  const isEditing = editingWardId === wardId;
                  const isActive = ward.isActive !== false && ward.isActive !== 0;

                  if (isEditing) {
                    return (
                      <tr key={wardId} style={{ backgroundColor: "#f0fdf4" }}>
                        <td className="text-muted small">{idx + 1}</td>
                        <td>
                          <Input
                            bsSize="sm"
                            type="text"
                            value={editWard.ward_name}
                            onChange={(e) => setEditWard({ ...editWard, ward_name: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <Input
                            bsSize="sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editWard.price_rate}
                            onChange={(e) => setEditWard({ ...editWard, price_rate: e.target.value })}
                          />
                        </td>
                        <td>
                          <Input
                            bsSize="sm"
                            type="text"
                            value={editWard.description}
                            onChange={(e) => setEditWard({ ...editWard, description: e.target.value })}
                          />
                        </td>
                        <td className="text-center">
                          <Badge color={isActive ? "success" : "secondary"} pill>
                            {isActive ? getTranslation("Active / सक्रिय", lang) : getTranslation("Inactive / निष्क्रिय", lang)}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <Button
                              size="sm"
                              color="success"
                              className="px-2 py-0.5"
                              title="Save"
                              disabled={submitting}
                              onClick={() => handleUpdateWard(wardId)}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              color="light"
                              className="px-2 py-0.5 border"
                              title="Cancel"
                              onClick={() => setEditingWardId(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={wardId} style={{ opacity: isActive ? 1 : 0.65 }}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <span className="fw-semibold text-dark">{ward.ward_name || ward.name}</span>
                      </td>
                      <td>
                        {ward.price_rate !== undefined && ward.price_rate !== null ? (
                          <span className="fw-semibold text-success">₹{Number(ward.price_rate).toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: "220px" }}>
                          {ward.description || "-"}
                        </span>
                      </td>
                      <td className="text-center">
                        {isActive ? (
                          <Badge color="success" pill style={{ fontSize: "11px", padding: "3px 8px" }}>
                            {getTranslation("Active / सक्रिय", lang)}
                          </Badge>
                        ) : (
                          <Badge color="secondary" pill style={{ fontSize: "11px", padding: "3px 8px" }}>
                            {getTranslation("Inactive / निष्क्रिय", lang)}
                          </Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          {/* Edit Icon */}
                          <span
                            onClick={() => startEdit(ward)}
                            style={{ cursor: "pointer" }}
                            title={getTranslation("Edit Ward / संपादित करें", lang)}
                          >
                            <svg
                              style={{ color: "#16a34a" }}
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </span>

                          {/* Delete (Soft delete) or Reactivate */}
                          {isActive ? (
                            <span
                              onClick={() => handleDeleteWard(ward)}
                              style={{ cursor: "pointer" }}
                              title={getTranslation("Soft Delete / निष्क्रिय करें", lang)}
                            >
                              <svg
                                style={{ color: "#dc2626" }}
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </span>
                          ) : (
                            <span
                              onClick={() => handleReactivateWard(wardId)}
                              style={{ cursor: "pointer", color: "#2563eb" }}
                              title={getTranslation("Reactivate / पुनः सक्रिय करें", lang)}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M23 4v6h-6"></path>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="bg-light py-2">
        <Button color="secondary" size="sm" onClick={toggle} style={{ borderRadius: "8px" }}>
          {getTranslation("Close / बंद करें", lang)}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default WardManagementModal;
