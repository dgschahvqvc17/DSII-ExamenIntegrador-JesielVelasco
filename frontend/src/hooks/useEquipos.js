import { useCallback } from 'react';
import * as equiposService from '../services/equiposService';
import { useAsync } from './useAsync';

export function useEquipos(q = '') {
  const cargar = useCallback(() => equiposService.listar(q), [q]);
  return useAsync(cargar, [cargar]);
}
