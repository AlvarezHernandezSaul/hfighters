// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean; // Prop para verificar si el usuario está autenticado
  redirectPath?: string; // Ruta a la que se redirigirá si no está autenticado
  children: React.ReactNode; // Aceptar children como una propiedad
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  redirectPath = '/Login', // Por defecto, redirige a la página de inicio de sesión
  children,
}) => {
  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de inicio de sesión
    return <Navigate to={redirectPath} replace />;
  }

  // Si está autenticado, renderiza el children (el componente solicitado)
  return <>{children}</>;
};

export default ProtectedRoute;