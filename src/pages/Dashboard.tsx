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
import LocationPicker from '../components/LocationPicker'

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
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [weatherError, setWeatherError] = useState('')
  const [pendingLat, setPendingLat] = useState<number | null>(null)
  const [pendingLon, setPendingLon] = useState<number | null>(null)
  const [savingLocation, setSavingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoadingWeather(true)
    try {
      const res = await weatherApi.getForecast(lat, lon)
      setForecast(res.data)
    } catch (e: any) {
      setWeatherError(e?.response?.data?.detail || 'Error loading weather data')
    } finally {
      setLoadingWeather(false)
    }
  }, [])

  const initLocation = useCallback(async () => {
    setLocationError('')

    const savedPromise = locationsApi.getDefault().catch(() => null)
    const geoPromise = getBrowserLocation().catch(() => null)

    const geoResult = await geoPromise

    if (geoResult) {
      setMapCenter({ lat: geoResult.latitude, lon: geoResult.longitude })
      const saved = await savedPromise
      if (saved) {
        setLocation(saved.data)
        await fetchWeather(saved.data.latitude, saved.data.longitude)
      } else {
        const geo = await getCityCountry(geoResult.latitude, geoResult.longitude)
        const res = await locationsApi.create({
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          city: geo.city,
          country: geo.country,
        })
        setLocation(res.data)
        await fetchWeather(geoResult.latitude, geoResult.longitude)
      }
    } else {
      const saved = await savedPromise
      if (saved) {
        setLocation(saved.data)
        setMapCenter({ lat: saved.data.latitude, lon: saved.data.longitude })
        await fetchWeather(saved.data.latitude, saved.data.longitude)
      } else {
        setLocationError('Could not get location. Click on the map to set it manually.')
        setLoadingWeather(false)
        setMapCenter({ lat: 40.71, lon: -74.01 })
      }
    }
  }, [fetchWeather])

  useEffect(() => {
    initLocation()
    const timer = setTimeout(() => setMapReady(true), 4000)
    return () => clearTimeout(timer)
  }, [initLocation])

  async function handleLogout() {
    await Session.signOut()
    window.location.href = '/login'
  }

  function handleMapClick(lat: number, lon: number) {
    setPendingLat(lat)
    setPendingLon(lon)
  }

  async function handleConfirmLocation() {
    if (pendingLat === null || pendingLon === null) return
    setSavingLocation(true)
    try {
      const geo = await getCityCountry(pendingLat, pendingLon)
      const res = await locationsApi.create({
        latitude: pendingLat,
        longitude: pendingLon,
        city: geo.city,
        country: geo.country,
        is_default: true,
      })
      setLocation(res.data)
      setMapCenter({ lat: pendingLat, lon: pendingLon })
      await fetchWeather(pendingLat, pendingLon)
      setPendingLat(null)
      setPendingLon(null)
    } catch (err: any) {
      setLocationError(err?.message || 'Error updating location')
    } finally {
      setSavingLocation(false)
    }
  }

  function handleCancelEdit() {
    setPendingLat(null)
    setPendingLon(null)
  }

  const chartData = forecast?.history.slice(-24).map(p => ({
    time: format(parseISO(p.timestamp), 'HH:mm', { locale: es }),
    temp: Math.round(p.temperature_c),
    humidity: p.humidity ?? 0,
  }))

  const displayLat = pendingLat ?? mapCenter?.lat ?? 0
  const displayLon = pendingLon ?? mapCenter?.lon ?? 0

  const currentTemp = forecast?.history.length
    ? forecast.history[forecast.history.length - 1].temperature_c
    : null

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-brand-600 text-white px-4 py-3 flex-shrink-0 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">🌤 ClimaApp</h1>
            {location && (
              <p className="text-brand-100 text-xs">
                {location.city ? `${location.city}, ` : ''}
                {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </p>
            )}
          </div>
        </div>
        {currentTemp !== null && !loadingWeather && (
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.round(currentTemp)}°C</p>
            <p className="text-xs text-brand-100">
              {forecast!.history[forecast!.history.length - 1]
                ? WMO_DESCRIPTIONS[forecast!.history[forecast!.history.length - 1].weather_code ?? 0] ?? ''
                : ''}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl hover:bg-brand-500 transition-colors"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full lg:w-3/5 flex flex-col">
          <div className="relative h-[45vh] lg:min-h-0 lg:flex-1"
          >
            {!mapReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Getting location...</p>
                </div>
              </div>
            )}
            {mapCenter && (
              <LocationPicker
                lat={displayLat}
                lon={displayLon}
                onSelect={handleMapClick}
                onReady={() => setMapReady(true)}
              />
            )}
          </div>

          {pendingLat !== null && pendingLon !== null && (
            <div className="flex-shrink-0 bg-brand-50 border-t border-brand-100 p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-brand-600 font-medium">New location</p>
                <p className="text-sm text-brand-700">
                  {pendingLat.toFixed(4)}°, {pendingLon.toFixed(4)}°
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocation}
                disabled={savingLocation}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {savingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          )}

          {locationError && (
            <div className="flex-shrink-0 bg-amber-50 border-t border-amber-200 px-4 py-2 text-amber-700 text-xs">
              ⚠️ {locationError}
            </div>
          )}
        </div>

        <div className="hidden lg:flex lg:w-2/5 h-full overflow-y-auto">
          <main className="flex-1 px-5 py-5 space-y-4">
            {weatherError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                ❌ {weatherError}
              </div>
            )}

            {loadingWeather ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm">Loading weather...</p>
              </div>
            ) : forecast ? (
              <>
                <section>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Forecast
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    <ForecastCard label="+3h" point={forecast.forecast_3h} offset="In 3 hours" />
                    <ForecastCard label="+1d" point={forecast.forecast_1d} offset="Tomorrow" />
                    <ForecastCard label="+3d" point={forecast.forecast_3d} offset="In 3 days" />
                  </div>
                </section>

                {chartData && chartData.length > 0 && (
                  <section className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Last 24 hours
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
                          formatter={(v: number) => [`${v}°C`, 'Temperature']}
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
                    Current conditions
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-brand-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-brand-600 mb-1">Now</p>
                      <p className="text-xl font-bold text-brand-700">
                        {forecast.history.length > 0
                          ? Math.round(forecast.history[forecast.history.length - 1].temperature_c)
                          : '—'}°C
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">3h ago</p>
                      <p className="text-xl font-bold text-slate-700">
                        {forecast.history.length > 3
                          ? Math.round(forecast.history[forecast.history.length - 4].temperature_c)
                          : '—'}°C
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Humidity</p>
                      <p className="text-xl font-bold text-slate-700">
                        {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].humidity !== null
                          ? `${Math.round(forecast.history[forecast.history.length - 1].humidity!)}%`
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Wind</p>
                      <p className="text-xl font-bold text-slate-700">
                        {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].wind_speed !== null
                          ? `${Math.round(forecast.history[forecast.history.length - 1].wind_speed!)} km/h`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </section>

                <p className="text-center text-xs text-slate-400">
                  {format(parseISO(forecast.generated_at), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              </>
            ) : null}
          </main>
        </div>
      </div>

      <div className="lg:hidden flex-shrink-0 border-t border-slate-200 bg-white">
        <div className="px-4 py-3">
          {weatherError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-3">
              ❌ {weatherError}
            </div>
          )}

          {loadingWeather ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading weather...</p>
            </div>
          ) : forecast ? (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <ForecastCard label="+3h" point={forecast.forecast_3h} offset="In 3 hours" />
                <ForecastCard label="+1d" point={forecast.forecast_1d} offset="Tomorrow" />
                <ForecastCard label="+3d" point={forecast.forecast_3d} offset="In 3 days" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-slate-500">Humidity</p>
                  <p className="text-base font-bold text-slate-700">
                    {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].humidity !== null
                      ? `${Math.round(forecast.history[forecast.history.length - 1].humidity!)}%`
                      : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-slate-500">Wind</p>
                  <p className="text-base font-bold text-slate-700">
                    {forecast.history.length > 0 && forecast.history[forecast.history.length - 1].wind_speed !== null
                      ? `${Math.round(forecast.history[forecast.history.length - 1].wind_speed!)} km/h`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}