import { HORARIO } from '../config'
import type { Cita } from '../types'

export const aMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const aHHMM = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export const fechaISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const diasDisponibles = (): Date[] => {
  const out: Date[] = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < HORARIO.diasAdelante; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    if (!HORARIO.diasCerrado.includes(d.getDay())) out.push(d)
  }
  return out
}

export const horasLibres = (fecha: string, duracion: number, citas: Cita[]): string[] => {
  const ini = aMin(HORARIO.apertura)
  const fin = aMin(HORARIO.cierre)
  const ahora = new Date()
  const esHoy = fecha === fechaISO(ahora)
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const ocupadas = citas
    .filter((c) => c.estado === 'confirmada')
    .map((c) => [aMin(c.hora.slice(0, 5)), aMin(c.hora.slice(0, 5)) + c.duracion_min] as const)

  const out: string[] = []
  for (let t = ini; t + duracion <= fin; t += HORARIO.pasoMin) {
    if (esHoy && t <= minAhora) continue
    const choca = ocupadas.some(([a, b]) => t < b && t + duracion > a)
    if (!choca) out.push(aHHMM(t))
  }
  return out
}
