import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../services/auth';

interface RequireLoginProps {
  children: React.ReactElement;
}

const RequireLogin: React.FC<RequireLoginProps> = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const location = useLocation();

  useEffect(() => {
    // Update token when authChange event is fired
    const handleAuthChange = () => {
      setToken(getToken());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Only require that a token exists (any authenticated user)
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireLogin;
