// App.tsx
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute'; // Importa el componente ProtectedRoute

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado de autenticación

  return (
    <Router>
      <Routes>
        {/* Redirigir la ruta raíz ("/") a "/Home" */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* Ruta para la página de inicio */}
        <Route path="/Home" element={<HomePage />} />

        {/* Ruta para la página de inicio de sesión */}
        <Route
          path="/Login"
          element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
        />
        
        {/* Ruta protegida para AdminPage */}
        <Route
          path="/AdminPage"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;