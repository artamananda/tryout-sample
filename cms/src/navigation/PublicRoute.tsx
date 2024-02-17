import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "react-auth-kit";
import { ReactElement } from "react";

export interface IProps {
  children: ReactElement;
}

const PublicRoute: React.FC<IProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PublicRoute;
