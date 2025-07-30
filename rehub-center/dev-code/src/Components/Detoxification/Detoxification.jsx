import React, { useState } from "react";

const Detoxification = () => {
  const [formData, setFormData] = useState({
    remarks: "",
    detoxified: false,
    nextStep: "",
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Detoxification Data Submitted:", formData);
    // Add submission API logic here if needed
  };

  return (
    <div className="container mt-4">
      <h4>Detoxification Form</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="remarks">Remarks</label>
          <input
            type="text"
            id="remarks"
            name="remarks"
            className="form-control"
            placeholder="Add any remarks"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            id="detoxified"
            name="detoxified"
            className="form-check-input checkbox_animated"
            checked={formData.detoxified}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="detoxified">
            Detoxified
          </label>
        </div>

        {formData.detoxified && (
          <div className="mb-3">
            <label htmlFor="nextStep">Next Step</label>
            <input
              type="text"
              id="nextStep"
              name="nextStep"
              className="form-control"
              placeholder="Enter next step after detox"
              value={formData.nextStep}
              onChange={handleChange}
            />
          </div>
        )}

        <button type="submit" className="btn btn-success">
          Submit Detox Info
        </button>
      </form>
    </div>
  );
};

export default Detoxification;
