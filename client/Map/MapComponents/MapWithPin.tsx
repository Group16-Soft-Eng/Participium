import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../CssMap/MapWithPin.css';
import type { Report } from '../types/report';

const TURIN_COORDINATES: [number, number] = [45.0703, 7.6869];

const createCustomIcon = (status: 'pending' | 'in-progress' | 'resolved' = 'pending') => {
  const statusEmojis = {
    'pending': '📍',
    'in-progress': '📌',
    'resolved': '✅',
  };

  return L.divIcon({
    html: `<div class="emoji-marker">${statusEmojis[status]}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapWithPinProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
  reports: Report[];
  selectedPosition?: [number, number] | null;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);

  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSelect(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="location-popup">
          <strong>📍 Selected Location</strong><br />
          Latitude: {position.lat.toFixed(6)}<br />
          Longitude: {position.lng.toFixed(6)}<br />
          <em>Fill out the form to complete your report</em>
        </div>
      </Popup>
    </Marker>
  );
}

const MapWithPin: React.FC<MapWithPinProps> = ({ 
  onLocationSelect, 
  initialPosition = TURIN_COORDINATES,
  reports = [],
  selectedPosition
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        center={selectedPosition || initialPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker onLocationSelect={onLocationSelect} />
        
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.status)}
          >
            <Popup>
              <div className="report-popup">
                <div className="report-popup-header">
                  <h3 className="report-popup-title">{report.title}</h3>
                  <span className={`report-popup-category category-${report.category}`}>
                    {report.category}
                  </span>
                </div>

                <div className="report-popup-status-container">
                  <span className={`report-popup-status status-${report.status.replace('-', '')}`}>
                    {report.status.replace('-', ' ')}
                  </span>
                </div>

                <div className="report-popup-description">
                  <p>{report.description}</p>
                </div>

                {report.photos.length > 0 && (
                  <div className="report-popup-photos">
                    <strong>Photos:</strong>
                    <div className="photos-grid">
                      {report.photos.slice(0, 3).map((photo, index) => (
                        <img
                          key={index}
                          src={URL.createObjectURL(photo)}
                          alt={`${report.title} - Photo ${index + 1}`}
                          className="photo-thumbnail"
                        />
                      ))}
                    </div>
                    {report.photos.length > 3 && (
                      <div className="photos-count">
                        +{report.photos.length - 3} more photos
                      </div>
                    )}
                  </div>
                )}

                <div className="report-popup-footer">
                  <div className="popup-location">
                    <strong>Location:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </div>
                  <div className="popup-date">
                    <strong>Submitted:</strong> {formatDate(report.createdAt)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedPosition && (
          <Marker position={selectedPosition} icon={createCustomIcon('pending')}>
            <Popup>
              <div className="location-popup">
                <strong>📍 New Report Location</strong><br />
                Latitude: {selectedPosition[0].toFixed(6)}<br />
                Longitude: {selectedPosition[1].toFixed(6)}<br />
                <em>Complete the form to submit this report</em>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="map-overview">
        <strong>🗺️ Map Overview:</strong> 
        <span className="overview-stats">
          {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
          {reports.length > 0 && (
            <>
              {' • '}
              <span className="stat-pending">{reports.filter(r => r.status === 'pending').length} pending</span>
              {' • '}
              <span className="stat-in-progress">{reports.filter(r => r.status === 'in-progress').length} in progress</span>
              {' • '}
              <span className="stat-resolved">{reports.filter(r => r.status === 'resolved').length} resolved</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default MapWithPin;