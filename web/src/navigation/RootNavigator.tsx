import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardScreen from '../screens/Dashboard';
import LoginScreen from '../screens/Auth/Login';
import NotFoundScreen from '../screens/NotFound';
import PublicRoute from './PublicRoute';
import { Suspense } from 'react';
import { Spin } from 'antd';
import PrivateRoute from './PrivateRoute';
import AppLayout from '../screens/Layout/AppLayout';
import TryoutScreen from '../screens/Tryout';
import RegisterScreen from '../screens/Auth/Register';
import ForgotPasswordScreen from '../screens/Auth/ForgotPassword';
import TryoutRoute from './TryoutRoute';
import HomeScreen from '../screens/Home';
import ELibraryScreen from '../screens/ELibrary';
import ReadScreen from '../screens/ELibrary/Read';
import ProgramScreen from '../screens/Program';
import RegisterProgramScreen from '../screens/Program/Register';
import BankSoalScreen from '../screens/BankSoal';
import LearningVideoScreen from '../screens/LearningVideo';
import MyTryoutScoreScreen from '../screens/Tryout/MyScore';
import ProfileScreen from '../screens/Profile';
import PackagesScreen, { CurrentPackagesRedirect } from '../screens/Packages';
import MyOrdersScreen from '../screens/Orders';
import OrderDetailScreen from '../screens/Orders/Detail';
import SKDResultScreen from '../screens/Tryout/SKDResult';
import TryoutReviewScreen from '../screens/Tryout/Review';
import MyProgramScreen from '../screens/MyProgram';
import CertificateScreen from '../screens/Certificate';

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
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <RegisterScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <ForgotPasswordScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/library"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <ELibraryScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/library/:id/read"
          element={
            <PublicRoute>
              <Suspense fallback={<Spin spinning={true} />}>
                <ReadScreen />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route path="*" element={<NotFoundScreen />} />

        <Route path="/" element={<HomeScreen />} />

        <Route element={<AppLayout />}>
          <Route path="/bank-soal/utbk" element={<BankSoalScreen category="utbk" />} />
          <Route path="/bank-soal/skd-cpns" element={<BankSoalScreen category="skd" />} />
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

          <Route
            path="/program"
            element={
              <PrivateRoute loginPath="/login">
                <ProgramScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/program/:programId/register"
            element={
              <PrivateRoute loginPath="/login">
                <RegisterProgramScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/learning-video"
            element={
              <PrivateRoute loginPath="/login">
                <LearningVideoScreen />
              </PrivateRoute>
            }
          />

          {/* Price lists are public so links from ads work without login. */}
          <Route path="/paket" element={<CurrentPackagesRedirect />} />
          <Route path="/program/:programId/paket" element={<PackagesScreen />} />
          <Route path="/sertifikat/:number" element={<CertificateScreen />} />

          <Route
            path="/program-saya"
            element={
              <PrivateRoute loginPath="/login">
                <MyProgramScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/pesanan"
            element={
              <PrivateRoute loginPath="/login">
                <MyOrdersScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/pesanan/:orderNumber"
            element={
              <PrivateRoute loginPath="/login">
                <OrderDetailScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout/:id/hasil-skd"
            element={
              <PrivateRoute loginPath="/login">
                <SKDResultScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout/:id/pembahasan"
            element={
              <PrivateRoute loginPath="/login">
                <TryoutReviewScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute loginPath="/login">
                <ProfileScreen />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout/:id/my-score"
            element={
              <PrivateRoute loginPath="/login">
                <MyTryoutScoreScreen />
              </PrivateRoute>
            }
          />
        </Route>

        <Route
          path="/tryout/:id/:type/:qNumber"
          element={
            <TryoutRoute loginPath="/tryout">
              <TryoutScreen />
            </TryoutRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default RootNavigator;
