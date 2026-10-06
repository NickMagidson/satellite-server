import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
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

interface CesiumEvent {
  addEventListener: (listener: (...args: never[]) => void) => () => void
}

interface CesiumCartesian3 {
  x: number
  y: number
  z: number
}

interface CesiumSkyBox {
  show: boolean
}

interface CesiumSkyBoxSources {
  positiveX: string | ImageBitmap
  negativeX: string | ImageBitmap
  positiveY: string | ImageBitmap
  negativeY: string | ImageBitmap
  positiveZ: string | ImageBitmap
  negativeZ: string | ImageBitmap
}

interface CesiumScene {
  pick: (windowPosition: unknown) => { id?: unknown } | undefined
  primitives: {
    add: (primitive: unknown) => unknown
    remove: (primitive: unknown) => boolean
  }
  preRender: CesiumEvent
  requestRender: () => void
  skyBox?: CesiumSkyBox
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
  entities: {
    add: (entity: CesiumEntity) => CesiumEntity
  }
  selectedEntity: CesiumEntity | undefined
  trackedEntity: CesiumEntity | undefined
  trackedEntityChanged: CesiumEvent
  destroy: () => void
  isDestroyed: () => boolean
}

interface CesiumNamespace {
  Ion: { defaultAccessToken: string }
  Entity: new (options: Record<string, unknown>) => CesiumEntity
  Viewer: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => CesiumViewerInstance
  SkyBox: {
    new (options: { sources: CesiumSkyBoxSources }): CesiumSkyBox
    createEarthSkyBox: () => CesiumSkyBox
  }
  Cartesian3: {
    new (x: number, y: number, z: number): CesiumCartesian3
    fromDegrees: (
      longitude: number,
      latitude: number,
      height: number,
    ) => unknown
  }
  CallbackPositionProperty: new (
    callback: (
      time: unknown,
      result?: CesiumCartesian3,
    ) => CesiumCartesian3 | undefined,
    isConstant: boolean,
  ) => unknown
  Color: { CYAN: unknown; WHITE: unknown; TRANSPARENT: unknown }
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

declare const __CESIUM_RUNTIME_BASE__: string

interface CesiumViewerProps {
  motion: SatelliteMotionHandle
  selectedEntityId?: string | null
  onSelectedEntityIdChange?: (entityId: string | null) => void
  onTrackingChange?: (isTracking: boolean) => void
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

export interface CesiumViewerHandle {
  recenter: () => void
  setTracking: (enabled: boolean) => void
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

function applyStartView(
  viewer: CesiumViewerInstance,
  homeView: StoredHomeView,
) {
  viewer.camera.setView(homeView as unknown as Record<string, unknown>)
  viewer.scene.requestRender()
}

function cameraStateFromViewer(viewer: CesiumViewerInstance): CameraState {
  const { positionWC, directionWC } = viewer.camera
  return {
    positionEcfKm: [
      positionWC.x / 1000,
      positionWC.y / 1000,
      positionWC.z / 1000,
    ],
    directionEcf: [directionWC.x, directionWC.y, directionWC.z],
  }
}

const CESIUM_SCRIPT_ID = 'cesium-script'
const CESIUM_STYLE_ID = 'cesium-style'
const CESIUM_SCRIPT_SRC = `${__CESIUM_RUNTIME_BASE__}Cesium.js`
const CESIUM_STYLE_HREF = `${__CESIUM_RUNTIME_BASE__}Widgets/widgets.css`
const SATELLITE_POINT_SIZE = 2
const CAMERA_THROTTLE_MS = 100
/** Tracking camera offset from the satellite in its local east-north-up frame, in meters. */
const TRACKING_VIEW_FROM = { east: 0, north: -1, up: 300_000 } as const

/** NASA Tycho Catalog Skymap (SVS) as a 2K cube map — denser than Cesium's default stars. */
const NASA_DEEP_SPACE_SKYBOX = {
  positiveX: '/skybox/tycho_px.jpg',
  negativeX: '/skybox/tycho_mx.jpg',
  positiveY: '/skybox/tycho_py.jpg',
  negativeY: '/skybox/tycho_my.jpg',
  positiveZ: '/skybox/tycho_pz.jpg',
  negativeZ: '/skybox/tycho_mz.jpg',
} as const

async function loadSkyBoxFace(url: string): Promise<ImageBitmap> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Skybox request failed (${response.status}): ${url}`)
  }

  // Match Cesium's loadCubeMap: flip during decode, then CubeMap flips again.
  return createImageBitmap(await response.blob(), {
    imageOrientation: 'flipY',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'default',
  })
}

async function loadNasaSkyBoxSources(): Promise<CesiumSkyBoxSources> {
  const [positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ] =
    await Promise.all([
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.positiveX),
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.negativeX),
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.positiveY),
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.negativeY),
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.positiveZ),
      loadSkyBoxFace(NASA_DEEP_SPACE_SKYBOX.negativeZ),
    ])

  return {
    positiveX,
    negativeX,
    positiveY,
    negativeY,
    positiveZ,
    negativeZ,
  }
}

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

const CesiumViewer = forwardRef<CesiumViewerHandle, CesiumViewerProps>(
  function CesiumViewer(
    {
      motion,
      selectedEntityId = null,
      onSelectedEntityIdChange,
      onTrackingChange,
      className,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<CesiumViewerInstance | null>(null)
    const cesiumApiRef = useRef<CesiumNamespace | null>(null)
    const pointsRef = useRef<Map<string, CesiumPointPrimitive>>(new Map())
    const selectionEntityRef = useRef<CesiumEntity | null>(null)
    const pointCollectionRef = useRef<CesiumPointPrimitiveCollection | null>(
      null,
    )
    const onSelectedEntityIdChangeRef = useRef(onSelectedEntityIdChange)
    const onTrackingChangeRef = useRef(onTrackingChange)
    const motionRef = useRef(motion)
    const selectedEntityIdRef = useRef(selectedEntityId)
    const previousSelectedEntityIdRef = useRef<string | null>(null)
    const homeViewRef = useRef<StoredHomeView | null>(null)
    const [viewerReady, setViewerReady] = useState(false)

    useEffect(() => {
      onSelectedEntityIdChangeRef.current = onSelectedEntityIdChange
    }, [onSelectedEntityIdChange])

    useEffect(() => {
      onTrackingChangeRef.current = onTrackingChange
    }, [onTrackingChange])

    useEffect(() => {
      motionRef.current = motion
    }, [motion])

    useEffect(() => {
      selectedEntityIdRef.current = selectedEntityId
    }, [selectedEntityId])

    useImperativeHandle(
      ref,
      () => ({
        recenter: () => {
          const viewer = viewerRef.current
          const Cesium = cesiumApiRef.current

          if (!viewer || !Cesium) {
            return
          }

          if (!homeViewRef.current) {
            homeViewRef.current = buildStartViewOptions(Cesium)
          }

          viewer.trackedEntity = undefined
          applyStartView(viewer, homeViewRef.current)
        },
        setTracking: (enabled) => {
          const viewer = viewerRef.current
          if (!viewer) {
            return
          }

          viewer.trackedEntity =
            enabled && selectedEntityIdRef.current
              ? (selectionEntityRef.current ?? undefined)
              : undefined
          viewer.scene.requestRender()
        },
      }),
      [],
    )

    useEffect(() => {
      let cancelled = false
      let CesiumApi: CesiumNamespace | null = null
      let removePreRender: (() => void) | null = null
      let removeCameraChanged: (() => void) | null = null
      let removeTrackedEntityChanged: (() => void) | null = null

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

        homeViewRef.current = buildStartViewOptions(Cesium)
        applyStartView(viewer, homeViewRef.current)

        // Default stars render immediately. The NASA cube is six 2048² JPEGs
        // served by the app, and Cesium draws nothing until every face is
        // decoded — with the atmosphere hidden, that gap is a black sky.
        viewer.scene.skyBox = Cesium.SkyBox.createEarthSkyBox()
        void loadNasaSkyBoxSources()
          .then((sources) => {
            if (cancelled || viewer.isDestroyed()) {
              return
            }

            viewer.scene.skyBox = new Cesium.SkyBox({ sources })
            viewer.scene.requestRender()
          })
          .catch((error: unknown) => {
            console.warn(
              'NASA skybox failed; keeping the default starfield.',
              error,
            )
          })

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

        viewer.scene.requestRender()

        const pointCollection = new Cesium.PointPrimitiveCollection()
        viewer.scene.primitives.add(pointCollection)
        pointCollectionRef.current = pointCollection
        // Cesium only tracks entities that belong to a data source, and only
        // follows them each tick when a visualizer reports a bounding sphere,
        // hence the invisible point graphic.
        selectionEntityRef.current = viewer.entities.add(
          new Cesium.Entity({
            id: 'selected-satellite',
            point: { pixelSize: 1, color: Cesium.Color.TRANSPARENT },
            viewFrom: new Cesium.Cartesian3(
              TRACKING_VIEW_FROM.east,
              TRACKING_VIEW_FROM.north,
              TRACKING_VIEW_FROM.up,
            ),
            position: new Cesium.CallbackPositionProperty((_time, result) => {
              const selectedId = selectedEntityIdRef.current
              const position = selectedId
                ? (pointsRef.current.get(selectedId)?.position as
                    | CesiumCartesian3
                    | undefined)
                : undefined
              if (!position) {
                return undefined
              }

              const out = result ?? new Cesium.Cartesian3(0, 0, 0)
              out.x = position.x
              out.y = position.y
              out.z = position.z
              return out
            }, false),
          }),
        )
        removeTrackedEntityChanged =
          viewer.trackedEntityChanged.addEventListener(() => {
            onTrackingChangeRef.current?.(viewer.trackedEntity !== undefined)
          })
        setViewerReady(true)
        logSatellitePerf('cesium_viewer_ready', {
          durationMs: Math.round(performance.now() - initStartedAt),
        })

        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const picked = viewer.scene.pick(click.position)
          const pickedId = Cesium.defined(picked?.id) ? picked?.id : undefined
          const entityId =
            pickedId !== undefined && pickedId === selectionEntityRef.current
              ? selectedEntityIdRef.current
              : typeof pickedId === 'string' && pointsRef.current.has(pickedId)
                ? pickedId
                : null

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
        removeCameraChanged =
          viewer.camera.changed.addEventListener(onCameraChanged)
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
        removeTrackedEntityChanged?.()
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
            color: Cesium.Color.WHITE,
            // outlineColor: Cesium.Color.WHITE,
            // outlineWidth: 1,
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

      if (previousSelectedEntityIdRef.current !== selectedEntityId) {
        previousSelectedEntityIdRef.current = selectedEntityId
        viewer.trackedEntity = undefined
      }
      viewer.selectedEntity = selectedEntityId
        ? (selectionEntityRef.current ?? undefined)
        : undefined
      viewer.scene.requestRender()
    }, [
      viewerReady,
      motion.indexById,
      motion.setSelectedIndex,
      selectedEntityId,
    ])

    return <div ref={containerRef} className={className} />
  },
)

CesiumViewer.displayName = 'CesiumViewer'

export default CesiumViewer
