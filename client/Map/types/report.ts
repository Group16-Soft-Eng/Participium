export interface Report {
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

export interface ReportData {
  title: string;
  description: string;
  category: string;
  photos: File[];
  latitude: number | null;
  longitude: number | null;
}

export type ReportCategory = 
  | 'infrastructure' 
  | 'environment' 
  | 'safety' 
  | 'sanitation' 
  | 'transport' 
  | 'other';

export const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'infrastructure', label: 'Infrastructure Issue' },
  { value: 'environment', label: 'Environmental Concern' },
  { value: 'safety', label: 'Safety Hazard' },
  { value: 'sanitation', label: 'Sanitation Problem' },
  { value: 'transport', label: 'Transport Issue' },
  { value: 'other', label: 'Other' },
];

export const STATUS_COLORS = {
  'pending': '#f59e0b', // Amber
  'in-progress': '#3b82f6', // Blue
  'resolved': '#10b981', // Green
};