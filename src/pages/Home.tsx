import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { realtimeDb } from "../firebase/Firebase";
import { ref, query, orderByChild, equalTo, get, update } from "firebase/database";
import HFLogo from "../assets/images/HF logo.jpg";
import Header from "../components/Header";

// Animación de fade-in para la información flotante
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Estilos globales para body y html
const GlobalStyle = styled.div`
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: black; /* Fondo negro por defecto */
`;

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
  padding-top: 80px; /* Reemplaza margin-top con padding */
  position: relative;
  z-index: 1;

  &::before {
    content: "";
    position: fixed; /* Cambiado a fixed para cubrir todo el viewport */
    top: 0;
    left: 0;
    width: 100vw; /* Usar vw para cubrir todo el ancho */
    height: 100vh; /* Usar vh para cubrir toda la altura */
    background: rgba(0, 0, 0, 0.70);
    backdrop-filter: blur(0px);
    z-index: 0;
  }
`;

const InputContainer = styled.div`
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 20;
  background: rgba(0, 0, 0, 0.8);
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
  background-color: white;
  color: black;
  z-index: 21;
`;

const SearchButton = styled.button`
  background-color: #484d44;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 21;

  &:hover {
    background-color: #3a3e36;
  }
`;

const InfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1000px;
  position: relative;
  z-index: 1;
  gap: 5vw;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    width: 100%;
  }
`;

const BoxContainer = styled.div`
  flex: 1;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2);
  min-width: 300px;
  max-width: 100%;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #484d44;
  border-bottom: 2px solid #484d44;
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
  text-shadow: 2px 2px 5px rgba(72, 77, 68, 0.5);
`;

