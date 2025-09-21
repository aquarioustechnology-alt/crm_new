"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLeadNotifications } from '@/hooks/useLeadNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  X, 
  RefreshCw, 
  CheckCircle,
  Bell,
  BellOff
} from 'lucide-react';

interface LeadNotificationPanelProps {
  className?: string;
}

export function LeadNotificationPanel({ className = '' }: LeadNotificationPanelProps) {
  const router = useRouter();
  
  // Safely get notification hook with error handling
  let notifications: any[] = [];
  let isLoading = false;
  let lastChecked: Date | null = null;
  let fetchNotifications = () => {};
  let markNotificationAsRead = () => {};
  let clearAllNotifications = () => {};
  let hasNotifications = false;
  
  try {
    const notificationHook = useLeadNotifications();
    notifications = notificationHook.notifications || [];
    isLoading = notificationHook.isLoading || false;
    lastChecked = notificationHook.lastChecked || null;
    fetchNotifications = notificationHook.fetchNotifications || (() => {});
    markNotificationAsRead = notificationHook.markNotificationAsRead || (() => {});
    clearAllNotifications = notificationHook.clearAllNotifications || (() => {});
    hasNotifications = notificationHook.hasNotifications || false;
  } catch (error) {
    console.warn('Lead notifications not available:', error);
  }

  const [isExpanded, setIsExpanded] = useState(false);

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    markNotificationAsRead(notification.leadId);
    
    // Navigate to the lead
    router.push(`/leads?leadId=${notification.leadId}&action=comment`);
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'first_comment':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'stale_followup':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'first_comment':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'stale_followup':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (!hasNotifications && !isLoading) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl"
      >
        {hasNotifications ? (
          <Bell className="w-5 h-5 text-amber-400" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        
        {hasNotifications && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-500 text-white border-0"
          >
            {notifications.length}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="absolute top-12 right-0 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Lead Notifications
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {lastChecked && (
              <p className="text-xs text-slate-400 mt-1">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Checking for notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All caught up! No notifications.</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.leadId}
                    className="p-3 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                          >
                            {notification.type === 'first_comment' ? 'First Comment' : 'Stale Follow-up'}
                          </Badge>
                          {notification.daysSince && (
                            <span className="text-xs text-slate-400">
                              {notification.daysSince} days
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white font-medium mb-1">
                          {notification.leadName}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-600">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="w-full text-xs text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                Clear all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
