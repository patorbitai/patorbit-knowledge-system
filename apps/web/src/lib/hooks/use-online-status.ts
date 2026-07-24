'use client';

import { useEffect } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';

export function useOnlineStatus(): void {
  useEffect(() => {
    const handleOnline = () => {
      const prev = useResumeStore.getState().syncStatus;
      if (prev === 'offline' || prev === 'pending-sync') {
        useResumeStore.getState().processOfflineQueue();
      }
      useResumeStore.setState({ isOffline: false, syncStatus: 'idle' });
    };

    const handleOffline = () => {
      const { pendingQueue } = useResumeStore.getState();
      const s = pendingQueue.length > 0 ? 'pending-sync' : 'offline';
      useResumeStore.setState({ isOffline: true, syncStatus: s });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
