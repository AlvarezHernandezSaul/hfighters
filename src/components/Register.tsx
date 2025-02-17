import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { realtimeDb } from "../firebase/Firebase";
import { ref, push, get, query, orderByChild, equalTo } from "firebase/database";

// Estilos generales mejorados
const FormContainer = styled.div`
  background-color: #fff;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  max-width: 650px;
  margin: auto;
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

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
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
`;

const DisciplineContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 5px;
  flex-wrap: wrap; /* Permite que las disciplinas se acomoden en varias filas si es necesario */
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

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    discipline: [] as string[],
    paymentDate: '',
    cutoffDate: '',
    amountPaid: '',
    location: '',
    socialMedia: '',
    memberNumber: '',
  });

  const [newDiscipline, setNewDiscipline] = useState('');
  const [memberNumberAvailable, setMemberNumberAvailable] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const cutoffDate = nextMonth.toISOString().split('T')[0];

    setFormData((prevData) => ({
      ...prevData,
      paymentDate: today,
      cutoffDate: cutoffDate,
    }));

    generateMemberNumber();
  }, []);

  const generateMemberNumber = async () => {
    let newMemberNumber = 1;
    let isAvailable = false;

    while (!isAvailable) {
      const memberNumberRef = query(ref(realtimeDb, 'socios'), orderByChild('memberNumber'), equalTo(newMemberNumber.toString()));
      const snapshot = await get(memberNumberRef);

      if (!snapshot.exists()) {
        isAvailable = true;
      } else {
        newMemberNumber++;
      }
    }

    setFormData(prev => ({ ...prev, memberNumber: newMemberNumber.toString() }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'paymentDate') {
      const newCutoffDate = new Date(value);
      newCutoffDate.setMonth(newCutoffDate.getMonth() + 1);
      setFormData({
        ...formData,
        paymentDate: value,
        cutoffDate: newCutoffDate.toISOString().split('T')[0],
      });
    }

    if (name === 'memberNumber') {
      checkMemberNumberAvailability(value);
    }
  };

  const checkMemberNumberAvailability = async (memberNumber: string) => {
    const memberNumberRef = query(ref(realtimeDb, 'socios'), orderByChild('memberNumber'), equalTo(memberNumber));
    const snapshot = await get(memberNumberRef);

    if (snapshot.exists()) {
      setMemberNumberAvailable(false);
    } else {
      setMemberNumberAvailable(true);
    }
  };

  const addDiscipline = (discipline: string) => {
    if (discipline && !formData.discipline.includes(discipline)) {
      setFormData({
        ...formData,
        discipline: [...formData.discipline, discipline],
      });
    }
  };

  const removeDiscipline = (disciplineToRemove: string) => {
    setFormData({
      ...formData,
      discipline: formData.discipline.filter(disc => disc !== disciplineToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberNumberAvailable) {
      alert("⚠️ El número de socio ya está en uso. Por favor, elige otro.");
      return;
    }

    try {
      const dbRef = ref(realtimeDb, 'socios');
      await push(dbRef, formData);
      alert('✅ Datos guardados exitosamente');
      setFormData({
        fullName: '',
        discipline: [],
        paymentDate: '',
        cutoffDate: '',
        amountPaid: '',
        location: '',
        socialMedia: '',
        memberNumber: '',
      });
      generateMemberNumber();
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      alert("❌ Error al guardar los datos");
    }
  };

  return (
    <FormContainer>
      <h2>Registro de Nuevos Socios</h2>
      <form onSubmit={handleSubmit}>
        <FormField>
          <Label>Número de Socio</Label>
          <Input
            type="text"
            name="memberNumber"
            value={formData.memberNumber}
            onChange={handleChange}
            required
            style={{ borderColor: memberNumberAvailable ? '#ddd' : 'red' }}
          />
          {!memberNumberAvailable && <span style={{ color: 'red' }}>Número de socio no disponible</span>}
        </FormField>

        <FormField>
          <Label>Nombre Completo</Label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </FormField>

        <FormField>
          <Label>Disciplina</Label>
          <DisciplineContainer>
            <Select name="newDiscipline" value={newDiscipline} onChange={(e) => {
              setNewDiscipline(e.target.value);
              addDiscipline(e.target.value);
            }}>
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
            <Input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
          </FormField>
          <FormField>
            <Label>Fecha Corte</Label>
            <Input type="date" name="cutoffDate" value={formData.cutoffDate} onChange={handleChange} required />
          </FormField>
          <FormField>
            <Label>Cantidad Pago</Label>
            <Input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleChange} required />
          </FormField>
        </GridContainer>

        <GridContainer>
          <FormField>
            <Label>Locación</Label>
            <Input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </FormField>
          <FormField>
            <Label>Red Social (opcional)</Label>
            <Input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleChange} />
          </FormField>
        </GridContainer>

        <Button type="submit">Guardar</Button>
      </form>
    </FormContainer>
  );
};

export default Register;