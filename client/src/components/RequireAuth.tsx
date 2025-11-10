import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRole, getToken } from '../services/auth';

interface RequireAuthProps {
  children: React.ReactElement;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const role = getRole();
  const token = getToken();
  const location = useLocation();

  // require that a token exists and role is 'employee'
  if (!token || role !== 'employee') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
