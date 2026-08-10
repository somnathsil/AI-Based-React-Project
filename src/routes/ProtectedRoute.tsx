import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from './routes.config';

export interface ProtectedRouteProps {
  redirectPath?: string;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = ROUTES.LOGIN,
}) => {
  const location = useLocation();
  // Check token in localStorage or Redux state
  const token = localStorage.getItem('access_token');
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
