import Swal from 'sweetalert2';

const base = {
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--foreground))',
};

export const notify = {
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: 'hsl(var(--primary))',
      ...base,
    });
  },
  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: 'hsl(var(--danger))',
      ...base,
    });
  },
  async confirm(title: string, text?: string): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'hsl(var(--danger))',
      cancelButtonColor: 'hsl(var(--muted))',
      reverseButtons: true,
      ...base,
    });
    return result.isConfirmed;
  },
};
