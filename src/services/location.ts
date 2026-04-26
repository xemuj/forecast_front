export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
    )
  })
}

export async function getCityCountry(lat: number, lon: number): Promise<{ city?: string; country?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    )
    const data = await res.json()
    return {
      city: data.address?.city || data.address?.town || data.address?.village || undefined,
      country: data.address?.country_code?.toUpperCase() || undefined,
    }
  } catch {
    return {}
  }
}