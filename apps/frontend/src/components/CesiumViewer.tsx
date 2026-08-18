import { useEffect, useRef, useState } from 'react'
import type { SatelliteMotionHandle } from '../hooks/useSatelliteMotionWorker'
import { GLOBE_START_VIEW } from '../lib/cesiumCamera'
import type { CameraState } from '../lib/satelliteMotion/types'
import {
  correctionDtSeconds,
  positionFromMotionBuffer,
} from '../lib/satelliteMotion/extrapolate'
import {
  logSatellitePerf,
  satellitePerfLoggingEnabled,
} from '../lib/perfLogging'

interface CesiumEntity {
  id?: string
}

interface CesiumSelectionEntity extends CesiumEntity {
  position: {
    setValue: (value: unknown) => void
  }
}

interface CesiumEvent {
  addEventListener: (listener: (...args: never[]) => void) => () => void
}

interface CesiumCartesian3 {
  x: number
  y: number
  z: number
}

interface CesiumScene {
  pick: (windowPosition: unknown) => { id?: unknown } | undefined
  primitives: {
    add: (primitive: unknown) => unknown
    remove: (primitive: unknown) => boolean
  }
  preRender: CesiumEvent
  requestRender: () => void
  skyAtmosphere?: { show: boolean }
  fog?: { enabled: boolean }
  moon?: { show: boolean }
  sun?: { show: boolean }
  globe?: {
    enableLighting: boolean
    showGroundAtmosphere: boolean
    maximumScreenSpaceError: number
  }
}

interface CesiumPointPrimitive {
  id?: string
  position: unknown
  pixelSize: number
  color: unknown
  outlineColor: unknown
}

interface CesiumPointPrimitiveCollection {
  add: (options: Record<string, unknown>) => CesiumPointPrimitive
  remove: (primitive: CesiumPointPrimitive) => boolean
}

interface CesiumCamera {
  setView: (options: Record<string, unknown>) => void
  positionWC: CesiumCartesian3
  directionWC: CesiumCartesian3
  changed: CesiumEvent
  percentageChanged: number
}

interface CesiumViewerInstance {
  camera: CesiumCamera
  scene: CesiumScene
  screenSpaceEventHandler: {
    setInputAction: (
      action: (event: { position: unknown }) => void,
      type: unknown,
    ) => void
    removeInputAction: (type: unknown) => void
  }
  selectedEntity: CesiumEntity | undefined
  trackedEntity: CesiumEntity | undefined
  destroy: () => void
}

interface CesiumNamespace {
  Ion: { defaultAccessToken: string }
  Entity: new (options: Record<string, unknown>) => CesiumSelectionEntity
  Viewer: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => CesiumViewerInstance
  Cartesian3: {
    new (x: number, y: number, z: number): CesiumCartesian3
    fromDegrees: (longitude: number, latitude: number, height: number) => unknown
  }
  ConstantPositionProperty: new (value: unknown) => unknown
  Color: { CYAN: unknown; WHITE: unknown }
  Math: { toRadians: (degrees: number) => number }
  PointPrimitiveCollection: new () => CesiumPointPrimitiveCollection
  ScreenSpaceEventType: { LEFT_CLICK: unknown }
  defined: (value: unknown) => boolean
}

declare global {
  interface Window {
    Cesium?: CesiumNamespace
  }
}

interface CesiumViewerProps {
  motion: SatelliteMotionHandle
  selectedEntityId?: string | null
  onSelectedEntityIdChange?: (entityId: string | null) => void
  className?: string
}

interface StoredHomeView {
  destination: unknown
  orientation: {
    heading: number
    pitch: number
    roll: number
  }
}

function buildStartViewOptions(Cesium: CesiumNamespace): StoredHomeView {
  const { destination, orientation } = GLOBE_START_VIEW

  return {
    destination: Cesium.Cartesian3.fromDegrees(
      destination.lon,
      destination.lat,
      destination.heightM,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(orientation.heading),
      pitch: Cesium.Math.toRadians(orientation.pitch),
      roll: Cesium.Math.toRadians(orientation.roll),
    },
  }
}

