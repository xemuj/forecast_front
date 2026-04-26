import { useState, useEffect, useCallback } from 'react'
import Session from 'supertokens-web-js/recipe/session'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { locationsApi, weatherApi, ForecastResponse, WeatherPoint, Location } from '../services/api'
import { getBrowserLocation, getCityCountry } from '../services/location'

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna densa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  71: 'Nieve ligera',
  73: 'Nieve moderada',
  75: 'Nieve intensa',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos violentos',
  95: 'Tormenta',
}

function weatherIcon(code: number | null): string {
  if (!code) return '🌤️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

function ForecastCard({ label, point, offset }: { label: string; point: WeatherPoint; offset: string }) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center min-w-[100px]">
      <p className="text-xs text-slate-500 font-medium mb-1">{offset}</p>
      <p className="text-lg font-semibold text-slate-700">{label}</p>
      <div className="text-3xl my-2">{weatherIcon(point.weather_code)}</div>
      <p className="text-sm text-slate-500 mb-1">
        {WMO_DESCRIPTIONS[point.weather_code ?? 0] ?? ''}
      </p>
      <p className="text-2xl font-bold text-brand-700">
        {Math.round(point.temperature_c)}°C
      </p>
      {point.humidity !== null && (
        <p className="text-xs text-slate-400 mt-1">💧 {point.humidity}%</p>
      )}
      {point.wind_speed !== null && (
        <p className="text-xs text-slate-400">💨 {point.wind_speed} km/h</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [weatherError, setWeatherError] = useState('')

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await weatherApi.getForecast(lat, lon)
      setForecast(res.data)
    } catch (e: any) {
      setWeatherError(e?.response?.data?.detail || 'Error cargando el clima')
    }
  }, [])

  const initLocation = useCallback(async () => {
    setLoadingLocation(true)
    setLocationError('')

    try {
      const saved = await locationsApi.getDefault()
      setLocation(saved.data)
      await fetchWeather(saved.data.latitude, saved.data.longitude)
    } catch {
      try {
        const { latitude, longitude } = await getBrowserLocation()
        const geo = await getCityCountry(latitude, longitude)
        const res = await locationsApi.create({
          latitude,
          longitude,
          city: geo.city,
          country: geo.country,
        })
        setLocation(res.data)
        await fetchWeather(latitude, longitude)
      } catch (err: any) {
        setLocationError(
          err?.message === 'User denied Geolocation'
            ? 'Ubicación denegada. Puedes ingresar coordenadas manualmente.'
            : 'No se pudo obtener la ubicación.',
        )
        setLoadingWeather(false)
      }
    } finally {
      setLoadingLocation(false)
      setLoadingWeather(false)
    }
  }, [fetchWeather])

  useEffect(() => {
    initLocation()
  }, [initLocation])

  async function handleLogout() {
    await Session.signOut()
    window.location.href = '/login'
  }

  async function handleRefreshLocation() {
    setLoadingLocation(true)
    setLocationError('')
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const geo = await getCityCountry(latitude, longitude)
      const res = await locationsApi.create({
        latitude,
        longitude,
        city: geo.city,
        country: geo.country,
        is_default: true,
      })
      setLocation(res.data)
      setLoadingWeather(true)
      await fetchWeather(latitude, longitude)
    } catch (err: any) {
      setLocationError(err?.message || 'Error actualizando ubicación')
    } finally {
      setLoadingLocation(false)
      setLoadingWeather(false)
    }
  }

  const chartData = forecast?.history.slice(-24).map(p => ({
    time: format(parseISO(p.timestamp), 'HH:mm', { locale: es }),
    temp: Math.round(p.temperature_c),
    humidity: p.humidity ?? 0,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🌤 ClimaApp</h1>
            {location && (
              <p className="text-brand-100 text-sm">
                {location.city ? `${location.city}, ` : ''}
                {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshLocation}
              disabled={loadingLocation}
              className="p-2 rounded-xl hover:bg-brand-500 transition-colors"
              title="Actualizar ubicación"
            >
              {loadingLocation ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-brand-500 transition-colors"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {locationError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {locationError}
          </div>
        )}

        {weatherError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            ❌ {weatherError}
          </div>
        )}

        {loadingWeather ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500">Cargando datos del clima...</p>
          </div>
        ) : forecast ? (
          <>
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Próximas predicciones
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <ForecastCard label="+3h" point={forecast.forecast_3h} offset="En 3 horas" />
                <ForecastCard label="+1d" point={forecast.forecast_1d} offset="Mañana" />
                <ForecastCard label="+3d" point={forecast.forecast_3d} offset="Pasado mañana" />
              </div>
            </section>

            {chartData && chartData.length > 0 && (
              <section className="bg-white rounded-2xl shadow-md p-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Últimas 24 horas
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={v => `${v}°`}
                      width={36}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}°C`, 'Temperatura']}
                      labelStyle={{ color: '#334155' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#3644f0"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#3644f0' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            <section className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Resumen histórico
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-brand-600 mb-1">Ahora</p>
                  <p className="text-xl font-bold text-brand-700">
                    {forecast.history.length > 0
                      ? Math.round(forecast.history[forecast.history.length - 1].temperature_c)
                      : '—'}°C
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Hace 3h</p>
                  <p className="text-xl font-bold text-slate-700">
                    {forecast.history.length > 3
                      ? Math.round(forecast.history[forecast.history.length - 4].temperature_c)
                      : '—'}°C
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Humedad actual</p>
                  <p className="text-xl font-bold text-slate-700">
                    {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].humidity !== null
                      ? `${Math.round(forecast.history[forecast.history.length - 1].humidity!)}%`
                      : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Viento actual</p>
                  <p className="text-xl font-bold text-slate-700">
                    {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].wind_speed !== null
                      ? `${Math.round(forecast.history[forecast.history.length - 1].wind_speed!)} km/h`
                      : '—'}
                  </p>
                </div>
              </div>
            </section>

            <p className="text-center text-xs text-slate-400">
              Generado: {format(parseISO(forecast.generated_at), "dd MMM yyyy, HH:mm", { locale: es })}
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}