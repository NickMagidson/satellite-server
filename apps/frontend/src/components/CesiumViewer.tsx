import { useEffect, useRef } from 'react'
import { GLOBE_START_VIEW } from '../lib/cesiumCamera'
import type { SatellitePositionOk } from '../lib/satelliteApi'

interface CesiumEntity {
  id?: string
}

type CesiumPickId = CesiumEntity | string

interface CesiumSelectionEntity extends CesiumEntity {
  position: {
    setValue: (value: unknown) => void
  }
}

interface CesiumScene {
  pick: (windowPosition: unknown) => { id?: CesiumPickId } | undefined
  primitives: {
    add: (primitive: unknown) => unknown
    remove: (primitive: unknown) => boolean
  }
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

interface CesiumPointPrimitive extends CesiumEntity {
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
    new (x: number, y: number, z: number): unknown
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
  positions: SatellitePositionOk[]
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

const CESIUM_SCRIPT_ID = 'cesium-script'
const CESIUM_STYLE_ID = 'cesium-style'
const CESIUM_SCRIPT_SRC = '/cesium/Cesium.js'
const CESIUM_STYLE_HREF = '/cesium/Widgets/widgets.css'
const SATELLITE_POINT_SIZE = 6

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
  positions,
  selectedEntityId = null,
  onSelectedEntityIdChange,
  className,
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CesiumViewerInstance | null>(null)
  const cesiumApiRef = useRef<CesiumNamespace | null>(null)
  const pointsRef = useRef<Map<string, CesiumPointPrimitive>>(new Map())
  const selectionEntitiesRef = useRef<Map<string, CesiumSelectionEntity>>(
    new Map(),
  )
  const pointCollectionRef = useRef<CesiumPointPrimitiveCollection | null>(null)
  const onSelectedEntityIdChangeRef = useRef(onSelectedEntityIdChange)

  useEffect(() => {
    onSelectedEntityIdChangeRef.current = onSelectedEntityIdChange
  }, [onSelectedEntityIdChange])

  useEffect(() => {
    let cancelled = false
    let CesiumApi: CesiumNamespace | null = null

    async function init() {
      ensureCesiumStylesheet()
      const Cesium = await loadCesium()
      CesiumApi = Cesium

      if (cancelled || !containerRef.current) {
        return
      }

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

      viewer.screenSpaceEventHandler.setInputAction((click) => {
        const picked = viewer.scene.pick(click.position)
        const pickedId = Cesium.defined(picked?.id) ? picked?.id : undefined
        const id = typeof pickedId === 'string' ? pickedId : pickedId?.id
        const entityId =
          id && pointsRef.current.has(id) ? id : null

        viewer.trackedEntity = undefined
        viewer.selectedEntity = entityId
          ? selectionEntitiesRef.current.get(entityId)
          : undefined
        onSelectedEntityIdChangeRef.current?.(entityId)
        viewer.scene.requestRender()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }

    void init()

    return () => {
      cancelled = true
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
      selectionEntitiesRef.current.clear()
    }
  }, [])

  useEffect(() => {
    async function updatePoints() {
      const viewer = viewerRef.current
      const pointCollection = pointCollectionRef.current
      if (!viewer || !pointCollection) {
        return
      }

      const Cesium = await loadCesium()
      const points = pointsRef.current
      const selectionEntities = selectionEntitiesRef.current
      const visibleIds = new Set(positions.map((position) => position.id))

      for (const [id, point] of points) {
        if (!visibleIds.has(id)) {
          pointCollection.remove(point)
          points.delete(id)
          selectionEntities.delete(id)
        }
      }

      for (const position of positions) {
        const { xKm, yKm, zKm } = position.ecf
        const cartesian = new Cesium.Cartesian3(
          xKm * 1000,
          yKm * 1000,
          zKm * 1000,
        )

        const existing = points.get(position.id)
        if (!existing) {
          const selectionEntity = new Cesium.Entity({
            id: position.id,
            name: position.name,
            position: new Cesium.ConstantPositionProperty(cartesian),
          })
          const point = pointCollection.add({
            id: selectionEntity,
            position: cartesian,
            pixelSize: SATELLITE_POINT_SIZE,
            color: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
          })
          points.set(position.id, point)
          selectionEntities.set(position.id, selectionEntity)
          continue
        }

        existing.position = cartesian
        selectionEntities.get(position.id)?.position.setValue(cartesian)
      }

      viewer.scene.requestRender()
    }

    void updatePoints()
  }, [positions, selectedEntityId])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) {
      return
    }

    viewer.trackedEntity = undefined
    viewer.selectedEntity = selectedEntityId
      ? selectionEntitiesRef.current.get(selectedEntityId)
      : undefined
    viewer.scene.requestRender()
  }, [positions, selectedEntityId])

  return <div ref={containerRef} className={className} />
}
