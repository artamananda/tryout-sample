import { useIsAuthenticated } from "react-auth-kit";
import { useLocation, Navigate } from "react-router-dom";

const PrivateRoute = ({ children, loginPath }: any) => {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate to={loginPath || "/login"} state={{ from: location }} replace />
    );
  }

  return children;
};

export default PrivateRoute;
