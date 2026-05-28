/**
 * UNLaR-Connect Campus 3D Footprint Geometry & Point Sampling System
 * 
 * This file defines the mathematical layout for the stylized 3D representation
 * of the Universidad Nacional de La Rioja (UNLaR) campus. 
 * 
 * Architecture Layout:
 * 1. Rectorado (Main Admin Block): Large front block at the center.
 * 2. Central Corridor Spine: A long connecting corridor linking all study pavilions.
 * 3. Pabellones A, B, C, D: Four long parallel blocks representing classrooms.
 * 4. Cúpula / Biblioteca (Library Dome): A central circular building.
 * 
 * SOURCING / GEOMETRY REPLACEMENT DIRECTIONS:
 * To replace these procedurally generated coordinates with exact GIS footprints or
 * an OpenStreetMap Overpass JSON extraction, edit the `CAMPUS_LAYOUT` structure below.
 * The `polygon` array represents 2D (x, z) coordinate vertices in meters relative
 * to the campus center, and `height` represents the vertical height in meters.
 */

export interface Footprint {
  id: string;
  name: string;
  polygon: [number, number][]; // vertices in (x, z) coordinates (meters)
  height: number;              // building height in meters
  elevation?: number;          // optional initial elevation above ground
}

// Coordinate System mapping:
// x: Left (-) to Right (+)
// z: Behind (- / Pabellones) to Front (+ / Rectorado)
// y: Vertical height (ground is y = 0)
export const CAMPUS_LAYOUT: Footprint[] = [
  // 1. Rectorado - Principal administrative building at the front
  {
    id: "rectorado",
    name: "Rectorado (Admin. Central)",
    polygon: [
      [-25, 4],
      [25, 4],
      [25, 18],
      [-25, 18]
    ],
    height: 11
  },
  // 2. Central Corridor Spine - Corridor connecting all study halls
  {
    id: "corridor_spine",
    name: "Corredor Central",
    polygon: [
      [-55, -2],
      [55, -2],
      [55, 2],
      [-55, 2]
    ],
    height: 3.8
  },
  // 3. Pabellón Académico A - Leftmost pavilion
  {
    id: "pabellon_a",
    name: "Pabellón A",
    polygon: [
      [-48, -32],
      [-40, -32],
      [-40, -2],
      [-48, -2]
    ],
    height: 7.5
  },
  // 4. Pabellón Académico B - Center-left pavilion
  {
    id: "pabellon_b",
    name: "Pabellón B",
    polygon: [
      [-20, -32],
      [-12, -32],
      [-12, -2],
      [-20, -2]
    ],
    height: 7.5
  },
  // 5. Pabellón Académico C - Center-right pavilion
  {
    id: "pabellon_c",
    name: "Pabellón C",
    polygon: [
      [12, -32],
      [20, -32],
      [20, -2],
      [12, -2]
    ],
    height: 7.5
  },
  // 6. Pabellón Académico D - Rightmost pavilion
  {
    id: "pabellon_d",
    name: "Pabellón D",
    polygon: [
      [40, -32],
      [48, -32],
      [48, -2],
      [40, -2]
    ],
    height: 7.5
  },
  // 7. Dome / Biblioteca - Central circular library dome in the inner courtyard
  // We model a circular building by approximating a 16-sided regular polygon
  {
    id: "biblioteca_dome",
    name: "Biblioteca Central (Cúpula)",
    polygon: Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 9.5;
      const cx = 0;
      const cz = -17; // Set inside the courtyard between pavilions B & C
      return [
        cx + radius * Math.cos(angle),
        cz + radius * Math.sin(angle)
      ] as [number, number];
    }),
    height: 13.5
  }
];

// Special interest nodes representing campus connections (routers, community points)
export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  type: "server" | "foyer" | "node";
}

