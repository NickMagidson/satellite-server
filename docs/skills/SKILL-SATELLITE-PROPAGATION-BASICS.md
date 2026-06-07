## Satellite Propagation Basics

This document summarizes the key concepts needed to parse Two-Line Elements (TLEs), understand orbital elements, propagate orbits, and visualize satellite motion.

---

### TLEs (Two-Line Elements)

**TLEs** are a compact format describing an Earth-orbiting satellite’s orbit at a specific epoch, along with drag and other parameters for the SGP4 propagator.

**Example TLE:**

```text
ISS (ZARYA)
1 25544U 98067A   24070.51782407  .00006484  00000-0  12035-3 0  9993
2 25544  51.6439  32.1281 0006008  76.8618  58.0505 15.50079139442263
```

**Line 1 fields (key ones):**

- **Column 01**: Line number (`1`)
- **Columns 03–07**: Satellite number (`25544`)
- **Column 08**: Classification (`U` = unclassified)
- **Columns 10–17**: International designator (`98067A`)
- **Columns 19–32**: Epoch year and day of year (`24070.51782407`)
  - `24` → 2024
  - `070.51782407` → 70.5178th day of year
- **Columns 34–43**: First time derivative of mean motion (rev/day²)
- **Columns 45–52**: Second derivative of mean motion (rev/day³, in mantissa/exponent form)
- **Columns 54–61**: BSTAR drag term (1/earth radii, mantissa/exponent form)
- **Columns 63**: Ephemeris type (usually `0`)
- **Columns 65–68**: Element set number
- **Columns 69**: Checksum

**Line 2 fields (orbital elements):**

- **Column 01**: Line number (`2`)
- **Columns 03–07**: Satellite number (`25544`)
- **Columns 09–16**: Inclination \(i\) [deg]
- **Columns 18–25**: Right Ascension of Ascending Node (RAAN, \(\Omega\)) [deg]
- **Columns 27–33**: Eccentricity \(e\) (decimal point implied)
- **Columns 35–42**: Argument of Perigee \(\omega\) [deg]
- **Columns 44–51**: Mean Anomaly \(M\) [deg]
- **Columns 53–63**: Mean Motion \(n\) [rev/day]
- **Columns 64–68**: Revolution number at epoch

For SGP4, you typically feed **both TLE lines** as raw strings to a library function, which returns a satellite record that can be propagated to arbitrary times.

---

### OMM (Orbital Mean-Elements Message)

**OMM** is a modern, structured format for sharing orbital mean elements, defined by the **CCSDS (Consultative Committee for Space Data Systems)**. It provides the same fundamental data as TLEs but in a more readable, extensible, and machine-parseable format.

**Format variants:**

OMM can be expressed in two formats:

1. **XML** (eXtensible Markup Language) – verbose but highly structured
2. **KVN** (Key-Value Notation) – compact, human-readable key-value pairs

**Example OMM (KVN format):**

```text
CCSDS_OMM_VERS = 2.0
CREATION_DATE = 2024-03-10T12:00:00
ORIGINATOR = EXAMPLE_ORG

OBJECT_NAME = ISS (ZARYA)
OBJECT_ID = 1998-067A
CENTER_NAME = EARTH
REF_FRAME = TEME
TIME_SYSTEM = UTC
MEAN_ELEMENT_THEORY = SGP4

EPOCH = 2024-03-10T12:23:45.678
MEAN_MOTION = 15.50079139
ECCENTRICITY = 0.0006008
INCLINATION = 51.6439
RA_OF_ASC_NODE = 32.1281
ARG_OF_PERICENTER = 76.8618
MEAN_ANOMALY = 58.0505
BSTAR = 0.000012035
MEAN_MOTION_DOT = 0.00006484
MEAN_MOTION_DDOT = 0.0
```

**Key OMM fields (SGP4-relevant):**

