import React, { useState, useEffect } from "react";
import { Container } from "reactstrap";
import HeaderCard from "../Common/Component/HeaderCard";
import BillingSettings from "../Settings/BillingSettings";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { fetchAllBranches } from "../../Services/adminManagementService";

const BillItemTypes = () => {
  const { selectedBranch } = useBranch();
  const { lang } = useLang();
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";
  const branchDetail = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  const currentBranchName = branchDetail[0]?.Branch_name || "";
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetchAllBranches()
      .then((list) => {
        if (isMounted && Array.isArray(list)) {
          setBranches(list);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container fluid={true} className="p-3 p-md-4">
      <HeaderCard
        title={getTranslation(
          "Bill Item Types / बिल आइटम प्रकार",
          lang
        )}
      />
      <BillingSettings
        isSuperAdmin={isSuperAdmin}
        branches={branches}
        selectedBranch={selectedBranch}
        currentBranchName={currentBranchName}
        lang={lang}
        viewMode="types"
      />
    </Container>
  );
};

export default BillItemTypes;
