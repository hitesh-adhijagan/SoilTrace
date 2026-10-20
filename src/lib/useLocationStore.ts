import { useState, useEffect } from "react";
import { defaultLocation, locationDatabase, getRegionCityForDistrict, type LocationInfo } from "@/lib/locationData";

const STORAGE_KEY = "soiltrace_user_location";

export function getSavedLocation(): LocationInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultLocation;
}

export function saveLocation(loc: LocationInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    window.dispatchEvent(new Event("soiltrace_location_changed"));
  } catch {}
}

export function useLocationStore() {
  const [location, setLocation] = useState<LocationInfo>(getSavedLocation);

  useEffect(() => {
    const handleUpdate = () => {
      setLocation(getSavedLocation());
    };
    window.addEventListener("soiltrace_location_changed", handleUpdate);
    return () => window.removeEventListener("soiltrace_location_changed", handleUpdate);
  }, []);

  const changeLocation = (stateName: string, districtName: string, cityName: string) => {
    const found = locationDatabase[stateName]?.[districtName]?.[cityName];
    if (found) {
      saveLocation(found);
    }
  };

  const changeByDistrict = (districtName: string) => {
    const result = getRegionCityForDistrict(districtName);
    if (result && result.location) {
      saveLocation(result.location);
      return result;
    }
    return null;
  };

  const setCustomLocation = (loc: LocationInfo) => {
    saveLocation(loc);
  };

  return { location, changeLocation, changeByDistrict, setCustomLocation };
}
