import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Report } from '../types/report';
import '../CssMap/MapWithPin.css';
import { useNavigate } from 'react-router-dom';
import { getRole, getToken } from '../../services/auth';
// @ts-ignore
import turinData from '../../data/turin_boundaries.json';

const TURIN_COORDINATES: [number, number] = [45.0703, 7.6600];

// Get Turin bounds from the actual boundary data
const getTurinBounds = () => {
  const cityBoundary = turinData?.find((item: any) => item.addresstype === 'city');
  if (cityBoundary?.boundingbox) {
    const [minLat, maxLat, minLon, maxLon] = cityBoundary.boundingbox.map(Number);
    return new LatLngBounds(
      [minLat, minLon],  // Southwest corner
      [maxLat, maxLon]   // Northeast corner
    );
  }
};

const TURIN_BOUNDS = getTurinBounds();

// Create mask data to dim area outside Turin
const getTurinMask = () => {
  const cityBoundary = turinData?.find((item: any) => item.addresstype === 'city');
  if (!cityBoundary?.geojson) return null;

  const geo = cityBoundary.geojson;
  
  // Larger bounding box covering area around Turin [Lon, Lat]
  const outerCoords = [
    [6.5, 46.6], // Top Left
    [9.3, 46.6], // Top Right
    [9.3, 44], // Bottom Right
    [6.5, 44], // Bottom Left
    [6.5, 46]  // Close the polygon
  ];

  let cityCoords: any[] = [];

  // Extract coordinates based on geometry type
  if (geo.type === 'Polygon') {
    cityCoords = (geo.coordinates as any)[0];
  } else if (geo.type === 'MultiPolygon') {
    // Take the main polygon (first one)
    cityCoords = (geo.coordinates as any)[0][0];
  }

  // Create mask: outer box with Turin boundary as a hole
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [outerCoords, cityCoords]
    }
  };
};

