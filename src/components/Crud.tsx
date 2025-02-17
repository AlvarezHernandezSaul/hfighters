import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { realtimeDb } from "../firebase/Firebase";
import { ref, onValue, remove, update } from "firebase/database";
import Modal from 'react-modal';

// Definimos la interfaz para Socio
interface Socio {
  id: string;
  fullName: string;
  discipline: string[];
  paymentDate: string;
  cutoffDate: string;
  amountPaid: string;
  location: string;
  socialMedia?: string;
  memberNumber: string; // Nuevo campo para el número de socio
}

// Estilos generales
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

const Button = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  transition: background 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const DeleteButton = styled(Button)`
  background-color: red;

  &:hover {
    background-color: darkred;
  }
`;

const StyledModal = styled(Modal)`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  margin: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  position: absolute;

  @media (max-width: 600px) {
    width: 95%;
    padding: 15px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const PaginateButton = styled(Button)`
  margin: 5px;
`;

const DisciplineContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const AddedDiscipline = styled.div`
  background: #007bff;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
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

// Filtros y búsqueda
const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Crud: React.FC = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const sociosRef = ref(realtimeDb, 'socios');
    onValue(sociosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sociosArray = Object.keys(data).map((key) => ({ id: key, ...data[key] })) as Socio[];
        setSocios(sociosArray);
        setFilteredSocios(sociosArray);
      } else {
        setSocios([]);
        setFilteredSocios([]);
      }
    });
  }, []);

  const calculateStatus = (cutoffDate: string): string => {
    const today = new Date();
    const cutoff = new Date(cutoffDate);
    const difference = Math.ceil((cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (difference > 5) return "A tiempo";
    if (difference > 0) return "Por vencer";
    return "Pago pendiente";
  };

  const handleEdit = (socio: Socio) => {
    setEditingSocio(socio);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingSocio) return;
    setEditingSocio({ ...editingSocio, [e.target.name]: e.target.value });
  };

  const handleDisciplineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisc = e.target.value.trim();
    if (newDisc && editingSocio && !editingSocio.discipline.includes(newDisc)) {
      setEditingSocio({
        ...editingSocio,
        discipline: [...editingSocio.discipline, newDisc],
      });
    }
  };

  const removeDiscipline = (discipline: string) => {
    if (editingSocio) {
      setEditingSocio({
        ...editingSocio,
        discipline: editingSocio.discipline.filter((disc) => disc !== discipline),
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el envío del formulario
    if (editingSocio) {
      await update(ref(realtimeDb, `socios/${editingSocio.id}`), editingSocio);
      setEditingSocio(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este socio?")) {
      await remove(ref(realtimeDb, `socios/${id}`));
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    filterSocios(event.target.value, statusFilter);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
    filterSocios(searchQuery, event.target.value);
  };

  const filterSocios = (query: string, status: string | null) => {
    let filtered = socios.filter((socio) =>
      socio.fullName.toLowerCase().includes(query.toLowerCase())
    );

    if (status) {
      filtered = filtered.filter((socio) => calculateStatus(socio.cutoffDate) === status);
    }

    setFilteredSocios(filtered);
  };

  const paginateSocios = (page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const selectedSocios = filteredSocios.slice(startIndex, startIndex + itemsPerPage);
    return selectedSocios;
  };

  const totalPages = Math.ceil(filteredSocios.length / itemsPerPage);

  return (
    <Container>
      <h2>Gestión de Socios</h2>

      <FilterContainer>
        <Input
          type="text"
          placeholder="Buscar por nombre"
          value={searchQuery}
          onChange={handleSearch}
        />
        <select onChange={handleStatusChange} value={statusFilter || ""}>
          <option value="">Filtrar por estatus</option>
          <option value="A tiempo">A tiempo</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Pago pendiente">Pago pendiente</option>
        </select>
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <Th>NS</Th>
            <Th>Nombre</Th>
            <Th>Pago</Th>
            <Th>Fecha Límite</Th>
            <Th>Locación</Th>
            <Th>Red Social</Th>
            <Th>Estatus</Th>
            <Th>Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {paginateSocios(currentPage).map((socio) => (
            <tr key={socio.id}>
              <Td>{socio.memberNumber}</Td>
              <Td>{socio.fullName}</Td>
              <Td>${socio.amountPaid}</Td>
              <Td>{socio.cutoffDate}</Td>
              <Td>{socio.location}</Td>
              <Td>{socio.socialMedia || "N/A"}</Td>
              <Td>
                <StatusBadge status={calculateStatus(socio.cutoffDate)}>
                  {calculateStatus(socio.cutoffDate)}
                </StatusBadge>
              </Td>
              <Td>
                <Button onClick={() => handleEdit(socio)}>Editar</Button>
                <DeleteButton onClick={() => handleDelete(socio.id)}>Eliminar</DeleteButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div>
        {totalPages > 1 && (
          <div>
            <PaginateButton onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Anterior
            </PaginateButton>
            <PaginateButton onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Siguiente
            </PaginateButton>
          </div>
        )}
      </div>

      {editingSocio && (
        <StyledModal isOpen={!!editingSocio} onRequestClose={() => setEditingSocio(null)}>
          <h2>Editar Socio</h2>
          <Form onSubmit={handleUpdate}> {/* Agregar onSubmit al formulario */}
            <label>Nombre Completo:</label>
            <Input type="text" name="fullName" value={editingSocio.fullName} onChange={handleChange} />
            <label>Fecha de Pago:</label>
            <Input type="date" name="paymentDate" value={editingSocio.paymentDate} onChange={handleChange} />
            <label>Fecha de Corte:</label>
            <Input type="date" name="cutoffDate" value={editingSocio.cutoffDate} onChange={handleChange} />
            <label>Monto Pagado:</label>
            <Input type="text" name="amountPaid" value={editingSocio.amountPaid} onChange={handleChange} />
            <label>Disciplinas:</label>
            <DisciplineContainer>
              <Select onChange={handleDisciplineChange}>
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
                  <RemoveButton onClick={() => removeDiscipline(disc)}>×</RemoveButton>
                </AddedDiscipline>
              ))}
            </div>
            <ButtonGroup>
              <Button type="submit">Guardar</Button> {/* Cambiar a type="submit" */}
              <DeleteButton onClick={() => setEditingSocio(null)}>Cancelar</DeleteButton>
            </ButtonGroup>
          </Form>
        </StyledModal>
      )}
    </Container>
  );
};

export default Crud;