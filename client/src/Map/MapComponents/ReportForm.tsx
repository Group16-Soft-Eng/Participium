import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MapWithPin from './MapWithPin';
import PhotoUpload from './PhotoUpload';
import { createReport } from '../mapApi/mapApi';
import { CATEGORIES } from '../types/report';
import type { ReportData } from '../types/report';
import '../CssMap/ReportForm.css';

const ReportForm: React.FC = () => {
  const [report, setReport] = useState<ReportData>({
    title: '',
    description: '',
    category: '',
    photos: [],
    latitude: null,
    longitude: null,
  });

  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    category: false,
    photos: false,
    location: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // If navigation brought a position via location.state, prefill the location
  const location = useLocation();
  useEffect(() => {
    // expect state.position = [lat, lng]
    if (location && (location as any).state && (location as any).state.position) {
      const pos = (location as any).state.position as [number, number];
      if (pos && pos.length === 2) {
        handleLocationSelect(pos[0], pos[1]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      await createReport(report);
      alert('Report submitted successfully!');

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
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      <div className="navigation-header">
        <Link to="/map" className="back-button">
          ← Back to Map
        </Link>
        <div className="header-content">
          <h1 className="report-title">🏛️ Turin Citizen Reports</h1>
          <p className="report-subtitle">
            Submit a new report to help improve Turin
          </p>
        </div>
        <div className="header-spacer"></div>
      </div>
      
      <div className="report-layout">
        <div>
          <div className="map-section">
            <h3 className="map-section-title">🗺️ Select Report Location</h3>
            <MapWithPin 
              onLocationSelect={handleLocationSelect}
              initialPosition={selectedLocation || undefined}
              reports={[]}
              selectedPosition={selectedLocation}
            />
          </div>
        </div>

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
                  className={`form-input ${!isFieldValid('title') ? 'form-input-error' : ''}`}
                  placeholder="e.g., Broken sidewalk on Via Roma"
                />
                {!isFieldValid('title') && (
                  <p className="form-error">Please provide a title for your report</p>
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
                  className={`form-input ${!isFieldValid('category') ? 'form-input-error' : ''}`}
                >
                  <option value="">Select the issue type</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {!isFieldValid('category') && (
                  <p className="form-error">Please select a category</p>
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
                  rows={4}
                  className={`form-input ${!isFieldValid('description') ? 'form-input-error' : ''}`}
                  placeholder="Please provide detailed information about the issue..."
                />
                {!isFieldValid('description') && (
                  <p className="form-error">Please provide a detailed description</p>
                )}
              </div>

              <div className="form-group">
                <PhotoUpload
                  photos={report.photos}
                  onPhotosChange={handlePhotosChange}
                  maxPhotos={3}
                />
              </div>

              <div className="location-status">
                <h4 className="location-status-title">Location *</h4>
                {report.latitude && report.longitude ? (
                  <div className="location-selected">
                    <strong>✅ Location Selected</strong><br />
                    Latitude: {report.latitude.toFixed(6)}<br />
                    Longitude: {report.longitude.toFixed(6)}<br />
                    <small>Click on the map to change location</small>
                  </div>
                ) : (
                  <div className="location-not-selected">
                    <strong>⚠️ No Location Selected</strong><br />
                    <small>Click on the map to the left to select a location in Turin</small>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!validateForm() || isLoading}
                className="submit-btn"
              >
                {isLoading ? '⏳ Submitting...' : validateForm() ? '🚀 Submit New Report' : 'Complete All Fields'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
