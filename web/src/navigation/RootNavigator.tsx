import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardScreen from '../screens/Dashboard';
import LoginScreen from '../screens/Login';
import NotFoundScreen from '../screens/NotFound';
import PublicRoute from './PublicRoute';
import { Suspense } from 'react';
import { Spin } from 'antd';
import PrivateRoute from './PrivateRoute';
import AppLayout from '../screens/Layout/AppLayout';
import TryoutScreen from '../screens/Tryout';
import HomeScreen from '../screens/Home';

const RootNavigator = () => {
  return (
    <Router>
      <Routes>
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

        <Route path="/" element={<HomeScreen />} />

        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute loginPath="/login">
                <DashboardScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout"
            element={
              <PrivateRoute loginPath="/login">
                <DashboardScreen />
              </PrivateRoute>
            }
          />
        </Route>

        <Route
          path="/tryout/:id/:type/:qNumber"
          element={
            <PrivateRoute loginPath="/login">
              <TryoutScreen />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default RootNavigator;
