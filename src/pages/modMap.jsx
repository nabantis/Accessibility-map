import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import "./Map.css";

async function insertBuilding(inputName, inputDesc, inputLat, inputLng, setLocations) {
  const { data, error } = await supabase
    .from("locations")
    .insert({ name: inputName, description: inputDesc, lat: inputLat, lng: inputLng })
    .select()
    .single();
  if (error) { alert("Failed to add building: " + error.message); return; }
  setLocations(prev => [...prev, data]);
}

async function deleteBuilding(bId, setLocations) {
  if (!window.confirm("Are you sure you want to delete this building?")) return;
  const { error } = await supabase.from("locations").delete().eq('id', bId);
  if (error) { alert("Failed to delete: " + error.message); return; }
  setLocations(prev => prev.filter(b => b.id !== bId));
}

function ContextMenuHandler({ setLocations }) {
  useMapEvents({
    contextmenu(e) {
      const { lat, lng } = e.latlng;
      let buildingName = prompt("Enter the name of the building:");
      if (!buildingName) return;
      let buildingDesc = prompt("Enter the building's description:");
      if (!buildingDesc) return;
      insertBuilding(buildingName, buildingDesc, lat, lng, setLocations);
    },
  });
  return null;
}

export default function ModMap() {
  const [locations, setLocations] = useState([]);
    // fetchLocations
  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase.from("locations").select("*");
      if (error) { console.error(error); return; }
      setLocations(data || []);
    }
    fetchLocations();
  }, []);

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
    }}>
      <MapContainer
        center={[52.4508, -1.9305]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <ContextMenuHandler setLocations={setLocations} />
        {locations.map((b) =>
          b.lat && b.lng ? (
            <Marker key={b.id} position={[b.lat, b.lng]}>
              <Popup>
                <b>{b.name}</b>
                <br />
                <button
                  style={{ backgroundColor: "red", color: "white", marginTop: 6, width: "100%" }}
                  onClick={() => deleteBuilding(b.id, setLocations)}
                >
                  Delete Building
                </button>
                <div>&nbsp;</div>
                <button
                  style={{ backgroundColor: "blue", color: "white", width: "100%" }}
                  onClick={() => alert("Edit features coming soon")}
                >
                  Edit Accessibility Features
                </button>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}