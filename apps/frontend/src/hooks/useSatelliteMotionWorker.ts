import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  allocateCorrectionTimeBuffer,
  allocateMotionBuffer,
} from '../lib/satelliteMotion/bufferLayout'
import type {
  CameraState,
  MainToWorkerMessage,
  SatelliteElement,
  SelectedPositionDetail,
  WorkerToMainMessage,
} from '../lib/satelliteMotion/types'
import { fetchSatelliteElements } from '../lib/satelliteApi'
import { filterByVisibleIds } from '../lib/satelliteFilters'
import { logSatellitePerf } from '../lib/perfLogging'
import { useSatellites } from './useSatellites'

export interface SatelliteMotionHandle {
  bufferRef: React.RefObject<Float32Array | null>
  /** Per-satellite last-SGP4 epoch (ms), same length as the motion buffer catalog. */
  correctionTimeRef: React.RefObject<Float64Array | null>
  count: number
  idByIndex: string[]
  nameByIndex: string[]
  indexById: Map<string, number>
  setCameraState: (camera: CameraState) => void
  setSelectedIndex: (index: number | null) => void
  selectedDetail: SelectedPositionDetail | null
  isReady: boolean
  isPending: boolean
  isError: boolean
  error: Error | null
}

function postToWorker(
  worker: Worker,
  message: MainToWorkerMessage,
  transfer?: Transferable[],
): void {
  if (transfer) {
    worker.postMessage(message, transfer)
    return
  }
  worker.postMessage(message)
}

function catalogIdentity(elements: SatelliteElement[]): string {
  return elements.map((element) => element.id).join(',')
}