const createClusterIcon = (count: number) => {
  return L.divIcon({
    html: `<div class="cluster-marker">${count}</div>`,
    className: 'cluster-icon',
    // increase icon size for better visibility
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: '#8b5cf6',
  environment: '#10b981',
  safety: '#ef4444',
  sanitation: '#f59e0b',
  transport: '#3b82f6',
  other: '#6b7280',
};

const createSimpleIcon = (category?: string) => {
  const color = (category && CATEGORY_COLORS[category]) || '#6b7280';
  const html = `<div class="report-marker" style="background:${color}">📍</div>`;
  return L.divIcon({
    html,
    className: 'simple-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

const createPinIcon = () => {
  return L.divIcon({
    html: `<div class="pin-marker">📍</div>`,
    className: 'pin-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const createHighlightPinIcon = () => {
  return L.divIcon({
    html: `<div class="highlight-pin-marker">📍</div>`,
    className: 'highlight-pin-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Check if a point is within Turin's boundaries
const isPointInTurin = (lat: number, lng: number): boolean => {
  const cityBoundary = turinData?.find((item: any) => item.addresstype === 'city');
  if (!cityBoundary?.geojson) return false;

  const geo = cityBoundary.geojson;
  let coords: number[][][] = [];

  // Extract coordinates based on geometry type
  if (geo.type === 'Polygon') {
    return isPointInPolygon([lng, lat], geo.coordinates as any);
  } else if (geo.type === 'MultiPolygon') {
    // Check all polygons in the multipolygon
    for (const polygon of geo.coordinates as any) {
      if (isPointInPolygon([lng, lat], polygon)) {
        return true;
      }
    }
    return false;
  }

  return coords.length > 0 ? isPointInPolygon([lng, lat], coords) : false;
};

// Helper function to check if point is in polygon using ray casting algorithm
const isPointInPolygon = (point: number[], polygon: number[][][]): boolean => {
  const [x, y] = point;
  const ring = polygon[0]; // Use outer ring
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

function ClusteringLayer({ reports, selectedId }: { reports: Report[]; selectedId?: string | null }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const navigate = useNavigate();

  // pinned location created by user click
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null);

  // handle map clicks to add a pin
  useMapEvents({
    click(e) {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      // Check if the point is within Turin boundaries
      if (!isPointInTurin(p.lat, p.lng)) {
        L.popup()
          .setLatLng(e.latlng)
          .setContent('<div style="text-align: center; padding: 8px;"><strong>⚠️ Invalid Location</strong><br/>You have to choose a location within the city of Turin</div>')
          .openOn(map);
        return;
      }
      
      setPinned(p);
      try {
        localStorage.setItem('pendingReportLocation', JSON.stringify([p.lat, p.lng]));
      } catch (err) {}
    },
  });

  // restore pinned location from localStorage (so pin survives navigation)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pendingReportLocation');
      if (stored) {
        const [lat, lng] = JSON.parse(stored);
        if (typeof lat === 'number' && typeof lng === 'number') {
          setPinned({ lat, lng });
        }
      }
    } catch (err) {
      // ignore
    }
  }, []);

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    if (!selectedId) return;
    const found = reports.find((r) => r.id === selectedId);
    if (found) {
      map.flyTo([found.latitude, found.longitude], 17);
    }
  }, [selectedId, reports, map]);

  const [scIndex, setScIndex] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    // dynamic import ensures compatibility with ESM bundlers
    (async () => {
      try {
        const mod = await import('supercluster');
        const SuperclusterLib = (mod && (mod.default || mod));
        if (!SuperclusterLib) return;
        const points = reports.map((r) => ({
          type: 'Feature',
          properties: { reportId: r.id, title: r.title, category: r.category, status: r.status, description: r.description },
          geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        }));
        const sc = new SuperclusterLib({ radius: 90, maxZoom: 18 });
        sc.load(points);
        if (mounted) setScIndex(sc);
      } catch (e) {
        // ignore and keep scIndex null to use fallback
      }
    })();
    return () => { mounted = false; };
  }, [reports]);

  if (scIndex && zoom < 17) {
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const clusters = scIndex.getClusters(bbox, map.getZoom());

    return (
      <>
        {clusters.map((c: any, i: number) => {
          const [lng, lat] = c.geometry.coordinates;
          if (c.properties?.cluster) {
            const count = c.properties.point_count;
            return (
              <Marker key={`cluster-${c.id || c.properties?.cluster_id || c.properties?.id}`} position={[lat, lng]} icon={createClusterIcon(count)}>
                <Popup>
                  <div style={{ maxWidth: 300 }}>
                    <strong>{count} reports</strong>
                    <div style={{ marginTop: 8 }}><em>Zoom in to see individual reports.</em></div>
                  </div>
                </Popup>
              </Marker>
            );
          }

          const props = c.properties || {};
          const report = reports.find(r => r.id === props.reportId);
          const reporterName = (() => {
          if (report?.anonymity) {
            return 'Anonymous';
          }
          
          if (report?.author) {
            const firstName = report.author.firstName || '';
            const lastName = report.author.lastName || '';
            return `${firstName} ${lastName}`.trim();
          }
          
          return 'Unknown';
          })();
          return (
            <Marker key={`rep-${props.reportId || i}`} position={[lat, lng]} icon={createSimpleIcon(props.category)}>
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{props.title}</strong>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: 4 }}>
                    Reported by: {reporterName}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* render pinned marker if present */}
        {pinned && (getToken() == null || getRole()?.includes('citizen')) && (
          <Marker position={[pinned.lat, pinned.lng]} icon={createPinIcon()}>
            <Popup>
              <div style={{ maxWidth: 260 }}>
                {!getToken() ? (
                  <div>
                    <div>To submit a report please login</div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => navigate('/login')}>Login</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div>Ready to submit a report from this location?</div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => navigate('/submitReport', { state: { position: [pinned.lat, pinned.lng] } })}>Submit a report</button>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </>
    );
  }

  // FALLBACK: original grid clustering
      let precision: number;
    if (zoom <= 10) {
      precision = 1;
    } else if (zoom <= 12) {
      precision = 2;
    } else {
      precision = 3;
    }// tune precision for better grouping
  const mapClusters: Record<string, { sumLat: number; sumLng: number; count: number; items: Report[] }> = {};
  reports.forEach((r) => {
    const keyLat = Number(r.latitude).toFixed(precision);
    const keyLng = Number(r.longitude).toFixed(precision);
    const key = `${keyLat}:${keyLng}`;
    if (!mapClusters[key]) mapClusters[key] = { sumLat: 0, sumLng: 0, count: 0, items: [] };
    mapClusters[key].sumLat += r.latitude;
    mapClusters[key].sumLng += r.longitude;
    mapClusters[key].count += 1;
    mapClusters[key].items.push(r);
  });
  const clusters = Object.values(mapClusters).map((c) => ({
    lat: c.sumLat / c.count,
    lng: c.sumLng / c.count,
    items: c.items,
  }));

  return (
    <>
      {clusters.map((c, i) => {
        // At high zoom levels (17+), always show individual markers
        if (zoom >= 17) {
          return c.items.map((r) => {
            let reporterName: string;

            if (r.anonymity) {
              reporterName = 'Anonymous';
            } else if (r.author) {
              const firstName = r.author.firstName || '';
              const lastName = r.author.lastName || '';
              reporterName = `${firstName} ${lastName}`.trim();
            } else {
              reporterName = 'Unknown';
            }

            return (
              <Marker key={`rep-${r.id}`} position={[r.latitude, r.longitude]} icon={createSimpleIcon(r.category)}>
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <strong>{r.title}</strong>
                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: 4 }}>
                      Reported by: {reporterName}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          });
        }
        
        if (c.items.length === 1) {
          const r = c.items[0];
          let reporterName: string;

          if (r.anonymity) {
            reporterName = 'Anonymous';
          } else if (r.author) {
            const firstName = r.author.firstName || '';
            const lastName = r.author.lastName || '';
            reporterName = `${firstName} ${lastName}`.trim();
          } else {
            reporterName = 'Unknown';
          }
          return (
            <Marker key={`rep-${r.id}`} position={[r.latitude, r.longitude]} icon={createSimpleIcon(r.category)}>
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{r.title}</strong>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: 4 }}>
                    Reported by: {reporterName}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        // cluster marker (only at zoom < 17)
        return (
          <Marker key={`cluster-${i}`} position={[c.lat, c.lng]} icon={createClusterIcon(c.items.length)}>
            <Popup>
              <div style={{ maxWidth: 300 }}>
                <strong>{c.items.length} reports</strong>
                <ul>
                  {c.items.slice(0, 8).map((r) => (
                    <li key={r.id}><strong>{r.title}</strong> — {r.category} — {r.status}</li>
                  ))}
                </ul>
                {c.items.length > 8 && <div>…and {c.items.length - 8} more</div>}
                <div style={{ marginTop: 8 }}><em>Zoom in to see individual reports.</em></div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

interface MapClusterViewProps {
  reports: Report[];
  selectedId?: string | null;
  initialCenter?: [number, number] | null;
  initialZoom?: number | null;
  highlightLocation?: [number, number] | null;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const MapClusterView: React.FC<MapClusterViewProps> = ({ reports, selectedId, initialCenter, initialZoom, highlightLocation }) => {
  const center = initialCenter || TURIN_COORDINATES;
  const zoom = initialZoom || 13;
  
  // Get the city boundary for rendering
  const cityBoundary = turinData?.find((item: any) => item.addresstype === 'city');
  const maskData = getTurinMask();
  
  const maskStyle = {
    color: 'transparent',
    fillColor: '#001c50',
    fillOpacity: 0.2,
    interactive: false
  };
  
  const boundaryStyle = {
    color: '#0a2c6bff',
    weight: 3,
    opacity: 1,
    fillOpacity: 0,
    interactive: false
  };
  
  return (
    <div style={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={zoom}
        maxBounds={TURIN_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={13.2}
        maxZoom={20}
        style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {maskData && (
          <GeoJSON 
            key="turin-mask"
            data={maskData as any} 
            style={maskStyle}
          />
        )}
        {cityBoundary && (
          <GeoJSON 
            key={cityBoundary.osm_id} 
            data={cityBoundary.geojson as any} 
            style={boundaryStyle}
          />
        )}
        {initialCenter && initialZoom && <MapController center={initialCenter} zoom={initialZoom} />}
        <ClusteringLayer reports={reports} selectedId={selectedId} />
        {highlightLocation && (
          <Marker position={highlightLocation} icon={createHighlightPinIcon()}>
            <Popup>
              <strong>📍 Report Location</strong>
              <br />
              Coordinates: {highlightLocation[0].toFixed(4)}, {highlightLocation[1].toFixed(4)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapClusterView;
