/**
 * UNLaR-Connect Campus 3D Footprint Geometry & Point Sampling System
 * 
 * This file models the actual layout of the Universidad Nacional de La Rioja (UNLaR)
 * campus based on the official isometric map:
 * 
 * Architectural Layout Features:
 * 1. Rectorado (Admin. Central): A grand 3-story front-right block.
 * 2. Glass Foyer Atrium: A prominent, vertical glass tower section at the center of the Rectorado.
 * 3. Main Spine Corridor: A long backbone corridor extending vertically.
 * 4. Pabellones A, B, C, D: Four long parallel modules extending perpendicularly to the left from the spine.
 * 5. Library / Museum Cluster: A courtyard block complex on the left of the lower spine.
 * 
 * DYNAMIC AUTOCENTERING:
 * The sampler automatically computes the bounding box of all coordinates
 * and centers the final 3D point cloud at (0, 0, 0).
 */

export interface Footprint {
  id: string;
  name: string;
  polygon: [number, number][]; // vertices in (x, z) coordinates (meters)
  height: number;              // building height in meters
  elevation?: number;          // optional initial elevation above ground
}

// Map Orientation:
// x: Left (-) to Right (+)
// z: Back/North (-) to Front/South (+ / Main Entrance)
// y: Vertical height (ground is y = 0)
export const CAMPUS_LAYOUT: Footprint[] = [
  // 1. Rectorado - Principal administrative building at the front-right (Av. Luis M. De La Fuente entrance)
  {
    id: "rectorado_base",
    name: "Rectorado (Admin. Central)",
    polygon: [
      [8, 24],
      [22, 24],
      [22, 38],
      [8, 38]
    ],
    height: 11.2 // 3 stories
  },
  // 2. Glass Foyer Atrium - Prominent glazed vertical tower in the center of the Rectorado
  {
    id: "rectorado_atrium",
    name: "Hall de Vidrio (Atrio)",
    polygon: [
      [12.5, 33.5],
      [17.5, 33.5],
      [17.5, 38.5],
      [12.5, 38.5]
    ],
    height: 14.5, // Rises above the main roofline
    elevation: 0
  },
  // 3. Main Spine Corridor - Long administrative and transition corridor running back (North)
  {
    id: "admin_spine",
    name: "Spine Administrativa (Corredor)",
    polygon: [
      [10, -35],
      [16, -35],
      [16, 24],
      [10, 24]
    ],
    height: 7.8 // 2 stories connecting wings
  },
  // 4. Pabellón A (Módulo Áulico) - Perpendicular wing 1 extending left
  {
    id: "pabellon_a",
    name: "Pabellón A",
    polygon: [
      [-30, -20],
      [10, -20],
      [10, -14],
      [-30, -14]
    ],
    height: 7.5
  },
  // 5. Pabellón B (Módulo Áulico) - Perpendicular wing 2 extending left
  {
    id: "pabellon_b",
    name: "Pabellón B",
    polygon: [
      [-30, -8],
      [10, -8],
      [10, -2],
      [-30, -2]
    ],
    height: 7.5
  },
  // 6. Pabellón C (Módulo Áulico) - Perpendicular wing 3 extending left
  {
    id: "pabellon_c",
    name: "Pabellón C",
    polygon: [
      [-30, 4],
      [10, 4],
      [10, 10],
      [-30, 10]
    ],
    height: 7.5
  },
  // 7. Pabellón D (Módulo Áulico) - Perpendicular wing 4 extending left
  {
    id: "pabellon_d",
    name: "Pabellón D",
    polygon: [
      [-30, 16],
      [10, 16],
      [10, 22],
      [-30, 22]
    ],
    height: 7.5
  },
  // 8. Biblioteca Central & Alumnos - Left-side courtyard block
  {
    id: "biblioteca_block",
    name: "Biblioteca Central (Edificio 9)",
    polygon: [
      [-26, -5],
      [-10, -5],
      [-10, 7],
      [-26, 7]
    ],
    height: 6.8
  },
  // 9. Museo de Ciencias & Microcine - Outer block (Label 7/8 on map)
  {
    id: "museo_microcine",
    name: "Museo & Microcine",
    polygon: [
      [-10, 2],
      [4, 2],
      [4, 14],
      [-10, 14]
    ],
    height: 5.8
  }
];

// Campus connection hubs matching logical network routers in academic areas
export interface CampusNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  type: "server" | "foyer" | "node";
}

export const CAMPUS_NODES: CampusNode[] = [
  { id: "node_rectorado", name: "Hall Atrio Central", x: 15, y: 5.5, z: 35, type: "foyer" },
  { id: "node_spine_mid", name: "Spine Administrativa", x: 13, y: 4, z: 2, type: "node" },
  { id: "node_pab_a", name: "Módulo A", x: -10, y: 2, z: -17, type: "node" },
  { id: "node_pab_b", name: "Módulo B", x: -10, y: 2, z: -5, type: "node" },
  { id: "node_pab_c", name: "Módulo C", x: -10, y: 2, z: 7, type: "node" },
  { id: "node_pab_d", name: "Módulo D", x: -10, y: 2, z: 19, type: "node" },
  { id: "node_biblioteca", name: "Biblioteca Servidor AI", x: -18, y: 3.4, z: 1, type: "server" }
];

