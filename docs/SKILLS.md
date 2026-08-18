# Skills Index

Skills are procedural instructions for completing specific types of work safely. Load only the skills relevant to the classified task.

## How to load skills

1. **Always** load for implementation work:
   - [Smallest safe change](./skills/SKILL-SMALLEST-SAFE-CHANGE.md)
   - [Pattern lookup](./skills/SKILL-PATTERN-LOOKUP.md)
2. Load **domain** skills matching the task (see [Task Classification](./TASK-CLASSIFICATION.md)).
3. Load **validation** skills before calling work done or opening a PR.
4. Load **pull request preparation** when the user asks for a PR.

---

## Core skills

| Skill | When to use | Reference |
|-------|-------------|-----------|
| Smallest safe change | Any implementation task | [`skills/SKILL-SMALLEST-SAFE-CHANGE.md`](./skills/SKILL-SMALLEST-SAFE-CHANGE.md) |
| Pattern lookup | Before adding files or new patterns | [`skills/SKILL-PATTERN-LOOKUP.md`](./skills/SKILL-PATTERN-LOOKUP.md) |
| Repository validation | Before PR or "ready" sign-off | [`skills/SKILL-REPOSITORY-VALIDATION.md`](./skills/SKILL-REPOSITORY-VALIDATION.md) |
| Linting | Frontend or ESLint/Prettier config changes | [`skills/SKILL-LINTING.md`](./skills/SKILL-LINTING.md) |
| Testing | API logic, routes, validation, utilities | [`skills/SKILL-TESTING.md`](./skills/SKILL-TESTING.md) |
| Build | Before merge; after structural or dependency changes | [`skills/SKILL-BUILD.md`](./skills/SKILL-BUILD.md) |
| Pull request preparation | User asks for PR or merge-ready branch | [`skills/SKILL-PULL-REQUEST-PREPARATION.md`](./skills/SKILL-PULL-REQUEST-PREPARATION.md) |

## Repository-specific skills

| Skill | When to use | Reference |
|-------|-------------|-----------|
| Cesium viewer change | Globe integration in this app (API wiring, React lifecycle, km→m) | [`skills/SKILL-CESIUM-VIEWER-CHANGE.md`](./skills/SKILL-CESIUM-VIEWER-CHANGE.md) |
| Satellite propagation basics | TLE, OMM, SGP4, coordinate frames (reference) | [`skills/SKILL-SATELLITE-PROPAGATION-BASICS.md`](./skills/SKILL-SATELLITE-PROPAGATION-BASICS.md) |

## CesiumJS domain skills

Upstream CesiumJS 1.143 API skills (from [cesiumgs/cesiumjs-skills](https://github.com/cesiumgs/cesiumjs-skills)). Use these for Cesium API patterns; use [Cesium viewer change](./skills/SKILL-CESIUM-VIEWER-CHANGE.md) for how this repo mounts the globe and consumes satellite data.

**Load order for Cesium / globe work:**

1. [Cesium viewer change](./skills/SKILL-CESIUM-VIEWER-CHANGE.md) — repo integration
2. [Using CesiumJS skills](./skills/CESIUM-SKILLS/using-cesiumjs-skills/SKILL.md) — domain orientation
3. Only the matching domain skill(s) below (do not load the whole pack)

| Skill | When to use | Reference |
|-------|-------------|-----------|
| using-cesiumjs-skills | Start of any CesiumJS work; skill map | [`skills/CESIUM-SKILLS/using-cesiumjs-skills/SKILL.md`](./skills/CESIUM-SKILLS/using-cesiumjs-skills/SKILL.md) |
| cesiumjs-viewer-setup | Viewer/CesiumWidget init, Ion token, widgets, SceneMode | [`skills/CESIUM-SKILLS/cesiumjs-viewer-setup/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-viewer-setup/SKILL.md) |
| cesiumjs-camera | Camera, flyTo, lookAt, navigation constraints, tracking | [`skills/CESIUM-SKILLS/cesiumjs-camera/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-camera/SKILL.md) |
| cesiumjs-entities | Entity API, DataSources, GeoJSON/KML/CZML/GPX | [`skills/CESIUM-SKILLS/cesiumjs-entities/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-entities/SKILL.md) |
| cesiumjs-primitives | Primitive/geometry collections, batching, performance geometry | [`skills/CESIUM-SKILLS/cesiumjs-primitives/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-primitives/SKILL.md) |
| cesiumjs-imagery | Imagery providers and layer stacking | [`skills/CESIUM-SKILLS/cesiumjs-imagery/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-imagery/SKILL.md) |
| cesiumjs-terrain-environment | Terrain, Globe, atmosphere, sky, lighting, shadows | [`skills/CESIUM-SKILLS/cesiumjs-terrain-environment/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-terrain-environment/SKILL.md) |
| cesiumjs-interaction | Picking, ScreenSpaceEventHandler, hover/selection | [`skills/CESIUM-SKILLS/cesiumjs-interaction/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-interaction/SKILL.md) |
| cesiumjs-spatial-math | Cartesian3, Cartographic, Transforms, projections | [`skills/CESIUM-SKILLS/cesiumjs-spatial-math/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-spatial-math/SKILL.md) |
| cesiumjs-time-properties | Clock, JulianDate, SampledProperty, CallbackProperty, paths | [`skills/CESIUM-SKILLS/cesiumjs-time-properties/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-time-properties/SKILL.md) |
| cesiumjs-3d-tiles | 3D Tiles, styling, voxels, point clouds, clipping | [`skills/CESIUM-SKILLS/cesiumjs-3d-tiles/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-3d-tiles/SKILL.md) |
| cesiumjs-models-particles | glTF/GLB models, animations, ParticleSystem | [`skills/CESIUM-SKILLS/cesiumjs-models-particles/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-models-particles/SKILL.md) |
| cesiumjs-materials-shaders | Fabric materials, IBL, post-process stages | [`skills/CESIUM-SKILLS/cesiumjs-materials-shaders/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-materials-shaders/SKILL.md) |
| cesiumjs-custom-shader | CustomShader GLSL, feature IDs, metadata in shaders | [`skills/CESIUM-SKILLS/cesiumjs-custom-shader/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-custom-shader/SKILL.md) |
| cesiumjs-core-utilities | Resource, Color, Event, Request, helpers | [`skills/CESIUM-SKILLS/cesiumjs-core-utilities/SKILL.md`](./skills/CESIUM-SKILLS/cesiumjs-core-utilities/SKILL.md) |

**Install locations:** the same pack also lives under `.agents/skills/` (Cursor) with `.claude/skills/` symlinks. Prefer the `docs/skills/CESIUM-SKILLS/` paths when following this index so docs and agent workflows stay aligned.
