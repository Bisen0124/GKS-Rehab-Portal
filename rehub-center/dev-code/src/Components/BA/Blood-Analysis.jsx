import React, { useState } from "react";

const BloodAnalysis = () => {
  const [formData, setFormData] = useState({
    packageName: "",
    transactionId: "",
    sampleCollected: false,
    reportFile: null,
    remarks: "",
    severity: "Normal",
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Blood Analysis Data Submitted:", formData);
    // Add your API POST logic here if needed
  };

  return (
    <div className="container mt-4">
      <h4>Blood Analysis Form</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="packageName">Package Selection</label>
          <input
            type="text"
            id="packageName"
            name="packageName"
            className="form-control"
            placeholder="Enter package name"
            value={formData.packageName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="transactionId">Transaction ID</label>
          <input
            type="text"
            id="transactionId"
            name="transactionId"
            className="form-control"
            placeholder="Enter transaction ID"
            value={formData.transactionId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            id="sampleCollected"
            name="sampleCollected"
            className="form-check-input checkbox_animated"
            checked={formData.sampleCollected}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="sampleCollected">
            Sample Collected
          </label>
        </div>

        <div className="mb-3">
          <label htmlFor="reportFile">Upload Report (PDF/Image)</label>
          <input
            type="file"
            id="reportFile"
            name="reportFile"
            className="form-control"
            accept=".pdf,.jpg,.png,.jpeg"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="remarks">Remarks</label>
          <input
            type="text"
            id="remarks"
            name="remarks"
            className="form-control"
            placeholder="Add any additional remarks"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="severity">Severity</label>
          <input
            type="text"
            id="severity"
            name="severity"
            className="form-control"
            list="severityList"
            value={formData.severity}
            onChange={handleChange}
          />
          <datalist id="severityList">
            <option value="Normal" />
            <option value="Moderate" />
            <option value="Severe" />
          </datalist>
        </div>

        <button type="submit" className="btn btn-primary">
          Submit Blood Analysis
        </button>
      </form>
    </div>
  );
};

export default BloodAnalysis;