function applyStartView(viewer: CesiumViewerInstance, homeView: StoredHomeView) {
  viewer.camera.setView(homeView as unknown as Record<string, unknown>)
  viewer.scene.requestRender()
}

function cameraStateFromViewer(viewer: CesiumViewerInstance): CameraState {
  const { positionWC, directionWC } = viewer.camera
  return {
    positionEcfKm: [positionWC.x / 1000, positionWC.y / 1000, positionWC.z / 1000],
    directionEcf: [directionWC.x, directionWC.y, directionWC.z],
  }
}

const CESIUM_SCRIPT_ID = 'cesium-script'
const CESIUM_STYLE_ID = 'cesium-style'
const CESIUM_SCRIPT_SRC = '/cesium/Cesium.js'
const CESIUM_STYLE_HREF = '/cesium/Widgets/widgets.css'
const SATELLITE_POINT_SIZE = 3
const CAMERA_THROTTLE_MS = 100

function ensureCesiumStylesheet(): void {
  if (document.getElementById(CESIUM_STYLE_ID)) {
    return
  }

  const link = document.createElement('link')
  link.id = CESIUM_STYLE_ID
  link.rel = 'stylesheet'
  link.href = CESIUM_STYLE_HREF
  document.head.appendChild(link)
}

function loadCesium(): Promise<CesiumNamespace> {
  if (window.Cesium) {
    return Promise.resolve(window.Cesium)
  }

  const existingScript = document.getElementById(CESIUM_SCRIPT_ID)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        if (window.Cesium) {
          resolve(window.Cesium)
          return
        }

        reject(new Error('Cesium failed to initialize.'))
      })
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Cesium script.'))
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = CESIUM_SCRIPT_ID
    script.src = CESIUM_SCRIPT_SRC
    script.async = true
    script.onload = () => {
      if (window.Cesium) {
        resolve(window.Cesium)
        return
      }

      reject(new Error('Cesium failed to initialize.'))
    }
    script.onerror = () => {
      reject(new Error('Failed to load Cesium script.'))
    }
    document.head.appendChild(script)
  })
}

