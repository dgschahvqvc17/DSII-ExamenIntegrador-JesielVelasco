import Swal from 'sweetalert2';

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  customClass: { popup: 'lab-toast' },
});

export const notificarExito = (mensaje) =>
  toast.fire({ icon: 'success', title: mensaje });

export const notificarError = (mensaje) =>
  toast.fire({ icon: 'error', title: mensaje });

export const confirmarEliminacion = (codigo) =>
  Swal.fire({
    title: '¿Eliminar la solicitud?',
    html: `La solicitud <strong>${codigo}</strong> se ocultará del listado pero permanecerá en Supabase para auditoría.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  });
