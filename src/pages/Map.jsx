import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Sidebar from "../components/Sidebar";
import "./Map.css";

// customMarkerIcon

// customMarkerIcon with label support
const STATUS_TEXT = {
  "#22c55e": "operational",
  "#f59e0b": "under repair",
  "#ef4444": "inaccessible",
};

function makeIcon(color, label = "", showLabel = false) {
  const statusText = STATUS_TEXT[color] || "unknown";
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;" role="img" aria-label="${label} - ${statusText}">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
        <path d="M14 0C7.373 0 2 5.373 2 12c0 9 12 24 12 24S26 21 26 12C26 5.373 20.627 0 14 0z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="12" r="5" fill="white" opacity=".9"/>
      </svg>
      ${showLabel ? `<div style="margin-top:2px;white-space:nowrap;background:rgba(0,0,0,0.75);color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;">${label}</div>` : ""}
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [28, showLabel ? 60 : 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

// prefMap
const PREF_MAP = {
  lift_access:    "lift",
  ramp_access:    "ramp",
  wide_paths:     "wide_path",
  tactile_paving: "tactile_paving",
  automatic_door: "automatic_door",
  high_contrast:  "high_contrast",
  text_to_speech: "text_to_speech",
  crowded_areas:  "crowded_areas",
};

// flyToHelper
function FlyTo({ target, onDone }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, 18, { duration: 0.8 });
    onDone?.();
  }, [target]);
  return null;
}


