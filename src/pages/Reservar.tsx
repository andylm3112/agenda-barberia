import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, configOk } from '../lib/supabase'
import { diasDisponibles, fechaISO, horasLibres } from '../lib/slots'
import { NOMBRE_NEGOCIO, SLOGAN, WHATSAPP } from '../config'
import type { Barbero, Cita, Servicio } from '../types'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function Reservar() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [barbero, setBarbero] = useState<Barbero | null>(null)
  const [fecha, setFecha] = useState<string>('')
  const [hora, setHora] = useState<string>('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState<Cita | null>(null)

  const dias = useMemo(() => diasDisponibles(), [])

  useEffect(() => {
    if (!configOk) {
      setError('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    ;(async () => {
      const [s, b] = await Promise.all([
        supabase.from('agenda_servicios').select('*').eq('activo', true).order('precio'),
        supabase.from('agenda_barberos').select('*').eq('activo', true).order('nombre'),
      ])
      if (s.error || b.error) {
        setError('No se pudo cargar la información. Intenta de nuevo.')
      } else {
        setServicios(s.data as Servicio[])
        setBarberos(b.data as Barbero[])
      }
      setLoading(false)
    })()
  }, [])

  const cargarCitas = async (barberoId: string, f: string) => {
    const { data, error: e } = await supabase
      .from('agenda_citas')
      .select('*')
      .eq('barbero_id', barberoId)
      .eq('fecha', f)
      .eq('estado', 'confirmada')
    if (e) {
      setError('No se pudo cargar la disponibilidad.')
      return
    }
    setCitas((data || []) as Cita[])
  }

  useEffect(() => {
    setHora('')
    if (barbero && fecha) cargarCitas(barbero.id, fecha)
  }, [barbero, fecha])

  const horas = useMemo(
    () => (servicio && fecha ? horasLibres(fecha, servicio.duracion_min, citas) : []),
    [servicio, fecha, citas],
  )

  const telValido = telefono.replace(/\D/g, '').length >= 10
  const puedeEnviar = servicio && barbero && fecha && hora && nombre.trim().length > 1 && telValido

  const confirmar = async () => {
    if (!puedeEnviar || !servicio || !barbero) return
    setEnviando(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('agenda_citas')
      .insert({
        barbero_id: barbero.id,
        servicio_id: servicio.id,
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.replace(/\D/g, ''),
        fecha,
        hora,
        duracion_min: servicio.duracion_min,
      })
      .select()
      .single()
    setEnviando(false)
    if (e || !data) {
      setError(
        e?.code === '23505'
          ? 'Ese horario acaba de ser tomado. Elige otro.'
          : 'No se pudo guardar la cita. Intenta de nuevo.',
      )
      await cargarCitas(barbero.id, fecha)
      setHora('')
      return
    }
    setListo(data as Cita)
  }

  const reiniciar = () => {
    setListo(null)
    setServicio(null)
    setBarbero(null)
    setFecha('')
    setHora('')
    setNombre('')
    setTelefono('')
  }

  if (loading) return <Pantalla>Cargando…</Pantalla>

  if (listo && servicio && barbero) {
    const msg = encodeURIComponent(
      `Hola, agendé una cita en ${NOMBRE_NEGOCIO}: ${servicio.nombre} con ${barbero.nombre}, ${listo.fecha} a las ${listo.hora.slice(0, 5)}. A nombre de ${listo.cliente_nombre}.`,
    )
    return (
      <Pantalla>
        <div className="w-full max-w-md rounded-2xl border border-secondary/40 bg-white/5 p-6 text-center">
          <div className="text-4xl">✂️</div>
          <h2 className="mt-2 text-2xl font-medium text-secondary">¡Cita confirmada!</h2>
          <p className="mt-4 text-lg">{servicio.nombre}</p>
          <p className="text-light/70">con {barbero.nombre}</p>
          <p className="mt-2 text-xl">
            {listo.fecha} · {listo.hora.slice(0, 5)}
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${msg}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block rounded-xl bg-secondary py-3 font-medium text-primary"
          >
            Avisar por WhatsApp
          </a>
          <button onClick={reiniciar} className="mt-3 w-full rounded-xl border border-secondary/40 py-3">
            Agendar otra cita
          </button>
        </div>
      </Pantalla>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-medium uppercase tracking-widest text-secondary">{NOMBRE_NEGOCIO}</h1>
        <p className="mt-1 text-light/70">{SLOGAN}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-red-300">{error}</div>
      )}

      <Paso n={1} titulo="Servicio">
        <div className="grid gap-2">
          {servicios.map((s) => (
            <Opcion key={s.id} activo={servicio?.id === s.id} onClick={() => { setServicio(s); setHora('') }}>
              <span>{s.nombre}</span>
              <span className="text-light/70">
                {s.duracion_min} min · ${s.precio}
              </span>
            </Opcion>
          ))}
        </div>
      </Paso>

      {servicio && (
        <Paso n={2} titulo="Barbero">
          <div className="grid grid-cols-3 gap-2">
            {barberos.map((b) => (
              <Opcion key={b.id} activo={barbero?.id === b.id} onClick={() => setBarbero(b)}>
                {b.nombre}
              </Opcion>
            ))}
          </div>
        </Paso>
      )}

      {servicio && barbero && (
        <Paso n={3} titulo="Día">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dias.map((d) => {
              const iso = fechaISO(d)
              return (
                <button
                  key={iso}
                  onClick={() => setFecha(iso)}
                  className={`min-w-[64px] rounded-xl border px-3 py-2 text-center ${
                    fecha === iso ? 'border-secondary bg-secondary text-primary' : 'border-secondary/40'
                  }`}
                >
                  <div className="text-xs">{DIAS[d.getDay()]}</div>
                  <div className="text-xl">{d.getDate()}</div>
                </button>
              )
            })}
          </div>
        </Paso>
      )}

      {servicio && barbero && fecha && (
        <Paso n={4} titulo="Hora">
          {horas.length === 0 ? (
            <p className="text-light/70">No hay horarios libres este día. Prueba otro.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {horas.map((h) => (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  className={`rounded-xl border py-2 ${
                    hora === h ? 'border-secondary bg-secondary text-primary' : 'border-secondary/40'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </Paso>
      )}

      {hora && (
        <Paso n={5} titulo="Tus datos">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="mb-2 w-full rounded-xl border border-secondary/40 bg-transparent px-4 py-3 outline-none focus:border-secondary"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            placeholder="Teléfono (10 dígitos)"
            className="w-full rounded-xl border border-secondary/40 bg-transparent px-4 py-3 outline-none focus:border-secondary"
          />
          <button
            onClick={confirmar}
            disabled={!puedeEnviar || enviando}
            className="mt-4 w-full rounded-xl bg-secondary py-3 text-lg font-medium text-primary disabled:opacity-40"
          >
            {enviando ? 'Guardando…' : 'Confirmar cita'}
          </button>
        </Paso>
      )}

      <footer className="mt-10 text-center">
        <Link to="/admin" className="text-xs text-light/40">
          Acceso del negocio
        </Link>
      </footer>
    </div>
  )
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-4">{children}</div>
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm uppercase tracking-widest text-secondary">
        {n}. {titulo}
      </h2>
      {children}
    </section>
  )
}

function Opcion({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left ${
        activo ? 'border-secondary bg-secondary/15' : 'border-secondary/40'
      }`}
    >
      {children}
    </button>
  )
}
