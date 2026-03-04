import React, { useState } from 'react';
import styled from 'styled-components';
import Register from '../components/Register';
import logo from '../assets/images/HF.jpg';
import Crud from '../components/Crud';
import CoachManager from '../components/CoachManager';
import PriceManager from '../components/PriceManager';
import { useNavigate } from 'react-router-dom'; // Reemplaza useHistory con useNavigate
import { auth } from '../firebase/Firebase'; // Asegúrate de tener la configuración de Firebase correctamente importada
import { signOut } from 'firebase/auth'; // Asegúrate de usar el método adecuado para cerrar sesión en Firebase

// Estilos para la vista
const AdminContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f4f4; /* Fondo gris claro */
  flex-direction: column;
  
  @media (min-width: 768px) {
    flex-direction: row; /* En pantallas más grandes, la barra lateral y el contenido se distribuyen horizontalmente */
  }
`;

const Sidebar = styled.div`
  width: 100%;
  background-color: #000; /* Negro */
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  align-items: center;
  position: fixed;
  height: 100%;
  top: 0;
  
  @media (min-width: 768px) {
    width: 250px; /* Barra lateral más ancha en pantallas grandes */
    position: fixed;
  }
`;

const Logo = styled.img`
  width: 70%;
  margin-bottom: 30px;
  
  @media (min-width: 768px) {
    width: 50%;
  }
`;

const MenuItem = styled.div`
  width: 100%;
  padding: 15px;
  color: #fff;
  font-size: 1.1rem;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-bottom: 10px;
  
  &:hover {
    background-color: #555; /* Gris oscuro para el hover */
  }
`;

const LogoutButton = styled(MenuItem)`
  margin-top: 20px; /* Reduce el espacio superior para que el botón esté más cerca del contenido */
  background-color: #dc3545; /* Rojo para el botón de logout */
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, transform 0.3s ease-in-out;
  
  &:hover {
    background-color: #c82333; /* Rojo oscuro en hover */
    transform: scale(1.05); /* Aumento de tamaño al hacer hover */
  }

  &:active {
    transform: scale(1); /* Normaliza el tamaño al hacer clic */
  }
`;

const ContentArea = styled.div`
  margin-left: 0;
  padding: 20px;
  width: 100%;
  background-color: #fff; /* Blanco para el área de contenido */
  height: 100vh;
  overflow-y: auto;
  
  @media (min-width: 768px) {
    margin-left: 250px; /* Deja espacio para la barra lateral en pantallas grandes */
  }
`;

const Card = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  min-width: 320px;
`;

const AdminPage: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'register' | 'list' | 'history'| 'coachManager' | 'priceManager'>('register');
  const navigate = useNavigate(); // Usamos useNavigate en lugar de useHistory
  const handleLogout = async () => {
    try {
      await signOut(auth); // Cerramos sesión usando Firebase
      navigate('/home'); // Redirigimos al usuario al home
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <AdminContainer>
      <Sidebar>
        <Logo src={logo} alt="Logo de la App" />
        <MenuItem onClick={() => setActiveComponent('register')}>Registrar Nuevos Socios</MenuItem>
        <MenuItem onClick={() => setActiveComponent('list')}>Lista de Socios</MenuItem>
        <MenuItem onClick={() => setActiveComponent('coachManager')}>Administrador Coach</MenuItem>
        <MenuItem onClick={() => setActiveComponent('priceManager')}>Gestionar Precios</MenuItem>
        <LogoutButton onClick={handleLogout}>Cerrar sesión</LogoutButton>
      </Sidebar>

      <ContentArea>
        <h2>Panel de Administración</h2>
        
        {activeComponent === 'register' && (
          <Card>
            <Register />
          </Card>
        )}

        {activeComponent === 'list' && (
          <Card>
            <Crud />
          </Card>
        )}


        {activeComponent === 'coachManager' && (
          <Card>
            <CoachManager/>
          </Card>
        )}

        {activeComponent === 'priceManager' && (
          <Card>
            <PriceManager/>
          </Card>
        )}
      </ContentArea>
    </AdminContainer>
  );
};

export default AdminPage;