export function useSatelliteMotionWorker(
  visibleSatelliteIds: ReadonlySet<string> | null,
): SatelliteMotionHandle {
  const elementsQuery = useQuery({
    queryKey: ['satellite-elements'],
    queryFn: async () => {
      const startedAt = performance.now()
      const response = await fetchSatelliteElements()
      logSatellitePerf('fetch_elements', {
        count: response.count,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return response
    },
    staleTime: 60_000,
  })
  const satellitesQuery = useSatellites()

  const workerRef = useRef<Worker | null>(null)
  const bufferRef = useRef<Float32Array | null>(null)
  const correctionTimeRef = useRef<Float64Array | null>(null)
  const idleBufferRef = useRef<Float32Array | null>(null)
  const idleCorrectionTimeRef = useRef<Float64Array | null>(null)

  const [selectedDetail, setSelectedDetail] =
    useState<SelectedPositionDetail | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [workerError, setWorkerError] = useState<Error | null>(null)

  const elements = useMemo(() => {
    if (visibleSatelliteIds === null) {
      return []
    }

    return filterByVisibleIds(
      elementsQuery.data?.elements ?? [],
      visibleSatelliteIds,
    )
  }, [elementsQuery.data?.elements, visibleSatelliteIds])
  const count = elements.length

  const idByIndex = useMemo(() => elements.map((element) => element.id), [elements])
  const nameByIndex = useMemo(
    () => elements.map((element) => element.name),
    [elements],
  )
  const indexById = useMemo(() => {
    const map = new Map<string, number>()
    elements.forEach((element, index) => {
      map.set(element.id, index)
    })
    return map
  }, [elements])

  const catalogKey = useMemo(
    () =>
      visibleSatelliteIds === null
        ? null
        : `${count}:${catalogIdentity(elements)}`,
    [count, elements, visibleSatelliteIds],
  )

  const setCameraState = useCallback((camera: CameraState) => {
    const worker = workerRef.current
    if (!worker) {
      return
    }
    postToWorker(worker, { type: 'CAMERA', camera })
  }, [])

  const setSelectedIndex = useCallback((index: number | null) => {
    const worker = workerRef.current
    if (!worker) {
      return
    }
    postToWorker(worker, { type: 'SET_SELECTED', selectedIndex: index })
    if (index === null) {
      setSelectedDetail(null)
    }
  }, [])

  const refetchElements = elementsQuery.refetch

  useEffect(() => {
    if (satellitesQuery.dataUpdatedAt === 0) {
      return
    }
    void refetchElements()
  }, [satellitesQuery.dataUpdatedAt, refetchElements])

  useEffect(() => {
    const catalogElements = visibleSatelliteIds === null ? null : elements

    if (!elementsQuery.isSuccess || !catalogElements) {
      bufferRef.current = null
      correctionTimeRef.current = null
      setIsReady(false)
      setSelectedDetail(null)
      return
    }

    if (catalogElements.length === 0) {
      bufferRef.current = null
      correctionTimeRef.current = null
      setIsReady(true)
      setWorkerError(null)
      setSelectedDetail(null)
      return
    }

    const worker = new Worker(
      new URL('../workers/satelliteMotion.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker
    const workerInitStartedAt = performance.now()
    let loggedFirstBuffer = false

    const catalogCount = catalogElements.length
    const bufferA = allocateMotionBuffer(catalogCount)
    const bufferB = allocateMotionBuffer(catalogCount)
    const timeA = allocateCorrectionTimeBuffer(catalogCount)
    const timeB = allocateCorrectionTimeBuffer(catalogCount)

    idleBufferRef.current = bufferB
    idleCorrectionTimeRef.current = timeB
    setIsReady(false)
    setWorkerError(null)
    setSelectedDetail(null)

    worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const message = event.data

      switch (message.type) {
        case 'BUFFER': {
          bufferRef.current = message.buffer
          correctionTimeRef.current = message.correctionTime
          setIsReady(true)

          if (!loggedFirstBuffer) {
            loggedFirstBuffer = true
            logSatellitePerf('worker_ready', {
              count: catalogCount,
              durationMs: Math.round(performance.now() - workerInitStartedAt),
            })
          }

          const idleBuffer = idleBufferRef.current
          const idleCorrectionTime = idleCorrectionTimeRef.current
          if (idleBuffer && idleCorrectionTime) {
            idleBufferRef.current = message.buffer
            idleCorrectionTimeRef.current = message.correctionTime
            postToWorker(
              worker,
              {
                type: 'RETURN_BUFFER',
                buffer: idleBuffer,
                correctionTime: idleCorrectionTime,
              },
              [idleBuffer.buffer, idleCorrectionTime.buffer],
            )
          }
          break
        }
        case 'SELECTED_DETAIL':
          setSelectedDetail(message.detail)
          break
        case 'ERROR':
          setWorkerError(new Error(message.message))
          break
      }
    }

    worker.onerror = (event) => {
      setWorkerError(new Error(event.message || 'Satellite motion worker failed.'))
    }

    postToWorker(
      worker,
      {
        type: 'INIT',
        elements: catalogElements,
        buffer: bufferA,
        correctionTime: timeA,
      },
      [bufferA.buffer, timeA.buffer],
    )

    return () => {
      worker.terminate()
      workerRef.current = null
      bufferRef.current = null
      correctionTimeRef.current = null
      idleBufferRef.current = null
      idleCorrectionTimeRef.current = null
      setIsReady(false)
    }
  }, [
    catalogKey,
    elements,
    elementsQuery.isSuccess,
    visibleSatelliteIds,
  ])

  const error =
    workerError ??
    (elementsQuery.error instanceof Error ? elementsQuery.error : null)

  return {
    bufferRef,
    correctionTimeRef,
    count,
    idByIndex,
    nameByIndex,
    indexById,
    setCameraState,
    setSelectedIndex,
    selectedDetail,
    isReady,
    isPending:
      visibleSatelliteIds === null ||
      elementsQuery.isPending ||
      (count > 0 && !isReady && !error),
    isError: Boolean(error) || elementsQuery.isError,
    error,
  }
}
