import { realtimeDb } from "../firebase/Firebase";
import { ref, get, remove, set } from "firebase/database";

interface SocioData {
  id: string;
  fullName: string;
  cutoffDate: string;
  memberNumber: string;
  [key: string]: any;
}

class AutoCleanupService {
  private static instance: AutoCleanupService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  private readonly INACTIVE_THRESHOLD_DAYS = 60; // 2 meses = 60 días

  private constructor() {}

  static getInstance(): AutoCleanupService {
    if (!AutoCleanupService.instance) {
      AutoCleanupService.instance = new AutoCleanupService();
    }
    return AutoCleanupService.instance;
  }

  // Iniciar el servicio de limpieza automática
  start(): void {
    if (this.intervalId) {
      console.log('El servicio de limpieza automática ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando servicio de limpieza automática de usuarios inactivos');
    
    // Ejecutar inmediatamente al iniciar
    this.performCleanup();
    
    // Programar ejecución cada 24 horas
    this.intervalId = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  // Detener el servicio
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Servicio de limpieza automática detenido');
    }
  }

  // Obtener usuarios inactivos
  private async getInactiveUsers(): Promise<SocioData[]> {
    try {
      const sociosRef = ref(realtimeDb, 'socios');
      const snapshot = await get(sociosRef);

      if (!snapshot.exists()) {
        return [];
      }

      const sociosData = snapshot.val();
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() - this.INACTIVE_THRESHOLD_DAYS);

      const inactiveUsers: SocioData[] = [];

      Object.keys(sociosData).forEach((key) => {
        const socio = sociosData[key];
        const cutoffDate = new Date(socio.cutoffDate);
        
        if (cutoffDate < thresholdDate) {
          inactiveUsers.push({
            id: key,
            fullName: socio.fullName || '',
            cutoffDate: socio.cutoffDate || '',
            memberNumber: socio.memberNumber || '',
            ...socio
          });
        }
      });

      return inactiveUsers;
    } catch (error) {
      console.error('Error al obtener usuarios inactivos:', error);
      return [];
    }
  }

  // Realizar limpieza automática
  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Iniciando limpieza automática de usuarios inactivos...');
      
      const inactiveUsers = await this.getInactiveUsers();
      
      if (inactiveUsers.length === 0) {
        console.log('✅ No se encontraron usuarios inactivos para eliminar');
        return;
      }

      console.log(`📋 Encontrados ${inactiveUsers.length} usuarios inactivos para eliminar`);

      let deletedCount = 0;
      let errorCount = 0;

      // Eliminar usuarios uno por uno
      for (const user of inactiveUsers) {
        try {
          await remove(ref(realtimeDb, `socios/${user.id}`));
          deletedCount++;
          console.log(`🗑️ Usuario eliminado: ${user.fullName} (${user.memberNumber}) - Último pago: ${user.cutoffDate}`);
        } catch (error) {
          console.error(`❌ Error al eliminar usuario ${user.fullName}:`, error);
          errorCount++;
        }
      }

      // Registrar estadísticas de la limpieza (opcional)
      // const cleanupStats = {
      //   timestamp: new Date().toISOString(),
      //   usersFound: inactiveUsers.length,
      //   usersDeleted: deletedCount,
      //   errors: errorCount
      // };

      // Guardar estadísticas en Firebase (opcional - comentado para evitar acumulación)
      // try {
      //   const statsRef = ref(realtimeDb, `cleanup_stats/${Date.now()}`);
      //   await set(statsRef, cleanupStats);
      // } catch (error) {
      //   console.error('Error al guardar estadísticas de limpieza:', error);
      // }

      console.log(`✅ Limpieza automática completada:`);
      console.log(`   - Usuarios eliminados: ${deletedCount}`);
      console.log(`   - Errores: ${errorCount}`);
      console.log(`   - Números de socio liberados: ${deletedCount}`);

      // Actualizar timestamp de última limpieza
      try {
        await set(ref(realtimeDb, 'system/lastCleanup'), {
          timestamp: new Date().toISOString(),
          deletedCount,
          errorCount
        });
      } catch (error) {
        console.error('Error al actualizar timestamp de limpieza:', error);
      }

    } catch (error) {
      console.error('❌ Error durante la limpieza automática:', error);
    }
  }

  // Método público para obtener estadísticas
  async getCleanupStats(): Promise<{ inactiveCount: number; lastCleanup: string | null }> {
    try {
      const inactiveUsers = await this.getInactiveUsers();
      return {
        inactiveCount: inactiveUsers.length,
        lastCleanup: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        inactiveCount: 0,
        lastCleanup: null
      };
    }
  }

  // Método para forzar limpieza manual (para testing)
  async forceCleanup(): Promise<void> {
    console.log('🔧 Forzando limpieza manual...');
    await this.performCleanup();
  }
}

export default AutoCleanupService;
