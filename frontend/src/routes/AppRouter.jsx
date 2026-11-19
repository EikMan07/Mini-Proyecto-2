import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import EmployeePortalPage from '../pages/EmployeePortalPage/EmployeePortalPage';
import HrDashboardPage from '../pages/HrDashboardPage/HrDashboardPage';
import HrWorkersPage from '../pages/HrWorkersPage/HrWorkersPage';
import ProtectedRoute from './ProtectedRoute';
import PageTransition from '../components/PageTransition/PageTransition';

function RoutedViews() {
  const location = useLocation();
  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute allowedRoles={['colaborador']} />}>
          <Route path="/portal" element={<EmployeePortalPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['rrhh']} />}>
          <Route path="/rrhh/dashboard" element={<HrDashboardPage />} />
          <Route path="/rrhh/trabajadores" element={<HrWorkersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </PageTransition>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RoutedViews />
    </BrowserRouter>
  );
}
