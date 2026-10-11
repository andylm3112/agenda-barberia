export interface Servicio { id: string; nombre: string; duracion_min: number; precio: number }
export interface Barbero { id: string; nombre: string }
export interface Cita {
  id: string
  barbero_id: string
  servicio_id: string
  cliente_nombre: string
  cliente_telefono: string
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  duracion_min: number
  estado: 'confirmada' | 'cancelada'
  created_at: string
}
