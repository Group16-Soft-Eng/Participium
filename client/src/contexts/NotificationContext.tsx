import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AlertColor } from '@mui/material';
import { getUserIdFromToken } from '../services/auth';

interface Notification {
  id: string;
  message: string;
  type: AlertColor;
  timestamp: number;
  read?: boolean;
}

interface NotificationContextType {
  addNotification: (message: string, type?: AlertColor) => void;
  allNotifications: Notification[];
  unreadCount: number;
  checkPendingNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Load all notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('participium_all_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAllNotifications(parsed);
      } catch (e) {
        console.error('Error parsing stored notifications:', e);
      }
    }
    
    // Check for pending notifications on mount
    checkPendingNotifications();
  }, []);

  // Save all notifications to localStorage whenever they change
  useEffect(() => {
    if (allNotifications.length > 0) {
      localStorage.setItem('participium_all_notifications', JSON.stringify(allNotifications));
    } else {
      localStorage.removeItem('participium_all_notifications');
    }
  }, [allNotifications]);

  const checkPendingNotifications = () => {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken(token);
    
    if (!userId) return;
    
    // Check for pending notifications for this user
    const pendingStr = localStorage.getItem('participium_pending_notifications');
    if (!pendingStr) return;
    
    try {
      const pending = JSON.parse(pendingStr);
      // Only get notifications that haven't been processed yet
      const userNotifications = pending.filter((n: any) => n.userId === userId && !n.processed);
      
      if (userNotifications.length > 0) {
        // Add these notifications to the queue
        const newNotifications = userNotifications.map((n: any) => ({
          id: n.id,
          message: n.message,
          type: n.type,
          timestamp: n.timestamp,
          read: false
        }));
        
        setAllNotifications(prev => [...newNotifications, ...prev]);
        
        // Mark as processed so they don't show again
        const updated = pending.map((n: any) => 
          n.userId === userId && !n.processed ? { ...n, processed: true } : n
        );
        localStorage.setItem('participium_pending_notifications', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Error checking pending notifications:', e);
    }
  };

  const addNotification = (message: string, type: AlertColor = 'success') => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    setAllNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setAllNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      allNotifications,
      unreadCount,
      checkPendingNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
