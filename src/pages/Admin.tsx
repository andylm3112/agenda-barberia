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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl uppercase tracking-widest text-secondary">{NOMBRE_NEGOCIO}</h1>
        <button onClick={salir} className="text-sm text-light/60">
          Cerrar sesión
        </button>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-xl border border-secondary/40 bg-transparent px-3 py-2 [color-scheme:dark]"
        />
        <button onClick={() => setFecha(fechaISO(new Date()))} className="rounded-xl border border-secondary/40 px-3 py-2">
          Hoy
        </button>
        <span className="ml-auto text-secondary">{activas.length} citas</span>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-red-300">{error}</div>}
      {loading && <p>Cargando…</p>}
      {!loading && citas.length === 0 && <p className="text-light/70">Sin citas este día.</p>}

      <ul className="grid gap-2">
        {citas.map((c) => {
          const cancelada = c.estado === 'cancelada'
          const msg = encodeURIComponent(
            `Hola ${c.cliente_nombre}, te recordamos tu cita en ${NOMBRE_NEGOCIO} el ${c.fecha} a las ${c.hora.slice(0, 5)}.`,
          )
          return (
            <li
              key={c.id}
              className={`rounded-xl border p-4 ${cancelada ? 'border-light/20 opacity-50' : 'border-secondary/40 bg-white/5'}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xl text-secondary">{c.hora.slice(0, 5)}</span>
                <span className="text-sm text-light/60">{barberos[c.barbero_id]?.nombre}</span>
              </div>
              <div className="mt-1">{c.cliente_nombre}</div>
              <div className="text-sm text-light/60">
                {servicios[c.servicio_id]?.nombre ?? 'Servicio'} · {c.duracion_min} min · {c.cliente_telefono}
              </div>
              {cancelada ? (
                <div className="mt-2 text-sm text-red-300">Cancelada</div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <a
                    href={`https://wa.me/52${c.cliente_telefono}?text=${msg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-secondary px-3 py-1 text-sm text-primary"
                  >
                    Recordar por WhatsApp
                  </a>
                  <button
                    onClick={() => cancelar(c)}
                    disabled={ocupado}
                    className="rounded-lg border border-red-400 px-3 py-1 text-sm text-red-300 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
