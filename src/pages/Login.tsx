import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-2xl border border-secondary/40 bg-white/5 p-6">
        <h1 className="mb-4 text-center text-2xl uppercase tracking-widest text-secondary">Acceso</h1>
        {error && <div className="mb-3 rounded-xl border border-red-500 bg-red-500/10 p-3 text-red-300">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className="mb-2 w-full rounded-xl border border-secondary/40 bg-transparent px-4 py-3 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="mb-4 w-full rounded-xl border border-secondary/40 bg-transparent px-4 py-3 outline-none"
        />
        <button disabled={loading} className="w-full rounded-xl bg-secondary py-3 font-medium text-primary disabled:opacity-40">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
