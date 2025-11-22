import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRole, getToken } from '../services/auth';

interface RequireAuthProps {
  children: React.ReactElement;
}

const RequireLogin: React.FC<RequireAuthProps> = ({ children }) => {
  const token = getToken();
  const location = useLocation();
  const role = getRole();
  // require that a token exists and is a regular citizen (not an officer/admin)
  const isOfficerLike = !!role && (role === 'officer' || role === 'municipal_administrator' || role.toString().includes('officer'));
  if (!token || isOfficerLike) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};


const RequireOfficer: React.FC<RequireAuthProps> = ({ children }) => {
  const role = getRole();
  const token = getToken();
  const location = useLocation();
  // require that a token exists and role represents some kind of officer or admin
  // Accept either the legacy 'officer' value, 'municipal_administrator',
  // or specific officer roles returned by the token (they usually contain 'officer').
  const isOfficerLike = !!role && (role === 'officer' || role === 'municipal_administrator' || role.toString().includes('officer'));
  if (!token || !isOfficerLike) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};


const RequireAdmin: React.FC<RequireAuthProps> = ({ children }) => {
  const role = getRole();
  const token = getToken();
  const location = useLocation();

  // require that a token exists and role is 'employee'
  if (!token || role !== 'municipal_administrator') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export { RequireLogin, RequireOfficer, RequireAdmin };