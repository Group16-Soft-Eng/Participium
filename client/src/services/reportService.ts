import api from './api';

export type ReportState = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface OfficerReport {
  id: number;
  title: string;
  description?: string;
  category?: string;
  anonymity?: boolean;
  authorName?: string;
  date?: string;
  location?: { Coordinates: { latitude: number; longitude: number } };
}

// fallback mock data used when backend is not available
let MOCK_REPORTS: OfficerReport[] = [
  {
    id: 1,
    title: 'Pothole in Via Roma',
    description: 'Large pothole near crosswalk',
    category: 'Roads and Urban Furnishings',
    anonymity: false,
    authorName: 'Giulia Bianchi',
    date: new Date().toISOString(),
    location: { Coordinates: { latitude: 45.0705, longitude: 7.6860 } },
  },
  {
    id: 2,
    title: 'Streetlight not working',
    description: 'Lamppost off since last week',
    category: 'Public Lighting',
    anonymity: true,
    authorName: 'anonymous',
    date: new Date().toISOString(),
    location: { Coordinates: { latitude: 45.0710, longitude: 7.6870 } },
  },
];

export async function getAssignedReports(): Promise<OfficerReport[]> {
  try {
  const res = await api.get<OfficerReport[]>('/officers/retrievedocs');
    return res.data;
  } catch (e) {
    // return mock
    return MOCK_REPORTS;
  }
}

export async function reviewReport(id: number, approved: ReportState, reason?: string, assignedOffice?: string): Promise<boolean> {
  try {
    // Align payload to OpenAPI `ReportState` schema.
    // The spec expects an object like: { Report: { ... }, Approved: 'APPROVED'|'DECLINED'|'PENDING', Reason: string, Officer?: {...} }
    const payload: any = {
      Report: { id },
      Approved: approved,
      Reason: reason ?? '',
    };
    if (assignedOffice) {
      // Some backends expect Office/Officer information; include as Office field if provided.
      payload.Office = assignedOffice;
    }

    await api.patch(`/officers/reviewdocs/${id}`, payload);
    return true;
  } catch (e) {
    // update mock data in-memory
    const idx = MOCK_REPORTS.findIndex((r) => r.id === id);
    if (idx >= 0) {
      // remove from mock list to simulate it being processed
      MOCK_REPORTS.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export function getOfficeForCategory(category?: string) {
  if (!category) return 'Office 3';
  const c = category.toLowerCase();
  if (c.includes('light') || c.includes('public lighting')) return 'Office 2';
  if (c.includes('road') || c.includes('roads')) return 'Office 1';
  if (c.includes('green') || c.includes('park')) return 'Office 3';
  return 'Office 3';
}
