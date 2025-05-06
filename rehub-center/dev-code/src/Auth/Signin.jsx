import React, { Fragment, useState, useEffect } from "react";
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H4, P } from "../AbstractElements";
import { ForgotPassword, Password, RememberPassword, LoginTitle, LoginsubTitle, EmailPhone } from "../Constant";
import { toast } from "react-toastify";
import man from "../assets/images/dashboard/1.png";
import SocialAuth from "./Tabs/LoginTab/SocialAuth";
import { Outlet, Link } from "react-router-dom";

import rehabImg from '../assets/images/GKS/gks-logo1.webp';

const Login = ({ selected }) => {
  const [identifier, setIdentifier] = useState(""); // ✅ Updated state name
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglePassword, setTogglePassword] = useState(false);

  const [value, setValue] = useState(localStorage.getItem("profileURL") || man);
  const [name, setName] = useState(localStorage.getItem("Name") || "");

  //remember me
  const [rememberMe, setRememberMe] = useState(false);
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    const savedIdentifier = remembered ? localStorage.getItem("rememberedIdentifier") : "";

    setRememberMe(remembered);
    setIdentifier(savedIdentifier);
  }, []);

  useEffect(() => {
    localStorage.setItem("profileURL", value);
    localStorage.setItem("Name", name);
  }, [value, name]);

  const loginAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await fetch("https://gks-yjdc.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier,
          password: password,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // ✅ Store login data
        localStorage.setItem("login", true);
        localStorage.setItem("Authorization", data.token);
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("profileURL", man);
        localStorage.setItem("Name", data.user.name);
  
        // ✅ Remember Me
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberedIdentifier", identifier);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedIdentifier");
        }
  
        toast.success("Login successful!");
        setTimeout(() => {
          window.location.href = `${process.env.PUBLIC_URL}/dashboard/default`;
        }, 1000); // 1 second delay
        
      } else {
        // ✅ Handle invalid login cases based on API message
        const message = data.message?.toLowerCase();
  
        if (message?.includes("password")) {
          toast.error("Invalid Password!");
        } else if (message?.includes("identifier") || message?.includes("email") || message?.includes("phone")) {
          toast.error("Invalid Email or Phone!");
        } else {
          toast.error(data.message || "Invalid credentials!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Fragment>
      <div className="p-0 container-fluid">
        <Row>
          <Col className="col-12">
            <div className="login-card">
              <div className="login-main login-tab">
                <Form className="theme-form" onSubmit={loginAuth}>
                  <img src={rehabImg} alt="rehab logo" className="d-flex" />
                  <H4>{LoginTitle}</H4>
                  <P>{LoginsubTitle}</P>
                  <FormGroup>
                    <Label className="col-form-label">{EmailPhone}</Label>
                    <Input
                      className="form-control"
                      type="text"
                      required
                      autoComplete="current-email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="position-relative">
                    <Label className="col-form-label">{Password}</Label>
                    <Input
                      className="form-control"
                      type={togglePassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="show-hide" onClick={() => setTogglePassword(!togglePassword)}>
                      <span className={togglePassword ? "" : "show"}></span>
                    </div>
                  </FormGroup>
                  <div className="form-group mb-0">
                    <div className="checkbox ms-3 mb-3">
                      <Input id="checkbox1" type="checkbox" checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)} />
                      <Label className="text-muted" for="checkbox1">
                        {RememberPassword}
                      </Label>
                    </div>
                    <Link className="link" to={`${process.env.PUBLIC_URL}/pages/authentication/forget-pwd`}>
                      {ForgotPassword}
                    </Link>

                    <Btn attrBtn={{ color: "primary", className: "btn-block w-100", disabled: loading }}>
                      {loading ? "Logging in..." : "Login"}
                    </Btn>
                  </div>
                  <SocialAuth />
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Fragment>
  );
};

export default Login;
