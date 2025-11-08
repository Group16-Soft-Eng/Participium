import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MapWithPin from './MapWithPin';
import PhotoUpload from './PhotoUpload';
import '../CssMap/ReportForm.css';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  photos: File[];
  latitude: number;
  longitude: number;
  createdAt: Date;
  status: 'pending' | 'in-progress' | 'resolved';
}

interface ReportData {
  title: string;
  description: string;
  category: string;
  photos: File[];
  latitude: number | null;
  longitude: number | null;
}

const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure Issue' },
  { value: 'environment', label: 'Environmental Concern' },
  { value: 'safety', label: 'Safety Hazard' },
  { value: 'sanitation', label: 'Sanitation Problem' },
  { value: 'transport', label: 'Transport Issue' },
  { value: 'other', label: 'Other' },
] as const;

const ReportForm: React.FC = () => {
  const [report, setReport] = useState<ReportData>({
    title: '',
    description: '',
    category: '',
    photos: [],
    latitude: null,
    longitude: null,
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    category: false,
    photos: false,
    location: false,
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setReport(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setSelectedLocation([lat, lng]);
    setTouched(prev => ({ ...prev, location: true }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setReport(prev => ({
      ...prev,
      [name]: value,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handlePhotosChange = (photos: File[]) => {
    setReport(prev => ({
      ...prev,
      photos,
    }));
    setTouched(prev => ({ ...prev, photos: true }));
  };

  const validateForm = (): boolean => {
    return (
      report.title.trim() !== '' &&
      report.description.trim() !== '' &&
      report.category !== '' &&
      report.photos.length >= 1 &&
      report.photos.length <= 3 &&
      report.latitude !== null &&
      report.longitude !== null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTouched({
        title: true,
        description: true,
        category: true,
        photos: true,
        location: true,
      });
      alert('Please fill in all required fields and select a location');
      return;
    }

    // Create new report and add to local state (no API calls)
    const newReport: Report = {
      id: Date.now().toString(),
      title: report.title,
      description: report.description,
      category: report.category,
      photos: [...report.photos],
      latitude: report.latitude!,
      longitude: report.longitude!,
      createdAt: new Date(),
      status: 'pending' // All new reports start as pending
    };

    // Add to local reports array
    setReports(prev => [...prev, newReport]);

    console.log('Report submitted locally:', newReport);
    alert(`Report submitted successfully! ${reports.length + 1} total reports on map.`);

    // Reset form
    setReport({
      title: '',
      description: '',
      category: '',
      photos: [],
      latitude: null,
      longitude: null,
    });
    setSelectedLocation(null);
    setTouched({
      title: false,
      description: false,
      category: false,
      photos: false,
      location: false,
    });
  };

  const isFieldValid = (fieldName: keyof typeof touched) => {
    if (!touched[fieldName]) return true;
    
    switch (fieldName) {
      case 'title':
        return report.title.trim() !== '';
      case 'description':
        return report.description.trim() !== '';
      case 'category':
        return report.category !== '';
      case 'photos':
        return report.photos.length >= 1 && report.photos.length <= 3;
      case 'location':
        return report.latitude !== null && report.longitude !== null;
      default:
        return true;
    }
  };

  return (
    <div className="report-form-container">
      {/* Navigation Header */}
      <div className="navigation-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <div className="header-content">
          <h1 className="report-title">🏛️ Turin Citizen Reports</h1>
          <p className="report-subtitle">
            Submit a new report to help improve Turin
          </p>
        </div>
        <div className="header-spacer"></div> {/* For flexbox spacing */}
      </div>
      
      <div className="report-layout">
        {/* Left Column - Map */}
        <div>
          <div className="map-section">
            <h3 className="map-section-title">🗺️ Turin Reports Map</h3>
            <MapWithPin 
              onLocationSelect={handleLocationSelect}
              initialPosition={selectedLocation || undefined}
              reports={reports}
              selectedPosition={selectedLocation}
            />
          </div>
        </div>

        {/* Right Column - Form */}
        <div>
          <div className="form-section">
            <h3 className="form-title">📝 Submit New Report</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Report Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={report.title}
                  onChange={handleInputChange}
                  required
                  className={`form-input ${!isFieldValid('title') ? 'form-input-error' : ''}`}
                  placeholder="e.g., Broken sidewalk on Via Roma"
                />
                {!isFieldValid('title') && (
                  <p className="form-error">
                    Please provide a title for your report
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Issue Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={report.category}
                  onChange={handleInputChange}
                  required
                  className={`form-input form-select ${!isFieldValid('category') ? 'form-input-error' : ''}`}
                >
                  <option value="">Select the issue type</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {!isFieldValid('category') && (
                  <p className="form-error">
                    Please select a category
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={report.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className={`form-input form-textarea ${!isFieldValid('description') ? 'form-input-error' : ''}`}
                  placeholder="Please provide detailed information about the issue..."
                />
                {!isFieldValid('description') && (
                  <p className="form-error">
                    Please provide a detailed description
                  </p>
                )}
              </div>

              <div className="form-group">
                <h4 className="form-label">
                  Photos (1-3 required) *
                </h4>
                <PhotoUpload
                  photos={report.photos}
                  onPhotosChange={handlePhotosChange}
                  maxPhotos={3}
                />
              </div>

              <div className="location-status">
                <h4 className="location-status-title">
                  Location *
                </h4>
                {report.latitude && report.longitude ? (
                  <div className="location-selected">
                    <strong>✅ Location Selected</strong><br />
                    Latitude: {report.latitude.toFixed(6)}<br />
                    Longitude: {report.longitude.toFixed(6)}<br />
                    <small>
                      Click on the map to change location
                    </small>
                  </div>
                ) : (
                  <div className="location-not-selected">
                    <strong>⚠️ No Location Selected</strong><br />
                    <small>
                      Click on the map to the left to select a location in Turin
                    </small>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!validateForm()}
                className="submit-btn"
                style={{
                  backgroundColor: validateForm() ? '#dc2626' : '#9ca3af',
                  cursor: validateForm() ? 'pointer' : 'not-allowed'
                }}
              >
                {validateForm() ? '🚀 Submit New Report' : 'Complete All Fields'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;