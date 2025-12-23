import React, { Fragment } from "react";
import { Card } from "reactstrap";
import { Btn, LI } from "../../../AbstractElements";
import { LogOut } from "react-feather";
import { Link, useNavigate } from "react-router-dom";

import Translated from "../../../Components/Translated";
import { useLang } from "../../../contexts/LangContext";
import { getTranslation } from "../../../utils/translator";

const LogoutClass = () => {

  const {lang} = useLang();
  
  const history = useNavigate();
  const Logout = () => {
    localStorage.removeItem("profileURL");
    localStorage.removeItem("token");

    localStorage.removeItem("auth0_profile");
    localStorage.removeItem("Name");
    localStorage.setItem("authenticated", false);
    history(`${process.env.PUBLIC_URL}/login`);
  };

  return (
    <Fragment>
      <LI attrLI={{ className: "onhover-dropdown p-0", onClick: Logout }}>
        <Btn attrBtn={{ as: Card.Header, className: "btn btn-primary-light logout-btn", color: "default" }}>
          <Link to={`${process.env.PUBLIC_URL}/login`}>
            <LogOut />
            {getTranslation("Log out/लॉग आउट",lang)}
          </Link>
        </Btn>
      </LI>
    </Fragment>
  );
};

export default LogoutClass;