// markerComponent with label toggle and improved logic
function BuildingMarker({ building, accessFeatures, userPrefs, showLabel }) {
  const [showAll, setShowAll] = useState(false);

  const buildingFeatures = accessFeatures.filter(
    (f) => String(f.location_id) === String(building.id)
  );

  // Show only the user's selected accessibility features for this building
  const selectedFeatures = userPrefs
    ? Object.entries(PREF_MAP)
        .filter(([prefKey]) => userPrefs[prefKey])
        .map(([prefKey, featureType]) => {
          const match = buildingFeatures.find((f) => f.type === featureType);
          return match ? { ...match, prefKey, featureType } : null;
        })
        .filter(Boolean)
    : [];

  // Other features (not selected by user)
  const otherFeatures = userPrefs
    ? buildingFeatures.filter((f) =>
        !Object.entries(PREF_MAP).some(
          ([prefKey, featureType]) =>
            f.type === featureType && userPrefs[prefKey] === true
        )
      )
    : [];

  return (
    <Marker
      position={[building.lat, building.lng]}
      icon={makeIcon(
        building.status === "operational" ? "#22c55e" :
        building.status === "under_repair" ? "#f59e0b" : "#ef4444",
        building.name,
        showLabel
      )}
    >
      <Popup>
        <div style={{ minWidth: 220, fontFamily: "sans-serif" }}>
          {/* title */}
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #eee" }}>
            {building.name}
          </div>

          {/* Selected Accessibility Features (user preferences) */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Selected Accessibility Features
          </div>
          {selectedFeatures.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 12, marginBottom: 8 }}>No selected features for this building.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }} aria-label="Selected accessibility features">
              <thead style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                <tr><th scope="col">Feature</th><th scope="col">Description</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {selectedFeatures.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "5px 8px 5px 0", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                      {f.featureType.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 12, color: "#555" }}>
                      {f.description}
                    </td>
                    <td style={{ padding: "5px 0", fontSize: 11, whiteSpace: "nowrap", fontWeight: 600,
                      color: f.status === "operational" ? "#22c55e" : f.status === "under_repair" ? "#f59e0b" : "#ef4444"
                    }}>
                      {f.status.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* showAllToggle */}
          {otherFeatures.length > 0 && (
            <>
              <button
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                aria-label={showAll ? "Hide additional features" : `Show all ${otherFeatures.length} additional features`}
                style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", padding: "4px 0", marginBottom: 4 }}
              >
                {showAll ? "Hide ▲" : `Show all features (${otherFeatures.length}) ▼`}
              </button>

              {showAll && (
                <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #eee", paddingTop: 6 }} aria-label="All accessibility features">
                  <thead style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                    <tr><th scope="col">Feature</th><th scope="col">Description</th><th scope="col">Status</th></tr>
                  </thead>
                  <tbody>
                    {otherFeatures.map((f) => (
                      <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "5px 8px 5px 0", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                          {f.type.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "5px 8px", fontSize: 12, color: "#555" }}>
                          {f.description}
                        </td>
                        <td style={{ padding: "5px 0", fontSize: 11, whiteSpace: "nowrap", fontWeight: 600,
                          color: f.status === "operational" ? "#22c55e" : f.status === "under_repair" ? "#f59e0b" : "#ef4444"
                        }}>
                          {f.status.replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
          {/* reportButton */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #eee" }}>
            <a
            href={`/report?location_id=${building.id}&location_name=${encodeURIComponent(building.name)}`}
            aria-label={`Report an issue at ${building.name}`}
            style={{
              display: "inline-block",
              padding: "6px 14px",
              background: "#3b82f6",
              color: "white",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,textDecoration: "none",
    }}          >
    Report an Issue
  </a>
</div>
          

        </div>
      </Popup>
    </Marker>
  );
}

// mapCompenent

export default function Map() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [accessFeatures, setAccessFeatures]     = useState([]);
  const [userPrefs, setUserPrefs]               = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [listView, setListView] = useState(false);
 
  useEffect(() => {
    async function fetchExtras() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
 
      const [featRes, prefRes] = await Promise.all([
        supabase.from("accessibility_features").select("*"),
        supabase
          .from("accessibility_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ]);
 
      if (featRes.data) setAccessFeatures(featRes.data);
      if (prefRes.data) setUserPrefs(prefRes.data);
    }
    fetchExtras();
  }, []);
 

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* sidebar */}
      <Sidebar
      onLocationSelect={(loc) => {
        setSelectedLocation(loc);
        
        if (loc?.lat && loc?.lng) setFlyTarget([loc.lat, loc.lng]);
      }}
      selectedLocationId={selectedLocation?.id}
      onLocationsLoaded={setLocations}
      />

      {/* mapPane */}
      <div className="am-map" style={{ position: "relative" }}>
        {/* controls */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "flex", gap: 6 }}>
          <button
            onClick={() => setListView((v) => !v)}
            aria-pressed={listView}
            style={{
              padding: "6px 12px",
              background: listView ? "#3b82f6" : "#fff",
              color: listView ? "#fff" : "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            {listView ? "Map View" : "List View"}
          </button>
          <button
            onClick={() => setShowLabels((v) => !v)}
            aria-label={showLabels ? "Hide building labels on map" : "Show building labels on map"}
            aria-pressed={showLabels}
            style={{
              padding: "6px 12px",
              background: showLabels ? "#3b82f6" : "#fff",
              color: showLabels ? "#fff" : "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            {showLabels ? "Hide Labels" : "Show Labels"}
          </button>
        </div>

        {listView ? (
          <div style={{ height: "100%", overflowY: "auto", padding: "50px 20px 20px" }} role="region" aria-label="Accessible list of locations">
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>All Locations</h2>
            {locations.length === 0 && <p>No locations found.</p>}
            {locations.map((b) => {
              const bFeatures = accessFeatures.filter((f) => String(f.location_id) === String(b.id));
              return (
                <div key={b.id} style={{
                  padding: "14px", marginBottom: "10px", border: "1px solid #ddd",
                  borderRadius: 8, background: "#fff"
                }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>
                    {b.name}
                    <span style={{
                      marginLeft: 8, fontSize: 12, fontWeight: 600,
                      color: b.status === "operational" ? "#22c55e" : b.status === "under_repair" ? "#f59e0b" : "#ef4444"
                    }}>
                      ({b.status ? b.status.replace(/_/g, " ") : "unknown"})
                    </span>
                  </h3>
                  {bFeatures.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#888" }}>No accessibility features listed.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label={`Accessibility features at ${b.name}`}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <th scope="col" style={{ textAlign: "left", padding: "4px 8px 4px 0", fontSize: 12, color: "#666" }}>Feature</th>
                          <th scope="col" style={{ textAlign: "left", padding: "4px 8px", fontSize: 12, color: "#666" }}>Description</th>
                          <th scope="col" style={{ textAlign: "left", padding: "4px 0", fontSize: 12, color: "#666" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bFeatures.map((f) => (
                          <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "5px 8px 5px 0", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                              {f.type?.replace(/_/g, " ")}
                            </td>
                            <td style={{ padding: "5px 8px", fontSize: 13, color: "#555" }}>
                              {f.description}
                            </td>
                            <td style={{ padding: "5px 0", fontSize: 12, fontWeight: 600,
                              color: f.status === "operational" ? "#22c55e" : f.status === "under_repair" ? "#f59e0b" : "#ef4444"
                            }}>
                              {f.status?.replace(/_/g, " ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <a
                    href={`/report?location_id=${b.id}&location_name=${encodeURIComponent(b.name)}`}
                    aria-label={`Report an issue at ${b.name}`}
                    style={{
                      display: "inline-block", marginTop: 8, padding: "5px 12px",
                      background: "#3b82f6", color: "white", borderRadius: 6,
                      fontSize: 12, fontWeight: 600, textDecoration: "none"
                    }}
                  >
                    Report an Issue
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <MapContainer
            center={[52.4508, -1.9305]}
            zoom={17}
            style={{ height: "100%", width: "100%" }}
            aria-label="Campus accessibility map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {locations.map((b) =>
              b.lat && b.lng ? (
                <BuildingMarker
                  key={b.id}
                  building={b}
                  accessFeatures={accessFeatures}
                  userPrefs={userPrefs}
                  showLabel={showLabels}
                />
              ) : null
            )}

            <FlyTo target={flyTarget} onDone={() => setFlyTarget(null)} />

          </MapContainer>
        )}
      </div>

    </div>
  );
}