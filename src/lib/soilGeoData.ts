// Regional Soil Classification and Geographic Soil Zone Data for SoilTrace

export interface SoilTypeDefinition {
  id: string;
  name: string;
  subType: string;
  color: string;
  fillColor: string;
  borderColor: string;
  textColor: string;
  phRange: string;
  typicalPh: number;
  texture: string;
  organicCarbon: string;
  permeability: string;
  majorCrops: string[];
  remediationAdvice: string;
  icarClassification: string;
  description: string;
}

export const SOIL_TYPES: Record<string, SoilTypeDefinition> = {
  alluvial: {
    id: "alluvial",
    name: "Alluvial Soil (Inceptisols / Entisols)",
    subType: "Indo-Gangetic & Fluvial Floodplain Loam",
    color: "#d97706", // Amber Gold
    fillColor: "#f59e0b",
    borderColor: "#b45309",
    textColor: "#78350f",
    phRange: "7.2 - 8.2",
    typicalPh: 7.8,
    texture: "Silt loam to clay loam with high silt fraction",
    organicCarbon: "0.45% - 0.75% (Medium)",
    permeability: "Moderate to high",
    majorCrops: ["Wheat", "Paddy (Rice)", "Sugarcane", "Mustard", "Potato", "Maize"],
    remediationAdvice: "Requires periodic zinc (Zn) supplementation, green manuring, and balanced NPK to counter intensive crop depletion.",
    icarClassification: "Typic Ustochrepts / Fluventic",
    description: "Formed by mineral-rich river sediment deposition across the major river plains. Exceptionally fertile and responsive to canal and tube-well irrigation."
  },
  black_cotton: {
    id: "black_cotton",
    name: "Black Cotton Soil (Vertisols / Regur)",
    subType: "Deccan Trap Weathered Basalt Clay",
    color: "#334155", // Dark Slate Basalt
    fillColor: "#475569",
    borderColor: "#0f172a",
    textColor: "#0f172a",
    phRange: "7.8 - 8.6",
    typicalPh: 8.2,
    texture: "Deep expansive montmorillonitic clay (40-60% clay)",
    organicCarbon: "0.40% - 0.60% (Low to Medium)",
    permeability: "Very low when wet; self-ploughing fissures when dry",
    majorCrops: ["Cotton", "Soybean", "Pigeon Pea (Tur)", "Sorghum (Jowar)", "Onion", "Grapes"],
    remediationAdvice: "Sub-surface drainage required to avoid waterlogging; add phosphatic fertilizers and gypsum if sodicity develops.",
    icarClassification: "Typic Chromusterts / Vertic Inceptisols",
    description: "Formed by weathering of basaltic Deccan lava rocks. Characterized by high moisture-holding capacity, swelling upon hydration, and deep shrinkage cracks."
  },
  red_yellow: {
    id: "red_yellow",
    name: "Red & Yellow Soil (Alfisols)",
    subType: "Peninsular Crystalline Granite Weathering",
    color: "#dc2626", // Crimson Red
    fillColor: "#ef4444",
    borderColor: "#991b1b",
    textColor: "#7f1d1d",
    phRange: "5.8 - 6.8",
    typicalPh: 6.4,
    texture: "Sandy loam to gravelly sandy clay loam",
    organicCarbon: "0.30% - 0.50% (Low)",
    permeability: "High to rapid",
    majorCrops: ["Finger Millet (Ragi)", "Groundnut", "Pulses", "Castor", "Tobacco", "Millets"],
    remediationAdvice: "Apply agricultural lime if pH < 6.0; supplement with rock phosphate and farmyard manure to fix phosphorus deficit.",
    icarClassification: "Udic Paleustalfs / Typic Rhodustalfs",
    description: "Developed over Archean granites and gneisses under moderate rainfall. Red color derives from ferric iron oxides diffusing through the mineral matrix."
  },
  laterite: {
    id: "laterite",
    name: "Laterite Soil (Ultisols / Oxisols)",
    subType: "Tropical Leached Hill Slope Loam",
    color: "#ea580c", // Burnt Rust Orange
    fillColor: "#f97316",
    borderColor: "#9a3412",
    textColor: "#7c2d12",
    phRange: "4.8 - 5.8",
    typicalPh: 5.3,
    texture: "Gravelly clay loam, rich in iron-aluminum concretions",
    organicCarbon: "0.60% - 1.10% in forest surface, leached below",
    permeability: "High surface percolation",
    majorCrops: ["Tea", "Coffee", "Rubber", "Cashew", "Areca Nut", "Coconut", "Tapioca"],
    remediationAdvice: "Heavy liming (calcium carbonate) required to counter high aluminum toxicity and acidic fixation of phosphates.",
    icarClassification: "Plinthic Acrorthox / Plinthustults",
    description: "Formed under intense alternating monsoon and dry spells, leaching silica and leaving residual iron and bauxite nodules. Acidic reaction."
  },
  arid_sandy: {
    id: "arid_sandy",
    name: "Arid & Desert Sandy Soil (Aridisols)",
    subType: "Aeolian Wind-blown Sand Deposits",
    color: "#ca8a04", // Desert Gold
    fillColor: "#eab308",
    borderColor: "#854d0e",
    textColor: "#713f12",
    phRange: "8.0 - 8.9",
    typicalPh: 8.4,
    texture: "Coarse sand to loamy sand (85%+ sand particles)",
    organicCarbon: "0.10% - 0.25% (Very Low)",
    permeability: "Very high, negligible water retention",
    majorCrops: ["Pearl Millet (Bajra)", "Cluster Bean (Guar)", "Moth Bean", "Mustard", "Barley"],
    remediationAdvice: "Drip irrigation essential; application of biochar, bentonite clay, and green manure to build water retention capacity.",
    icarClassification: "Typic Torripsamments / Calciorthids",
    description: "Characterized by high solar insolation, mechanical rock weathering, low organic matter, and subterranean calcium carbonate (kankar) beds."
  },
  coastal_saline: {
    id: "coastal_saline",
    name: "Coastal Saline & Estuarine Soil",
    subType: "Marine Ingress & Mangrove Tidal Alluvium",
    color: "#0891b2", // Coastal Cyan
    fillColor: "#06b6d4",
    borderColor: "#155e75",
    textColor: "#164e63",
    phRange: "7.0 - 8.3",
    typicalPh: 7.6,
    texture: "Sandy alluvium to heavy silty mangrove marine clay",
    organicCarbon: "0.50% - 1.40% (High in mangrove belt)",
    permeability: "Variable; restricted by saline groundwater table",
    majorCrops: ["Saline-tolerant Rice (Pokkali/Lunishree)", "Coconut", "Prawn/Crab Aquaculture", "Mangrove Casuarina"],
    remediationAdvice: "Provide leaching drainage sluice gates, bund protection against seawater intrusion, and green mulch incorporation.",
    icarClassification: "Typic Halaquepts / Fluvaquents",
    description: "Influenced by sea tides, coastal backwaters, and sea spray. Characterized by elevated sodium chloride and fluctuating electrical conductivity."
  },
  mountain_forest: {
    id: "mountain_forest",
    name: "Mountain & Forest Peaty Soil",
    subType: "Sub-Himalayan & Ghat Organic Humus Loam",
    color: "#059669", // Deep Emerald
    fillColor: "#10b981",
    borderColor: "#064e3b",
    textColor: "#064e3b",
    phRange: "5.2 - 6.5",
    typicalPh: 5.8,
    texture: "Rich loamy silt with high decayed litter humus",
    organicCarbon: "1.50% - 3.20% (Very High)",
    permeability: "High to moderate with good spring discharge",
    majorCrops: ["Apples", "Stone Fruits", "Maize", "Cardamom", "Ginger", "Turmeric", "Saffron"],
    remediationAdvice: "Terrace contour farming to avoid runoff erosion; balance nitrogen-rich humus with rock phosphorus and zinc.",
    icarClassification: "Typic Dystrochrepts / Typic Hapludolls",
    description: "Formed under dense forest cover in temperate and sub-tropical hill tracts. Rich in decomposing leaf humus, porous, and biologically active."
  }
};

