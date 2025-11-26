import api from './api';

export type ReportState = 'PENDING' | 'APPROVED' | 'DECLINED' | 'IN_PROGRESS' | 'SUSPENDED' | 'RESOLVED';

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
  state?: ReportState;
  assignedOfficerId?: number;
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

export async function getMyAssignedReports(): Promise<OfficerReport[]> {
  try {
    const res = await api.get<OfficerReport[]>('/officers/assigned');
    return res.data;
  } catch (e) {
    console.error('Error fetching my assigned reports:', e);
    return [];
  }
}

export async function reviewReport(
  id: number, 
  approved: ReportState, 
  reason?: string,
  reportDetails?: { title: string; authorId?: number; authorUsername?: string },
  officerMessage?: string
): Promise<boolean> {
  try {
    // Backend expects: { state: 'APPROVED' | 'DECLINED', reason?: string }
    const payload = {
      state: approved,
      reason: reason ?? undefined
    };

    await api.patch(`/officers/reviewdocs/${id}`, payload);
    
    // Store notification in localStorage for the report author
    if (reportDetails?.authorId) {
      let notification;
      
      if (approved === 'APPROVED') {
        notification = {
          id: `${Date.now()}_${id}`,
          userId: reportDetails.authorId,
          reportId: id,
          reportTitle: reportDetails.title,
          message: `Your report "${reportDetails.title}" has been approved by an officer.`,
          type: 'success' as const,
          timestamp: Date.now(),
          read: false
        };
        
        // If officer included a message, store it separately
        if (officerMessage) {
          const messageData = {
            id: `msg_${Date.now()}_${id}`,
            userId: reportDetails.authorId,
            reportId: id,
            reportTitle: reportDetails.title,
            from: 'officer',
            message: officerMessage,
            timestamp: Date.now(),
            read: false
          };
          
          const messagesStr = localStorage.getItem('participium_messages');
          const messages = messagesStr ? JSON.parse(messagesStr) : [];
          messages.push(messageData);
          localStorage.setItem('participium_messages', JSON.stringify(messages));
        }
      } else if (approved === 'DECLINED') {
        notification = {
          id: `${Date.now()}_${id}`,
          userId: reportDetails.authorId,
          reportId: id,
          reportTitle: reportDetails.title,
          message: `Your report "${reportDetails.title}" has been rejected. Reason: ${reason || 'No reason provided'}`,
          type: 'error' as const,
          timestamp: Date.now(),
          read: false
        };
      }
      
      if (notification) {
        // Get existing notifications
        const stored = localStorage.getItem('participium_pending_notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.push(notification);
        localStorage.setItem('participium_pending_notifications', JSON.stringify(notifications));
      }
    }
    
    return true;
  } catch (e) {
    console.error('Error reviewing report:', e);
    return false;
  }
}

export async function updateReportStatus(reportId: number, status: ReportState): Promise<boolean> {
  try {
    await api.patch(`/officers/reviewdocs/${reportId}`, { state: status });
    return true;
  } catch (e) {
    console.error('Error updating report status:', e);
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
