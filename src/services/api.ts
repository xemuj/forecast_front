import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export interface Location {
  id: number
  user_id: string
  latitude: number
  longitude: number
  city: string | null
  country: string | null
  is_default: boolean
  created_at: string
}

export interface WeatherPoint {
  timestamp: string
  temperature_c: number
  humidity: number | null
  wind_speed: number | null
  weather_code: number | null
  description?: string | null
}

export interface ForecastResponse {
  latitude: number
  longitude: number
  generated_at: string
  history: WeatherPoint[]
  forecast_3h: WeatherPoint
  forecast_1d: WeatherPoint
  forecast_3d: WeatherPoint
}

export const locationsApi = {
  create: (data: { latitude: number; longitude: number; city?: string; country?: string; is_default?: boolean }) =>
    api.post<Location>('/api/v1/locations', data),

  list: () => api.get<Location[]>('/api/v1/locations'),

  getDefault: () => api.get<Location>('/api/v1/locations/default'),
}

export const weatherApi = {
  getForecast: (lat?: number, lon?: number) => {
    const params: Record<string, number> = {}
    if (lat !== undefined) params.lat = lat
    if (lon !== undefined) params.lon = lon
    return api.get<ForecastResponse>('/api/v1/weather/forecast', { params })
  },
}

export default api