export const CAMPUS_NODES: CampusNode[] = [
  { id: "node_rectorado", name: "Foyer Rectorado", x: 0, y: 5.5, z: 11, type: "foyer" },
  { id: "node_pab_a", name: "Acceso Pabellón A", x: -44, y: 2, z: -2, type: "node" },
  { id: "node_pab_b", name: "Acceso Pabellón B", x: -16, y: 2, z: -2, type: "node" },
  { id: "node_pab_c", name: "Acceso Pabellón C", x: 16, y: 2, z: -2, type: "node" },
  { id: "node_pab_d", name: "Acceso Pabellón D", x: 44, y: 2, z: -2, type: "node" },
  { id: "node_biblioteca", name: "Cúpula Central AI", x: 0, y: 6.8, z: -17, type: "server" }
];

/**
 * Procedural point-cloud generator.
 * Combines structural wireframe-like lines along edges and corners with random surface sampling.
 * This guarantees a high-fidelity visual footprint outline that makes the building recognizable
 * mainly by its silhouette while keeping performance extremely lightweight.
 */
export function generateCampusPointData(densityMultiplier: number = 1.0) {
  const points: { x: number; y: number; z: number; r: number; g: number; b: number; size: number }[] = [];

  // Brand Colors (normalized RGB values [0 - 1]):
  // Warm Amber (#F59E0B) -> [0.96, 0.62, 0.04]
  // Terracotta Orange (#E2775F) -> [0.89, 0.47, 0.37]
  const colorAmber = { r: 0.96, g: 0.62, b: 0.04 };
  const colorTerracotta = { r: 0.89, g: 0.47, b: 0.37 };

  // Helper to colorize points based on coordinate height (y) and distance from center
  function getPointColor(x: number, y: number, z: number, height: number, elevation: number) {
    const relativeHeight = y / (height + elevation);
    const distFromCenter = Math.sqrt(x * x + z * z);
    const maxDist = 65; // Approximate radius of entire campus

    // Blend ratio: center & top of buildings are brighter Amber; outer/lower parts shift to warm Terracotta
    const colorBlend = Math.min(1, Math.max(0, (distFromCenter / maxDist) * 0.7 - relativeHeight * 0.3));
    
    const r = colorAmber.r * (1 - colorBlend) + colorTerracotta.r * colorBlend;
    const g = colorAmber.g * (1 - colorBlend) + colorTerracotta.g * colorBlend;
    const b = colorAmber.b * (1 - colorBlend) + colorTerracotta.b * colorBlend;

    return { r, g, b };
  }

  // Iterate over each footprint definition
  for (const building of CAMPUS_LAYOUT) {
    const poly = building.polygon;
    const h = building.height;
    const elev = building.elevation || 0;
    const numVertices = poly.length;

    // Adjust sampling densities based on multiplier
    const verticalEdgeDensity = 3.5 * densityMultiplier; // Points per meter on vertical corners
    const outlineDensity = 1.8 * densityMultiplier;      // Points per meter on polygon outlines (base/roof)
    const surfaceDensity = 0.04 * densityMultiplier;     // Points per square meter on walls/roofs

    // 1. SAMPLE VERTICAL CORNERS/RIBS
    // Renders high-legibility vertical lines at each polygon vertex
    for (let i = 0; i < numVertices; i++) {
      const [vx, vz] = poly[i];
      const edgePoints = Math.max(5, Math.floor(h * verticalEdgeDensity));
      
      for (let j = 0; j <= edgePoints; j++) {
        const t = j / edgePoints;
        const y = elev + t * h;
        const col = getPointColor(vx, y, vz, h, elev);
        points.push({
          x: vx,
          y,
          z: vz,
          ...col,
          size: 1.4 // Make corners slightly more defined
        });
      }
    }

    // 2. SAMPLE HORIZONTAL OUTLINES (Base & Roof outlines)
    // Draw glowing contour rings along the floor and roof levels
    for (let i = 0; i < numVertices; i++) {
      const [x1, z1] = poly[i];
      const [x2, z2] = poly[(i + 1) % numVertices];
      
      const dx = x2 - x1;
      const dz = z2 - z1;
      const edgeLen = Math.sqrt(dx * dx + dz * dz);
      const numOutlinePoints = Math.max(3, Math.floor(edgeLen * outlineDensity));

      for (let j = 0; j < numOutlinePoints; j++) {
        const t = j / numOutlinePoints;
        const currX = x1 + dx * t;
        const currZ = z1 + dz * t;

        // Ground/Base Ring
        const colBase = getPointColor(currX, elev, currZ, h, elev);
        points.push({
          x: currX,
          y: elev,
          z: currZ,
          ...colBase,
          size: 0.9
        });

        // Roof Ring
        const colRoof = getPointColor(currX, elev + h, currZ, h, elev);
        points.push({
          x: currX,
          y: elev + h,
          z: currZ,
          ...colRoof,
          size: 1.2
        });
      }
    }

    // 3. SAMPLE WALLS (Random dots scattered inside vertical rectangle faces)
    // Provides volumetric depth to the vertical silhouettes
    for (let i = 0; i < numVertices; i++) {
      const [x1, z1] = poly[i];
      const [x2, z2] = poly[(i + 1) % numVertices];
      
      const dx = x2 - x1;
      const dz = z2 - z1;
      const faceWidth = Math.sqrt(dx * dx + dz * dz);
      const faceArea = faceWidth * h;
      const numWallPoints = Math.floor(faceArea * surfaceDensity);

      for (let j = 0; j < numWallPoints; j++) {
        const t = Math.random();
        const currY = elev + Math.random() * h;
        const currX = x1 + dx * t;
        const currZ = z1 + dz * t;

        const col = getPointColor(currX, currY, currZ, h, elev);
        points.push({
          x: currX,
          y: currY,
          z: currZ,
          ...col,
          size: 0.7
        });
      }
    }

    // 4. SAMPLE ROOFS (Scattered dots inside polygon roofs)
    // Provides solid ceiling volume for camera overhead perspectives
    // For simple boxes, we can easily find bounds and reject points outside the shape
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const [vx, vz] of poly) {
      if (vx < minX) minX = vx;
      if (vx > maxX) maxX = vx;
      if (vz < minZ) minZ = vz;
      if (vz > maxZ) maxZ = vz;
    }

    const bboxArea = (maxX - minX) * (maxZ - minZ);
    // Since some polygons might not be perfect axis-aligned boxes (like our 16-sided circle), 
    // we use a simple ray-casting/bounding verification to check if a point lies inside the polygon.
    function isInsidePolygon(point: [number, number], vs: [number, number][]) {
      const x = point[0], z = point[1];
      let inside = false;
      for (let k = 0, l = vs.length - 1; k < vs.length; l = k++) {
        const xi = vs[k][0], zi = vs[k][1];
        const xj = vs[l][0], zj = vs[l][1];
        const intersect = ((zi > z) !== (zj > z))
            && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    const numRoofPoints = Math.floor(bboxArea * surfaceDensity);
    let attempts = 0;
    let gathered = 0;
    
    // Safety limit to prevent infinite loops in weird polygons
    while (gathered < numRoofPoints && attempts < numRoofPoints * 3) {
      attempts++;
      const randX = minX + Math.random() * (maxX - minX);
      const randZ = minZ + Math.random() * (maxZ - minZ);

      if (isInsidePolygon([randX, randZ], poly)) {
        const col = getPointColor(randX, elev + h, randZ, h, elev);
        points.push({
          x: randX,
          y: elev + h,
          z: randZ,
          ...col,
          size: 0.8
        });
        gathered++;
      }
    }
  }

  // Convert the array into Flat32Arrays which Three.js uses to update GPU buffers extremely fast
  const count = points.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const p = points[i];
    
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;

    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;

    sizes[i] = p.size;
  }

  return {
    positions,
    colors,
    sizes,
    count,
    nodes: CAMPUS_NODES
  };
}
