export interface RegionCodes {
  provinceCode: string
  cityCode: string
  districtCode: string
}

export function resolveRegionCodesFromAdcode(adcode: unknown): RegionCodes {
  const code = String(adcode ?? '').trim()
  if (!/^\d{6}$/.test(code)) {
    return {
      provinceCode: '',
      cityCode: '',
      districtCode: '',
    }
  }

  return {
    provinceCode: `${code.slice(0, 2)}0000`,
    cityCode: `${code.slice(0, 4)}00`,
    districtCode: code,
  }
}

export function normalizeCoordinate(value: unknown) {
  const coordinate = typeof value === 'number'
    ? value
    : typeof value === 'string' ? Number(value) : Number.NaN

  return Number.isFinite(coordinate) ? coordinate : undefined
}
