import React from 'react';
import { Navigate } from 'react-router-dom';

const AutoSettingsRedirect = () => {
  return <Navigate to="/automation/auto-login" replace />;
};

export default AutoSettingsRedirect;