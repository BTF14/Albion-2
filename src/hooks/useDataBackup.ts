import { useState, useCallback, useEffect } from 'react';
import { AlbionFullBackupData, BackupValidationResult, ImportMode } from '../domain/models/backup';
import { validateBackupFile } from '../domain/use-cases/backupManager';
import {
  createFullBackupData,
  triggerDownloadBackupJSON,
  restoreFullBackupData,
} from '../utils/storage';
import { CityId } from '../types';

export function useDataBackup(currentCityId?: CityId) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Escuchar cuando se restaura un respaldo para refrescar estados locales
  useEffect(() => {
    const handleBackupRestored = () => {
      // Evento global para componentes que necesiten refrescar
    };
    window.addEventListener('albion_backup_restored', handleBackupRestored);
    return () => window.removeEventListener('albion_backup_restored', handleBackupRestored);
  }, []);

  /**
   * Genera y descarga el archivo JSON con toda la información
   */
  const exportFullBackup = useCallback(
    (notes?: string) => {
      setIsExporting(true);
      try {
        const backupData = createFullBackupData({ activeCityId: currentCityId, notes });
        triggerDownloadBackupJSON(backupData);
        setImportStatus({
          type: 'success',
          message: `¡Copia de seguridad generada con éxito! Se exportaron ${backupData.metadata.totalLogsCount} registros, ${backupData.metadata.totalPriceEntriesCount} precios manuales y ${backupData.metadata.totalCharactersCount} personajes.`,
        });
      } catch (err) {
        console.error('Error exportando respaldo', err);
        setImportStatus({
          type: 'error',
          message: 'Ocurrió un error al generar la copia de seguridad.',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [currentCityId]
  );

  /**
   * Analiza un archivo JSON seleccionado por el usuario antes de aplicar cambios
   */
  const inspectBackupFile = useCallback((file: File) => {
    setImportStatus(null);
    setValidationResult(null);

    // Protección defensiva contra agotamiento de recursos (RESOURCE-EXHAUSTION-AND-AVAILABILITY.md)
    const MAX_BACKUP_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      setValidationResult({
        isValid: false,
        error: 'El archivo excede el tamaño máximo permitido para un respaldo (20 MB).',
        version: 0,
        summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
      });
      setImportStatus({
        type: 'error',
        message: 'El archivo es demasiado grande (> 20 MB).',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateBackupFile(parsed);
        setValidationResult(result);
        if (!result.isValid) {
          setImportStatus({
            type: 'error',
            message: result.error || 'El archivo seleccionado no es un respaldo compatible.',
          });
        }
      } catch {
        setValidationResult({
          isValid: false,
          error: 'El archivo no es un JSON válido o está dañado.',
          version: 0,
          summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
        });
        setImportStatus({
          type: 'error',
          message: 'Error al leer el archivo JSON. Verifica que sea un archivo válido.',
        });
      }
    };
    reader.readAsText(file);
  }, []);

  /**
   * Aplica la restauración tras la confirmación del usuario
   */
  const applyRestore = useCallback(
    (mode: ImportMode = 'merge') => {
      if (!validationResult || !validationResult.isValid || !validationResult.data) {
        setImportStatus({
          type: 'error',
          message: 'No hay ningún archivo de respaldo válido listo para restaurar.',
        });
        return;
      }

      setIsImporting(true);
      try {
        const res = restoreFullBackupData(validationResult.data, mode);
        if (res.success) {
          setImportStatus({
            type: 'success',
            message:
              mode === 'merge'
                ? `¡Restauración combinada exitosa! Ahora tienes ${res.logsCount} cosechas y ${res.pricesCount} cotizaciones de precios en tu historial.`
                : `¡Base de datos reemplazada con éxito! Se cargaron ${res.logsCount} cosechas y ${res.pricesCount} cotizaciones de precios desde el respaldo.`,
          });
          setValidationResult(null); // Limpiar tras éxito
        } else {
          setImportStatus({
            type: 'error',
            message: res.error || 'Error restaurando los datos en el navegador.',
          });
        }
      } catch (err) {
        console.error('Error aplicando respaldo', err);
        setImportStatus({
          type: 'error',
          message: 'Ocurrió un error inesperado al restaurar los datos.',
        });
      } finally {
        setIsImporting(false);
      }
    },
    [validationResult]
  );

  const clearStatus = useCallback(() => {
    setImportStatus(null);
    setValidationResult(null);
  }, []);

  return {
    isExporting,
    isImporting,
    validationResult,
    importStatus,
    exportFullBackup,
    inspectBackupFile,
    applyRestore,
    clearStatus,
  };
}