export interface SoilZonePolygon {
  id: string;
  soilTypeId: string;
  soilInfo: SoilTypeDefinition;
  name: string;
  zoneTag: string;
  coordinates: [number, number][]; // [lat, lng][]
  areaSqKm: number;
}

/**
 * Generates organic geographic polygons for soil types around a target coordinate
 * and includes realistic regional distribution zones.
 */
export function generateLocalSoilZones(centerLat: number, centerLng: number, primarySoilHint?: string): SoilZonePolygon[] {
  // Determine primary soil type key from hint or default
  let primaryKey = "alluvial";
  const lowerHint = (primarySoilHint || "").toLowerCase();
  if (lowerHint.includes("black") || lowerHint.includes("vertisol") || lowerHint.includes("basalt")) {
    primaryKey = "black_cotton";
  } else if (lowerHint.includes("laterite") || lowerHint.includes("ultisol")) {
    primaryKey = "laterite";
  } else if (lowerHint.includes("red") || lowerHint.includes("alfisol") || lowerHint.includes("loam")) {
    if (lowerHint.includes("alluvial") || lowerHint.includes("inceptisol")) {
      primaryKey = "alluvial";
    } else {
      primaryKey = "red_yellow";
    }
  } else if (lowerHint.includes("arid") || lowerHint.includes("desert") || lowerHint.includes("sandy")) {
    primaryKey = "arid_sandy";
  } else if (lowerHint.includes("coastal") || lowerHint.includes("saline") || lowerHint.includes("mangrove")) {
    primaryKey = "coastal_saline";
  } else if (lowerHint.includes("forest") || lowerHint.includes("mountain") || lowerHint.includes("hill")) {
    primaryKey = "mountain_forest";
  }

  // Pick complementary adjacent soil types to create realistic separated zones
  const adjacentKeysByPrimary: Record<string, string[]> = {
    alluvial: ["alluvial", "red_yellow", "coastal_saline", "arid_sandy", "mountain_forest"],
    black_cotton: ["black_cotton", "alluvial", "red_yellow", "laterite"],
    red_yellow: ["red_yellow", "black_cotton", "laterite", "alluvial"],
    laterite: ["laterite", "red_yellow", "coastal_saline", "mountain_forest"],
    arid_sandy: ["arid_sandy", "alluvial", "black_cotton"],
    coastal_saline: ["coastal_saline", "alluvial", "laterite", "red_yellow"],
    mountain_forest: ["mountain_forest", "alluvial", "laterite"]
  };

  const soilSequence = adjacentKeysByPrimary[primaryKey] || ["alluvial", "red_yellow", "black_cotton", "arid_sandy"];

  const zones: SoilZonePolygon[] = [];

  // Generate 5 distinct colored soil zones around the active coordinate
  // Each zone covers a different geometric sector with natural-looking radial variations
  const sectorCount = 5;
  const baseRadiusDeg = 0.12; // ~13 km radius

  for (let s = 0; s < sectorCount; s++) {
    const soilKey = soilSequence[s % soilSequence.length];
    const soilInfo = SOIL_TYPES[soilKey] || SOIL_TYPES.alluvial;

    // Angle range for this sector
    const startAngle = (s * 2 * Math.PI) / sectorCount;
    const endAngle = ((s + 1) * 2 * Math.PI) / sectorCount;
    const midAngle = (startAngle + endAngle) / 2;

    const ringCoords: [number, number][] = [];

    // Center point with slight offset
    const centerOffsetLat = centerLat + Math.sin(midAngle) * 0.008;
    const centerOffsetLng = centerLng + Math.cos(midAngle) * 0.008;
    ringCoords.push([centerOffsetLat, centerOffsetLng]);

    // Radial arc points with organic jitter
    const stepCount = 8;
    for (let i = 0; i <= stepCount; i++) {
      const angle = startAngle + (i / stepCount) * (endAngle - startAngle);
      // Realistic jitter based on trigonometric harmonies
      const noise = Math.sin(angle * 4 + s) * 0.02 + Math.cos(angle * 7) * 0.015;
      const radius = baseRadiusDeg * (0.8 + (s % 3) * 0.25) + noise;

      const pLat = centerLat + Math.sin(angle) * radius;
      const pLng = centerLng + Math.cos(angle) * (radius * 1.15); // longitude compensation
      ringCoords.push([Number(pLat.toFixed(5)), Number(pLng.toFixed(5))]);
    }

    // Close the polygon
    ringCoords.push([centerOffsetLat, centerOffsetLng]);

    const zoneNames = [
      "Core Agricultural Plains Belt",
      "Transitional Floodplain & Silt Terrace",
      "Elevated Residual Uplands",
      "Riverine Catchment & Basin Alluvium",
      "Peripheral Agro-Ecological Boundary"
    ];

    zones.push({
      id: `zone-${s}-${soilKey}`,
      soilTypeId: soilKey,
      soilInfo,
      name: `${soilInfo.name.split(" (")[0]} - ${zoneNames[s % zoneNames.length]}`,
      zoneTag: `Zone ${String.fromCharCode(65 + s)}`,
      coordinates: ringCoords,
      areaSqKm: Math.round(180 + (s * 75) + (centerLat % 5) * 12)
    });
  }

  // Add 1 broader regional buffer zone with a separated color
  const outerSoilKey = soilSequence[2] || "alluvial";
  const outerSoil = SOIL_TYPES[outerSoilKey];
  const outerCoords: [number, number][] = [];
  const outerSteps = 14;
  for (let i = 0; i <= outerSteps; i++) {
    const angle = (i / outerSteps) * 2 * Math.PI;
    const r = baseRadiusDeg * 1.9 + Math.sin(angle * 3) * 0.03;
    const pLat = centerLat + Math.sin(angle) * r;
    const pLng = centerLng + Math.cos(angle) * (r * 1.2);
    outerCoords.push([Number(pLat.toFixed(5)), Number(pLng.toFixed(5))]);
  }
  outerCoords.push(outerCoords[0]);

  zones.push({
    id: `zone-outer-${outerSoilKey}`,
    soilTypeId: outerSoilKey,
    soilInfo: outerSoil,
    name: `${outerSoil.name.split(" (")[0]} - Regional Macro Belt`,
    zoneTag: "Macro Belt",
    coordinates: outerCoords,
    areaSqKm: 850
  });

  return zones;
}

