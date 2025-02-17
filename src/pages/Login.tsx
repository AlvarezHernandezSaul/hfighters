import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/Firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import LogoImage from "../assets/images/HF logo.jpg"; // Renombrado para evitar conflicto

// Definimos la interfaz para las props de LoginPage
interface LoginPageProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void; // Función para actualizar el estado de autenticación
}

// Estilo global para eliminar márgenes y padding
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`;

// Estilos para la vista
const LoginContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #000;  // Fondo negro para toda la vista
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px; // Limitar ancho máximo
  background-color: #000;  // Barra lateral negra
  color: #fff;
  padding: 30px;
  border-radius: 12px;
`;

const Logo = styled.img`
  width: 80%;  // Ajustado el tamaño del logo
  max-width: 200px;  // Asegurar que el logo no sea muy grande
  margin-bottom: 10px;
  border-radius: 8px;

  @media (min-width: 768px) {
    width: 60%;  
  }
`;

const FormContainer = styled.div`
  background-color: #fff;
  padding: 20px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Heading = styled.h2`
  text-align: center;
  color: #000;  // Color de texto negro para el encabezado
  font-size: 1.6rem;
  margin-bottom: 20px;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px;
  margin: 15px 0;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;  // Azul para el foco
    outline: none;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 8px;
  background-color: #007bff;  // Azul para el botón
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }

  &:active {
    background-color: #004085;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 15px;
`;

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>(''); // Establecemos el tipo de error como string
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Iniciar sesión con Firebase
      await signInWithEmailAndPassword(auth, email, password);

      // Actualizar el estado de autenticación
      setIsAuthenticated(true);

      // Redirigir al usuario a la página de administración
      navigate('/AdminPage');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      } else {
        setError('Error desconocido. Intenta nuevamente.');
      }
    }
  };

  return (
    <>
      <GlobalStyle />
      <LoginContainer>
        <Sidebar>
          <Logo src={LogoImage} alt="Logo" />
          <FormContainer>
            <Heading>Iniciar Sesión</Heading>
            <form onSubmit={handleLogin}>
              <InputField
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <InputField
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <SubmitButton type="submit">Iniciar Sesión</SubmitButton>
            </form>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </FormContainer>
        </Sidebar>
      </LoginContainer>
    </>
  );
};

export default LoginPage;