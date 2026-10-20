import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import Survey from "@/pages/Survey";
import Dashboard from "@/pages/Dashboard";
import Experiment from "@/pages/Experiment";
import MapPage from "@/pages/Map";
import Story from "@/pages/Story";
import Sources from "@/pages/Sources";
import { Toaster } from "@/components/ui/sonner";
import { getPageTitle } from "@/lib/useDocumentTitle";

function RouteTitleSync() {
  const location = useLocation();
  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);
  return null;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <RouteTitleSync />
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/experiment" element={<Experiment />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/story" element={<Story />} />
        <Route path="/sources" element={<Sources />} />
      </Routes>
    </>
  );
}
