/* eslint-disable no-unused-vars */
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Callback from "../Auth/Callback";
import Signin from "../Auth/Signin";
import Loader from "../Layout/Loader";
import LayoutRoutes from "../Route/LayoutRoutes";
import { authRoutes } from "./AuthRoutes";
import PrivateRoute from "./PrivateRoute";

const Routers = () => {
  const [currentUser, setCurrentUser] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let abortController = new AbortController();
    setAuthenticated(JSON.parse(localStorage.getItem("authenticated")));
    console.ignoredYellowBox = ["Warning: Each", "Warning: Failed"];
    console.disableYellowBox = true;
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <BrowserRouter basename={"/"}>
      <>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path={"/"} element={<PrivateRoute />}>
              {currentUser !== null || authenticated ? (
                <>
                  <Route exact path={`${process.env.PUBLIC_URL}`} element={<Navigate to={`${process.env.PUBLIC_URL}/dashboard/default`} />} />
                  <Route exact path={`/`} element={<Navigate to={`${process.env.PUBLIC_URL}/dashboard/default`} />} />
                </>
              ) : (
                ""
              )}
              <Route path={`/*`} element={<LayoutRoutes />} />
            </Route>
            <Route path={`${process.env.PUBLIC_URL}/callback`} render={() => <Callback />} />
            <Route exact path={`${process.env.PUBLIC_URL}/login`} element={<Signin />} />
            {authRoutes.map(({ path, Component }, i) => (
              <Route path={path} element={Component} key={i} />
            ))}
          </Routes>
        </Suspense>
      </>
    </BrowserRouter>
  );
};

export default Routers;
