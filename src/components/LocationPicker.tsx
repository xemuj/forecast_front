import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface LocationPickerProps {
  lat: number
  lon: number
  onSelect: (lat: number, lon: number) => void
  onReady?: () => void
}

function MapController({ lat, lon, onSelect, onReady }: { lat: number; lon: number; onSelect: (lat: number, lon: number) => void; onReady?: () => void }) {
  const map = useMap()
  const initialised = useRef(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true
      map.setView([lat, lon], 10)
      onReady?.()
    } else {
      if (isMobile) {
        map.setView([lat, lon], 10)
      } else {
        map.flyTo([lat, lon], 10, { duration: 1.2 })
      }
    }
  }, [lat, lon, map, onReady, isMobile])

  useMapEvents({
    click: e => {
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return <Marker position={[lat, lon]} icon={markerIcon} />
}

export default function LocationPicker({ lat, lon, onSelect, onReady }: LocationPickerProps) {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={[lat, lon]}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController lat={lat} lon={lon} onSelect={onSelect} onReady={onReady} />
      </MapContainer>
    </div>
  )
}