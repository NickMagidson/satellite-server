/// <reference lib="webworker" />

import * as satellite from 'satellite.js'
import type { OMMJsonObject, SatRec } from 'satellite.js'
import {
  FLAG_IN_FOV,
  FLAG_SELECTED,
  FLAG_VALID,
  writeEciState,
} from '../lib/satelliteMotion/bufferLayout'
import type {
  CameraState,
  MainToWorkerMessage,
  SatelliteElement,
  SelectedPositionDetail,
  WorkerToMainMessage,
} from '../lib/satelliteMotion/types'
import type { EcfKm } from './propagationScheduler'
import { isInFov, shouldRunSgp4 } from './propagationScheduler'

const SELECTED_DETAIL_INTERVAL_MS = 500

interface CachedEci {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
}

interface WorkerSatellite {
  id: string
  name: string
  satrec: SatRec
  lastSgp4Ms: number
  lastEcfKm: EcfKm | null
  eci: CachedEci | null
}

let entries: WorkerSatellite[] = []
let selectedIndex: number | null = null
let camera: CameraState | null = null
let writeBuffer: Float32Array | null = null
let writeCorrectionTime: Float64Array | null = null
let rafId: number | null = null
let lastSelectedDetailMs = 0
let waitingForBuffer = false

function nowMs(): number {
  return performance.timeOrigin + performance.now()
}

function post(message: WorkerToMainMessage, transfer?: Transferable[]): void {
  if (transfer) {
    self.postMessage(message, transfer)
    return
  }
  self.postMessage(message)
}

function buildEntries(elements: SatelliteElement[]): WorkerSatellite[] {
  return elements.map((element) => ({
    id: element.id,
    name: element.name,
    satrec: satellite.json2satrec(element.omm as OMMJsonObject),
    lastSgp4Ms: Number.NEGATIVE_INFINITY,
    lastEcfKm: null,
    eci: null,
  }))
}

function runSgp4(entry: WorkerSatellite, date: Date, atMs: number): boolean {
  const pv = satellite.propagate(entry.satrec, date)
  entry.lastSgp4Ms = atMs

  if (!pv?.position) {
    entry.lastEcfKm = null
    entry.eci = null
    return false
  }

  const position = pv.position
  entry.eci = { position, velocity: pv.velocity }

  const gmst = satellite.gstime(date)
  const ecf = satellite.eciToEcf(position, gmst)
  entry.lastEcfKm = { x: ecf.x, y: ecf.y, z: ecf.z }
  return true
}

function writeEntry(
  buffer: Float32Array,
  index: number,
  entry: WorkerSatellite,
): void {
  if (!entry.eci) {
    writeEciState(
      buffer,
      index,
      { x: 0, y: 0, z: 0 },
      null,
      selectedIndex === index ? FLAG_SELECTED : 0,
    )
    return
  }

  let flags = FLAG_VALID
  if (selectedIndex === index) {
    flags |= FLAG_SELECTED
  }
  if (camera && entry.lastEcfKm && isInFov(camera, entry.lastEcfKm)) {
    flags |= FLAG_IN_FOV
  }

  writeEciState(
    buffer,
    index,
    entry.eci.position,
    entry.eci.velocity,
    flags,
  )
}

function publishBuffer(
  buffer: Float32Array,
  correctionTime: Float64Array,
): void {
  writeBuffer = null
  writeCorrectionTime = null
  waitingForBuffer = true

  post(
    { type: 'BUFFER', buffer, correctionTime },
    [buffer.buffer, correctionTime.buffer],
  )
}

function maybePostSelectedDetail(date: Date, atMs: number): void {
  if (selectedIndex === null) {
    return
  }

  if (atMs - lastSelectedDetailMs < SELECTED_DETAIL_INTERVAL_MS) {
    return
  }

  if (selectedIndex < 0 || selectedIndex >= entries.length) {
    return
  }

  const entry = entries[selectedIndex]
  if (!entry.eci) {
    return
  }

  const gmst = satellite.gstime(date)
  const geodetic = satellite.eciToGeodetic(entry.eci.position, gmst)
  const detail: SelectedPositionDetail = {
    id: entry.id,
    name: entry.name,
    geodetic: {
      latitudeDeg: satellite.degreesLat(geodetic.latitude),
      longitudeDeg: satellite.degreesLong(geodetic.longitude),
      altitudeKm: geodetic.height,
    },
    propagatedAt: date.toISOString(),
  }

  lastSelectedDetailMs = atMs
  post({ type: 'SELECTED_DETAIL', detail })
}

function tick(): void {
  rafId = self.requestAnimationFrame(tick)

  if (
    waitingForBuffer ||
    !writeBuffer ||
    !writeCorrectionTime ||
    entries.length === 0
  ) {
    return
  }

  const atMs = nowMs()
  const date = new Date(atMs)
  const buffer = writeBuffer
  const correctionTime = writeCorrectionTime

  entries.forEach((entry, index) => {
    if (
      shouldRunSgp4({
        index,
        selectedIndex,
        camera,
        satEcfKm: entry.lastEcfKm,
        nowMs: atMs,
        lastSgp4Ms: entry.lastSgp4Ms,
      })
    ) {
      runSgp4(entry, date, atMs)
    }
    writeEntry(buffer, index, entry)
    // Per-satellite epoch so main-thread extrapolation uses time since this sat's SGP4.
    correctionTime[index] = entry.lastSgp4Ms
  })

  publishBuffer(buffer, correctionTime)
  maybePostSelectedDetail(date, atMs)
}

function ensureLoop(): void {
  if (rafId === null) {
    rafId = self.requestAnimationFrame(tick)
  }
}

function loadCatalog(
  elements: SatelliteElement[],
  buffer: Float32Array,
  correctionTime: Float64Array,
): void {
  entries = buildEntries(elements)
  selectedIndex = null
  lastSelectedDetailMs = 0

  const atMs = nowMs()
  const date = new Date(atMs)

  entries.forEach((entry, index) => {
    runSgp4(entry, date, atMs)
    writeEntry(buffer, index, entry)
    correctionTime[index] = entry.lastSgp4Ms
  })

  publishBuffer(buffer, correctionTime)
  ensureLoop()
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'INIT':
      case 'RELOAD':
        loadCatalog(message.elements, message.buffer, message.correctionTime)
        break
      case 'CAMERA':
        camera = message.camera
        break
      case 'SET_SELECTED':
        selectedIndex = message.selectedIndex
        break
      case 'RETURN_BUFFER':
        writeBuffer = message.buffer
        writeCorrectionTime = message.correctionTime
        waitingForBuffer = false
        break
    }
  } catch (error) {
    post({
      type: 'ERROR',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
