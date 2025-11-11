import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRole, getToken } from '../services/auth';

interface RequireAuthProps {
  children: React.ReactElement;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const [authState, setAuthState] = useState({ role: getRole(), token: getToken() });
  const location = useLocation();

  useEffect(() => {
    // Update auth state when authChange event is fired
    const handleAuthChange = () => {
      setAuthState({ role: getRole(), token: getToken() });
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // require that a token exists and role is 'employee'
  if (!authState.token || authState.role !== 'employee') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