/**
 * Resolves soil classification and agronomic properties for any touched coordinate.
 */
export function getSoilAtCoordinate(
  lat: number,
  lng: number,
  activeSoilHint?: string
): {
  soil: SoilTypeDefinition;
  estimatedPh: number;
  nitrogenStatus: "Low" | "Medium" | "High";
  phosphorusStatus: "Low" | "Medium" | "High";
  potassiumStatus: "Low" | "Medium" | "High";
  organicCarbonPct: number;
  elevationMeters: number;
  zoneClassification: string;
} {
  // Deterministic calculation based on latitude and longitude coordinates
  const latHash = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453;
  const pseudoRandom = latHash - Math.floor(latHash);

  // Geographic India-wide soil inference heuristic
  let soilKey = "alluvial";
  if (lat > 27.5 && lng < 75.5) {
    soilKey = "arid_sandy"; // Thar / Rajasthan
  } else if (lat > 29.0 && lng > 74.0 && lng < 78.0) {
    soilKey = "alluvial"; // Punjab / Haryana plains
  } else if (lat >= 16.0 && lat <= 23.0 && lng >= 73.0 && lng <= 80.0) {
    soilKey = "black_cotton"; // Deccan Plateau / Maharashtra / MP
  } else if (lat < 16.0 && lng < 76.0) {
    soilKey = "laterite"; // Western Ghats / Kerala / Coastal Karnataka
  } else if (lat < 16.0 && lng >= 76.0) {
    soilKey = "red_yellow"; // Tamil Nadu / Southern Karnataka / Andhra
  } else if ((lat < 22.0 && lng < 73.0) || (lat < 14.0 && lng > 80.0)) {
    soilKey = "coastal_saline"; // Coastal belts
  } else if (lat > 31.0) {
    soilKey = "mountain_forest"; // Himalayan foothills
  } else if (activeSoilHint) {
    // If inside known district hint
    const h = activeSoilHint.toLowerCase();
    if (h.includes("black")) soilKey = "black_cotton";
    else if (h.includes("laterite")) soilKey = "laterite";
    else if (h.includes("red")) soilKey = "red_yellow";
    else if (h.includes("arid") || h.includes("sand")) soilKey = "arid_sandy";
    else if (h.includes("saline") || h.includes("coastal")) soilKey = "coastal_saline";
    else if (h.includes("forest") || h.includes("mountain")) soilKey = "mountain_forest";
  }

  const soil = SOIL_TYPES[soilKey] || SOIL_TYPES.alluvial;

  // Approximate realistic elevation based on coordinates
  // Coastal/Delta: 5-50m; Indo-Gangetic: 180-250m; Deccan Plateau: 500-800m; Foothills: 900-1800m
  let baseElevation = 210;
  if (lat < 20.0 && lat > 12.0 && lng > 73.5 && lng < 78.5) {
    baseElevation = 620; // Deccan
  } else if (lat > 31.0) {
    baseElevation = 1150; // Hills
  } else if (lng < 73.0 || (lat < 14.0 && lng > 79.5)) {
    baseElevation = 18; // Coastal
  }
  const elevationMeters = Math.round(baseElevation + (pseudoRandom * 45) - 20);

  // Approximate pH with small local spatial deviation
  const phOffset = (pseudoRandom - 0.5) * 0.4;
  const estimatedPh = Number((soil.typicalPh + phOffset).toFixed(1));

  // Nutrient estimates
  const nOptions: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"];
  const nitrogenStatus = nOptions[Math.floor(pseudoRandom * 3)];
  const phosphorusStatus = nOptions[Math.floor(((pseudoRandom * 7) % 1) * 3)];
  const potassiumStatus = soilKey === "alluvial" || soilKey === "black_cotton" ? "High" : "Medium";

  const ocPct = Number((0.35 + pseudoRandom * 0.5).toFixed(2));

  return {
    soil,
    estimatedPh,
    nitrogenStatus,
    phosphorusStatus,
    potassiumStatus,
    organicCarbonPct: ocPct,
    elevationMeters,
    zoneClassification: `ICAR Regional Agro-Zone ${Math.floor(pseudoRandom * 8) + 1} (${soil.icarClassification})`
  };
}
