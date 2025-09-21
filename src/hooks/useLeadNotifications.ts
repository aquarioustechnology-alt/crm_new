"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast-notification';

interface LeadNotification {
  type: 'first_comment' | 'stale_followup';
  leadId: string;
  leadName: string;
  message: string;
  actionUrl?: string;
  daysSince?: number;
}

interface NotificationResponse {
  notifications: LeadNotification[];
  total: number;
}

export function useLeadNotifications() {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  // Safely get toast functions with error handling
  let showInfo: (title: string, description?: string) => void = () => {};
  let showWarning: (title: string, description?: string) => void = () => {};
  
  try {
    const toast = useToast();
    showInfo = toast?.showInfo || (() => {});
    showWarning = toast?.showWarning || (() => {});
  } catch (error) {
    console.warn('Toast context not available:', error);
  }

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/lead-nudges');
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.notifications);
        setLastChecked(new Date());
        
        // Show notifications as toasts
        data.notifications.forEach((notification, index) => {
          setTimeout(() => {
            const toastType = notification.type === 'first_comment' ? 'info' : 'warning';
            const toastTitle = notification.type === 'first_comment' 
              ? '💬 Time to add a comment!' 
              : '⏰ Lead needs attention';
            
            if (toastType === 'info') {
              showInfo(toastTitle, notification.message);
            } else {
              showWarning(toastTitle, notification.message);
            }
          }, index * 2000); // Stagger notifications by 2 seconds
        });
      }
    } catch (error) {
      console.error('Error fetching lead notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showInfo, showWarning]);

  const markNotificationAsRead = useCallback((leadId: string) => {
    setNotifications(prev => prev.filter(n => n.leadId !== leadId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-fetch notifications when the hook is first used
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    lastChecked,
    fetchNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    hasNotifications: notifications.length > 0
  };
}
