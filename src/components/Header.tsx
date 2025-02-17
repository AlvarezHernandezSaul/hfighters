import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import HFLogo from "../assets/images/HF logo.jpg"; // Asegúrate de que la ruta sea correcta

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: black;
  padding: 15px 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
  height: 70px; /* Mantén un tamaño consistente */
`;

const Logo = styled.img`
  height: 100px;
  width: auto;
`;

const Title = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  margin: 0;
  @media (min-width: 768px) {
    font-size: 2.5rem; /* Aumenta el tamaño en pantallas más grandes */
  }
`;

const LoginButton = styled(Link)`
  background-color: #f0a500;
  color: black;
  font-size: 1rem;
  margin-right: 20px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  text-decoration: none;
  transition: 0.3s;
  @media (min-width: 768px) {
    font-size: 1.2rem;
  }

  &:hover {
    background-color: #d88a00;
  }
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Logo src={HFLogo} alt="Logo House Fighters" />
      <Title>HOUSE FIGHTERS</Title>
      <LoginButton to="/Login">Iniciar Sesión</LoginButton>
    </HeaderContainer>
  );
};

export default Header;