/**
 * Procedural point-cloud generator.
 * Employs edge sampling and wall/roof dot fills to outline the real UNLaR architecture.
 * Automatically aligns the entire dataset centered at (0, 0, 0) inside WebGL coordinates.
 */
export function generateCampusPointData(densityMultiplier: number = 1.0) {
  const points: { x: number; y: number; z: number; r: number; g: number; b: number; size: number }[] = [];

  // 1. CALCULATE AUTOMATIC GEOMETRIC CENTER
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  CAMPUS_LAYOUT.forEach((b) => {
    b.polygon.forEach(([vx, vz]) => {
      if (vx < minX) minX = vx;
      if (vx > maxX) maxX = vx;
      if (vz < minZ) minZ = vz;
      if (vz > maxZ) maxZ = vz;
    });
  });

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Brand Colors (normalized RGB values [0 - 1]):
  // Warm Amber (#F59E0B) -> [0.96, 0.62, 0.04]
  // Terracotta Orange (#E2775F) -> [0.89, 0.47, 0.37]
  const colorAmber = { r: 0.96, g: 0.62, b: 0.04 };
  const colorTerracotta = { r: 0.89, g: 0.47, b: 0.37 };

  // Helper to colorize points based on coordinate height (y) and distance from center
  function getPointColor(x: number, y: number, z: number, height: number, elevation: number) {
    const relativeHeight = y / (height + elevation);
    const distFromCenter = Math.sqrt(x * x + z * z);
    const maxDist = 55; // Approximate radius of campus

    const colorBlend = Math.min(1, Math.max(0, (distFromCenter / maxDist) * 0.75 - relativeHeight * 0.2));
    
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
    const verticalEdgeDensity = 3.6 * densityMultiplier; // Points per meter on vertical corners
    const outlineDensity = 1.8 * densityMultiplier;      // Points per meter on polygon outlines (base/roof)
    const surfaceDensity = 0.04 * densityMultiplier;     // Points per square meter on walls/roofs

    // 1. SAMPLE VERTICAL CORNERS
    for (let i = 0; i < numVertices; i++) {
      const [rawVx, rawVz] = poly[i];
      const vx = rawVx - centerX;
      const vz = rawVz - centerZ;
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
          size: building.id.includes("atrium") ? 1.6 : 1.3 // Make atrium glass tower stand out!
        });
      }
    }

    // 2. SAMPLE HORIZONTAL OUTLINES
    for (let i = 0; i < numVertices; i++) {
      const [rawX1, rawZ1] = poly[i];
      const [rawX2, rawZ2] = poly[(i + 1) % numVertices];
      
      const x1 = rawX1 - centerX;
      const z1 = rawZ1 - centerZ;
      const x2 = rawX2 - centerX;
      const z2 = rawZ2 - centerZ;
      
      const dx = x2 - x1;
      const dz = z2 - z1;
      const edgeLen = Math.sqrt(dx * dx + dz * dz);
      const numOutlinePoints = Math.max(3, Math.floor(edgeLen * outlineDensity));

      for (let j = 0; j < numOutlinePoints; j++) {
        const t = j / numOutlinePoints;
        const currX = x1 + dx * t;
        const currZ = z1 + dz * t;

        // Ground Ring
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

    // 3. SAMPLE WALLS
    for (let i = 0; i < numVertices; i++) {
      const [rawX1, rawZ1] = poly[i];
      const [rawX2, rawZ2] = poly[(i + 1) % numVertices];
      
      const x1 = rawX1 - centerX;
      const z1 = rawZ1 - centerZ;
      const x2 = rawX2 - centerX;
      const z2 = rawZ2 - centerZ;
      
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

    // 4. SAMPLE ROOFS
    let minX_b = Infinity, maxX_b = -Infinity;
    let minZ_b = Infinity, maxZ_b = -Infinity;
    for (const [vx, vz] of poly) {
      if (vx < minX_b) minX_b = vx;
      if (vx > maxX_b) maxX_b = vx;
      if (vz < minZ_b) minZ_b = vz;
      if (vz > maxZ_b) maxZ_b = vz;
    }

    const bboxArea = (maxX_b - minX_b) * (maxZ_b - minZ_b);
    
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
    
    while (gathered < numRoofPoints && attempts < numRoofPoints * 3) {
      attempts++;
      const randX = minX_b + Math.random() * (maxX_b - minX_b);
      const randZ = minZ_b + Math.random() * (maxZ_b - minZ_b);

      if (isInsidePolygon([randX, randZ], poly)) {
        const currX = randX - centerX;
        const currZ = randZ - centerZ;
        const col = getPointColor(currX, elev + h, currZ, h, elev);
        points.push({
          x: currX,
          y: elev + h,
          z: currZ,
          ...col,
          size: 0.8
        });
        gathered++;
      }
    }
  }

  // Convert points to GPU Float32 arrays
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

  // Center node markers exactly using calculated center bounds
  const centeredNodes = CAMPUS_NODES.map((node) => ({
    ...node,
    x: node.x - centerX,
    z: node.z - centerZ
  }));

  return {
    positions,
    colors,
    sizes,
    count,
    nodes: centeredNodes
  };
}
