import React, { createContext, useContext, useState, useEffect } from 'react';

// Interface para el contexto
interface DateTimeContextType {
  currentDateTime: Date;
  getFormattedDate: () => string; // Formato YYYY-MM-DD
  getFormattedDateTime: () => string; // Formato completo ISO
}

// Contexto
const DateTimeContext = createContext<DateTimeContextType | undefined>(undefined);

// Proveedor del contexto
export const DateTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Función para obtener la hora desde internet con timeout
  const fetchDateTimeFromServer = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      const response = await fetch('https://worldtimeapi.org/api/timezone/America/Mexico_City', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const serverDate = new Date(data.datetime);
      setCurrentDateTime(serverDate);
      console.log('Hora sincronizada con servidor:', serverDate.toLocaleString());
    } catch (error) {
      console.error('Error al obtener la hora del servidor:', error);
      // Fallback a la hora local si falla
      const localDate = new Date();
      setCurrentDateTime(localDate);
      console.log('Usando hora local como fallback:', localDate.toLocaleString());
    }
  };

  // Actualizar la hora cada segundo y sincronizar al inicio
  useEffect(() => {
    fetchDateTimeFromServer(); // Sincroniza al cargar
    const interval = setInterval(() => {
      setCurrentDateTime((prev) => new Date(prev.getTime() + 1000)); // Incrementa localmente
    }, 1000);

    return () => clearInterval(interval); // Limpia el intervalo al desmontar
  }, []);

  // Formato YYYY-MM-DD
  const getFormattedDate = () => {
    return currentDateTime.toISOString().split('T')[0];
  };

  // Formato completo ISO (YYYY-MM-DDTHH:MM:SSZ)
  const getFormattedDateTime = () => {
    return currentDateTime.toISOString();
  };

  const value = {
    currentDateTime,
    getFormattedDate,
    getFormattedDateTime,
  };

  return (
    <DateTimeContext.Provider value={value}>
      {children}
    </DateTimeContext.Provider>
  );
};

// Hook para usar el contexto
export const useDateTime = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTime debe usarse dentro de un DateTimeProvider');
  }
  return context;
};