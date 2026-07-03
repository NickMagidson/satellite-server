/** Float32 slots per satellite in the motion buffer. */
export const SATELLITE_STRIDE = 7

export const ECI_X = 0
export const ECI_Y = 1
export const ECI_Z = 2
export const ECI_VX = 3
export const ECI_VY = 4
export const ECI_VZ = 5
export const FLAGS = 6

/** Flag bits stored at FLAGS (uint32 reinterpreted as float32). */
export const FLAG_VALID = 1 << 0
export const FLAG_SELECTED = 1 << 1
export const FLAG_IN_FOV = 1 << 2

export function bufferIndex(satelliteIndex: number, field: number): number {
  return satelliteIndex * SATELLITE_STRIDE + field
}

export function allocateMotionBuffer(count: number): Float32Array {
  return new Float32Array(count * SATELLITE_STRIDE)
}

export function allocateCorrectionTimeBuffer(): Float64Array {
  return new Float64Array(1)
}

export function getFlags(buffer: Float32Array, satelliteIndex: number): number {
  const offset = (buffer.byteOffset + bufferIndex(satelliteIndex, FLAGS) * 4) >>> 0
  return new Uint32Array(buffer.buffer, offset, 1)[0]
}

export function setFlags(
  buffer: Float32Array,
  satelliteIndex: number,
  flags: number,
): void {
  const offset = (buffer.byteOffset + bufferIndex(satelliteIndex, FLAGS) * 4) >>> 0
  new Uint32Array(buffer.buffer, offset, 1)[0] = flags >>> 0
}

export function hasFlag(flags: number, bit: number): boolean {
  return (flags & bit) !== 0
}

export function writeEciState(
  buffer: Float32Array,
  satelliteIndex: number,
  positionKm: { x: number; y: number; z: number },
  velocityKmPerSec: { x: number; y: number; z: number } | null,
  flags: number,
): void {
  const base = satelliteIndex * SATELLITE_STRIDE
  buffer[base + ECI_X] = positionKm.x
  buffer[base + ECI_Y] = positionKm.y
  buffer[base + ECI_Z] = positionKm.z
  buffer[base + ECI_VX] = velocityKmPerSec?.x ?? 0
  buffer[base + ECI_VY] = velocityKmPerSec?.y ?? 0
  buffer[base + ECI_VZ] = velocityKmPerSec?.z ?? 0
  setFlags(buffer, satelliteIndex, flags)
}

export function readEciState(
  buffer: Float32Array,
  satelliteIndex: number,
): {
  positionKm: { x: number; y: number; z: number }
  velocityKmPerSec: { x: number; y: number; z: number }
  flags: number
} {
  const base = satelliteIndex * SATELLITE_STRIDE
  return {
    positionKm: {
      x: buffer[base + ECI_X] ?? 0,
      y: buffer[base + ECI_Y] ?? 0,
      z: buffer[base + ECI_Z] ?? 0,
    },
    velocityKmPerSec: {
      x: buffer[base + ECI_VX] ?? 0,
      y: buffer[base + ECI_VY] ?? 0,
      z: buffer[base + ECI_VZ] ?? 0,
    },
    flags: getFlags(buffer, satelliteIndex),
  }
}
