import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { realtimeDb } from "../firebase/Firebase";
import { ref, get, set } from "firebase/database";

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

const Container = styled.div`
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  
  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button<{ danger?: boolean }>`
  background-color: ${(props) => (props.danger ? '#dc3545' : '#007bff')};
  color: #fff;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
  margin: 10px 5px;

  &:hover {
    background-color: ${(props) => (props.danger ? '#c82333' : '#0056b3')};
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  grid-column: 1 / -1;
`;

const InfoBox = styled.div`
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  margin: 5px 0;
  color: #0056b3;
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 12px;
  margin: 10px 0;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px;
  margin: 10px 0;
  text-align: center;
`;

const PreviewBox = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const PreviewTitle = styled.h3`
  color: #484d44;
  border-bottom: 2px solid #484d44;
  padding-bottom: 5px;
  margin-bottom: 15px;
`;

const PreviewPrice = styled.p`
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0;
  color: #333;
`;

const PreviewRule = styled.p`
  font-size: 16px;
  margin: 5px 0;
  color: #666;
`;

const PriceManager: React.FC = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar precios desde Firebase
  const loadPrices = useCallback(async () => {
    try {
      const pricesRef = ref(realtimeDb, 'prices');
      const snapshot = await get(pricesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPrices(data);
      }
    } catch (error) {
      console.error('Error al cargar precios:', error);
      setMessage({ type: 'error', text: 'Error al cargar los precios desde la base de datos' });
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const handleInputChange = (field: keyof PriceData, value: string) => {
    // Solo permitir números
    if (!/^\d*$/.test(value)) return;
    
    setPrices(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    setMessage(null);
  };

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos los campos tengan valores
    const emptyFields = Object.entries(prices).filter(([_, value]) => !value || value === '0');
    if (emptyFields.length > 0) {
      setMessage({ type: 'error', text: 'Todos los precios deben tener un valor mayor a 0' });
      return;
    }

    setIsLoading(true);
    try {
      const pricesRef = ref(realtimeDb, 'prices');
      await set(pricesRef, prices);
      
      setMessage({ type: 'success', text: '✅ Precios actualizados exitosamente' });
      setHasChanges(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error al guardar precios:', error);
      setMessage({ type: 'error', text: 'Error al guardar los precios. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  }, [prices]);

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que deseas descartar los cambios?')) {
      loadPrices();
      setHasChanges(false);
      setMessage(null);
    }
  };

  return (
    <Container>
      <Title>Gestión de Precios</Title>
      
      <InfoBox>
        <InfoText><strong>Función:</strong> Editar los precios que se muestran en la página principal</InfoText>
        <InfoText><strong>Nota:</strong> Los cambios se reflejarán inmediatamente en la página de inicio</InfoText>
      </InfoBox>

      {message && (
        message.type === 'success' ? 
          <SuccessMessage>{message.text}</SuccessMessage> :
          <ErrorMessage>{message.text}</ErrorMessage>
      )}

      <Form onSubmit={handleSave}>
        <FormGroup>
          <Label>🏋️ GYM ($)</Label>
          <Input
            type="text"
            value={prices.gym}
            onChange={(e) => handleInputChange('gym', e.target.value)}
            placeholder="380"
          />
        </FormGroup>

        <FormGroup>
          <Label>🥊 MMA & KICKBOXING ($)</Label>
          <Input
            type="text"
            value={prices.mma_kickboxing}
            onChange={(e) => handleInputChange('mma_kickboxing', e.target.value)}
            placeholder="400"
          />
        </FormGroup>

        <FormGroup>
          <Label>🤼 WRESTLING ($)</Label>
          <Input
            type="text"
            value={prices.wrestling}
            onChange={(e) => handleInputChange('wrestling', e.target.value)}
            placeholder="400"
          />
        </FormGroup>

        <FormGroup>
          <Label>💪 VISITA O CLASE ($)</Label>
          <Input
            type="text"
            value={prices.visita_clase}
            onChange={(e) => handleInputChange('visita_clase', e.target.value)}
            placeholder="50"
          />
        </FormGroup>

        <FormGroup>
          <Label>🔥 CROSSFIT ($)</Label>
          <Input
            type="text"
            value={prices.crossfit}
            onChange={(e) => handleInputChange('crossfit', e.target.value)}
            placeholder="380"
          />
        </FormGroup>

        <FormGroup>
          <Label>🔹 2 ACTIVIDADES ($)</Label>
          <Input
            type="text"
            value={prices.dos_actividades}
            onChange={(e) => handleInputChange('dos_actividades', e.target.value)}
            placeholder="580"
          />
        </FormGroup>

        <FormGroup>
          <Label>PLAN FAMILIAR - 4 PERSONAS ($)</Label>
          <Input
            type="text"
            value={prices.plan_familiar}
            onChange={(e) => handleInputChange('plan_familiar', e.target.value)}
            placeholder="1350"
          />
        </FormGroup>

        <FormGroup>
          <Label>PLAN AMIGOS - 3 PERSONAS ($)</Label>
          <Input
            type="text"
            value={prices.plan_amigos}
            onChange={(e) => handleInputChange('plan_amigos', e.target.value)}
            placeholder="1050"
          />
        </FormGroup>

        <FormGroup>
          <Label>ACTIVIDAD EXTRA POR PERSONA ($)</Label>
          <Input
            type="text"
            value={prices.actividad_extra}
            onChange={(e) => handleInputChange('actividad_extra', e.target.value)}
            placeholder="200"
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="submit" disabled={isLoading || !hasChanges}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          <Button type="button" danger onClick={handleReset} disabled={isLoading || !hasChanges}>
            Descartar Cambios
          </Button>
        </ButtonGroup>
      </Form>

      <PreviewBox>
        <PreviewTitle>PRECIOS - Vista Previa</PreviewTitle>
        <PreviewPrice>🏋️ GYM: ${prices.gym}</PreviewPrice>
        <PreviewPrice>🥊 MMA & KICKBOXING: ${prices.mma_kickboxing}</PreviewPrice>
        <PreviewPrice>🤼 WRESTLING: ${prices.wrestling}</PreviewPrice>
        <PreviewPrice>💪 VISITA O CLASE: ${prices.visita_clase}</PreviewPrice>
        <PreviewPrice>🔥 CROSSFIT: ${prices.crossfit}</PreviewPrice>
        <PreviewPrice>🔹 2 ACTIVIDADES: ${prices.dos_actividades}</PreviewPrice>
        <PreviewRule>PLAN FAMILIAR: 4 PERSONAS X ${prices.plan_familiar}</PreviewRule>
        <PreviewRule>PLAN AMIGOS: 3 PERSONAS X ${prices.plan_amigos}</PreviewRule>
        <PreviewRule>❗❗IMPORTANTE❗❗ PAGO EN UNA SOLA EXIBICIÓN</PreviewRule>
        <PreviewRule>1 ACTIVIDAD POR PERSONA</PreviewRule>
        <PreviewRule>(ACTIVIDAD EXTRA POR PERSONA ${prices.actividad_extra} EXTRA)</PreviewRule>
      </PreviewBox>
    </Container>
  );
};

export default PriceManager;
