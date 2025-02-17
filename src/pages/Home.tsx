import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { ref, get, push } from "firebase/database";
import { realtimeDb } from "../firebase/Firebase";
import HFLogo from "../assets/images/HF logo.jpg";
import Header from "../components/Header";

// Animación de fade-in para la información flotante
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Contenedor principal
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: black url(${HFLogo}) center top no-repeat;
  background-size: 50%;
  background-color: black; 
  color: white;
  text-align: center;
  font-family: "Arial", sans-serif;
  margin-top: 80px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.70);
    backdrop-filter: blur(0px);
    z-index: 0;
  }
`;

const InputContainer = styled.div`
  position: fixed; /* Fija el contenedor en la pantalla */
  top: 20%; /* Ajusta la posición vertical */
  left: 50%; /* Centra horizontalmente */
  transform: translateX(-50%); /* Centra horizontalmente */
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 20; /* Asegura que esté por encima de otros elementos */
  background: rgba(0, 0, 0, 0.8); /* Fondo semitransparente */
  padding: 20px;
  border-radius: 15px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  margin-bottom: 20px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 200px;
  background-color: white; /* Fondo blanco para mejor visibilidad */
  color: black; /* Texto negro */
  z-index: 21; /* Asegura que esté por encima del contenedor */
`;

const SearchButton = styled.button`
  background-color: #f0a500;
  color: black;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 21; /* Asegura que esté por encima del contenedor */

  &:hover {
    background-color: #e69500;
  }
`;

// Contenedor de información (Reglas y Precios)
const InfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1000px;
  position: relative;
  z-index: 1;
  gap: 5vw; /* Hace que el espacio entre cajas sea responsive */
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    width: 100%;
  }
`;

// Estilos para reglas y precios
const BoxContainer = styled.div`
  flex: 1;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2);
  min-width: 300px;
  max-width: 100%; /* Asegura que no se desborde */
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #f0a500;
  border-bottom: 2px solid #f0a500;
  padding-bottom: 5px;
  margin-bottom: 10px;
`;

const Rule = styled.p`
  font-size: 18px;
  margin: 5px 0;
  color: #ddd;
`;

const Price = styled.p`
  font-size: 20px;
  font-weight: bold;
  margin: 5px 0;
  color: white;
  text-shadow: 2px 2px 5px rgba(240, 165, 0, 0.5);
`;

// Modal de información del socio
const MemberInfoModal = styled.div<{ statusColor: string }>`
  background-color: ${(props) => props.statusColor};
  color: black;
  padding: 20px;
  border-radius: 15px;
  position: fixed;
  top: 20%;
  left: 5%;
  right: 5%;
  z-index: 9999; /* Asegura que esté al frente */
  max-width: 90%;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-in-out;

  @media (max-width: 600px) {
    padding: 15px;
    font-size: 14px;
  }
`;

const Name = styled.h3`
  font-size: 26px;
  margin-bottom: 10px;
`;

const InfoText = styled.p`
  font-size: 18px;
  margin: 5px 0;
`;

