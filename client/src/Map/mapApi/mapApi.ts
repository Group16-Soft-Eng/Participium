import { getToken } from '../../services/auth';
import type { Report, ReportData } from '../types/report';

const URI = 'http://localhost:5000/api/v1';

// CREATE NEW REPORT
async function createReport(reportData: ReportData): Promise<Report> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', reportData.title);
    formData.append('description', reportData.description);
    formData.append('category', reportData.category);
    
    if (reportData.latitude !== null) {
        formData.append('latitude', reportData.latitude.toString());
    }
    if (reportData.longitude !== null) {
        formData.append('longitude', reportData.longitude.toString());
    }

    // Add photos (1-3 files)
    reportData.photos.forEach((photo) => {
        formData.append('photos', photo);
    });

    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(URI + `/reports`, {
        method: 'POST',
        headers: headers,
        body: formData
    });

    if (response.ok) {
        const report = await response.json();
        return report;
    } else {
        const err = await response.text();
        throw err;
    }
}

// GET ALL REPORTS
async function getAllReports(): Promise<Report[]> {
    
    const token = getToken();

    
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(URI + `/reports`, {
        method: 'GET',
        headers: headers,
    });

    if (response.ok) {
        const reports = await response.json();
        return reports;
    } else {
        const err = await response.text();
        throw err;
    }
}

export { createReport, getAllReports };