import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { realtimeDb } from "../firebase/Firebase";
import { ref, onValue } from "firebase/database";

// Definimos la interfaz para una actividad en el historial
interface Actividad {
  id: string;
  fecha: string;
  tipo: string; // Ej: "Pago", "Visita", "Edición"
  descripcion: string;
  memberNumber?: string; // Número de socio
  socioNombre?: string; // Opcional, nombre del socio
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

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  max-width: 200px;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  max-width: 200px;
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

// Estilos para el indicador visual de asistencias
const AsistenciaBadge = styled.div`
  background-color: #28a745;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 10px;
`;

const Historial: React.FC = () => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filtro, setFiltro] = useState<"global" | "porSocio">("global");
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("dia");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
  const [numeroSocio, setNumeroSocio] = useState("");
  const [totalAsistencias, setTotalAsistencias] = useState(0); // Contador de asistencias

  // Cargar actividades desde Firebase
  useEffect(() => {
    const actividadesRef = ref(realtimeDb, 'historial');
    onValue(actividadesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Recorrer las fechas y obtener las actividades
        const actividadesArray: Actividad[] = [];
        Object.keys(data).forEach((fecha) => {
          const actividadesDelDia = data[fecha];
          Object.keys(actividadesDelDia).forEach((id) => {
            actividadesArray.push({
              id,
              fecha,
              ...actividadesDelDia[id],
            });
          });
        });
        setActividades(actividadesArray);
      } else {
        setActividades([]);
      }
    });
  }, []);

  // Función para filtrar actividades por período de tiempo
  const filtrarPorPeriodo = (actividad: Actividad) => {
    const fechaActividad = new Date(actividad.fecha);
    const fechaInicio = new Date(fecha);

    switch (periodo) {
      case "dia": {
        return actividad.fecha === fecha;
      }
      case "semana": {
        const fechaFinSemana = new Date(fechaInicio);
        fechaFinSemana.setDate(fechaInicio.getDate() + 7);
        return fechaActividad >= fechaInicio && fechaActividad < fechaFinSemana;
      }
      case "mes": {
        const fechaFinMes = new Date(fechaInicio);
        fechaFinMes.setMonth(fechaInicio.getMonth() + 1);
        return fechaActividad >= fechaInicio && fechaActividad < fechaFinMes;
      }
      default: {
        return true;
      }
    }
  };

  // Filtrar actividades según la selección, período y número de socio
  const actividadesFiltradas = actividades.filter((actividad) => {
    const coincidePeriodo = filtrarPorPeriodo(actividad);

    if (filtro === "global") {
      return coincidePeriodo;
    } else {
      return coincidePeriodo && actividad.memberNumber === numeroSocio;
    }
  });

  // Contar el número de nodos (actividades) dentro del período seleccionado
  useEffect(() => {
    if (filtro === "global") {
      const count = actividadesFiltradas.length;
      setTotalAsistencias(count);
    }
  }, [filtro, actividadesFiltradas]);

  return (
    <Container>
      <h2>Historial de Actividades</h2>

      {/* Indicador visual de asistencias */}
      {filtro === "global" && (
        <AsistenciaBadge>
          {periodo === "dia" && `Asistencias hoy: ${totalAsistencias}`}
          {periodo === "semana" && `Asistencias esta semana: ${totalAsistencias}`}
          {periodo === "mes" && `Asistencias este mes: ${totalAsistencias}`}
        </AsistenciaBadge>
      )}

      <FilterContainer>
        <Select value={filtro} onChange={(e) => setFiltro(e.target.value as "global" | "porSocio")}>
          <option value="global">Global</option>
          <option value="porSocio">Por Socio</option>
        </Select>

        {filtro === "porSocio" && (
          <Input
            type="text"
            placeholder="Número de Socio"
            value={numeroSocio}
            onChange={(e) => setNumeroSocio(e.target.value)}
          />
        )}

        <Select value={periodo} onChange={(e) => setPeriodo(e.target.value as "dia" | "semana" | "mes")}>
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
        </Select>

        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </FilterContainer>

      <Table>
        <thead>
          <tr>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th>Descripción</Th>
            {filtro === "porSocio" && <Th>Socio</Th>}
          </tr>
        </thead>
        <tbody>
          {filtro === "global" ? (
            // Vista global: mostrar todas las actividades
            actividadesFiltradas.map((actividad) => (
              <tr key={actividad.id}>
                <Td>{actividad.fecha}</Td>
                <Td>{actividad.tipo}</Td>
                <Td>{actividad.descripcion}</Td>
              </tr>
            ))
          ) : (
            // Vista por socio: mostrar actividades filtradas
            actividadesFiltradas.map((actividad) => (
              <tr key={actividad.id}>
                <Td>{actividad.fecha}</Td>
                <Td>{actividad.tipo}</Td>
                <Td>{actividad.descripcion}</Td>
                <Td>{actividad.socioNombre || "N/A"}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default Historial;