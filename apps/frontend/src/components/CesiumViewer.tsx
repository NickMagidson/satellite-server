import { useEffect, useRef } from 'react'
import type { SatellitePositionOk } from '../lib/satelliteApi'

interface CesiumEntity {
  id?: string
  position?: {
    setValue?: (value: unknown) => void
  }
}

interface CesiumScene {
  pick: (windowPosition: unknown) => { id?: CesiumEntity } | undefined
}

interface CesiumViewerInstance {
  entities: {
    add: (options: Record<string, unknown>) => CesiumEntity
    remove: (entity: CesiumEntity) => boolean
  }
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
  Viewer: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => CesiumViewerInstance
  Cartesian3: new (x: number, y: number, z: number) => unknown
  ConstantPositionProperty: new (value: unknown) => unknown
  Color: { CYAN: unknown; WHITE: unknown; BLACK: unknown }
  LabelStyle: { FILL_AND_OUTLINE: unknown }
  VerticalOrigin: { BOTTOM: unknown }
  Cartesian2: new (x: number, y: number) => unknown
  DistanceDisplayCondition: new (near: number, far: number) => unknown
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

const CESIUM_SCRIPT_ID = 'cesium-script'
const CESIUM_STYLE_ID = 'cesium-style'
const CESIUM_SCRIPT_SRC = '/cesium/Cesium.js'
const CESIUM_STYLE_HREF = '/cesium/Widgets/widgets.css'

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
  const entitiesRef = useRef<Map<string, CesiumEntity>>(new Map())
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
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: true,
      })
      viewerRef.current = viewer

      viewer.screenSpaceEventHandler.setInputAction((click) => {
        const picked = viewer.scene.pick(click.position)
        const entity = Cesium.defined(picked?.id) ? picked?.id : undefined
        const entityId =
          entity?.id && entitiesRef.current.has(entity.id) ? entity.id : null

        viewer.trackedEntity = undefined
        viewer.selectedEntity = entityId ? entity : undefined
        onSelectedEntityIdChangeRef.current?.(entityId)
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
      viewerRef.current?.destroy()
      viewerRef.current = null
      entitiesRef.current.clear()
    }
  }, [])

  useEffect(() => {
    async function updateEntities() {
      const viewer = viewerRef.current
      if (!viewer) {
        return
      }

      const Cesium = await loadCesium()
      const entities = entitiesRef.current
      const visibleIds = new Set(positions.map((position) => position.id))

      for (const [id, entity] of entities) {
        if (!visibleIds.has(id)) {
          viewer.entities.remove(entity)
          entities.delete(id)
        }
      }

      for (const position of positions) {
        const { xKm, yKm, zKm } = position.ecf
        const cartesian = new Cesium.Cartesian3(
          xKm * 1000,
          yKm * 1000,
          zKm * 1000,
        )

        const existing = entities.get(position.id)
        // Should use PointPrimitive for this.
        if (!existing) {
          const entity = viewer.entities.add({
            id: position.id,
            name: position.name,
            position: new Cesium.ConstantPositionProperty(cartesian),
            point: {
              pixelSize: 8,
              color: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1,
            },
            label: {
              text: position.name,
              font: '12px "IBM Plex Sans", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -12),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                0,
                5_000_000,
              ),
            },
          })
          entities.set(position.id, entity)
          continue
        }

        existing.position?.setValue?.(cartesian)
      }
    }

    void updateEntities()
  }, [positions])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) {
      return
    }

    viewer.trackedEntity = undefined
    viewer.selectedEntity = selectedEntityId
      ? entitiesRef.current.get(selectedEntityId)
      : undefined
  }, [positions, selectedEntityId])

  return <div ref={containerRef} className={className} />
}
