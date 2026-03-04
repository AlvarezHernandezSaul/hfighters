import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { realtimeDb } from "../firebase/Firebase";
import { ref, get, query, orderByChild, equalTo, push } from "firebase/database";
import { useDateTime } from '../context/DateTimeContext';
import { useAvailableNumbers } from '../hooks/useAvailableNumbers';

// Estilos
const FormContainer = styled.div`
  background-color: #fff;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  max-width: 650px;
  margin: auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 5px;
`;

const Input = styled.input<{ error?: boolean }>`
  padding: 12px;
  border: 1px solid ${(props) => (props.error ? "red" : "#ddd")};
  border-radius: 6px;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
`;

const Button = styled.button`
  background-color: #000;
  color: #fff;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
  width: 100%;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
  display: block;

  &:hover {
    background-color: #444;
  }

  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const DisciplineContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 5px;
  flex-wrap: wrap;
`;

const AddedDisciplineContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
`;

const AddedDiscipline = styled.div`
  background: #007bff;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RemoveButton = styled.button`
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-weight: bold;
`;

const ClockContainer = styled.div`
  display: inline-block;
  font-size: 1.1rem;
  color: #333;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  padding: 12px;
  margin: 15px 0;
  text-align: center;
  font-weight: bold;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const AvailableNumbersContainer = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
`;

const AvailableNumbersTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 5px;
  max-height: 150px;
  overflow-y: auto;
  padding: 5px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: white;
`;

const NumberBadge = styled.span<{ isNext?: boolean }>`
  background-color: ${props => props.isNext ? '#007bff' : '#6c757d'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  text-align: center;
  font-weight: ${props => props.isNext ? 'bold' : 'normal'};
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.875rem;
  color: #6c757d;
`;

const RefreshButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #218838;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled.button`
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: 10px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #138496;
  }
