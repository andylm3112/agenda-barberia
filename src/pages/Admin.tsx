import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fechaISO } from '../lib/slots'
import { NOMBRE_NEGOCIO } from '../config'
import type { Barbero, Cita, Servicio } from '../types'

export default function Admin() {
  const nav = useNavigate()
  const [fecha, setFecha] = useState(fechaISO(new Date()))
  const [citas, setCitas] = useState<Cita[]>([])
  const [servicios, setServicios] = useState<Record<string, Servicio>>({})
  const [barberos, setBarberos] = useState<Record<string, Barbero>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async (f: string) => {
    setError(null)
    const [c, s, b] = await Promise.all([
      supabase.from('agenda_citas').select('*').eq('fecha', f).order('hora'),
      supabase.from('agenda_servicios').select('*'),
      supabase.from('agenda_barberos').select('*'),
    ])
    if (c.error || s.error || b.error) {
      setError('No se pudieron cargar las citas.')
    } else {
      setCitas(c.data as Cita[])
      setServicios(Object.fromEntries((s.data as Servicio[]).map((x) => [x.id, x])))
      setBarberos(Object.fromEntries((b.data as Barbero[]).map((x) => [x.id, x])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        nav('/login')
        return
      }
      cargar(fecha)
    })()
  }, [fecha, cargar, nav])

  const cancelar = async (c: Cita) => {
    if (!window.confirm(`¿Cancelar la cita de ${c.cliente_nombre}?`)) return
    setOcupado(true)
    const { error: e } = await supabase.from('agenda_citas').update({ estado: 'cancelada' }).eq('id', c.id)
    setTimeout(() => setOcupado(false), 1500)
    if (e) {
      setError('No se pudo cancelar.')
      return
    }
    cargar(fecha)
  }

  const salir = async () => {
    await supabase.auth.signOut()
    nav('/login')
  }

  const activas = citas.filter((c) => c.estado === 'confirmada')

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-light">
        <div className="franja" />
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
          <h1 className="display text-xl">{NOMBRE_NEGOCIO}</h1>
          <button onClick={salir} className="text-sm text-light/80 underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-xl border-2 border-primary/15 bg-white px-3 py-2 text-base"
          />
          <button onClick={() => setFecha(fechaISO(new Date()))} className="rounded-full border-2 border-primary/20 px-4 py-2 font-semibold">
            Hoy
          </button>
          <span className="display ml-auto text-lg text-secondary">
            {activas.length} {activas.length === 1 ? 'cita' : 'citas'}
          </span>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-secondary bg-secondary/10 p-3 font-medium text-secondary">
            {error}
          </div>
        )}
        {loading && <p>Cargando…</p>}
        {!loading && citas.length === 0 && <p className="text-primary/70">No hay citas este día.</p>}

        <ul className="grid gap-3">
          {citas.map((c) => {
            const cancelada = c.estado === 'cancelada'
            const msg = encodeURIComponent(
              `Hola ${c.cliente_nombre}, te recordamos tu cita en ${NOMBRE_NEGOCIO} el ${c.fecha} a las ${c.hora.slice(0, 5)}.`,
            )
            return (
              <li
                key={c.id}
                className={`rounded-2xl border-2 bg-white p-4 ${cancelada ? 'border-primary/10 opacity-55' : 'border-primary/10'}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className={`display text-3xl ${cancelada ? 'text-primary/60 line-through' : 'text-secondary'}`}>
                    {c.hora.slice(0, 5)}
                  </span>
                  <span className="font-semibold">{barberos[c.barbero_id]?.nombre}</span>
                </div>
                <div className="mt-1 text-lg font-semibold">{c.cliente_nombre}</div>
                <div className="text-sm text-primary/70">
                  {servicios[c.servicio_id]?.nombre ?? 'Servicio'}, {c.duracion_min} min, {c.cliente_telefono}
                </div>
                {cancelada ? (
                  <div className="mt-2 text-sm font-semibold text-secondary">Cancelada</div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`https://wa.me/52${c.cliente_telefono}?text=${msg}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-light"
                    >
                      Recordar por WhatsApp
                    </a>
                    <button
                      onClick={() => cancelar(c)}
                      disabled={ocupado}
                      className="rounded-full border-2 border-secondary px-4 py-2 text-sm font-semibold text-secondary disabled:opacity-40"
                    >
                      Cancelar cita
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
