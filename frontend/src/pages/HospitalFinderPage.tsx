import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { DivIcon, LatLngBounds } from "leaflet";
import { HOSPITALS, getRecommendedHospitals, HOSPITAL_CATEGORIES } from "../lib/hospitalData";
import type { Hospital } from "../lib/hospitalData";

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom hospital marker icon
const createHospitalIcon = (isSelected: boolean, isRecommended: boolean): DivIcon => {
  const color = isSelected ? "#dc2626" : isRecommended ? "#059669" : "#0284c7";
  const size = isSelected ? 40 : 32;

  return L.divIcon({
    html: `
      <div class="hospital-marker ${isSelected ? "selected" : ""} ${isRecommended ? "recommended" : ""}" 
           style="width: ${size}px; height: ${size}px; background: ${color}; border-radius: 50%; 
                  display: flex; align-items: center; justify-content: center; 
                  color: white; font-weight: bold; border: 3px solid white; 
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">
        🏥
      </div>
    `,
    iconSize: [size, size],
    popupAnchor: [0, -size / 2],
    className: "hospital-icon",
  });
};

// Map updater component to handle fit bounds
function MapUpdater({ hospitals, selectedHospital }: { hospitals: Hospital[]; selectedHospital: Hospital | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedHospital) {
      // Zoom to selected hospital with animation
      map.flyTo(selectedHospital.coords, 13, { duration: 1 });
    } else if (hospitals.length > 0) {
      // Fit all hospitals in view
      const bounds = new LatLngBounds(hospitals.map(h => h.coords));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [selectedHospital, hospitals, map]);

  return null;
}

export default function HospitalFinderPage() {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [riskLevel, setRiskLevel] = useState<"high" | "moderate" | "low">("high");

  // Get recommended hospitals based on risk level
  const recommendedHospitals = getRecommendedHospitals(riskLevel);

  const filteredHospitals = useMemo(() => {
    const term = searchCity.trim().toLowerCase();
    if (!term) {
      return HOSPITALS;
    }
    return HOSPITALS.filter(
      (hospital) =>
        hospital.city.toLowerCase().includes(term) ||
        hospital.name.toLowerCase().includes(term) ||
        hospital.specialization.toLowerCase().includes(term),
    );
  }, [searchCity]);

  // Handle hospital card click
  const handleHospitalClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  // Default center - will be overridden by MapUpdater
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <section className="relative isolate min-h-[82vh] overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ width: "100%", height: "100%" }}
          className="hospital-finder-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapUpdater hospitals={filteredHospitals} selectedHospital={selectedHospital} />

          {filteredHospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={hospital.coords}
              icon={createHospitalIcon(selectedHospital?.id === hospital.id, hospital.recommended)}
              eventHandlers={{
                click: () => {
                  setSelectedHospital(hospital);
                  setActiveHospital(hospital);
                },
              }}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <p className="text-sm font-semibold text-slate-900">{hospital.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{hospital.city}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute inset-0 z-10 bg-slate-900/28" />
      </div>

      <div className="relative z-[1200] flex min-h-[82vh] items-end p-4 md:items-center md:p-8">
        <div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur md:ml-auto md:max-w-[430px]">
          <h2 className="text-xl font-bold text-slate-900">Hospital Finder</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search hospitals and open detailed information from the list.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["high", "moderate", "low"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskLevel(level)}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  riskLevel === level
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search hospitals or cities..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {riskLevel === "high" && recommendedHospitals.length > 0 ? (
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended For You</p>
          ) : null}

          <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {filteredHospitals.map((hospital) => (
              <HospitalListItem
                key={hospital.id}
                hospital={hospital}
                isSelected={selectedHospital?.id === hospital.id}
                onLocate={() => handleHospitalClick(hospital)}
                onOpenModal={() => {
                  setSelectedHospital(hospital);
                  setActiveHospital(hospital);
                }}
              />
            ))}

            {filteredHospitals.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No hospitals found for this search.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {activeHospital ? (
        <div
          className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setActiveHospital(null)}
        >
          <div
            className="z-[1410] w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{activeHospital.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{activeHospital.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHospital(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">{activeHospital.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Specialization</p>
                <p className="mt-1 font-semibold text-slate-900">{activeHospital.specialization}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rating</p>
                <p className="mt-1 font-semibold text-slate-900">{activeHospital.rating.toFixed(1)} / 5.0</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 font-semibold text-slate-900">{activeHospital.contactPhone}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Beds</p>
                <p className="mt-1 font-semibold text-slate-900">{activeHospital.beds}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">{activeHospital.address}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HospitalListItem({
  hospital,
  isSelected,
  onLocate,
  onOpenModal,
}: {
  hospital: Hospital;
  isSelected: boolean;
  onLocate: () => void;
  onOpenModal: () => void;
}) {
  const isOncology = HOSPITAL_CATEGORIES.oncology.some(
    (spec) => hospital.specialization.toLowerCase() === spec.toLowerCase()
  );

  return (
    <div
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
        isSelected
          ? "border-red-500 bg-red-50 shadow-lg shadow-red-200"
          : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <button
            type="button"
            onClick={onOpenModal}
            className="text-left text-sm font-bold leading-tight text-slate-900 underline-offset-2 hover:underline"
          >
            {hospital.name}
          </button>
          <p className="text-xs text-slate-500 mt-1">{hospital.city}</p>
        </div>
        <button
          type="button"
          onClick={onLocate}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Locate
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-yellow-500 text-xs font-bold">★ {hospital.rating.toFixed(1)}</span>
        <span className="text-slate-400 text-xs">({hospital.acreDays} ACRE)</span>
      </div>

      {/* Specialization Badge */}
      <div className="mt-2">
        <span
          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
            isOncology
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {hospital.specialization}
        </span>
      </div>

      {/* Beds Info */}
      <div className="mt-2 text-xs text-slate-600">
        <p>🛏️ {hospital.beds} beds available</p>
      </div>
    </div>
  );
}
