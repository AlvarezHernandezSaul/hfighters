import { useState, useEffect, useCallback } from 'react';
import { realtimeDb } from "../firebase/Firebase";
import { ref, get } from "firebase/database";

interface AvailableNumbersData {
  availableNumbers: number[];
  usedNumbers: Set<number>;
  totalAvailable: number;
  isLoading: boolean;
  error: string | null;
}

export const useAvailableNumbers = () => {
  const [data, setData] = useState<AvailableNumbersData>({
    availableNumbers: [],
    usedNumbers: new Set(),
    totalAvailable: 0,
    isLoading: true,
    error: null
  });

  const fetchAvailableNumbers = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const sociosRef = ref(realtimeDb, "socios");
      const snapshot = await get(sociosRef);
      
      const usedNumbers = new Set<number>();
      
      if (snapshot.exists()) {
        const sociosData = snapshot.val();
        Object.values(sociosData).forEach((socio: any) => {
          const memberNumber = parseInt(socio.memberNumber, 10);
          if (!isNaN(memberNumber)) {
            usedNumbers.add(memberNumber);
          }
        });
      }

      // Generar lista de números disponibles (del 1 al 9999)
      const availableNumbers: number[] = [];
      for (let i = 1; i <= 9999; i++) {
        if (!usedNumbers.has(i)) {
          availableNumbers.push(i);
        }
      }

      setData({
        availableNumbers,
        usedNumbers,
        totalAvailable: availableNumbers.length,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error al obtener números disponibles:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, []);

  useEffect(() => {
    fetchAvailableNumbers();
  }, [fetchAvailableNumbers]);

  const refreshNumbers = useCallback(() => {
    fetchAvailableNumbers();
  }, [fetchAvailableNumbers]);

  const getNextAvailableNumber = useCallback((): number | null => {
    return data.availableNumbers.length > 0 ? data.availableNumbers[0] : null;
  }, [data.availableNumbers]);

  const getAvailableNumbersInRange = useCallback((start: number, end: number): number[] => {
    return data.availableNumbers.filter(num => num >= start && num <= end);
  }, [data.availableNumbers]);

  return {
    ...data,
    refreshNumbers,
    getNextAvailableNumber,
    getAvailableNumbersInRange
  };
};
