import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import EmployeePortalPage from '../pages/EmployeePortalPage/EmployeePortalPage';
import HrDashboardPage from '../pages/HrDashboardPage/HrDashboardPage';
import ProtectedRoute from './ProtectedRoute';
import PageTransition from '../components/PageTransition/PageTransition';

function RoutedViews() {
  useLocation();
  return <PageTransition><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute allowedRoles={['colaborador']} />}><Route path="/portal" element={<EmployeePortalPage />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={['rrhh']} />}><Route path="/rrhh/dashboard" element={<HrDashboardPage />} /></Route>
    <Route path="*" element={<Navigate to="/portal" replace />} />
  </Routes></PageTransition>;
}

export default function AppRouter() { return <BrowserRouter><RoutedViews /></BrowserRouter>; }
