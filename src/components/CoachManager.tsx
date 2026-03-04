import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import styled from "styled-components";
import { realtimeDb } from "../firebase/Firebase";
import { ref, remove, set, push } from "firebase/database";
import Modal from "react-modal";
import useFirebaseData from "../firebase/useFirebaseData";

// Interfaces
interface Coach {
  id: string;
  name: string;
  disciplines: string[];
  horario: string;
}

interface Socio {
  id: string;
  fullName: string;
  discipline: string[];
  paymentDate: string;
  cutoffDate: string;
  amountPaid: string;
  location: string;
  socialMedia?: string;
  memberNumber: string;
  horarioPago?: string;
}

// Estilos (sin cambios)
const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "500px",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    backgroundColor: "#f9f9f9",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const Button = styled.button<{ danger?: boolean }>`
  background-color: ${(props) => (props.danger ? "#ff4444" : "#f0a500")};
  color: ${(props) => (props.danger ? "white" : "black")};
  font-size: 1rem;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.danger ? "#cc0000" : "#e69500")};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 100%;
  margin-bottom: 1.25rem;
  background-color: white;

  &:disabled {
    background-color: #eee;
  }

  @media (max-width: 768px) {
    font-size: 0.875rem;
    padding: 0.5rem;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  cursor: pointer;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const CheckboxInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 100%;
  margin-bottom: 1.25rem;
  background-color: white;

  &:disabled {
    background-color: #eee;
  }

  @media (max-width: 768px) {
    font-size: 0.875rem;
    padding: 0.5rem;
  }
`;

const DateRangeContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
`;

const TableHeader = styled.th`
  background-color: #f0a500;
  color: black;
  padding: 0.75rem;
  text-align: left;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border: 1px solid #ddd;
`;

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 1rem;
  margin: 0.5rem 0;
`;

// Componente reutilizable para disciplinas
interface DisciplineSelectorProps {
  disciplines: string[];
  selectedDisciplines: string[];
  onChange: (discipline: string) => void;
  disabled: boolean;
}

const DisciplineSelector: React.FC<DisciplineSelectorProps> = ({
  disciplines,
  selectedDisciplines,
  onChange,
  disabled,
}) => (
  <CheckboxContainer>
    <h4>Selecciona las disciplinas:</h4>
    {disciplines.map((discipline) => (
      <CheckboxLabel key={discipline}>
        <CheckboxInput
          type="checkbox"
          value={discipline}
          checked={selectedDisciplines.includes(discipline)}
          onChange={() => onChange(discipline)}
          disabled={disabled}
        />
        {discipline}
      </CheckboxLabel>
    ))}
  </CheckboxContainer>
);