`;

const Register = React.memo(() => {
  const {  currentDateTime } = useDateTime();
  const { 
    availableNumbers, 
    totalAvailable, 
    isLoading: numbersLoading, 
    refreshNumbers
  } = useAvailableNumbers();

  const [formData, setFormData] = useState({
    fullName: "",
    discipline: [] as string[],
    paymentDate: "",
    cutoffDate: "",
    amountPaid: "",
    location: "",
    socialMedia: "",
    memberNumber: "",
  });
  const [newDiscipline, setNewDiscipline] = useState("");
  const [memberNumberAvailable, setMemberNumberAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState({ paymentDate: false, cutoffDate: false });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAvailableNumbers, setShowAvailableNumbers] = useState(false);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const memberNumberRef = useRef<HTMLInputElement>(null);
  const paymentDateRef = useRef<HTMLInputElement>(null);
  const cutoffDateRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const socialMediaRef = useRef<HTMLInputElement>(null);
  const disciplineSelectRef = useRef<HTMLSelectElement>(null);

  const getHorario = useCallback(() => {
    const now = currentDateTime;
    const hours = now.getHours();
    return hours >= 6 && hours < 12
      ? { horarioAsistencia: "Mañana", horarioPago: "Mañana" }
      : hours >= 16 && hours < 22
      ? { horarioAsistencia: "Tarde", horarioPago: "Tarde" }
      : { horarioAsistencia: "Fuera de horario", horarioPago: "Fuera de horario" };
  }, [currentDateTime]);

  const generateMemberNumber = useCallback(async () => {
    try {
      const sociosRef = ref(realtimeDb, "socios");
      const snapshot = await get(sociosRef);
      const memberNumbers = new Set<number>();
      if (snapshot.exists()) {
        Object.values(snapshot.val()).forEach((socio: any) => {
          const num = parseInt(socio.memberNumber, 10);
          if (!isNaN(num)) memberNumbers.add(num);
        });
      }
      let newMemberNumber = 1;
      while (memberNumbers.has(newMemberNumber)) {
        newMemberNumber++;
      }
      const formattedNumber = newMemberNumber.toString().padStart(4, "0");
      setFormData((prev) => ({ ...prev, memberNumber: formattedNumber }));
      setMemberNumberAvailable(true);
    } catch (error) {
      console.error("Error generando número de socio:", error);
      setMemberNumberAvailable(false);
    }
  }, []);

  // Función para obtener la fecha actual sin adelanto por zona horaria
  const getCurrentDate = useCallback(() => {
    const now = new Date(currentDateTime);
    // Ajustamos para evitar que se adelante al día siguiente por desfase horario
    now.setHours(0, 0, 0, 0); // Fijamos la hora a medianoche para obtener solo el día actual
    return now.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  }, [currentDateTime]);

  useEffect(() => {
    if (isInitialLoad) {
      const today = getCurrentDate();
      console.log("Fecha actual ajustada (carga inicial):", today); // Depuración
      const nextMonth = new Date(today);
      nextMonth.setDate(nextMonth.getDate() + 30);
      setFormData((prevData) => ({
        ...prevData,
        paymentDate: today,
        cutoffDate: nextMonth.toISOString().split("T")[0],
      }));
      generateMemberNumber();
      setIsInitialLoad(false);
    }
  }, [generateMemberNumber, getCurrentDate, isInitialLoad]);

  const checkMemberNumberAvailability = useCallback(async (memberNumber: string) => {
    try {
      const formattedNumber = memberNumber.padStart(4, "0");
      const memberNumberQuery = query(
        ref(realtimeDb, "socios"),
        orderByChild("memberNumber"),
        equalTo(formattedNumber)
      );
      const snapshot = await get(memberNumberQuery);
      setMemberNumberAvailable(!snapshot.exists());
    } catch (error) {
      console.error("Error al verificar el número de socio:", error);
      setMemberNumberAvailable(false);
    }
  }, []);

  const isValidDateFormat = (value: string) => {
    const regex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
    if (!regex.test(value)) return false;
    if (value.length === 10) {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }
    return true;
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === "paymentDate") {
        if (!isValidDateFormat(value)) {
          setDateError((prev) => ({ ...prev, paymentDate: true }));
          return;
        } else {
          setDateError((prev) => ({ ...prev, paymentDate: false }));
        }
        const newPaymentDate = new Date(value);
        const newCutoffDate = new Date(newPaymentDate);
        newCutoffDate.setDate(newCutoffDate.getDate() + 30);
        setFormData((prevData) => ({
          ...prevData,
          paymentDate: value,
          cutoffDate: newCutoffDate.toISOString().split("T")[0],
        }));
      } else if (name === "cutoffDate") {
        if (!isValidDateFormat(value)) {
          setDateError((prev) => ({ ...prev, cutoffDate: true }));
          return;
        } else {
          setDateError((prev) => ({ ...prev, cutoffDate: false }));
        }
        setFormData((prevData) => ({
          ...prevData,
          cutoffDate: value,
        }));
      } else if (name === "memberNumber") {
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        checkMemberNumberAvailability(value);
      } else {
        setFormData((prevData) => ({ ...prevData, [name]: value }));
      }
    },
    [checkMemberNumberAvailability]
  );

  const addDiscipline = useCallback(
    (discipline: string) => {
      if (discipline && !formData.discipline.includes(discipline)) {
        setFormData((prevData) => ({
          ...prevData,
          discipline: [...prevData.discipline, discipline],
        }));
        setNewDiscipline("");
      }
    },
    [formData.discipline]
  );

  const removeDiscipline = useCallback((disciplineToRemove: string) => {
    setFormData((prevData) => ({
      ...prevData,
      discipline: prevData.discipline.filter((disc) => disc !== disciplineToRemove),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      if (
        !formData.fullName ||
        formData.discipline.length === 0 ||
        !formData.paymentDate ||
        !formData.cutoffDate ||
        !formData.amountPaid ||
        !formData.location ||
        !formData.memberNumber
      ) {
        alert("⚠️ Todos los campos son obligatorios, excepto Red Social.");
        setIsSubmitting(false);
        return;
      }
      if (!memberNumberAvailable) {
        alert("⚠️ El número de socio ya está en uso. Por favor, elige otro.");
        setIsSubmitting(false);
        return;
      }
      if (dateError.paymentDate || dateError.cutoffDate) {
        alert("⚠️ Por favor, corrige las fechas inválidas.");
        setIsSubmitting(false);
        return;
      }
      const { horarioAsistencia, horarioPago } = getHorario();
      const creationDateTime = currentDateTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      console.log("Iniciando guardado directo:", { formData: { ...formData, horarioAsistencia, horarioPago, creationDateTime } });

      try {
        const newMemberRef = ref(realtimeDb, "socios");
        await push(newMemberRef, {
          ...formData,
          horarioAsistencia,
          horarioPago,
          creationDateTime,
        });
        console.log("Guardado exitoso en Firebase");
        
        // Mostrar mensaje de éxito temporal
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        const today = getCurrentDate();
        const nextMonth = new Date(today);
        nextMonth.setDate(nextMonth.getDate() + 30);
        setFormData({
          fullName: "",
          discipline: [],
          paymentDate: today,
          cutoffDate: nextMonth.toISOString().split("T")[0],
          amountPaid: "",
          location: "",
          socialMedia: "",
          memberNumber: "",
        });
        
        // Generar nuevo número automáticamente
        generateMemberNumber();
        
        // Refrescar números disponibles en segundo plano
        refreshNumbers();
        
        if (fullNameRef.current) fullNameRef.current.focus();
      } catch (error: unknown) {
        console.error("Error al guardar en Firebase:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        alert("❌ Error al guardar los datos: " + errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, memberNumberAvailable, generateMemberNumber, isSubmitting, getHorario, getCurrentDate, currentDateTime, refreshNumbers]
  );

  return (
    <FormContainer>
      <HeaderContainer>
        <Title>Registro de Nuevos Socios</Title>
        <ClockContainer>
          {currentDateTime.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </ClockContainer>
      </HeaderContainer>
      
      {showSuccessMessage && (
        <SuccessMessage>
          ✅ Socio registrado exitosamente
        </SuccessMessage>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormField>
          <Label>Número de Socio</Label>
          <Input
            type="text"
            name="memberNumber"
            value={formData.memberNumber}
            onChange={handleChange}
            required
            ref={memberNumberRef}
            style={{ borderColor: memberNumberAvailable ? "#ddd" : "red" }}
          />
          {!memberNumberAvailable && <span style={{ color: "red" }}>Número de socio no disponible</span>}
        </FormField>

        {/* Información de números disponibles */}
        <AvailableNumbersContainer>
          <AvailableNumbersTitle>
            📋 Números Disponibles ({totalAvailable} libres)
            <ToggleButton onClick={() => setShowAvailableNumbers(!showAvailableNumbers)}>
              {showAvailableNumbers ? 'Ocultar Lista' : 'Ver Lista'}
            </ToggleButton>
          </AvailableNumbersTitle>

          {showAvailableNumbers && (
            <>
              <StatsContainer>
                <span>Próximos disponibles:</span>
                <RefreshButton onClick={refreshNumbers} disabled={numbersLoading}>
                  {numbersLoading ? '⟳' : '🔄'} Actualizar
                </RefreshButton>
              </StatsContainer>
              <NumbersGrid>
                {availableNumbers.slice(0, 50).map((number, index) => (
                  <NumberBadge 
                    key={number} 
                    isNext={index === 0}
                    onClick={() => {
                      const formattedNumber = number.toString().padStart(4, "0");
                      setFormData(prev => ({ ...prev, memberNumber: formattedNumber }));
                      setMemberNumberAvailable(true);
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Click para usar el número ${number.toString().padStart(4, "0")}`}
                  >
                    {number.toString().padStart(4, "0")}
                  </NumberBadge>
                ))}
                {availableNumbers.length > 50 && (
                  <NumberBadge style={{ cursor: 'default' }}>
                    +{availableNumbers.length - 50} más...
                  </NumberBadge>
                )}
              </NumbersGrid>
            </>
          )}
        </AvailableNumbersContainer>

        <FormField>
          <Label>Nombre Completo</Label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            ref={fullNameRef}
          />
        </FormField>

        <FormField>
          <Label>Disciplina</Label>
          <DisciplineContainer>
            <Select
              name="newDiscipline"
              value={newDiscipline}
              onChange={(e) => {
                setNewDiscipline(e.target.value);
                addDiscipline(e.target.value);
              }}
              ref={disciplineSelectRef}
            >
              <option value="">Selecciona una</option>
              <option value="Gym">Gym</option>
              <option value="MMA & KICK BOXING">MMA & KICK BOXING</option>
              <option value="CROSSFIT">CROSSFIT</option>
              <option value="BOX">BOX</option>
              <option value="KICK BOXING">KICK BOXING</option>
              <option value="KICK BOXING KIDS">KICK BOXING KIDS</option>
            </Select>
          </DisciplineContainer>

          {formData.discipline.length > 0 && (
            <AddedDisciplineContainer>
              {formData.discipline.map((disc, index) => (
                <AddedDiscipline key={index}>
                  {disc}
                  <RemoveButton onClick={() => removeDiscipline(disc)}>×</RemoveButton>
                </AddedDiscipline>
              ))}
            </AddedDisciplineContainer>
          )}
        </FormField>

        <GridContainer>
          <FormField>
            <Label>Fecha Pago</Label>
            <Input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              ref={paymentDateRef}
              error={dateError.paymentDate}
            />
            {dateError.paymentDate && <span style={{ color: "red" }}>Fecha inválida</span>}
          </FormField>
          <FormField>
            <Label>Fecha Corte</Label>
            <Input
              type="date"
              name="cutoffDate"
              value={formData.cutoffDate}
              onChange={handleChange}
              required
              ref={cutoffDateRef}
              error={dateError.cutoffDate}
            />
            {dateError.cutoffDate && <span style={{ color: "red" }}>Fecha inválida</span>}
          </FormField>
          <FormField>
            <Label>Cantidad Pago</Label>
            <Input
              type="number"
              name="amountPaid"
              value={formData.amountPaid}
              onChange={handleChange}
              required
              ref={amountPaidRef}
            />
          </FormField>
        </GridContainer>

        <GridContainer>
          <FormField>
            <Label>Locación</Label>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              ref={locationRef}
            />
          </FormField>
          <FormField>
            <Label>Red Social (opcional)</Label>
            <Input
              type="text"
              name="socialMedia"
              value={formData.socialMedia}
              onChange={handleChange}
              ref={socialMediaRef}
            />
          </FormField>
        </GridContainer>

        <Button type="submit" disabled={isSubmitting}>
          Guardar
        </Button>
      </form>
    </FormContainer>
  );
});

export default Register;