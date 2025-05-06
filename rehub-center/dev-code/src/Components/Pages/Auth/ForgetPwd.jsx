import React, { Fragment, useState } from "react";
import { Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H4, H6, P } from "../../../AbstractElements";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const ForgetPwd = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState(["", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [serverOtp, setServerOtp] = useState("");

  

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      toast.error("Please enter your Email or Phone");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://gks-yjdc.onrender.com/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "OTP sent successfully!");

        // Capture server OTP if available (only for testing/dev)
  if (data.otp) {
    setServerOtp(data.otp); // assuming API sends it back (for dev only)
    console.log("OTP sent:", data.otp); // for dev debugging only
  }
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const enteredOtp = otp.map((o) => o.trim()).join("");

    if (!enteredOtp || enteredOtp.length < 4) {
      toast.error("Please enter a valid OTP.");
      return;
    }

    // Dev-only: Compare with OTP received from backend
    if (serverOtp && enteredOtp !== serverOtp) {
      toast.error("Entered OTP is incorrect.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://gks-yjdc.onrender.com/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone,
          otp: enteredOtp,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Password reset successful!");
      
        setTimeout(() => {
          navigate(`${process.env.PUBLIC_URL}/login`); // or your login route
        }, 10000); // wait 1 second
      } if(serverOtp!== enteredOtp) {
        toast.error(data.message || "Entered OPT is not correct");
      }
    } catch (error) {
      toast.error("Reset password error:", error); 
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

  };

  return (
    <Fragment>
      <section>
        <Container className="p-0" fluid={true}>
          <Row className="m-0">
            <Col className="p-0">
              <div className="login-card">
                <div className="login-main">
                  <Form
                    className="theme-form login-form p-0 w-100"
                    onSubmit={step === 1 ? handleSendOTP : handleResetPassword}
                  >
                    <H4 attrH4={{ className: "mb-3" }}>Reset Your Password</H4>

                    {step === 1 && (
                      <FormGroup>
                        <Label>Enter Your Email or Phone Number</Label>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder="Enter email or phone"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                        />
                        <Btn
                          attrBtn={{
                            className: "btn-block mt-4 w-100 mb-4",
                            color: "primary",
                            type: "submit",
                          }}
                        >
                          {loading ? "Sending..." : "Send OTP"}
                        </Btn>
                      </FormGroup>
                    )}

                    {step === 2 && (
                      <>
                        <FormGroup>
                          <Label>Enter OTP</Label>
                          <Row>
                            {[0, 1, 2].map((i) => (
                              <Col key={i}>
                                <Input
                                  className="form-control text-center opt-text"
                                  type="text"
                                  maxLength="2"
                                  value={otp[i]}
                                  onChange={(e) => handleOtpChange(i, e.target.value)}
                                />
                              </Col>
                            ))}
                          </Row>
                        </FormGroup>

                        <H6 className="mt-4">Create Your New Password</H6>
                        <FormGroup className="position-relative">
                          <Label>New Password</Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="icon-lock"></i>
                            </span>
                            <Input
                              className="form-control"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="*********"
                              required
                            />
                          </div>
                        </FormGroup>

                        <FormGroup>
                          <Label>Retype Password</Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="icon-lock"></i>
                            </span>
                            <Input
                              className="form-control"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="*********"
                              required
                            />
                          </div>
                        </FormGroup>

                        <FormGroup>
                          <Btn
                            attrBtn={{
                              className: "btn btn-primary btn-block w-100 mt-4 mb-4",
                              type: "submit",
                            }}
                          >
                            {loading ? "Submitting..." : "Reset Password"}
                          </Btn>
                        </FormGroup>
                      </>
                    )}

                    <P>
                      Already have a password?
                      <Link className="ms-2" to={`${process.env.PUBLIC_URL}/login`}>
                        Sign in
                      </Link>
                    </P>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <ToastContainer position="top-right" autoClose={3000} />
    </Fragment>
  );
};

export default ForgetPwd;