**Metadata:**
- `OBJECT_NAME`: Satellite name
- `OBJECT_ID`: International designator (COSPAR ID)
- `EPOCH`: ISO 8601 timestamp for the state (clearer than TLE's day-of-year format)
- `MEAN_ELEMENT_THEORY`: Typically `SGP4` or `SGP4-XP`

**Orbital elements (identical to TLE content):**
- `MEAN_MOTION`: [rev/day] – equivalent to TLE Line 2, columns 53–63
- `ECCENTRICITY`: [dimensionless] – TLE Line 2, columns 27–33
- `INCLINATION`: [deg] – TLE Line 2, columns 09–16
- `RA_OF_ASC_NODE` (RAAN, \(\Omega\)): [deg] – TLE Line 2, columns 18–25
- `ARG_OF_PERICENTER` (Argument of Perigee, \(\omega\)): [deg] – TLE Line 2, columns 35–42
- `MEAN_ANOMALY` (\(M\)): [deg] – TLE Line 2, columns 44–51

**Perturbation parameters:**
- `BSTAR`: [1/earth radii] – atmospheric drag coefficient (TLE Line 1, columns 54–61)
- `MEAN_MOTION_DOT`: First derivative of mean motion [rev/day²] (TLE Line 1, columns 34–43)
- `MEAN_MOTION_DDOT`: Second derivative of mean motion [rev/day³] (TLE Line 1, columns 45–52)

**OMM vs TLE:**

| Aspect | TLE | OMM |
|--------|-----|-----|
| **Format** | Fixed-width text (80 chars) | XML or KVN (flexible, self-describing) |
| **Readability** | Requires memorizing column positions | Human-readable key-value pairs |
| **Epoch** | Day-of-year (e.g., `24070.51782407`) | ISO 8601 (e.g., `2024-03-10T12:23:45.678`) |
| **Extensibility** | Cannot add custom fields | Can add metadata, covariance, maneuvers, etc. |
| **Parsing** | Column-based parsing | Standard XML/KVN parsers |
| **Adoption** | Ubiquitous (since 1960s) | Growing (space agencies, commercial operators) |

**Advantages of OMM:**

1. **Clarity**: No need to remember TLE column positions.
2. **Extensibility**: Can include covariance matrices, maneuver data, user-defined fields.
3. **Standards**: Part of the CCSDS Navigation Data Messages suite (also includes OEM, OPM, etc.).
4. **Precision**: ISO timestamps are unambiguous; no year 2000-style epoch ambiguity.
5. **Metadata**: Can include originator, creation date, reference frame explicitly.

**Using OMM for propagation:**

To propagate orbits from OMM data:

1. **Parse the OMM** (XML or KVN):
   - Extract the six Keplerian elements + BSTAR + derivatives.
   - Parse the epoch into a standard timestamp.

2. **Convert to SGP4 input**:
   - Most SGP4 libraries expect TLE strings, so you may need to:
     - Use an SGP4 library that natively supports OMM (e.g., `orekit` in Java/Python, `python-sgp4` with helpers), or
     - Construct a "virtual TLE" from OMM fields (not recommended; loses precision and metadata).

3. **Propagate**:
   - Use the same SGP4 algorithm as with TLEs.
   - Compute position/velocity at desired times relative to epoch.

4. **Coordinate transforms**:
   - OMM explicitly specifies `REF_FRAME` (e.g., `TEME`, `GCRF`).
   - Apply appropriate transforms for your visualization engine.

**Libraries with OMM support:**

- **Python**: `orekit` (via `orekit-python-wrapper`), custom parsers for KVN/XML
- **JavaScript**: Limited native support; often requires custom parsing + conversion to TLE-like format for `satellite.js`
- **Java**: `orekit` has full CCSDS standards support
- **C++**: Custom parsers or `orekit` via JNI

**Practical tip:**

If you receive OMM data and need to use `satellite.js` (which expects TLEs), consider:

- Writing a parser to extract the six orbital elements and SGP4 parameters from OMM.
- Constructing TLE-like strings programmatically (though this loses OMM metadata advantages).
- Using a backend service with `orekit` or similar for propagation, then sending computed positions to the frontend.

**Example workflow:**

```
OMM (XML/KVN)
    ↓ [parse]
Orbital elements + epoch + BSTAR
    ↓ [SGP4 initialization]
Satellite record (satrec)
    ↓ [propagate at times t₁, t₂, ...]
TEME positions/velocities
    ↓ [coordinate transforms]
ECEF / lat-lon-alt
    ↓ [visualization]
3D orbit path in Cesium/Leaflet
```

**When to use OMM:**

- You're building a modern space situational awareness system.
- You need covariance data or maneuver history alongside ephemeris.
- You're interfacing with space agencies or commercial operators using CCSDS standards.
- You want unambiguous, self-documenting orbital data.

**When TLEs are sufficient:**

- You're working with public satellite catalogs (CelesTrak, Space-Track).
- Your tools/libraries only support TLE input.
- You need a compact, widely-supported format for LEO/MEO satellites.

---

### Classical Orbital Elements (COEs)

For Keplerian orbits, you commonly use **six** classical orbital elements:

- **Semi-major axis** \(a\) [km]
- **Eccentricity** \(e\) (0 circular, <1 elliptical, =1 parabolic, >1 hyperbolic)
- **Inclination** \(i\) [rad/deg] – tilt of the orbit plane w.r.t. Earth’s equator
- **Right Ascension of Ascending Node** \(\Omega\) [rad/deg] – angle from reference direction to where the orbit crosses the equator northbound
- **Argument of Perigee** \(\omega\) [rad/deg] – angle from ascending node to perigee in the orbit plane
- **True Anomaly** \(\nu\) [rad/deg] – position of the satellite along the ellipse at a given time

**TLE → COE mapping (approximate):**

- \(i =\) inclination
- \(\Omega =\) RAAN
- \(\omega =\) argument of perigee
- Mean anomaly \(M\) and mean motion \(n\) are used with SGP4 to compute \(\nu\) and \(a\) at a given time (the mapping is non-trivial and handled by SGP4).

---

### Time Systems

Propagation and visualization require consistent time handling:

- **TLE epoch**: days of year relative to UTC.
- **Propagation time**: usually expressed as:
  - Offset seconds from TLE epoch, or
  - Absolute UTC timestamps (e.g., JS `Date`, Python `datetime`).

When using an SGP4 library, you typically:

- Parse the TLE to get an **epoch**.
- For a desired time \(t\), compute \(\Delta t = t - t_{\text{epoch}}\).
- Pass \(\Delta t\) into the SGP4 function, which returns the position/velocity at \(t\).

---

### SGP4 Propagation

**SGP4 (Simplified General Perturbations 4)** is the standard algorithm for propagating TLE-based orbits.

Key points:

- **Inputs**:
  - Two TLE lines.
  - Desired time(s) relative to the TLE epoch.
- **Outputs**:
  - Satellite position and velocity in **TEME** frame (usually \(x, y, z, \dot{x}, \dot{y}, \dot{z}\) in km and km/s).
- **Perturbations modeled**:
  - Earth’s oblateness (J2, J3, J4)
  - Atmospheric drag (via BSTAR)
  - Resonance effects for some orbits
- **Use cases**:
  - Short to medium term orbit prediction (days to weeks).
  - Visualization and basic analysis of LEO/MEO/GEO satellites.

In practice, for web/JS apps you often use `satellite.js` or similar to:

- Parse TLE → create satrec.
- Propagate satrec at many timestamps → get positions.

---

### Coordinate Frames

For visualization, you’ll often convert between several frames:

- **TEME (True Equator, Mean Equinox)**:
  - Native SGP4 output frame.
- **ECI (Earth-Centered Inertial)**:
  - Non-rotating frame, origin at Earth’s center.
  - Useful for physics and orbital mechanics.
- **ECEF (Earth-Centered, Earth-Fixed)**:
  - Rotates with the Earth; longitude/latitude fixed.
  - Needed for mapping and ground tracking.
- **Geodetic lat/lon/alt**:
  - Latitude, longitude, and altitude over an Earth ellipsoid.
  - Necessary to plot ground tracks, footprint circles, etc.

Common pipeline:

1. **TLE + time → SGP4 → TEME position/velocity.**
2. **TEME → ECI** (often handled implicitly by library).
3. **ECI → ECEF** (accounting for Earth rotation, polar motion, etc.).
4. **ECEF → lat/lon/alt** for ground track.
5. For 3D visualization tools (e.g., Cesium):
   - Convert ECEF or lat/lon/alt into the engine’s coordinate system (usually Earth-fixed).

---

### Orbital Period and Mean Motion

**Mean motion** \(n\) (from TLE) is in **revolutions per day**.

- Orbital period \(T\) is:

\[
T = \frac{1}{n} \text{ days} = \frac{86400}{n} \text{ seconds}
\]

For LEO, \(n \approx 15\) rev/day → \(T \approx 90\) minutes.

---

### Visualizing Orbits

To visualize orbits (e.g., in Cesium or other 3D engines), you typically:

- **Choose a time span**:
  - E.g., from now to now + 1 orbit period, or now to now + 24 hours.
- **Sample times**:
  - E.g., every 10–60 seconds.
- **Propagate**:
  - For each sample time, use SGP4 to get position in TEME/ECI.
- **Convert to visualization coordinates**:
  - Earth-fixed (ECEF) or lat/lon/alt.
  - Feed into the engine as positions over time (trajectories).
- **Render**:
  - Satellite marker at current position.
  - Polyline or path representing orbit track.
  - Optional: ground track, sensor cones, coverage footprints.

For multiple satellites:

- Repeat the above per TLE.
- Consider limiting the number of time samples or satellites rendered at once for performance.

---

### Practical Checklist for Visualization

To visualize orbits from TLEs you need:

- **Data**:
  - One or more valid TLEs (two-line strings).
- **Time handling**:
  - Current time and offsets from TLE epoch.
- **Propagation**:
  - SGP4 implementation (e.g., `satellite.js`, `python-sgp4`, etc.).
- **Coordinate transforms**:
  - TEME/ECI → ECEF → lat/lon/alt (provided by many libraries).
- **Visualization engine**:
  - 3D globe or 2D map (e.g., Cesium, Leaflet, custom WebGL).
- **Sampling strategy**:
  - Time range and step for generating orbit path and ground track.

With these components in place, you can parse TLEs, propagate satellite states over time, and render accurate, time-varying orbit visualizations.

