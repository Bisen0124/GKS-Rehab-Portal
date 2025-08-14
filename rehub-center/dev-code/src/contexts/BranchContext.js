import React, { createContext, useState, useContext } from "react";

// Create context
const BranchContext = createContext();

// Custom hook (for easy usage)
export const useBranch = () => useContext(BranchContext);

// Provider
export const BranchProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState("");

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
};
