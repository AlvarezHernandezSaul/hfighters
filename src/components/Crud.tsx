import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { realtimeDb } from "../firebase/Firebase";
import { ref, remove, update } from "firebase/database";
import Modal from 'react-modal';
import useFirebaseData from '../firebase/useFirebaseData';

// Interface (sin cambios)
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

// Estilos corregidos
const Container = styled.div`
  max-width: 900px;
  margin: auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const Th = styled.th`
  background-color: #000;
  color: white;
  padding: 10px;
`;

const Td = styled.td`
  padding: 10px;
  border-bottom: 1px solid #ddd;
  text-align: center;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
  color: white;
  background-color: ${(props) =>
    props.status === "A tiempo" ? "green" :
    props.status === "Por vencer" ? "orange" : "red"};
`;

const Button = styled.button<{ danger?: boolean }>`
  background-color: ${(props) => (props.danger ? "#e63946" : "#007bff")};
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin: 5px;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.danger ? "#b32d38" : "#0056b3")};
  }

  &:disabled {
    background-color: #999;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    padding: 6px 12px;
    font-size: 0.875rem;
  }
`;

const StyledModal = styled(Modal)`
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 550px;
  max-height: 85vh; /* Limita la altura máxima al 85% del viewport */
  margin: 0 auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: none;
  overflow-y: auto; /* Permite scroll vertical si el contenido excede */
  overflow-x: hidden; /* Evita scroll horizontal */
  box-sizing: border-box;

  h2 {
    margin: 0 0 1rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: #333;
    text-align: center;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  @media (max-width: 600px) {
    width: 90%;
    padding: 1rem;
    max-width: 100%;
    max-height: 80vh; /* Ajusta la altura máxima en móviles */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    h2 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const Label = styled.label`
  font-size: 1rem;
  font-weight: 500;
  color: #444;
  margin-bottom: 0.25rem;

  @media (max-width: 600px) {
    font-size: 0.875rem;
  }
`;

const Input = styled.input<{ error?: boolean }>`
  padding: 10px;
  border: 1px solid ${(props) => (props.error ? "#e63946" : "#ccc")};
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  background-color: #f9f9f9;
  transition: border-color 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    outline: none;
    background-color: #fff;
  }

  @media (max-width: 600px) {
    padding: 8px;
    font-size: 0.875rem;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  background-color: #f9f9f9;
  transition: border-color 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    outline: none;
    background-color: #fff;
  }

  @media (max-width: 600px) {
    padding: 8px;
    font-size: 0.875rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  gap: 0.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    margin-top: 1rem;
  }
`;

const PaginateButton = styled(Button)`
  margin: 5px;
`;

const DisciplineContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  width: 100%;
`;

const AddedDiscipline = styled.div`
  background: #007bff;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 600px) {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
`;

const RemoveButton = styled.button`
  background: #e63946;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;

  &:hover {
    background: #b32d38;
  }

  @media (max-width: 600px) {
    width: 16px;
    height: 16px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const ErrorMessage = styled.span`
  color: #e63946;
  font-size: 0.875rem;
  margin-top: 0.25rem;

  @media (max-width: 600px) {
    font-size: 0.75rem;
  }
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

const Crud: React.FC = () => {
  const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [dateError, setDateError] = useState({ paymentDate: false, cutoffDate: false });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fullNameRef = useRef<HTMLInputElement>(null);
  const paymentDateRef = useRef<HTMLInputElement>(null);
  const cutoffDateRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const socialMediaRef = useRef<HTMLInputElement>(null);
  const disciplineSelectRef = useRef<HTMLSelectElement>(null);

  const { data: sociosData, error } = useFirebaseData('socios');

  const sociosArray = useMemo(() => {
    if (!sociosData || error) return [];
    return Object.keys(sociosData).map((key) => ({
      id: key,
      fullName: sociosData[key].fullName || '',
      discipline: sociosData[key].discipline || [],
      paymentDate: sociosData[key].paymentDate || '',
      cutoffDate: sociosData[key].cutoffDate || '',
      amountPaid: sociosData[key].amountPaid || '',
      location: sociosData[key].location || '',
      socialMedia: sociosData[key].socialMedia || '',
      memberNumber: sociosData[key].memberNumber || '',
      horarioPago: sociosData[key].horarioPago || '',
    })) as Socio[];
  }, [sociosData, error]);

  const calculateStatus = useCallback((cutoffDate: string): string => {
    const today = new Date();
    const cutoff = new Date(cutoffDate);
    const difference = Math.ceil((cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return difference > 5 ? "A tiempo" : difference > 0 ? "Por vencer" : "Pago pendiente";
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...sociosArray];

    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter((socio) =>
        socio.fullName.toLowerCase().includes(queryLower) ||
        socio.memberNumber.toLowerCase().includes(queryLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((socio) => calculateStatus(socio.cutoffDate) === statusFilter);
    }

    setFilteredSocios(filtered);
  }, [sociosArray, searchQuery, statusFilter, calculateStatus]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este socio?")) return;

    setIsLoading(true);
    try {
      await remove(ref(realtimeDb, `socios/${id}`));
      console.log('Socio eliminado exitosamente');
      setSuccessMessage("Socio eliminado exitosamente");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error al eliminar el socio:", error);
      alert("Hubo un error al eliminar el socio.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEdit = useCallback((socio: Socio) => {
    setEditingSocio(socio);
    setDateError({ paymentDate: false, cutoffDate: false });
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

  const updateCutoffDate = useCallback((paymentDate: string) => {
    if (!isValidDateFormat(paymentDate) || paymentDate.length !== 10) return null;

    const payment = new Date(paymentDate);
    if (isNaN(payment.getTime())) return null;

    const cutoff = new Date(payment);
    cutoff.setDate(payment.getDate() + 30);
    return cutoff.toISOString().split("T")[0];
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editingSocio) return;
      const { name, value } = e.target;

      if (name === "paymentDate") {
        if (!isValidDateFormat(value)) {
          setDateError((prev) => ({ ...prev, paymentDate: true }));
          return;
        } else {
          setDateError((prev) => ({ ...prev, paymentDate: false }));
        }

        const newCutoffDate = updateCutoffDate(value);
        setEditingSocio({
          ...editingSocio,
          paymentDate: value,
          cutoffDate: newCutoffDate || editingSocio.cutoffDate,
        });
      } else if (name === "cutoffDate") {
        if (!isValidDateFormat(value)) {
          setDateError((prev) => ({ ...prev, cutoffDate: true }));
          return;
        } else {
          setDateError((prev) => ({ ...prev, cutoffDate: false }));
        }
        setEditingSocio({ ...editingSocio, cutoffDate: value });
      } else {
        setEditingSocio({ ...editingSocio, [name]: value });
      }
    },
    [editingSocio, updateCutoffDate]
  );

  const handleDisciplineChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDisc = e.target.value.trim();
      if (newDisc && editingSocio && !editingSocio.discipline.includes(newDisc)) {
        setEditingSocio({
          ...editingSocio,
          discipline: [...editingSocio.discipline, newDisc],
        });
      }
    },
    [editingSocio]
  );

  const removeDiscipline = useCallback(
    (discipline: string) => {
      if (editingSocio) {
        setEditingSocio({
          ...editingSocio,
          discipline: editingSocio.discipline.filter((disc) => disc !== discipline),
        });
      }
    },
    [editingSocio]
  );

  const handleUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingSocio) return;

      if (dateError.paymentDate || dateError.cutoffDate) {
        alert("⚠️ Por favor, corrige las fechas inválidas.");
        return;
      }

      setIsLoading(true);
      try {
        await update(ref(realtimeDb, `socios/${editingSocio.id}`), editingSocio);
        console.log('Socio actualizado exitosamente');
        setSuccessMessage("Socio actualizado exitosamente");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setEditingSocio(null);
        if (fullNameRef.current) fullNameRef.current.focus();
      } catch (error: unknown) {
        console.error("Error al actualizar el socio:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert("❌ Error al actualizar el socio: " + errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [editingSocio]
  );

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value || null);
    setCurrentPage(1);
  }, []);

  const paginateSocios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSocios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSocios, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSocios.length / itemsPerPage);

  return (
    <Container>
      <h2>Gestión de Socios</h2>

      {showSuccessMessage && (
        <SuccessMessage>
          ✅ {successMessage}
        </SuccessMessage>
      )}

      <FilterContainer>
        <Input
          type="text"
          placeholder="Buscar por nombre o número de socio"
          value={searchQuery}
          onChange={handleSearch}
          disabled={isLoading}
        />
        <select onChange={handleStatusChange} value={statusFilter || ""} disabled={isLoading}>
          <option value="">Filtrar por estatus</option>
          <option value="A tiempo">A tiempo</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Pago pendiente">Pago pendiente</option>
        </select>
      </FilterContainer>

      {error && <p style={{ color: 'red' }}>Error al cargar datos: {error}</p>}

      <Table>
        <thead>
          <tr>
            <Th>NS</Th>
            <Th>Nombre</Th>
            <Th>Pago</Th>
            <Th>Fecha Límite</Th>
            <Th>Locación</Th>
            <Th>Red Social</Th>
            <Th>Horario de Pago</Th>
            <Th>Estatus</Th>
            <Th>Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {paginateSocios.map((socio) => (
            <tr key={socio.id}>
              <Td>{socio.memberNumber}</Td>
              <Td>{socio.fullName}</Td>
              <Td>${socio.amountPaid}</Td>
              <Td>{socio.cutoffDate}</Td>
              <Td>{socio.location}</Td>
              <Td>{socio.socialMedia || "N/A"}</Td>
              <Td>{socio.horarioPago || "N/A"}</Td>
              <Td>
                <StatusBadge status={calculateStatus(socio.cutoffDate)}>
                  {calculateStatus(socio.cutoffDate)}
                </StatusBadge>
              </Td>
              <Td>
                <Button onClick={() => handleEdit(socio)} disabled={isLoading}>Editar</Button>
                <Button danger onClick={() => handleDelete(socio.id)} disabled={isLoading}>Eliminar</Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div>
        {totalPages > 1 && (
          <div>
            <PaginateButton onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
              Anterior
            </PaginateButton>
            <PaginateButton onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages || isLoading}>
              Siguiente
            </PaginateButton>
          </div>
        )}
      </div>

      {editingSocio && (
        <StyledModal isOpen={!!editingSocio} onRequestClose={() => setEditingSocio(null)}>
          <h2>Editar Socio</h2>
          <Form onSubmit={handleUpdate}>
            <Label>Nombre Completo:</Label>
            <Input
              type="text"
              name="fullName"
              value={editingSocio.fullName}
              onChange={handleChange}
              disabled={isLoading}
              ref={fullNameRef}
            />
            <Label>Fecha de Pago:</Label>
            <Input
              type="date"
              name="paymentDate"
              value={editingSocio.paymentDate}
              onChange={handleChange}
              disabled={isLoading}
              ref={paymentDateRef}
              error={dateError.paymentDate}
            />
            {dateError.paymentDate && <ErrorMessage>Fecha inválida</ErrorMessage>}
            <Label>Fecha de Corte:</Label>
            <Input
              type="date"
              name="cutoffDate"
              value={editingSocio.cutoffDate}
              onChange={handleChange}
              disabled={isLoading}
              ref={cutoffDateRef}
              error={dateError.cutoffDate}
            />
            {dateError.cutoffDate && <ErrorMessage>Fecha inválida</ErrorMessage>}
            <Label>Monto Pagado:</Label>
            <Input
              type="text"
              name="amountPaid"
              value={editingSocio.amountPaid}
              onChange={handleChange}
              disabled={isLoading}
              ref={amountPaidRef}
            />
            <Label>Locación:</Label>
            <Input
              type="text"
              name="location"
              value={editingSocio.location}
              onChange={handleChange}
              disabled={isLoading}
              ref={locationRef}
            />
            <Label>Red Social (opcional):</Label>
            <Input
              type="text"
              name="socialMedia"
              value={editingSocio.socialMedia || ""}
              onChange={handleChange}
              disabled={isLoading}
              ref={socialMediaRef}
            />
            <Label>Disciplinas:</Label>
            <DisciplineContainer>
              <Select onChange={handleDisciplineChange} disabled={isLoading} ref={disciplineSelectRef}>
                <option value="">Selecciona una disciplina</option>
                <option value="Gym">Gym</option>
                <option value="MMA & KICK BOXING">MMA & KICK BOXING</option>
                <option value="CROSSFIT">CROSSFIT</option>
                <option value="BOX">BOX</option>
                <option value="KICK BOXING">KICK BOXING</option>
                <option value="KICK BOXING KIDS">KICK BOXING KIDS</option>
              </Select>
            </DisciplineContainer>
            <div>
              {editingSocio.discipline.map((disc, index) => (
                <AddedDiscipline key={index}>
                  {disc}
                  <RemoveButton onClick={() => removeDiscipline(disc)} disabled={isLoading}>×</RemoveButton>
                </AddedDiscipline>
              ))}
            </div>
            <ButtonGroup>
              <Button type="submit" disabled={isLoading}>Guardar</Button>
              <Button danger onClick={() => setEditingSocio(null)} disabled={isLoading}>Cancelar</Button>
            </ButtonGroup>
          </Form>
        </StyledModal>
      )}
    </Container>
  );
};

export default Crud;