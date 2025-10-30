// client/src/components/layout/NotificationBell.tsx
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';

import { getNotifications, markAllNotificationsAsRead, API_BASE_URL } from '@/lib/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationBell() {
  const { isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const memoizedInvalidate = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const eventSource = new EventSource(`${API_BASE_URL}/notifications/stream?token=${token}`);

    eventSource.addEventListener('new_notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        toast.info("New Notification", { description: data.message });
        memoizedInvalidate();
      } catch (e) {
        console.error("Failed to parse notification event", e);
      }
    });
    
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated, token, memoizedInvalidate]);
  
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
             <div className="p-4 space-y-4">
                <div className="flex items-start gap-3"><Skeleton className="h-2 w-2 rounded-full mt-1.5" /><div className='space-y-2 flex-1'><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/3" /></div></div>
                <div className="flex items-start gap-3"><Skeleton className="h-2 w-2 rounded-full mt-1.5" /><div className='space-y-2 flex-1'><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/3" /></div></div>
                <div className="flex items-start gap-3"><Skeleton className="h-2 w-2 rounded-full mt-1.5" /><div className='space-y-2 flex-1'><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/2" /></div></div>
             </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map(notification => (
              <Link
                key={notification.id}
                to={notification.link || '#'}
                className="block p-3 border-b last:border-b-0 hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-start gap-3">
                  {!notification.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  <div className={cn("flex-1", notification.isRead && "pl-5")}>
                    <p className="text-sm leading-relaxed">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You have no notifications.
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}