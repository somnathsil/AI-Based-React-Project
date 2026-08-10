import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routes.config";

export interface PublicRouteProps {
  redirectPath?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  redirectPath = ROUTES.DASHBOARD,
}) => {
  const token = localStorage.getItem("access_token");
  const isAuthenticated = Boolean(token);

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
