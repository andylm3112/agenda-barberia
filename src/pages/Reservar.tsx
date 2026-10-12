import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, configOk } from '../lib/supabase'
import { diasDisponibles, fechaISO, horasLibres } from '../lib/slots'
import { NOMBRE_NEGOCIO, SLOGAN, WHATSAPP, HORARIO } from '../config'
import type { Barbero, Cita, Servicio } from '../types'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const AVATARES = ['bg-secondary', 'bg-azul', 'bg-primary']

const fechaLarga = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const fechaCorta = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

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
  const hoy = fechaISO(new Date())

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
  const nombreValido = nombre.trim().length > 1
  const puedeEnviar = Boolean(servicio && barbero && fecha && hora && nombreValido && telValido)

  const pasos = [Boolean(servicio), Boolean(barbero), Boolean(fecha), Boolean(hora), nombreValido && telValido]

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
    window.scrollTo({ top: 0 })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary text-light">
        <p className="display text-xl">Cargando…</p>
      </div>
    )
  }

  if (listo && servicio && barbero) {
    const msg = encodeURIComponent(
      `Hola, agendé una cita en ${NOMBRE_NEGOCIO}: ${servicio.nombre} con ${barbero.nombre}, ${fechaLarga(listo.fecha)} a las ${listo.hora.slice(0, 5)}. A nombre de ${listo.cliente_nombre}.`,
    )
    return (
      <div className="min-h-screen bg-primary px-4 py-10">
        <div className="mx-auto max-w-sm">
          <h1 className="display text-center text-3xl text-light">
            Listo, {listo.cliente_nombre.split(' ')[0]}
          </h1>
          <p className="mt-1 text-center text-light/75">Tu cita está confirmada.</p>

          <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="franja" />
            <div className="px-6 pb-6 pt-5">
              <p className="text-sm text-primary/70">{NOMBRE_NEGOCIO}</p>
              <p className="display mt-1 text-2xl leading-tight">{fechaLarga(listo.fecha).replace(/^./, (c) => c.toUpperCase())}</p>
              <p className="display text-6xl leading-none text-secondary">{listo.hora.slice(0, 5)}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-primary/70">Servicio</dt>
                  <dd className="text-base font-semibold">{servicio.nombre}</dd>
                </div>
                <div>
                  <dt className="text-primary/70">Barbero</dt>
                  <dd className="text-base font-semibold">{barbero.nombre}</dd>
                </div>
              </dl>
            </div>
            <div className="relative border-t-2 border-dashed border-primary/20">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-primary" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-primary" />
            </div>
            <div className="p-6">
              <a
                href={`https://wa.me/${WHATSAPP}?text=${msg}`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-full bg-secondary py-3.5 text-center font-semibold text-white"
              >
                Avisar por WhatsApp
              </a>
              <button
                onClick={reiniciar}
                className="mt-3 w-full rounded-full border border-primary/25 py-3.5 font-semibold"
              >
                Agendar otra cita
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const resumen = [servicio?.nombre, barbero?.nombre, fecha && fechaCorta(fecha), hora]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="min-h-screen bg-primary">
      <header className="text-light">
        <div className="franja" />
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-5 pb-16 pt-8">
          <div className="min-w-0">
            <p className="text-sm text-light/75">
              Abierto de {HORARIO.apertura} a {HORARIO.cierre}
            </p>
            <h1 className="display mt-2 text-[2rem] leading-[1.05] sm:text-4xl">{NOMBRE_NEGOCIO}</h1>
            <p className="mt-3 max-w-[15rem] text-lg leading-snug text-light/90">{SLOGAN}</p>
          </div>
          <div className="poste" aria-hidden="true">
            <span className="poste-tapa" />
            <div className="poste-tubo">
              <div className="poste-rayas" />
            </div>
            <span className="poste-tapa" />
          </div>
        </div>
      </header>

      <main className="relative -mt-8 rounded-t-[2rem] bg-papel px-4 pb-36 pt-6">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={pasos.filter(Boolean).length}>
            {pasos.map((ok, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${ok ? 'bg-secondary' : 'bg-primary/15'}`} />
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-secondary bg-secondary/10 p-3 font-medium text-secondary">
              {error}
            </div>
          )}

          <Paso n={1} hecho={pasos[0]} titulo="¿Qué te hacemos?">
            <div className="grid gap-2">
              {servicios.map((s) => {
                const activo = servicio?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServicio(s)
                      setHora('')
                    }}
                    aria-pressed={activo}
                    className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
                      activo ? 'border-primary bg-primary text-light' : 'border-primary/10 bg-white'
                    }`}
                  >
                    <span>
                      <span className="block text-lg font-semibold leading-tight">{s.nombre}</span>
                      <span className={`text-sm ${activo ? 'text-light/75' : 'text-primary/70'}`}>{s.duracion_min} min</span>
                    </span>
                    <span className={`display text-2xl ${activo ? 'text-light' : 'text-secondary'}`}>${s.precio}</span>
                  </button>
                )
              })}
            </div>
          </Paso>

          {servicio && (
            <Paso n={2} hecho={pasos[1]} titulo="¿Con quién?">
              <div className="grid grid-cols-3 gap-2">
                {barberos.map((b, i) => {
                  const activo = barbero?.id === b.id
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBarbero(b)}
                      aria-pressed={activo}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3 transition-colors ${
                        activo ? 'border-secondary bg-white' : 'border-primary/10 bg-white'
                      }`}
                    >
                      <span
                        className={`display flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white ${AVATARES[i % AVATARES.length]}`}
                      >
                        {b.nombre.charAt(0)}
                      </span>
                      <span className="font-semibold">{b.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </Paso>
          )}

          {servicio && barbero && (
            <Paso n={3} hecho={pasos[2]} titulo="¿Qué día?">
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
                {dias.map((d) => {
                  const iso = fechaISO(d)
                  const activo = fecha === iso
                  return (
                    <button
                      key={iso}
                      onClick={() => setFecha(iso)}
                      aria-pressed={activo}
                      className={`min-w-[68px] shrink-0 rounded-2xl border-2 px-3 py-2.5 text-center transition-colors ${
                        activo ? 'border-secondary bg-secondary text-white' : 'border-primary/10 bg-white'
                      }`}
                    >
                      <div className={`text-sm ${activo ? 'text-white/90' : 'text-primary/70'}`}>
                        {iso === hoy ? 'Hoy' : DIAS[d.getDay()]}
                      </div>
                      <div className="display text-2xl leading-tight">{d.getDate()}</div>
                    </button>
                  )
                })}
              </div>
            </Paso>
          )}

          {servicio && barbero && fecha && (
            <Paso n={4} hecho={pasos[3]} titulo="¿A qué hora?">
              {horas.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-primary/80">
                  No quedan horarios este día con {barbero.nombre}. Prueba otro día u otro barbero.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {horas.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      aria-pressed={hora === h}
                      className={`rounded-xl border-2 py-2.5 font-semibold transition-colors ${
                        hora === h ? 'border-secondary bg-secondary text-white' : 'border-primary/10 bg-white'
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
            <Paso n={5} hecho={pasos[4]} titulo="¿A nombre de quién?">
              <label className="block">
                <span className="mb-1 block text-sm text-primary/70">Nombre</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border-2 border-primary/15 bg-white px-4 py-3 text-base outline-none focus:border-secondary"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm text-primary/70">Teléfono de 10 dígitos</span>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/[^\d]/g, ''))}
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full rounded-xl border-2 border-primary/15 bg-white px-4 py-3 text-base outline-none focus:border-secondary"
                />
              </label>
            </Paso>
          )}

          <footer className="mt-8 text-center">
            <Link to="/admin" className="text-sm text-primary/60 underline">
              Acceso del negocio
            </Link>
          </footer>
        </div>
      </main>

      {servicio && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-primary px-4 py-3 text-light shadow-[0_-8px_24px_rgb(0_0_0/0.3)]">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate font-semibold">{resumen}</div>
              <div className="text-sm text-light/75">${servicio.precio} en el local</div>
            </div>
            <button
              onClick={confirmar}
              disabled={!puedeEnviar || enviando}
              className="shrink-0 rounded-full bg-secondary px-5 py-3 font-semibold text-white disabled:bg-white/15 disabled:text-white/60"
            >
              {enviando ? 'Guardando…' : 'Confirmar cita'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Paso({
  n,
  hecho,
  titulo,
  children,
}: {
  n: number
  hecho: boolean
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-3 flex items-center gap-2.5">
        <span
          className={`display flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            hecho ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          {hecho ? '✓' : n}
        </span>
        <span className="display text-xl">{titulo}</span>
      </h2>
      {children}
    </section>
  )
}
