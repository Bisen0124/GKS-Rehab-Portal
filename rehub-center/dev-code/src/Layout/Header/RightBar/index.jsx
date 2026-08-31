import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Maximize } from 'react-feather';
import { LI, UL } from '../../../AbstractElements';
import CustomizerContext from '../../../_helper/Customizer';
import LogoutClass from './Logout';
import { useBranch } from '../../../contexts/BranchContext';

import LanguageSwitcher from '../../../Components/LanguageSwitcher';

import ApiTranslated from '../../../Components/ApiTranslated';

const Rightbar = () => {
  const { sidebarResponsive } = useContext(CustomizerContext);

  // ✅ Global branch state from context
  const { selectedBranch, setSelectedBranch } = useBranch();

  // ✅ Local state for branches only
  const [branches, setBranches] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRoleType, setUserRoleType] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('Name') || '');
    setUserRoleType(localStorage.getItem('isRoleType') || '');

    const storedBranches = JSON.parse(localStorage.getItem("Branch_Detail")) || [];
    setBranches(storedBranches);

    // Optional: set initial branch if not already selected
    if (!selectedBranch && storedBranches.length > 0) {
      setSelectedBranch(storedBranches[0].Branch_id);
    }
  }, []);

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setSelectedBranch(value);
    localStorage.setItem("Selected_Branch_ID", value); // Optional: for persistence
  };

  const isSuperAdmin = userRoleType === "SuperAdmin";

  const toggleFullScreen = () => {
    if (
      !document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement
    ) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  return (
    <Fragment>
     
      <div className="nav-right col pull-right right-menu p-0">
        <UL attrUL={{ className: `simple-list d-flex flex-row nav-menus gap-4 align-items-center ${sidebarResponsive ? 'open' : ''}` }}>
         
         <LanguageSwitcher/>

         <LI attrLI={{ className: 'd-flex align-items-center' }}>
           <button
             type="button"
             onClick={toggleFullScreen}
             title="Toggle Fullscreen / पूर्ण स्क्रीन"
             style={{
               background: "#f1f5f9",
               border: "1.5px solid #cbd5e1",
               borderRadius: "8px",
               padding: "6px 10px",
               display: "inline-flex",
               alignItems: "center",
               justifyContent: "center",
               cursor: "pointer",
               color: "#24695c",
               transition: "all 0.2s ease",
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = "#e2e8f0";
               e.currentTarget.style.borderColor = "#24695c";
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = "#f1f5f9";
               e.currentTarget.style.borderColor = "#cbd5e1";
             }}
           >
             <Maximize size={16} />
           </button>
         </LI>

         <h6 style={{ marginBottom: "0px", fontWeight: "600", color: "#1e293b" }}>
           <ApiTranslated text={userName} />
         </h6>

          <div
            className="alert alert-info py-2 px-3 mb-0 d-inline-block superadmin-badge"
            role="alert"
            style={{
              backgroundColor: "rgb(214, 98, 44)",
              border: "1px solid rgb(217, 97, 54)",
              borderRadius: "8px",
            }}
          >
            <h6 className="mb-0 text-white" style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px" }}>{userRoleType}</h6>
          </div>

          {/* ✅ Branch Selector for SuperAdmin */}
          {isSuperAdmin && branches.length > 0 && (
            <div className="form-group mb-0 mx-2">
              <select
                className="form-select text-uppercase"
                value={selectedBranch}
                onChange={handleBranchChange}
                style={{
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  height: "38px",
                }}
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.Branch_id} value={branch.Branch_id}>
                    {branch.Branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <LogoutClass />
        </UL>
      </div>
    </Fragment>
  );
};

export default Rightbar;