const Home = () => {
  const [memberInfo, setMemberInfo] = useState<{ name: string; status: string; statusColor: string; cutoffDate: string; daysRemaining: number; } | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); // Referencia para el campo de entrada

  // Enfocar automáticamente el campo de entrada al cargar la página
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Mantener el enfoque en el campo de entrada si pierde el foco
  useEffect(() => {
    const handleFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("click", handleFocus); // Enfocar al hacer clic en cualquier lugar
    return () => {
      window.removeEventListener("click", handleFocus);
    };
  }, []);

  // Función para agregar una actividad al historial
  const addToHistorial = async (socioId: string, socioNombre: string, memberNumber: string, disciplines: string[]) => {
    const fechaActual = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
    const actividad = {
      tipo: "Consulta",
      descripcion: `Consulta de estado del socio ${socioNombre}`,
      socioId,
      socioNombre,
      memberNumber, // Añadir el número de socio al historial
      disciplines, // Añadir las disciplinas al historial
    };

    try {
      // Crear un nodo de fecha si no existe y agregar la actividad
      await push(ref(realtimeDb, `historial/${fechaActual}`), actividad);
    } catch (error) {
      console.error("Error al agregar al historial:", error);
    }
  };

  const handleMemberNumberSubmit = async () => {
    if (memberNumber) {
      setLoading(true);
      const memberId = await findMemberByNumber(memberNumber);
      if (memberId) {
        const socioData = await fetchMemberData(memberId);
        if (socioData) {
          const disciplines = socioData.disciplines || []; // Obtener las disciplinas del socio
          await addToHistorial(memberId, socioData.fullName, memberNumber, disciplines); // Registrar en el historial
        }
      } else {
        console.log("No se encontró socio con ese número.");
      }
      setLoading(false);
    }
  };

  const findMemberByNumber = async (number: string) => {
    try {
      const dbRef = ref(realtimeDb, "socios");
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const members = snapshot.val();
        for (const memberId in members) {
          if (members[memberId].memberNumber === number) {
            return memberId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error al buscar socio por número:", error);
      return null;
    }
  };

  // Obtener datos del socio
  const fetchMemberData = async (memberId: string) => {
    try {
      const dbRef = ref(realtimeDb, `socios/${memberId}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const { fullName, cutoffDate, disciplines } = snapshot.val(); // Obtener las disciplinas
        const statusInfo = getStatus(cutoffDate);

        setMemberInfo({
          name: fullName,
          status: statusInfo.statusText,
          statusColor: statusInfo.color,
          cutoffDate,
          daysRemaining: statusInfo.daysRemaining,
        });

        // Limpiar el campo de entrada
        setMemberNumber("");

        setTimeout(() => setMemberInfo(null), 5000); // Cierra el modal después de 5 segundos
        return { fullName, disciplines }; // Devolver los datos del socio, incluyendo las disciplinas
      } else {
        console.error("No se encontraron datos del socio.");
      }
    } catch (error) {
      console.error("Error al obtener datos del socio:", error);
    }
    return null;
  };

  // Determinar el estado del socio
  const getStatus = (cutoffDate: string) => {
    const today = new Date();
    const cutoff = new Date(cutoffDate);
    const daysRemaining = Math.ceil((cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 5) {
      return { statusText: "🟢 A Tiempo", color: "green", daysRemaining };
    } else if (daysRemaining > 0 && daysRemaining <= 5) {
      return { statusText: "🟡 Por Vencer", color: "yellow", daysRemaining };
    } else if (cutoff.toDateString() === today.toDateString()) {
      return { statusText: "🟡 Por Vencer", color: "yellow", daysRemaining };
    } else {
      return { statusText: "🔴 Pago Pendiente", color: "red", daysRemaining };
    }
  };

  // Manejar la tecla "Enter" en el campo de entrada
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleMemberNumberSubmit();
    }
  };

  return (
    <HomeContainer>
      <Header />
      <InputContainer>
        <Input
          type="text"
          placeholder="Ingresa número de socio"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
          onKeyPress={handleKeyPress} // Manejar la tecla "Enter"
          ref={inputRef} // Referencia para el campo de entrada
          autoFocus // Enfocar automáticamente al cargar
        />
        <SearchButton onClick={handleMemberNumberSubmit} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </SearchButton>
      </InputContainer>

      {memberInfo && (
        <MemberInfoModal statusColor={memberInfo.statusColor}>
          <Name>Hola, {memberInfo.name}</Name>
          <InfoText>Mensualidad vigente hasta: {new Date(memberInfo.cutoffDate).toLocaleDateString()}</InfoText>
          <InfoText>Días restantes: {memberInfo.daysRemaining}</InfoText>
          <InfoText>Recuerda pagar puntualmente tu mensualidad para poder seguir usando las instalaciones</InfoText>
        </MemberInfoModal>
      )}

      <InfoContainer>
        {/* Reglas */}
        <BoxContainer>
          <Title>REGLAMENTO HOUSE FIGHTERS GYM</Title>
          <Rule>✅ NO SE PERMITIRÁ ACCESO AL GYM SI SU MENSUALIDAD NO ESTÁ VIGENTE.</Rule>
          <Rule>✅ TODOS LOS SOCIOS TIENEN LA OBLIGACIÓN DE ACOMODAR EL EQUIPO QUE UTILIZAN DURANTE SU ENTRENAMIENTO</Rule>
          <Rule>✅ USO OBLIGATORIO DE TOALLA Y DESODORANTE DE USO PERSONAL Y PARA LOS EQUIPOS</Rule>
          <Rule>✅ PROHIBIDO AZOTAR MANCUERNAS, DISCOS, BARRAS, PRENSA Y ACCESORIOS DE LA JAULA ENTRE OTROS MÁS.</Rule>
          <Rule>✅ HOUSE FIGHTERS GYM SE DESLINDA DE CUALQUIER RESPONSABILIDAD DE OBJETOS PERDIDOS U OLVIDADOS.</Rule>
          <Rule>✅ USO OBLIGATORIO DE ROPA DEPORTIVA
          (SE NEGARÁ EL ACCESO AL NO CUMPLIR CON ESTE REQUISITO)</Rule>
          <Rule>✅QUEDA ESTRICTAMENTE PROHIBIDO TOMAR FOTOS O VIDEOS DE ACOSO Y HACER CUALQUIER TIPO DE COMENTARIOS OBSCENOS A OTROS SOCIOS
          (@ SERÁ BAJA INMEDIATA Y DEFINITIVA.)</Rule>
        </BoxContainer>

        {/* Precios */}
        <BoxContainer>
          <Title>PRECIOS</Title>
          <Price>🏋️ GYM: $380</Price>
          <Price>🥊 MMA & KICKBOXING: $400</Price>
          <Price>🤼 WRESTLING: $400</Price>
          <Price>💪 VISITA O CLASE: $50</Price>
          <Price>🔥 CROSSFIT: $380</Price>
          <Price>🔹 2 ACTIVIDADES: $580</Price>
          <p></p>
          <Rule>PLAN FAMILIAR: 4 PERSONAS X $1350 </Rule>
          <Rule>PLAN AMIGOS: 3 PERSONAS X $1050 </Rule>
          <Rule>❗❗IMPORTANTE❗❗ PAGO EN UNA SOLA EXIBICIÓN</Rule>
          <Rule>1 ACTIVIDAD POR PERSONA </Rule>
          <Rule>(ACTIVIDAD EXTRA POR PERSONA $200 EXTRA)</Rule>
        </BoxContainer>
      </InfoContainer>
      <p></p>
    </HomeContainer>
  );
};

export default Home;