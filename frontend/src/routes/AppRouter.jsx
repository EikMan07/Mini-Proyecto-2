import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import EmployeePortalPage from '../pages/EmployeePortalPage/EmployeePortalPage';
import HrDashboardPage from '../pages/HrDashboardPage/HrDashboardPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute allowedRoles={['colaborador']} />}><Route path="/portal" element={<EmployeePortalPage />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={['rrhh']} />}><Route path="/rrhh/dashboard" element={<HrDashboardPage />} /></Route>
    <Route path="*" element={<Navigate to="/portal" replace />} />
  </Routes></BrowserRouter>;
}
