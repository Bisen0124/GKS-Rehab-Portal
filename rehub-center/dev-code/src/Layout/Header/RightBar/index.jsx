import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Maximize } from 'react-feather';
import { LI, UL } from '../../../AbstractElements';
import CustomizerContext from '../../../_helper/Customizer';
import LogoutClass from './Logout';
import { useBranch } from '../../../contexts/BranchContext';

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

  return (
    <Fragment>
      <div className="nav-right col pull-right right-menu p-0">
        <UL attrUL={{ className: `simple-list d-flex flex-row nav-menus gap-5 align-center ${sidebarResponsive ? 'open' : ''}` }}>
          <h6 style={{ marginBottom: '0px' }}>{userName}</h6>

          <div
            className="alert alert-info py-2 px-3 mb-0 d-inline-block"
            role="alert"
            style={{
              backgroundColor: "rgb(214, 98, 44)",
              border: "1px solid rgb(217, 97, 54)"
            }}
          >
            <h6 className="mb-0 text-white">{userRoleType}</h6>
          </div>

          {/* ✅ Branch Selector for SuperAdmin */}
          {isSuperAdmin && branches.length > 0 && (
            <div className="form-group mb-0 mx-2">
              <select
                className="form-select text-uppercase"
                value={selectedBranch}
                onChange={handleBranchChange}
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
