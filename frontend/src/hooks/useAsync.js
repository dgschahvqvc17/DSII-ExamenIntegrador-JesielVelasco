import { useCallback, useEffect, useState } from 'react';

/**
 * Hook reutilizable para cargas asíncronas con estados loading/error y
 * función `recargar` para volver a consultar la API tras una mutación.
 */
export function useAsync(loader, deps = []) {
  const [estado, setEstado] = useState({
    data: null,
    loading: true,
    error: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(loader, deps);

  useEffect(() => {
    let activo = true;
    setEstado((actual) => ({ ...actual, loading: true, error: null }));

    recargar()
      .then((data) => {
        if (activo) setEstado({ data, loading: false, error: null });
        return data;
      })
      .catch((error) => {
        if (activo) setEstado({ data: null, loading: false, error });
        return null;
      });

    return () => {
      activo = false;
    };
  }, [recargar]);

  const reemplazarData = (data) =>
    setEstado((actual) => ({ ...actual, data }));

  return { ...estado, recargar, reemplazarData };
}