export default function CesiumViewer({
  motion,
  selectedEntityId = null,
  onSelectedEntityIdChange,
  className,
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CesiumViewerInstance | null>(null)
  const cesiumApiRef = useRef<CesiumNamespace | null>(null)
  const pointsRef = useRef<Map<string, CesiumPointPrimitive>>(new Map())
  const selectionEntityRef = useRef<CesiumSelectionEntity | null>(null)
  const pointCollectionRef = useRef<CesiumPointPrimitiveCollection | null>(null)
  const onSelectedEntityIdChangeRef = useRef(onSelectedEntityIdChange)
  const motionRef = useRef(motion)
  const selectedEntityIdRef = useRef(selectedEntityId)
  const [viewerReady, setViewerReady] = useState(false)

  useEffect(() => {
    onSelectedEntityIdChangeRef.current = onSelectedEntityIdChange
  }, [onSelectedEntityIdChange])

  useEffect(() => {
    motionRef.current = motion
  }, [motion])

  useEffect(() => {
    selectedEntityIdRef.current = selectedEntityId
  }, [selectedEntityId])

  useEffect(() => {
    let cancelled = false
    let CesiumApi: CesiumNamespace | null = null
    let removePreRender: (() => void) | null = null
    let removeCameraChanged: (() => void) | null = null

    async function init() {
      ensureCesiumStylesheet()
      const Cesium = await loadCesium()
      CesiumApi = Cesium

      if (cancelled || !containerRef.current) {
        return
      }

      const initStartedAt = performance.now()
      const perfLoggingEnabled = satellitePerfLoggingEnabled()
      Cesium.Ion.defaultAccessToken =
        import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN ?? ''

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: true,
        infoBox: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        scene3DOnly: true,
        msaaSamples: 1,
      })
      viewerRef.current = viewer
      cesiumApiRef.current = Cesium

      applyStartView(viewer, buildStartViewOptions(Cesium))

      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = false
      }
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = false
      }
      if (viewer.scene.moon) {
        viewer.scene.moon.show = false
      }
      if (viewer.scene.sun) {
        viewer.scene.sun.show = false
      }
      if (viewer.scene.globe) {
        viewer.scene.globe.enableLighting = false
        viewer.scene.globe.showGroundAtmosphere = false
        viewer.scene.globe.maximumScreenSpaceError = 4
      }

      const pointCollection = new Cesium.PointPrimitiveCollection()
      viewer.scene.primitives.add(pointCollection)
      pointCollectionRef.current = pointCollection
      selectionEntityRef.current = new Cesium.Entity({
        id: 'selected-satellite',
        position: new Cesium.ConstantPositionProperty(
          new Cesium.Cartesian3(0, 0, 0),
        ),
      })
      setViewerReady(true)
      logSatellitePerf('cesium_viewer_ready', {
        durationMs: Math.round(performance.now() - initStartedAt),
      })

      viewer.screenSpaceEventHandler.setInputAction((click) => {
        const picked = viewer.scene.pick(click.position)
        const pickedId = Cesium.defined(picked?.id) ? picked?.id : undefined
        const entityId =
          typeof pickedId === 'string' && pointsRef.current.has(pickedId)
            ? pickedId
            : null

        viewer.trackedEntity = undefined
        viewer.selectedEntity = entityId
          ? (selectionEntityRef.current ?? undefined)
          : undefined
        onSelectedEntityIdChangeRef.current?.(entityId)
        viewer.scene.requestRender()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      let lastCameraPostMs = 0
      const onCameraChanged = () => {
        const now = performance.now()
        if (now - lastCameraPostMs < CAMERA_THROTTLE_MS) {
          return
        }
        lastCameraPostMs = now
        motionRef.current.setCameraState(cameraStateFromViewer(viewer))
      }
      viewer.camera.percentageChanged = 0.01
      removeCameraChanged = viewer.camera.changed.addEventListener(onCameraChanged)
      motionRef.current.setCameraState(cameraStateFromViewer(viewer))

      let loggedFirstMotionRender = false
      let updateSampleStartedAt = performance.now()
      let updateSampleCount = 0
      let updateSampleTotalMs = 0
      let updateSampleMaxMs = 0
      const scratchCartesian = new Cesium.Cartesian3(0, 0, 0)

      const onPreRender = () => {
        const updateStartedAt = perfLoggingEnabled ? performance.now() : 0
        const currentMotion = motionRef.current
        const buffer = currentMotion.bufferRef.current
        const correctionTimes = currentMotion.correctionTimeRef.current
        const pointCollectionCurrent = pointCollectionRef.current
        if (
          !buffer ||
          !correctionTimes ||
          !pointCollectionCurrent ||
          currentMotion.count === 0
        ) {
          viewer.scene.requestRender()
          return
        }

        const date = new Date()
        const points = pointsRef.current

        for (let index = 0; index < currentMotion.count; index += 1) {
          const id = currentMotion.idByIndex[index]
          if (!id) {
            continue
          }

          const dtSeconds = correctionDtSeconds(correctionTimes[index])
          const ecfMeters = positionFromMotionBuffer(
            buffer,
            index,
            dtSeconds,
            date,
          )
          const point = points.get(id)
          if (!ecfMeters || !point) {
            continue
          }

          scratchCartesian.x = ecfMeters.x
          scratchCartesian.y = ecfMeters.y
          scratchCartesian.z = ecfMeters.z
          point.position = scratchCartesian
        }

        const selectedId = selectedEntityIdRef.current
        const selectedPoint = selectedId ? points.get(selectedId) : undefined
        if (selectedPoint) {
          selectionEntityRef.current?.position.setValue(selectedPoint.position)
        }

        if (perfLoggingEnabled) {
          const now = performance.now()
          const durationMs = now - updateStartedAt
          updateSampleCount += 1
          updateSampleTotalMs += durationMs
          updateSampleMaxMs = Math.max(updateSampleMaxMs, durationMs)

          if (!loggedFirstMotionRender) {
            loggedFirstMotionRender = true
            logSatellitePerf('cesium_first_motion_render', {
              count: currentMotion.count,
              durationMs: Math.round(durationMs),
            })
          }

          if (now - updateSampleStartedAt >= 5000 && updateSampleCount > 0) {
            logSatellitePerf('cesium_update_loop', {
              count: currentMotion.count,
              samples: updateSampleCount,
              averageMs: Math.round(updateSampleTotalMs / updateSampleCount),
              maxMs: Math.round(updateSampleMaxMs),
            })
            updateSampleStartedAt = now
            updateSampleCount = 0
            updateSampleTotalMs = 0
            updateSampleMaxMs = 0
          }
        }

        viewer.scene.requestRender()
      }

      removePreRender = viewer.scene.preRender.addEventListener(onPreRender)
      viewer.scene.requestRender()
    }

    void init()

    return () => {
      cancelled = true
      setViewerReady(false)
      removePreRender?.()
      removeCameraChanged?.()
      const viewer = viewerRef.current
      if (viewer && CesiumApi) {
        viewer.screenSpaceEventHandler.removeInputAction(
          CesiumApi.ScreenSpaceEventType.LEFT_CLICK,
        )
      }
      if (viewer && pointCollectionRef.current) {
        viewer.scene.primitives.remove(pointCollectionRef.current)
      }
      viewerRef.current?.destroy()
      viewerRef.current = null
      cesiumApiRef.current = null
      pointCollectionRef.current = null
      pointsRef.current.clear()
      selectionEntityRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!viewerReady) {
      return
    }

    async function syncCatalog() {
      const viewer = viewerRef.current
      const pointCollection = pointCollectionRef.current
      const Cesium = cesiumApiRef.current
      if (!viewer || !pointCollection || !Cesium) {
        return
      }

      const points = pointsRef.current
      const visibleIds = new Set(motion.idByIndex)
      const syncStartedAt = performance.now()

      for (const [id, point] of points) {
        if (!visibleIds.has(id)) {
          pointCollection.remove(point)
          points.delete(id)
        }
      }

      for (let index = 0; index < motion.count; index += 1) {
        const id = motion.idByIndex[index]
        if (!id || points.has(id)) {
          continue
        }

        const cartesian = new Cesium.Cartesian3(0, 0, 0)
        const point = pointCollection.add({
          id,
          position: cartesian,
          pixelSize: SATELLITE_POINT_SIZE,
          color: Cesium.Color.CYAN,
          // outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
        })
        points.set(id, point)
      }

      viewer.scene.requestRender()
      logSatellitePerf('cesium_catalog_sync', {
        count: motion.count,
        durationMs: Math.round(performance.now() - syncStartedAt),
      })
    }

    void syncCatalog()
  }, [viewerReady, motion.count, motion.idByIndex])

  useEffect(() => {
    if (!viewerReady) {
      return
    }

    const viewer = viewerRef.current
    if (!viewer) {
      return
    }

    const selectedIndex =
      selectedEntityId === null
        ? null
        : (motion.indexById.get(selectedEntityId) ?? null)
    motion.setSelectedIndex(selectedIndex)

    viewer.trackedEntity = undefined
    viewer.selectedEntity = selectedEntityId
      ? (selectionEntityRef.current ?? undefined)
      : undefined
    const selectedPoint = selectedEntityId
      ? pointsRef.current.get(selectedEntityId)
      : undefined
    if (selectedPoint) {
      selectionEntityRef.current?.position.setValue(selectedPoint.position)
    }
    viewer.scene.requestRender()
  }, [viewerReady, motion.indexById, motion.setSelectedIndex, selectedEntityId])

  return <div ref={containerRef} className={className} />
}