// Componente principal
const CoachManager = () => {
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachDisciplines, setNewCoachDisciplines] = useState<string[]>([]);
  const [newCoachHorario, setNewCoachHorario] = useState("");
  const [editCoachId, setEditCoachId] = useState<string | null>(null);
  const [editCoachName, setEditCoachName] = useState("");
  const [editCoachDisciplines, setEditCoachDisciplines] = useState<string[]>([]);
  const [editCoachHorario, setEditCoachHorario] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedHorario, setSelectedHorario] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const newCoachNameRef = useRef<HTMLInputElement>(null);
  const editCoachNameRef = useRef<HTMLInputElement>(null);

  const { data: coachesData, error: coachesError } = useFirebaseData("coaches");
  const { data: sociosData, error: sociosError } = useFirebaseData("socios");

  // Lista de disciplinas disponibles
  const availableDisciplines = useMemo(
    () => [
      "Gym",
      "MMA & KICK BOXING",
      "CROSSFIT",
      "BOX",
      "KICK BOXING",
      "KICK BOXING KIDS",
    ],
    []
  );

  // Coaches procesados
  const coaches = useMemo(() => {
    if (!coachesData || coachesError) return [];
    return Object.entries(coachesData).map(([key, value]) => ({
      id: key,
      name: value.name || "",
      disciplines: value.disciplines || [],
      horario: value.horario || "",
    })) as Coach[];
  }, [coachesData, coachesError]);

  // Socios procesados
  const socios = useMemo(() => {
    if (!sociosData || sociosError) return [];
    return Object.entries(sociosData).map(([key, value]) => ({
      id: key,
      fullName: value.fullName || "",
      discipline: value.discipline || [],
      paymentDate: value.paymentDate || "",
      cutoffDate: value.cutoffDate || "",
      amountPaid: value.amountPaid || "",
      location: value.location || "",
      socialMedia: value.socialMedia || "",
      memberNumber: value.memberNumber || "",
      horarioPago: value.horarioPago || "",
    })) as Socio[];
  }, [sociosData, sociosError]);

  // Establecer fechas de lunes a sábado de la semana en curso
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);

    // Calcular el lunes de esta semana (inicio)
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Calcular el sábado de esta semana (fin, 6 días desde lunes)
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Lunes + 5 = Sábado
    endOfWeek.setHours(23, 59, 59, 999);

    // Formatear fechas como YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    setStartDate(formatDate(startOfWeek));
    setEndDate(formatDate(endOfWeek));
  }, []);

  // Socios filtrados
  const filteredSocios = useMemo(() => {
    return socios.filter((socio) => {
      const matchesCoach =
        !selectedCoach ||
        selectedCoach === "Todos" ||
        coaches.some(
          (coach) =>
            coach.id === selectedCoach &&
            socio.discipline.some((disc) => coach.disciplines.includes(disc)) &&
            socio.horarioPago === coach.horario
        );

      const matchesHorario = !selectedHorario || socio.horarioPago === selectedHorario;

      const paymentDate = new Date(socio.paymentDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesDateRange =
        (!start || paymentDate >= start) &&
        (!end || paymentDate <= end);

      return matchesCoach && matchesHorario && matchesDateRange;
    });
  }, [socios, selectedCoach, selectedHorario, startDate, endDate, coaches]);

  // Funciones de manejo de modales y acciones
  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setNewCoachName("");
    setNewCoachDisciplines([]);
    setNewCoachHorario("");
  }, []);

  const openManageModal = useCallback((coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (coach) {
      setEditCoachId(coachId);
      setEditCoachName(coach.name);
      setEditCoachDisciplines(coach.disciplines);
      setEditCoachHorario(coach.horario);
      setIsManageModalOpen(true);
    }
  }, [coaches]);

  const closeManageModal = useCallback(() => {
    setIsManageModalOpen(false);
    setEditCoachId(null);
    setEditCoachName("");
    setEditCoachDisciplines([]);
    setEditCoachHorario("");
  }, []);

  const deleteCoach = useCallback(async () => {
    if (!editCoachId || !window.confirm("¿Seguro que deseas eliminar este coach?")) return;

    setIsLoading(true);
    try {
      await remove(ref(realtimeDb, `coaches/${editCoachId}`));
      console.log("Coach eliminado exitosamente");
      alert("✅ Coach eliminado exitosamente");
      closeManageModal();
    } catch (error) {
      console.error("Error al eliminar el coach:", error);
      alert("❌ Error al eliminar el coach");
    } finally {
      setIsLoading(false);
    }
  }, [editCoachId, closeManageModal]);

  const handleDisciplineChange = useCallback((discipline: string, isEditMode: boolean = false) => {
    const setDisciplines = isEditMode ? setEditCoachDisciplines : setNewCoachDisciplines;
    setDisciplines((prev) =>
      prev.includes(discipline) ? prev.filter((d) => d !== discipline) : [...prev, discipline]
    );
  }, []);

  const saveCoach = useCallback(async () => {
    if (!newCoachName || newCoachDisciplines.length === 0 || !newCoachHorario) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      const newCoach = {
        name: newCoachName,
        disciplines: newCoachDisciplines,
        horario: newCoachHorario,
      };
      const newCoachRef = ref(realtimeDb, "coaches");
      await push(newCoachRef, newCoach);
      console.log("Guardado exitoso de coach");
      alert("✅ Coach guardado exitosamente");
      closeAddModal();
      if (newCoachNameRef.current) newCoachNameRef.current.focus();
    } catch (error) {
      console.error("Error al guardar el coach:", error);
      alert("❌ Error al guardar el coach");
    } finally {
      setIsLoading(false);
    }
  }, [newCoachName, newCoachDisciplines, newCoachHorario, closeAddModal]);

  const saveEditedCoach = useCallback(async () => {
    if (!editCoachId || !editCoachName || editCoachDisciplines.length === 0 || !editCoachHorario) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedCoach = {
        name: editCoachName,
        disciplines: editCoachDisciplines,
        horario: editCoachHorario,
      };
      const coachRef = ref(realtimeDb, `coaches/${editCoachId}`);
      await set(coachRef, updatedCoach);
      console.log("Actualización exitosa de coach");
      alert("✅ Coach actualizado exitosamente");
      closeManageModal();
      if (editCoachNameRef.current) editCoachNameRef.current.focus();
    } catch (error) {
      console.error("Error al actualizar el coach:", error);
      alert("❌ Error al actualizar el coach");
    } finally {
      setIsLoading(false);
    }
  }, [editCoachId, editCoachName, editCoachDisciplines, editCoachHorario, closeManageModal]);

  return (
    <Container>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Button onClick={openAddModal} disabled={isLoading}>
          Agregar Coach
        </Button>
        {selectedCoach && selectedCoach !== "Todos" && (
          <Button onClick={() => openManageModal(selectedCoach)} disabled={isLoading}>
            Editar Coach
          </Button>
        )}
      </div>

      <FilterContainer>
        <Select
          value={selectedCoach}
          onChange={(e) => setSelectedCoach(e.target.value)}
          disabled={isLoading}
          aria-label="Seleccionar coach"
        >
          <option value="">Selecciona un coach</option>
          <option value="Todos">Todos</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </Select>
        <Select
          value={selectedHorario}
          onChange={(e) => setSelectedHorario(e.target.value)}
          disabled={isLoading}
          aria-label="Seleccionar horario"
        >
          <option value="">Selecciona un horario</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </Select>
      </FilterContainer>

      <DateRangeContainer>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isLoading}
          aria-label="Fecha inicial"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isLoading}
          aria-label="Fecha final"
        />
      </DateRangeContainer>

      {selectedCoach && (
        <div>
          <h3>Número de registros: {filteredSocios.length}</h3>
        </div>
      )}

      {coachesError && <ErrorMessage>Error al cargar coaches: {coachesError}</ErrorMessage>}
      {sociosError && <ErrorMessage>Error al cargar socios: {sociosError}</ErrorMessage>}

      {filteredSocios.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <TableHeader>Número de Socio</TableHeader>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Disciplina(s)</TableHeader>
              <TableHeader>Monto de Pago</TableHeader>
              <TableHeader>Fecha de Pago</TableHeader>
              <TableHeader>Horario de Pago</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredSocios.map((socio) => (
              <TableRow key={socio.id}>
                <TableCell>{socio.memberNumber}</TableCell>
                <TableCell>{socio.fullName}</TableCell>
                <TableCell>{socio.discipline.join(", ")}</TableCell>
                <TableCell>{socio.amountPaid}</TableCell>
                <TableCell>{socio.paymentDate}</TableCell>
                <TableCell>{socio.horarioPago}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No hay registros para mostrar.</p>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeAddModal}
        style={customModalStyles}
        aria-labelledby="add-coach-modal"
      >
        <h2 id="add-coach-modal">Agregar Coach</h2>
        <Input
          type="text"
          placeholder="Nombre del coach"
          value={newCoachName}
          onChange={(e) => setNewCoachName(e.target.value)}
          disabled={isLoading}
          ref={newCoachNameRef}
          aria-label="Nombre del coach"
        />
        <DisciplineSelector
          disciplines={availableDisciplines}
          selectedDisciplines={newCoachDisciplines}
          onChange={(discipline) => handleDisciplineChange(discipline)}
          disabled={isLoading}
        />
        <Select
          value={newCoachHorario}
          onChange={(e) => setNewCoachHorario(e.target.value)}
          disabled={isLoading}
          aria-label="Horario del coach"
        >
          <option value="">Selecciona un horario</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </Select>
        <Button onClick={saveCoach} disabled={isLoading}>
          Guardar
        </Button>
        <Button onClick={closeAddModal} disabled={isLoading}>
          Cancelar
        </Button>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onRequestClose={closeManageModal}
        style={customModalStyles}
        aria-labelledby="edit-coach-modal"
      >
        <h2 id="edit-coach-modal">Editar Coach</h2>
        <Input
          type="text"
          placeholder="Nombre del coach"
          value={editCoachName}
          onChange={(e) => setEditCoachName(e.target.value)}
          disabled={isLoading}
          ref={editCoachNameRef}
          aria-label="Nombre del coach"
        />
        <DisciplineSelector
          disciplines={availableDisciplines}
          selectedDisciplines={editCoachDisciplines}
          onChange={(discipline) => handleDisciplineChange(discipline, true)}
          disabled={isLoading}
        />
        <Select
          value={editCoachHorario}
          onChange={(e) => setEditCoachHorario(e.target.value)}
          disabled={isLoading}
          aria-label="Horario del coach"
        >
          <option value="">Selecciona un horario</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </Select>
        <Button onClick={saveEditedCoach} disabled={isLoading}>
          Guardar Cambios
        </Button>
        <Button danger onClick={deleteCoach} disabled={isLoading}>
          Eliminar Coach
        </Button>
        <Button onClick={closeManageModal} disabled={isLoading}>
          Cancelar
        </Button>
      </Modal>
    </Container>
  );
};

export default CoachManager;