import { useCallback } from 'react';
import * as solicitudesService from '../services/solicitudesService';
import { useAsync } from './useAsync';

export function useSolicitudes(filtros = {}) {
  const { q, prioridad, estado } = filtros;

  const cargar = useCallback(
    () => solicitudesService.listar({ q, prioridad, estado }),
    [q, prioridad, estado],
  );

  return useAsync(cargar, [cargar]);
}

export function useHistorialSolicitudes(filtros = {}) {
  const { q, prioridad, estado } = filtros;
  const cargar = useCallback(
    () => solicitudesService.listarHistorial({ q, prioridad, estado }),
    [q, prioridad, estado],
  );
  return useAsync(cargar, [cargar]);
}
