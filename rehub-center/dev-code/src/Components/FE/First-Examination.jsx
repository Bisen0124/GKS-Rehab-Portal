import React, { useState } from "react";

const FirstExamination = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    doa: "",
    pulse: "",
    bp: "",
    spo2: "",
    location: "",
    addiction: "",
    intoxicated: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your submission logic here
  };

  return (
    <div className="container mt-4">
      <h3>First Evaluation Form</h3>
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              className="form-control"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              className="form-control"
              value={formData.weight}
              step="0.1"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="doa">Date of Admission</label>
            <input
              type="date"
              id="doa"
              name="doa"
              className="form-control"
              value={formData.doa}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-2">
            <label htmlFor="pulse">Pulse</label>
            <input
              type="number"
              id="pulse"
              name="pulse"
              className="form-control"
              value={formData.pulse}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="bp">BP</label>
            <input
              type="text"
              id="bp"
              name="bp"
              className="form-control"
              value={formData.bp}
              onChange={handleChange}
              placeholder="e.g. 120/80"
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="spo2">SpO2 (%)</label>
            <input
              type="number"
              id="spo2"
              name="spo2"
              className="form-control"
              value={formData.spo2}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-control"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="addiction">Addiction</label>
            <input
              type="text"
              id="addiction"
              name="addiction"
              className="form-control"
              value={formData.addiction}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            id="intoxicated"
            name="intoxicated"
            className="form-check-input checkbox_animated"
            checked={formData.intoxicated}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="intoxicated">
            Intoxicated at the time of admission
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          Submit Evaluation
        </button>
      </form>
    </div>
  );
};

export default FirstExamination;
