import { useState, useEffect } from "react";
import { locationDatabase } from "@/lib/locationData";
import { useLocationStore } from "@/lib/useLocationStore";
import { MapPin, Globe, Check, Sparkles } from "lucide-react";

export default function LocationSelector() {
  const { location, changeLocation } = useLocationStore();
  const [selectedState, setSelectedState] = useState(location.state);
  const [selectedDistrict, setSelectedDistrict] = useState(location.district);
  const [selectedCity, setSelectedCity] = useState(location.city);

  useEffect(() => {
    setSelectedState(location.state);
    setSelectedDistrict(location.district);
    setSelectedCity(location.city);
  }, [location]);

  const states = Object.keys(locationDatabase);
  const districts = selectedState && locationDatabase[selectedState] ? Object.keys(locationDatabase[selectedState]) : [];
  const cities =
    selectedState && selectedDistrict && locationDatabase[selectedState]?.[selectedDistrict]
      ? Object.keys(locationDatabase[selectedState][selectedDistrict])
      : [];

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const distList = Object.keys(locationDatabase[st] || {});
    const firstDist = distList[0] || "";
    setSelectedDistrict(firstDist);
    const cityList = firstDist ? Object.keys(locationDatabase[st][firstDist] || {}) : [];
    const firstCity = cityList[0] || "";
    setSelectedCity(firstCity);
    if (firstCity) {
      changeLocation(st, firstDist, firstCity);
    }
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    const cityList = Object.keys(locationDatabase[selectedState]?.[dist] || {});
    const firstCity = cityList[0] || "";
    setSelectedCity(firstCity);
    if (firstCity) {
      changeLocation(selectedState, dist, firstCity);
    }
  };

  const handleCityChange = (c: string) => {
    setSelectedCity(c);
    changeLocation(selectedState, selectedDistrict, c);
  };

  return (
    <div data-testid="location-selector" className="ink-frame bg-paper p-3.5 sm:p-5 border border-ink/20 space-y-3.5 sm:space-y-4">
      {/* Top Header & Context Display */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-ink/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-leaf/10 text-leaf ring-1 ring-leaf/30 shrink-0">
            <MapPin size={16} />
          </span>
          <div>
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-terracotta">Location Context Selector</p>
            <h3 className="font-serif text-base sm:text-lg leading-tight text-ink flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>{location.city}</span>
              <span className="text-muted font-normal text-xs sm:text-sm">({location.district} District, {location.state})</span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono uppercase tracking-wider">
          <Globe size={12} className="text-leaf shrink-0" />
          <span>Pan-India Regional Dataset Active</span>
        </div>
      </div>

      {/* Cascading State / District / City Dropdowns */}
      <div className="grid gap-3 sm:grid-cols-3 pt-1">
        {/* State Dropdown */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1 font-semibold">
            State ({states.length})
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs sm:text-sm font-medium outline-none focus:border-leaf min-h-[40px] cursor-pointer"
          >
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* District Dropdown */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1 font-semibold">
            District ({districts.length})
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-leaf text-leaf min-h-[40px] cursor-pointer"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1 font-semibold">
            Region / City Name ({cities.length} Available)
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper/60 px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-leaf text-terracotta min-h-[40px] cursor-pointer"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted border-t border-ink/10 pt-2.5">
        <span className="flex items-center gap-1.5 text-leaf">
          <Check size={13} /> ICAR Soil Series: <strong>{location.soilType}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber" />
          <span>CPCB Zone: {location.cpcbZone}</span>
        </span>
      </div>
    </div>
  );
}
