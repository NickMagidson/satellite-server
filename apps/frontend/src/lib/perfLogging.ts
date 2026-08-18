function readBooleanEnv(value: unknown): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
}

export function satellitePerfLoggingEnabled(): boolean {
  return readBooleanEnv(import.meta.env.VITE_SATELLITE_PERF_LOGS)
}

export function logSatellitePerf(
  label: string,
  data: Record<string, number | string | boolean | null>,
): void {
  if (!satellitePerfLoggingEnabled()) {
    return
  }

  console.info(`[satellite-perf] ${label}`, data)
}
