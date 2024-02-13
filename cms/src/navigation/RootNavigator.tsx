import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardScreen from "../screens/Dashboard";
import LoginScreen from "../screens/Login";
import NotFoundScreen from "../screens/NotFound";
import PublicRoute from "./PublicRoute";
import { Suspense } from "react";
import { Spin } from "antd";
import PrivateRoute from "./PrivateRoute";
import AppLayout from "../screens/Layout/AppLayout";

const RootNavigator = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <LoginScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <LoginScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route path="*" element={<NotFoundScreen />} />

        <Route>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute loginPath="/login">
                <DashboardScreen />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default RootNavigator;
