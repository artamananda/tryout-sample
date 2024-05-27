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
import TryoutResultScreen from '../screens/TryoutResult';
import FormKpu from '../components/Tryout/FormKpu';
import FormPpu from '../components/Tryout/FormPpu';
import FormPbm from '../components/Tryout/FormPbm';
import FormPku from '../components/Tryout/FormPku';
import FormInd from '../components/Tryout/FormInd';
import FormIng from '../components/Tryout/FormIng';
import FormMtk from '../components/Tryout/FormMtk';
import ResultTable from '../components/TryoutResult/ResultTable';
import ResultScore from '../components/TryoutResult/ResultScore';
import QuestionPage from '../screens/Question';
import EditTryoutScreen from '../screens/Tryout/Edit';

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
        <Route
          path="*"
          element={<NotFoundScreen />}
        />

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
                <TryoutScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/add"
            element={
              <PrivateRoute loginPath="/login">
                <EditTryoutScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/question"
            element={
              <PrivateRoute loginPath="/login">
                <EditTryoutScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/question/:questionType"
            element={
              <PrivateRoute loginPath="/login">
                <QuestionPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout/:tryoutId/create/question/kpu"
            element={
              <PrivateRoute loginPath="/login">
                <FormKpu />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/ppu"
            element={
              <PrivateRoute loginPath="/login">
                <FormPpu />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/pbm"
            element={
              <PrivateRoute loginPath="/login">
                <FormPbm />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/pku"
            element={
              <PrivateRoute loginPath="/login">
                <FormPku />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/ind"
            element={
              <PrivateRoute loginPath="/login">
                <FormInd />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/ing"
            element={
              <PrivateRoute loginPath="/login">
                <FormIng />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout/:tryoutId/create/question/mtk"
            element={
              <PrivateRoute loginPath="/login">
                <FormMtk />
              </PrivateRoute>
            }
          />

          <Route
            path="/tryout-result"
            element={
              <PrivateRoute loginPath="/login">
                <TryoutResultScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout-result/:id"
            element={
              <PrivateRoute loginPath="/login">
                <ResultTable />
              </PrivateRoute>
            }
          />
          <Route
            path="/tryout-score/:id"
            element={
              <PrivateRoute loginPath="/login">
                <ResultScore />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default RootNavigator;
