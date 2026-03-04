import { useState, useEffect } from 'react';
import { realtimeDb } from './Firebase';
import { ref, onValue } from 'firebase/database';

interface FirebaseData {
  [key: string]: any;
}

interface UseFirebaseDataReturn {
  data: FirebaseData;
  error: string | null;
}

const useFirebaseData = (path: string): UseFirebaseDataReturn => {
  const [data, setData] = useState<FirebaseData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dbRef = ref(realtimeDb, path);
    let previousData: FirebaseData = {};
    let timeoutId: NodeJS.Timeout;

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const newData = snapshot.val() || {};
        if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setData(newData);
            previousData = newData;
          }, 300); // Retraso de 300ms para evitar saturación en producción
        }
      },
      (error) => {
        setError(error.message);
        console.error('Error en onValue:', error);
      },
      { onlyOnce: false }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [path]);

  return { data, error };
};

export default useFirebaseData;