const MemberInfoModal = styled.div<{ statusColor: string }>`
  background-color: ${(props) => props.statusColor};
  color: ${(props) => {
    if (props.statusColor === '#6c757d') return 'white'; // Gris con texto blanco
    if (props.statusColor === '#ffc107') return 'black'; // Amarillo con texto negro
    return 'black'; // Otros colores con texto negro
  }};
  padding: 20px;
  border-radius: 15px;
  position: fixed;
  top: 20%;
  left: 5%;
  right: 5%;
  z-index: 9999;
  max-width: 90%;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-in-out;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: ${(props) => {
    if (props.statusColor === '#6c757d') return '2px solid #495057'; // Borde gris oscuro
    if (props.statusColor === '#ffc107') return '2px solid #e0a800'; // Borde amarillo oscuro
    return 'none';
  }};

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

interface MemberInfo {
  name: string;
  status: string;
  statusColor: string;
  cutoffDate: string;
  daysRemaining: number;
  isNotFound?: boolean;
}

interface SocioData {
  fullName: string;
  cutoffDate: string;
  memberNumber: string;
  horarioPago?: string;
  [key: string]: string | string[] | undefined;
}

interface PriceData {
  gym: string;
  mma_kickboxing: string;
  wrestling: string;
  visita_clase: string;
  crossfit: string;
  dos_actividades: string;
  plan_familiar: string;
  plan_amigos: string;
  actividad_extra: string;
}

const Home = () => {
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const [prices, setPrices] = useState<PriceData>({
    gym: '380',
    mma_kickboxing: '400',
    wrestling: '400',
    visita_clase: '50',
    crossfit: '380',
    dos_actividades: '580',
    plan_familiar: '1350',
    plan_amigos: '1050',
    actividad_extra: '200',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, memberInfo]);

  // Cargar precios desde Firebase
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const pricesRef = ref(realtimeDb, 'prices');
        const snapshot = await get(pricesRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPrices(data);
        }
      } catch (error) {
        console.error('Error al cargar precios:', error);
      }
    };

    loadPrices();
  }, []);

  const getHorario = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 12 ? "Mañana" : hour >= 16 && hour < 22 ? "Tarde" : "Fuera de horario";
  }, []);

  const getStatus = useCallback((cutoffDate: string) => {
    const today = new Date();
    const cutoff = new Date(cutoffDate);
    const daysRemaining = Math.ceil((cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 5) {
      return { statusText: "🟢 A Tiempo", color: "green", daysRemaining };
    } else if (daysRemaining > 0 || cutoff.toDateString() === today.toDateString()) {
      return { statusText: "🟡 Por Vencer", color: "yellow", daysRemaining };
    } else {
      return { statusText: "🔴 Pago Pendiente", color: "red", daysRemaining };
    }
  }, []);

  const findMemberByNumber = useCallback(async (number: string): Promise<SocioData & { id: string } | null> => {
    try {
      const dbRef = query(ref(realtimeDb, "socios"), orderByChild("memberNumber"), equalTo(number));
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const members = snapshot.val() as Record<string, SocioData>;
        const memberId = Object.keys(members)[0];
        return { ...members[memberId], id: memberId };
      }
      return null;
    } catch (error) {
      console.error("Error al buscar socio por número:", error);
      return null;
    }
  }, []);

  const updateHorario = useCallback(async (memberId: string, memberData: SocioData) => {
    const horarioAsistencia = getHorario();
    const horarioPago = memberData.horarioPago || horarioAsistencia;

    try {
      const socioRef = ref(realtimeDb, `socios/${memberId}`);
      await update(socioRef, {
        horarioAsistencia,
        horarioPago,
      });
      console.log('Horario actualizado para socio:', memberId);
    } catch (error) {
      console.error("Error al actualizar horario:", error);
      throw error;
    }
  }, [getHorario]);

  const fetchMemberData = useCallback(async (memberId: string) => {
    try {
      const dbRef = ref(realtimeDb, `socios/${memberId}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val() as SocioData;
        const { fullName = "", cutoffDate = "" } = data;
        const statusInfo = getStatus(cutoffDate);

        setMemberInfo({
          name: fullName,
          status: statusInfo.statusText,
          statusColor: statusInfo.color,
          cutoffDate,
          daysRemaining: statusInfo.daysRemaining,
        });

        setMemberNumber("");
        setTimeout(() => setMemberInfo(null), 4000);
      } else {
        console.error("No se encontraron datos del socio.");
      }
    } catch (error) {
      console.error("Error al obtener datos del socio:", error);
    }
  }, [getStatus]);

  const handleMemberNumberSubmit = useCallback(async () => {
    if (!memberNumber || loading) return;

    // Validar que el número tenga entre 1 y 4 dígitos
    const numericValue = parseInt(memberNumber, 10);
    if (isNaN(numericValue) || numericValue < 1 || numericValue > 9999) {
      setMemberInfo({
        name: `Número ${memberNumber}`,
        status: "⚠️ Número inválido",
        statusColor: "#ffc107", // Color amarillo para advertencia
        cutoffDate: "",
        daysRemaining: 0,
        isNotFound: true
      });
      setMemberNumber("");
      setTimeout(() => setMemberInfo(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const socioData = await findMemberByNumber(memberNumber);
      if (socioData) {
        await updateHorario(socioData.id, socioData);
        await fetchMemberData(socioData.id);
      } else {
        // Mostrar modal para número no encontrado
        setMemberInfo({
          name: `Número ${memberNumber.padStart(4, "0")}`,
          status: "🚫 No hay datos disponibles",
          statusColor: "#6c757d", // Color gris
          cutoffDate: "",
          daysRemaining: 0,
          isNotFound: true
        });
        
        setMemberNumber("");
        setTimeout(() => setMemberInfo(null), 5000); // Mostrar por 5 segundos
        console.log("No se encontró socio con ese número.");
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [memberNumber, loading, findMemberByNumber, updateHorario, fetchMemberData]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleMemberNumberSubmit();
    }
  }, [handleMemberNumberSubmit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setMemberNumber(value);
    }
  };

  return (
    <GlobalStyle>
      <HomeContainer>
        <Header />
        <InputContainer>
          <Input
            type="text"
            placeholder="Ingresa número de socio"
            value={memberNumber}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            ref={inputRef}
            disabled={loading}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <SearchButton onClick={handleMemberNumberSubmit} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </SearchButton>
        </InputContainer>

        {memberInfo && (
          <MemberInfoModal statusColor={memberInfo.statusColor}>
            {memberInfo.isNotFound ? (
              <>
                <Name style={{ fontSize: '24px', marginBottom: '15px' }}>
                  {memberInfo.name}
                </Name>
                <InfoText style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>
                  {memberInfo.status}
                </InfoText>
                {memberInfo.status.includes('inválido') ? (
                  <>
                    <InfoText style={{ fontSize: '18px', lineHeight: '1.5', marginBottom: '15px' }}>
                      📝 <strong>Ingresa un número válido (1-9999)</strong>
                    </InfoText>
                    <InfoText style={{ fontSize: '16px', lineHeight: '1.4', opacity: '0.9' }}>
                      🔢 Ejemplo: 1, 123, 1234
                    </InfoText>
                  </>
                ) : (
                  <>
                    <InfoText style={{ fontSize: '18px', lineHeight: '1.5', marginBottom: '15px' }}>
                      🏢 <strong>Solicitar asignación de número en recepción</strong>
                    </InfoText>
                    <InfoText style={{ fontSize: '16px', lineHeight: '1.4', opacity: '0.9' }}>
                      👥 El personal te ayudará a registrarte como nuevo socio
                    </InfoText>
                    <InfoText style={{ fontSize: '14px', marginTop: '15px', opacity: '0.8', fontStyle: 'italic' }}>
                      💡 Tip: Trae una identificación oficial para agilizar el proceso
                    </InfoText>
                  </>
                )}
              </>
            ) : (
              <>
                <Name>Hola, {memberInfo.name}</Name>
                <InfoText>Mensualidad vigente hasta: {new Date(memberInfo.cutoffDate).toLocaleDateString()}</InfoText>
                <InfoText>Días restantes: {memberInfo.daysRemaining}</InfoText>
                <InfoText>Recuerda pagar puntualmente tu mensualidad para poder seguir usando las instalaciones</InfoText>
              </>
            )}
          </MemberInfoModal>
        )}

        <InfoContainer>
          <BoxContainer>
            <Title>REGLAMENTO</Title>
            <Rule>✅ NO SE PERMITIRÁ ACCESO AL GYM SI SU MENSUALIDAD NO ESTÁ VIGENTE.</Rule>
            <Rule>✅ TODOS LOS SOCIOS TIENEN LA OBLIGACIÓN DE ACOMODAR EL EQUIPO QUE UTILIZAN DURANTE SU ENTRENAMIENTO</Rule>
            <Rule>✅ USO OBLIGATORIO DE TOALLA Y DESODORANTE DE USO PERSONAL Y PARA LOS EQUIPOS</Rule>
            <Rule>✅ PROHIBIDO AZOTAR MANCUERNAS, DISCOS, BARRAS, PRENSA Y ACCESORIOS DE LA JAULA ENTRE OTROS MÁS.</Rule>
            <Rule>✅ HOUSE FIGHTERS GYM SE DESLINDA DE CUALQUIER RESPONSABILIDAD DE OBJETOS PERDIDOS U OLVIDADOS.</Rule>
            <Rule>✅ USO OBLIGATORIO DE ROPA DEPORTIVA (SE NEGARÁ EL ACCESO AL NO CUMPLIR CON ESTE REQUISITO)</Rule>
            <Rule>✅QUEDA ESTRICTAMENTE PROHIBIDO TOMAR FOTOS O VIDEOS DE ACOSO Y HACER CUALQUIER TIPO DE COMENTARIOS OBSCENOS A OTROS SOCIOS (SERÁ BAJA INMEDIATA Y DEFINITIVA.)</Rule>
          </BoxContainer>

          <BoxContainer>
            <Title>PRECIOS</Title>
            <Price>🏋️ GYM: ${prices.gym}</Price>
            <Price>🥊 MMA & KICKBOXING: ${prices.mma_kickboxing}</Price>
            <Price>🤼 WRESTLING: ${prices.wrestling}</Price>
            <Price>💪 VISITA O CLASE: ${prices.visita_clase}</Price>
            <Price>🔥 CROSSFIT: ${prices.crossfit}</Price>
            <Price>🔹 2 ACTIVIDADES: ${prices.dos_actividades}</Price>
            <p></p>
            <Rule>PLAN FAMILIAR: 4 PERSONAS X ${prices.plan_familiar} </Rule>
            <Rule>PLAN AMIGOS: 3 PERSONAS X ${prices.plan_amigos} </Rule>
            <Rule>❗❗IMPORTANTE❗❗ PAGO EN UNA SOLA EXIBICIÓN</Rule>
            <Rule>1 ACTIVIDAD POR PERSONA </Rule>
            <Rule>(ACTIVIDAD EXTRA POR PERSONA ${prices.actividad_extra} EXTRA)</Rule>
          </BoxContainer>
        </InfoContainer>
        <p></p>
      </HomeContainer>
    </GlobalStyle>
  );
};

export default Home;