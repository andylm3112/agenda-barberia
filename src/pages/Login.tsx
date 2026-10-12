import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { NOMBRE_NEGOCIO } from '../config'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    nav('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <form onSubmit={entrar} className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="franja" />
        <div className="p-6">
          <h1 className="display text-2xl">Panel de {NOMBRE_NEGOCIO}</h1>
          <p className="mb-5 mt-1 text-primary/70">Entra para ver tus citas.</p>
          {error && (
            <div role="alert" className="mb-3 rounded-xl border border-secondary bg-secondary/10 p-3 font-medium text-secondary">
              {error}
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm text-primary/70">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border-2 border-primary/15 px-4 py-3 text-base outline-none focus:border-secondary"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm text-primary/70">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border-2 border-primary/15 px-4 py-3 text-base outline-none focus:border-secondary"
            />
          </label>
          <button disabled={loading} className="mt-5 w-full rounded-full bg-secondary py-3.5 font-semibold text-white disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
