import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";

export const ProtectedRoute = ({children}:{children:any}) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext) as any;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};