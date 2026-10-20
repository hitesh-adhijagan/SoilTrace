import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import EvidenceBadge from "@/components/EvidenceBadge";
import SiteShell from "@/components/SiteShell";
import LocationSelector from "@/components/LocationSelector";
import { useLocationStore } from "@/lib/useLocationStore";
import {
  SOIL_TYPES,
  generateLocalSoilZones,
  getSoilAtCoordinate,
  type SoilZonePolygon
} from "@/lib/soilGeoData";
import {
  ExternalLink,
  Layers,
  MapPin,
  Satellite,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Palette,
  Building2,
  Copy,
  CheckCheck,
  Compass,
  Mountain,
  ChevronDown,
  ChevronUp,
  X,
  Crosshair
} from "lucide-react";

interface TouchedPointDetails {
  lat: number;
  lng: number;
  distanceKm: number;
  direction: string;
  elevationMeters: number;
  soilName: string;
  soilColor: string;
  soilBorderColor: string;
  estimatedPh: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  organicCarbonPct: number;
  zoneClassification: string;
  majorCrops: string[];
}

export default function MapPage() {
  const { location } = useLocationStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<L.Map | null>(null);
  const soilLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const touchedMarkerRef = useRef<L.CircleMarker | null>(null);

  // Map Modes & Layer Controls
  const [mapMode, setMapMode] = useState<"satellite" | "street">("satellite");
  const [showSoilLayers, setShowSoilLayers] = useState<boolean>(true);
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  // Touched Coordinate Details State
  const [touchedPoint, setTouchedPoint] = useState<TouchedPointDetails | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Calculate distance & compass direction between two coordinates
  const calculateDistanceAndBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): { distanceKm: number; direction: string } => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Number((R * c).toFixed(2));

    // Compass direction
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    brng = (brng + 360) % 360;

    const directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
    const direction = directions[Math.round(brng / 45) % 8];

    return { distanceKm, direction };
  };

  // Handle Touched Coordinate on Map
  const handleMapTouch = useCallback(
    (lat: number, lng: number) => {
      const { distanceKm, direction } = calculateDistanceAndBearing(
        location.coords[0],
        location.coords[1],
        lat,
        lng
      );

      const soilInfo = getSoilAtCoordinate(lat, lng, location.soilType);

      const details: TouchedPointDetails = {
        lat,
        lng,
        distanceKm,
        direction,
        elevationMeters: soilInfo.elevationMeters,
        soilName: soilInfo.soil.name,
        soilColor: soilInfo.soil.color,
        soilBorderColor: soilInfo.soil.borderColor,
        estimatedPh: soilInfo.estimatedPh,
        nitrogen: soilInfo.nitrogenStatus,
        phosphorus: soilInfo.phosphorusStatus,
        potassium: soilInfo.potassiumStatus,
        organicCarbonPct: soilInfo.organicCarbonPct,
        zoneClassification: soilInfo.zoneClassification,
        majorCrops: soilInfo.soil.majorCrops
      };

      setTouchedPoint(details);

      // Render touched marker on Leaflet map
      if (leafletInstance.current) {
        const map = leafletInstance.current;

        if (touchedMarkerRef.current) {
          map.removeLayer(touchedMarkerRef.current);
        }

        const marker = L.circleMarker([lat, lng], {
          radius: 10,
          color: "#06b6d4",
          fillColor: details.soilColor,
          fillOpacity: 0.95,
          weight: 3.5,
          className: "pulse-point-marker"
        }).addTo(map);

        touchedMarkerRef.current = marker;

        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #1a1e1b; min-width: 250px; line-height: 1.45; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${details.soilColor}; padding-bottom: 5px; margin-bottom: 7px;">
              <div style="display: flex; align-items: center; gap: 5px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${details.soilColor}; border: 1px solid ${details.soilBorderColor};"></span>
                <span style="font-weight: 700; color: #1a1e1b; font-size: 13px;">📍 Coordinate Details</span>
              </div>
              <span style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">Point Inspected</span>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 7px; font-family: monospace; font-size: 11px;">
              <strong style="color: #0f172a; font-size: 12px;">${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</strong><br/>
              <span style="color: #475569; font-size: 10px;">${details.distanceKm === 0 ? `Exact center of ${location.city}` : `${details.distanceKm} km ${details.direction} of ${location.city}`}</span><br/>
              <span style="color: #0d9488; font-size: 10px; font-weight: 600;">⛰️ Elevation: ${details.elevationMeters} m MSL</span>
            </div>

            <div style="margin-bottom: 6px; background: ${details.soilColor}15; border-left: 3px solid ${details.soilColor}; padding: 5px 8px; border-radius: 0 4px 4px 0;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Soil Classification at Point</span><br/>
              <strong style="color: ${details.soilBorderColor}; font-size: 12px;">${details.soilName}</strong>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; margin-bottom: 6px; background: #fffbeb; padding: 6px 8px; border-radius: 4px; border: 1px solid #fef3c7;">
              <div>pH Reaction: <b style="color: #b45309;">${details.estimatedPh}</b></div>
              <div>Org. Carbon: <b style="color: #15803d;">${details.organicCarbonPct}%</b></div>
              <div style="grid-column: span 2; font-family: monospace; font-size: 10px; color: #334155;">
                NPK Status: N(<b>${details.nitrogen}</b>) • P(<b>${details.phosphorus}</b>) • K(<b>${details.potassium}</b>)
              </div>
            </div>

            <div style="font-size: 10px; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 5px; margin-top: 5px;">
              <span style="font-weight: 600; color: #1e293b;">🌾 Recommended Crops:</span><br/>
              <span style="color: #64748b;">${details.majorCrops.slice(0, 4).join(", ")}</span>
            </div>
            
            <div style="font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 4px;">
              ${details.zoneClassification}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();
      }
    },
    [location]
  );

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletInstance.current) {
      const map = L.map(mapRef.current, {
        center: location.coords,
        zoom: location.zoom,
        scrollWheelZoom: true
      });

      leafletInstance.current = map;

      // Listen for map touch / click to display coordinate details
      map.on("click", (e: L.LeafletMouseEvent) => {
        handleMapTouch(e.latlng.lat, e.latlng.lng);
      });
    }

    const map = leafletInstance.current;
    map.setView(location.coords, location.zoom);

    // Clear previous tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Base Tile Layers
    if (mapMode === "satellite") {
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community",
          maxZoom: 19
        }
      ).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Esri Boundaries & Places",
          maxZoom: 19,
          opacity: 0.85
        }
      ).addTo(map);
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);
    }

    // Clear previous static markers and soil layers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        // Do not remove touchedMarker if it's currently active and set
        if (layer !== touchedMarkerRef.current) {
          map.removeLayer(layer);
        }
      }
    });

    // Clean up existing soil layer group
    if (soilLayerGroupRef.current) {
      map.removeLayer(soilLayerGroupRef.current);
      soilLayerGroupRef.current = null;
    }

    // Render Soil Types with Separated Colors if enabled
    if (showSoilLayers) {
      const soilLayerGroup = L.layerGroup();
      const zones = generateLocalSoilZones(location.coords[0], location.coords[1], location.soilType);

      zones.forEach((zone: SoilZonePolygon) => {
        const poly = L.polygon(zone.coordinates, {
          color: zone.soilInfo.borderColor,
          weight: 2,
          fillColor: zone.soilInfo.fillColor,
          fillOpacity: 0.45,
          className: "soil-zone-polygon"
        });

        // Hover feedback
        poly.on("mouseover", (e) => {
          const l = e.target as L.Polygon;
          l.setStyle({
            fillOpacity: 0.72,
            weight: 3,
            color: "#ffffff"
          });
        });

        poly.on("mouseout", (e) => {
          const l = e.target as L.Polygon;
          l.setStyle({
            fillOpacity: 0.45,
            weight: 2,
            color: zone.soilInfo.borderColor
          });
        });

        // When polygon is touched/clicked, inspect that exact coordinate
        poly.on("click", (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          handleMapTouch(e.latlng.lat, e.latlng.lng);
        });

        soilLayerGroup.addLayer(poly);
      });

      soilLayerGroup.addTo(map);
      soilLayerGroupRef.current = soilLayerGroup;
    }

    // Primary Satellite Soil Specimen Marker for Active Location
    const primaryMarker = L.circleMarker(location.coords, {
      radius: 11,
      color: "#2e6f40",
      fillColor: "#4ade80",
      fillOpacity: 0.95,
      weight: 3.5
    }).addTo(map);

    primaryMarker
      .bindPopup(`
      <div style="font-family: monospace; font-size: 12px; padding: 6px; color: #1a1e1b; min-width: 200px;">
        <div style="border-bottom: 2px solid #2e6f40; padding-bottom: 4px; margin-bottom: 4px;">
          <span style="font-size: 10px; text-transform: uppercase; color: #c2593f; font-weight: bold;">District Reference Specimen</span><br/>
          <strong style="color: #2e6f40; font-size: 14px;">${location.city}</strong>
          <span style="color: #4b5563; font-size: 12px;"> (${location.district} Dist)</span>
        </div>
        <div style="margin-top: 4px; font-size: 11px;">
          <span>State: <b>${location.state}</b></span><br/>
          <span>ICAR Soil: <b style="color: #2e6f40;">${location.soilType}</b></span><br/>
          <span>pH Rating: <b style="color: #c2593f;">${location.pH}</b></span><br/>
          <span>NPK: N(<b>${location.nitrogen}</b>) P(<b>${location.phosphorus}</b>) K(<b>${location.potassium}</b>)</span><br/>
          <span style="color: #6b7280; font-size: 10px;">ICAR Station: ${location.icarStation}</span>
        </div>
      </div>
    `)
      .openPopup();

    // Secondary Environmental CPCB Marker
    const offsetCoords: [number, number] = [location.coords[0] + 0.012, location.coords[1] + 0.012];
    const secondaryMarker = L.circleMarker(offsetCoords, {
      radius: 8,
      color: "#f87171",
      fillColor: "#c2593f",
      fillOpacity: 0.85,
      weight: 2
    }).addTo(map);

    secondaryMarker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; padding: 4px;">
        <strong style="color: #c2593f;">${location.cpcbZone}</strong><br/>
        <span style="color: #4b5563;">CPCB Regional Environmental Monitoring Reference Point</span>
      </div>
    `);

    // Invalidate Leaflet dimensions
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [location, mapMode, showSoilLayers, handleMapTouch]);

  // Recenter Map on current location
  const handleRecenter = () => {
    if (leafletInstance.current) {
      leafletInstance.current.setView(location.coords, location.zoom);
      leafletInstance.current.invalidateSize();
    }
  };

  // Copy touched coordinate to clipboard
  const handleCopyCoordinate = () => {
    if (!touchedPoint) return;
    const coordString = `${touchedPoint.lat.toFixed(6)}, ${touchedPoint.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordString);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <SiteShell title={`Map & Satellite — ${location.city}`}>
      <div data-testid="map-page" className="space-y-8">
        {/* Page Heading & Dynamic Region/City Display */}
        <div data-testid="map-heading" className="border-b border-ink/15 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
            Atlas Plate 04 / Satellite Remote Sensing & Regional Soil Record
          </p>
          <h1 className="mt-2.5 font-serif text-4xl leading-tight sm:text-6xl">
            {location.city} <em className="text-leaf">Satellite Map & Soil Record.</em>
          </h1>

          {/* Prominent District & Region / City Name Display Indicator */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 bg-leaf/15 text-leaf border border-leaf/30 px-3 py-1 rounded-sm font-semibold">
              <Building2 size={13} />
              District: <span>{location.district}</span>
            </span>
            <span className="text-muted">➔</span>
            <span className="inline-flex items-center gap-1.5 bg-terracotta/15 text-terracotta border border-terracotta/30 px-3 py-1 rounded-sm font-semibold">
              <MapPin size={13} />
              Region / City: <span>{location.city}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-ink/5 text-muted border border-ink/10 px-2.5 py-1 rounded-sm">
              State: {location.state}
            </span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            High-resolution satellite imagery paired with ICAR-NBSS&LUP soil profile data and CPCB environmental monitoring markers for <strong>{location.city}, {location.district}, {location.state}</strong>.
          </p>
        </div>

        {/* Global Pan-India State / District / City Cascading Selector */}
        <LocationSelector />

        {/* Map Container Card */}
        <section data-testid="map-module" className="ink-frame overflow-hidden bg-paper border border-ink/20">
          {/* Map Top Header Controls */}
          <div data-testid="map-empty-state" className="border-b border-amber/40 bg-amber/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <EvidenceBadge status="verified" />
                <div>
                  <p data-testid="map-empty-title" className="font-serif text-xl sm:text-2xl leading-none">
                    {location.city} Satellite Imagery & Specimen Active
                  </p>
                  <p className="font-mono text-[10px] text-muted uppercase tracking-wider mt-1">
                    District: {location.district} ➔ Resolved Region / City: {location.city} ({location.state})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="ink-button text-xs py-1.5 px-3 bg-paper text-ink border border-ink/20 hover:border-leaf flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  Recenter Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode(mapMode === "satellite" ? "street" : "satellite")}
                  className={`ink-button text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer ${
                    mapMode === "satellite" ? "bg-leaf text-paper" : "bg-paper text-ink border border-ink/20"
                  }`}
                >
                  <Satellite size={14} />
                  {mapMode === "satellite" ? "Satellite View" : "Street View"}
                </button>
              </div>
            </div>
            <p data-testid="map-empty-copy" className="mt-2.5 text-xs sm:text-sm leading-6 text-muted">
              {location.satelliteNotes}
            </p>
          </div>

          {/* Map Canvas with Overlaid Floating Controls */}
          <div className="relative w-full">
            {/* BUTTON INSIDE FIELD OF MAP BOX: Toggle Soil Types with Separated Colors */}
            <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-[1000] flex flex-col items-end gap-1.5 sm:gap-2 max-w-[calc(100%-1rem)]">
              <button
                type="button"
                id="toggle-soil-types-btn"
                data-testid="toggle-soil-types-button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSoilLayers((prev) => !prev);
                }}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-sm text-xs font-mono font-bold tracking-wide shadow-2xl border-2 transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer ${
                  showSoilLayers
                    ? "bg-leaf text-paper border-leaf ring-2 ring-leaf/40 shadow-leaf/40"
                    : "bg-paper/95 text-ink border-ink/40 hover:border-leaf hover:bg-paper"
                }`}
              >
                <Palette size={15} className={showSoilLayers ? "text-amber" : "text-leaf"} />
                <div className="text-left">
                  <span className="block leading-tight text-xs sm:text-sm">
                    <span className="hidden sm:inline">
                      {showSoilLayers ? "✓ Soil Types Displayed (Separated Colors Active)" : "🎨 Show Soil Types (Separated Colors in Map)"}
                    </span>
                    <span className="sm:hidden">
                      {showSoilLayers ? "✓ Soil Colors Active" : "🎨 Show Soil Colors"}
                    </span>
                  </span>
                  <span className="hidden sm:block text-[10px] opacity-85 font-normal">
                    {showSoilLayers ? "Showing distinct separated color zones in map" : "Press button to display soil type colors in map"}
                  </span>
                </div>
                {showSoilLayers && <span className="size-2 rounded-full bg-amber animate-ping shrink-0" />}
              </button>

              {/* Quick Map Instruction Badge (Desktop & Tablet only to avoid crowding mobile) */}
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="hidden sm:flex bg-paper/95 backdrop-blur-md border border-ink/20 rounded-sm px-3 py-1 text-[10px] font-mono text-muted shadow-md items-center gap-1.5"
              >
                <Crosshair size={12} className="text-leaf shrink-0" />
                <span>Touch or click any point on map for coordinate details</span>
              </div>
            </div>

            {/* Leaflet Map Div (Responsive height across phone, tablet, and desktop) */}
            <div
              ref={mapRef}
              id="study-map"
              data-testid="map-canvas"
              className="h-[360px] sm:h-[460px] md:h-[520px] lg:h-[580px] min-h-[340px] w-full relative z-0 cursor-crosshair"
            />

            {/* TOUCHED COORDINATE TELEMETRY HUD INSIDE MAP FIELD */}
            {touchedPoint && (
              <div
                data-testid="touched-coordinate-hud"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-[1000] max-w-sm sm:max-w-md w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] bg-paper/95 backdrop-blur-md border-2 border-ink/20 rounded-sm shadow-2xl p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="flex items-start justify-between gap-2 border-b border-ink/10 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3.5 rounded-full shrink-0 border border-ink/20 shadow-xs"
                      style={{ backgroundColor: touchedPoint.soilColor }}
                    />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-leaf font-bold">
                        Point Touched / Inspected Coordinate Details
                      </p>
                      <h4 className="font-mono text-xs sm:text-sm font-bold text-ink">
                        {touchedPoint.lat.toFixed(5)}° N, {touchedPoint.lng.toFixed(5)}° E
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyCoordinate}
                      className="text-[10px] font-mono px-2 py-1 bg-paper border border-ink/20 rounded-sm hover:border-leaf flex items-center gap-1 text-ink cursor-pointer"
                    >
                      {copiedCoords ? <CheckCheck size={11} className="text-leaf" /> : <Copy size={11} />}
                      <span>{copiedCoords ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTouchedPoint(null)}
                      className="size-6 flex items-center justify-center rounded-sm text-muted hover:text-ink hover:bg-ink/5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Distance & Proximity */}
                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted mb-2 gap-1">
                  <span className="flex items-center gap-1">
                    <Compass size={12} className="text-leaf" />
                    <span>
                      {touchedPoint.distanceKm === 0
                        ? `Exact center of ${location.city}`
                        : `${touchedPoint.distanceKm} km ${touchedPoint.direction} of ${location.city}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <Mountain size={12} className="text-amber" />
                    <span>Elevation: {touchedPoint.elevationMeters} m MSL</span>
                  </span>
                </div>

                {/* Soil Profile at Touched Coordinate */}
                <div className="bg-paper/80 border border-ink/10 rounded-sm p-2.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-muted">Soil Type at Point:</span>
                    <span
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-sm border"
                      style={{
                        backgroundColor: `${touchedPoint.soilColor}25`,
                        borderColor: touchedPoint.soilBorderColor,
                        color: touchedPoint.soilBorderColor
                      }}
                    >
                      {touchedPoint.soilName.split(" (")[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="border border-ink/10 bg-paper p-1.5 rounded-sm">
                      <span className="text-[9px] uppercase text-muted block">pH Rating</span>
                      <strong className="text-terracotta">{touchedPoint.estimatedPh}</strong>
                    </div>
                    <div className="border border-ink/10 bg-paper p-1.5 rounded-sm">
                      <span className="text-[9px] uppercase text-muted block">Org. Carbon</span>
                      <strong className="text-leaf">{touchedPoint.organicCarbonPct}%</strong>
                    </div>
                    <div className="border border-ink/10 bg-paper p-1.5 rounded-sm">
                      <span className="text-[9px] uppercase text-muted block">NPK Status</span>
                      <span className="text-[10px] font-bold text-ink">
                        {touchedPoint.nitrogen[0]}-{touchedPoint.phosphorus[0]}-{touchedPoint.potassium[0]}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-muted font-mono">
                    <span className="font-semibold text-ink">Recommended Crops: </span>
                    <span>{touchedPoint.majorCrops.slice(0, 4).join(", ")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* FLOATING SOIL LEGEND INSIDE MAP FIELD (When Soil Types are active) */}
            {showSoilLayers && (
              <div
                data-testid="soil-legend-card"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-[1000] bg-paper/95 backdrop-blur-md border-2 border-ink/20 rounded-sm shadow-2xl transition-all ${
                  isLegendExpanded ? "p-2.5 sm:p-3 max-w-[250px] sm:max-w-xs" : "px-3 py-1.5 cursor-pointer hover:border-leaf"
                }`}
              >
                {!isLegendExpanded ? (
                  <button
                    type="button"
                    onClick={() => setIsLegendExpanded(true)}
                    className="flex items-center gap-2 font-mono text-[11px] font-bold text-ink uppercase tracking-wider cursor-pointer"
                  >
                    <Palette size={13} className="text-leaf shrink-0" />
                    <span>Soil Legend</span>
                    <ChevronUp size={13} className="text-muted ml-0.5" />
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
                        <Palette size={14} className="text-leaf shrink-0" />
                        <span>Soil Types</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLegendExpanded(false)}
                        className="text-muted hover:text-ink text-xs p-0.5 cursor-pointer"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="space-y-1 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                      {Object.values(SOIL_TYPES).map((soil) => (
                      <div
                        key={soil.id}
                        className="flex items-center gap-2 text-[11px] hover:bg-ink/5 p-1 rounded-sm transition-colors"
                      >
                        <span
                          className="size-3.5 rounded-xs shrink-0 border shadow-xs"
                          style={{
                            backgroundColor: soil.fillColor,
                            borderColor: soil.borderColor
                          }}
                        />
                        <div className="truncate flex-1">
                          <span className="font-medium text-ink block truncate">{soil.name.split(" (")[0]}</span>
                          <span className="text-[9px] text-muted font-mono">{soil.phRange} pH • {soil.typicalPh}</span>
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Map Attribution & Coordinates Footer Note */}
          <div
            data-testid="map-attribution-note"
            className="flex flex-col gap-3 border-t border-ink/15 p-4 sm:p-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between bg-paper"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-leaf" />
              <span>Base Layer: Esri High-Resolution Satellite World Imagery & ISRO Bhuvan Geographic Alignment.</span>
            </div>
            <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-leaf font-semibold">
              <MapPin size={14} />
              <span>
                {location.city} Coords: {location.coords[0].toFixed(4)}°N, {location.coords[1].toFixed(4)}°E
              </span>
            </div>
          </div>
        </section>

        {/* Personalized Regional Soil Report Card for Selected Location */}
        <section data-testid="personalized-report" className="ink-frame bg-paper p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/15 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber" size={18} />
                <p className="font-mono text-xs uppercase tracking-wider text-terracotta">
                  Personalized Individual Report / Record Card
                </p>
              </div>
              <h2 className="mt-2 font-serif text-3xl">
                Soil Profile & Govt Record for {location.city}, {location.district}, {location.state}
              </h2>
            </div>
            <EvidenceBadge status="verified" />
          </div>

          <p className="text-sm leading-7 text-muted max-w-3xl">{location.reportSummary}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            <div className="border border-ink/15 bg-paper/60 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">ICAR Soil Series Type</p>
              <p className="mt-1 font-serif text-lg font-semibold text-leaf">{location.soilType}</p>
            </div>
            <div className="border border-ink/15 bg-paper/60 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">pH Rating & Reaction</p>
              <p className="mt-1 font-serif text-lg font-semibold text-terracotta">{location.pH} (Rating)</p>
            </div>
            <div className="border border-ink/15 bg-paper/60 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">NPK Nutrients</p>
              <p className="mt-1 text-xs font-mono text-ink">
                N: <b>{location.nitrogen}</b> | P: <b>{location.phosphorus}</b> | K: <b>{location.potassium}</b>
              </p>
            </div>
            <div className="border border-ink/15 bg-paper/60 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">Micronutrients & Metals</p>
              <p className="mt-1 text-xs text-muted">{location.micronutrients}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="border border-ink/15 bg-paper/40 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">CPCB Environmental Zone</p>
              <p className="mt-1 font-serif text-sm text-ink">{location.cpcbZone}</p>
            </div>
            <div className="border border-ink/15 bg-paper/40 p-4 rounded-sm">
              <p className="font-mono text-[10px] uppercase text-muted">Regional Agricultural Research Station</p>
              <p className="mt-1 font-serif text-sm text-ink">{location.icarStation}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-4 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5 text-leaf">
              <ShieldCheck size={14} /> ICAR-NBSS&LUP & CPCB Published Ground Truth Reference
            </span>
            <a
              href="https://soilhealth.dac.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-leaf hover:text-terracotta uppercase tracking-wider"
            >
              Verify Govt Soil Health Card Portal <ExternalLink size={12} />
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}