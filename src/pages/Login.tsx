import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await EmailPassword.signIn({
        formFields: [
          { id: 'email', value: email },
          { id: 'password', value: password },
        ],
      })

      if (res.status === 'OK') {
        navigate('/dashboard')
      } else if (res.status === 'FIELD_ERROR') {
        setError(res.formFields?.[0]?.error || 'Inicio de sesión fallido')
      } else {
        setError('Inicio de sesión fallido')
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌤</div>
          <h1 className="text-2xl font-bold text-brand-700">ClimaApp</h1>
          <p className="text-slate-500 mt-1">Inicia sesión para ver el clima</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-800"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-800"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}