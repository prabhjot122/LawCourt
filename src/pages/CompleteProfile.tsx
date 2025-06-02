import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import OAuthProfileCompletion from '@/components/OAuthProfileCompletion';

const CompleteProfile = () => {
  const location = useLocation();
  const userId = location.state?.userId;

  // If no userId is provided, redirect to login
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <OAuthProfileCompletion userId={userId} />;
};

export default CompleteProfile;
