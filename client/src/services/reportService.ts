import api from './api';

export type ReportState = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface OfficerReport {
  id: number;
  title: string;
  description?: string;
  category?: string;
  anonymity?: boolean;
  author?: {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  date?: string;
  location?: { Coordinates: { latitude: number; longitude: number } };
  document?: {
    description?: string;
    photos?: string[];
  };
}

export async function getAssignedReports(): Promise<OfficerReport[]> {
  try {
    const res = await api.get<OfficerReport[]>('/officers/retrievedocs');
    return res.data;
  } catch (e) {
    console.error('Error fetching assigned reports:', e);
    return [];
  }
}

export async function reviewReport(id: number, approved: ReportState, reason?: string): Promise<boolean> {
  try {
    // Backend expects: { state: 'APPROVED' | 'DECLINED', reason?: string }
    const payload = {
      state: approved,
      reason: reason ?? undefined
    };

    await api.patch(`/officers/reviewdocs/${id}`, payload);
    return true;
  } catch (e) {
    console.error('Error reviewing report:', e);
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
