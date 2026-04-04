import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../model/store';

export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.systemRole !== 'admin') return <Navigate to="/campaigns" replace />;
  return <Outlet />;
}
