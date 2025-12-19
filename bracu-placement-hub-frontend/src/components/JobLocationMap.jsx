import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
// This ensures the marker icon displays correctly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/**
 * JobLocationMap Component
 *
 * Displays an interactive map showing the exact location of a job.
 * Uses OpenStreetMap tiles as the external API for map imagery.
 *
 * @param {Object} props - Component props
 * @param {number} props.latitude - Job location latitude
 * @param {number} props.longitude - Job location longitude
 * @param {string} props.company - Company name for popup
 * @param {string} props.jobTitle - Job title for popup
 */
function JobLocationMap({ latitude, longitude, company, jobTitle }) {
  // Validate coordinates
  if (!latitude || !longitude) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
        <p className="text-yellow-800">
          📍 Location coordinates not available for this job.
        </p>
      </div>
    );
  }

  const position = [latitude, longitude];

  console.log("🗺️ Leaflet is loading tiles from OpenStreetMap...");
  console.log(`Tile URL: https://tile.openstreetmap.org/{z}/{x}/{y}.png`);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* 
          TileLayer Component - This is where the EXTERNAL API integration happens!
          It fetches map image tiles from OpenStreetMap's tile server.
          
          How it works:
          1. Leaflet calculates which tiles are needed based on zoom level and position
          2. For each tile, it makes an HTTP GET request to OpenStreetMap
          3. Example request: https://a.tile.openstreetmap.org/13/6442/3867.png
          4. OpenStreetMap returns a PNG image of that map section
          5. Leaflet assembles all tiles into a complete map
          
          Attribution is required by OpenStreetMap's usage policy
        */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Marker shows the exact job location */}
        <Marker position={position}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-lg text-gray-800">{company}</p>
              <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
              <p className="text-xs text-gray-500 mt-2">
                📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default JobLocationMap;
