import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import * as queue from '@/lib/services/offline-queue';
import { type SaveQueueItem } from '@/lib/services/offline-queue';

import { mockResume } from '../../../tests/mocks/resume-data';
import { type ResumeStore, useResumeStore } from './use-resume-store';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/lib/services/offline-queue');

describe('useResumeStore', () => {
  const initialState = useResumeStore.getState();

  // Reset store to initial state before each test
  beforeEach(() => {
    useResumeStore.setState(initialState);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('loadResume', () => {
    it('should load resume successfully', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue(mockResume);

      await act(() => useResumeStore.getState().loadResume('res-1'));

      expect(getSpy).toHaveBeenCalledWith('/resumes/res-1');
      expect(useResumeStore.getState().resume).toEqual(mockResume);
      expect(useResumeStore.getState().isLoading).toBe(false);
    });

    it('should handle loading errors', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('Network error'));

      await act(() => useResumeStore.getState().loadResume('res-1'));

      expect(useResumeStore.getState().resume).toBeNull();
      expect(useResumeStore.getState().isLoading).toBe(false);
      expect(useResumeStore.getState().saveError).toContain('Failed to load');
    });

    it('should process offline queue after loading', async () => {
      vi.spyOn(api, 'get').mockResolvedValue(mockResume);
      const processQueueSpy = vi.spyOn(useResumeStore.getState(), 'processOfflineQueue');
      processQueueSpy.mockResolvedValue(); // prevent actual implementation

      await act(() => useResumeStore.getState().loadResume('res-1'));

      expect(processQueueSpy).toHaveBeenCalled();
    });
  });

  describe('updateSectionContent and flushSection', () => {
    beforeEach(() => {
      useResumeStore.setState({ resume: { ...mockResume } });
    });

    it('should update section content locally immediately', () => {
      const newContent = { summary: 'New summary' };
      act(() => {
        useResumeStore.getState().updateSectionContent('sec-1', newContent);
      });

      const updatedSection = useResumeStore
        .getState()
        .resume?.sections.find((s) => s.id === 'sec-1');
      expect(updatedSection?.content).toEqual(newContent);
    });

    it('should debounce the flushSection call', async () => {
      const flushSpy = vi.spyOn(useResumeStore.getState(), 'flushSection');

      act(() => {
        useResumeStore.getState().updateSectionContent('sec-1', { summary: 'a' });
        useResumeStore.getState().updateSectionContent('sec-1', { summary: 'b' });
      });

      expect(flushSpy).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });
      expect(flushSpy).toHaveBeenCalledOnce();
      expect(flushSpy).toHaveBeenCalledWith('sec-1');
    });

    it('flushSection should call api.patch', async () => {
      const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue({});
      act(() => {
        useResumeStore.getState().updateSectionContent('sec-1', { summary: 'final' });
      });

      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(patchSpy).toHaveBeenCalledWith('/resumes/res-1/sections/sec-1', {
        content: { summary: 'final' },
      });
      expect(useResumeStore.getState().syncStatus).toBe('saved');
    });

    it('should enqueue save if offline', async () => {
      useResumeStore.setState({ isOffline: true });
      const enqueueSpy = vi.spyOn(queue, 'enqueue').mockResolvedValue();

      act(() => {
        useResumeStore.getState().updateSectionContent('sec-1', { summary: 'offline update' });
      });

      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(enqueueSpy).toHaveBeenCalled();
      expect(useResumeStore.getState().pendingQueue).toHaveLength(1);
      expect(useResumeStore.getState().syncStatus).toBe('pending-sync');
    });

    it('should enqueue save if API call fails', async () => {
      vi.spyOn(api, 'patch').mockRejectedValue(new Error('API offline'));
      const enqueueSpy = vi.spyOn(queue, 'enqueue').mockResolvedValue();

      act(() => {
        useResumeStore.getState().updateSectionContent('sec-1', { summary: 'API fail update' });
      });

      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(enqueueSpy).toHaveBeenCalled();
      expect(useResumeStore.getState().pendingQueue).toHaveLength(1);
      expect(useResumeStore.getState().syncStatus).toBe('pending-sync');
      expect(useResumeStore.getState().message?.type).toBe('error');
    });
  });

  describe('processOfflineQueue', () => {
    const item1: SaveQueueItem = {
      id: 'q1',
      type: 'section',
      resumeId: 'res-1',
      sectionId: 'sec-1',
      payload: { content: { text: 'a' } },
      timestamp: 1,
    };
    const item2: SaveQueueItem = {
      id: 'q2',
      type: 'title',
      resumeId: 'res-1',
      payload: { title: 'b' },
      timestamp: 2,
    };

    beforeEach(() => {
      vi.spyOn(queue, 'getAll').mockResolvedValue([item1, item2]);
      vi.spyOn(queue, 'dequeue').mockResolvedValue();
      vi.spyOn(queue, 'clearAll').mockResolvedValue();
      useResumeStore.setState({ isOffline: true });
    });

    it('should do nothing if online', async () => {
      useResumeStore.setState({ isOffline: false });
      const getAllSpy = vi.spyOn(queue, 'getAll');
      await act(() => useResumeStore.getState().processOfflineQueue());
      expect(getAllSpy).not.toHaveBeenCalled();
    });

    it('should process all items and call API', async () => {
      const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue({});

      await act(() => useResumeStore.getState().processOfflineQueue());

      expect(patchSpy).toHaveBeenCalledTimes(2);
      expect(patchSpy).toHaveBeenCalledWith('/resumes/res-1/sections/sec-1', {
        content: { text: 'a' },
      });
      expect(patchSpy).toHaveBeenCalledWith('/resumes/res-1', { title: 'b' });
      expect(useResumeStore.getState().pendingQueue).toHaveLength(0);
      expect(useResumeStore.getState().syncStatus).toBe('saved');
    });

    it('should stop processing on first API error', async () => {
      const patchSpy = vi.spyOn(api, 'patch').mockRejectedValueOnce(new Error('Failed!'));
      const dequeueSpy = vi.spyOn(queue, 'dequeue');

      await act(() => useResumeStore.getState().processOfflineQueue());

      expect(patchSpy).toHaveBeenCalledOnce();
      expect(dequeueSpy).not.toHaveBeenCalled();
      expect(useResumeStore.getState().syncStatus).toBe('error');
    });
  });

  describe('reset', () => {
    it('should clear all state back to initial values', () => {
      useResumeStore.setState({
        resume: mockResume,
        isLoading: true,
        saveError: 'An error',
      });

      act(() => {
        useResumeStore.getState().reset();
      });

      const state = useResumeStore.getState();
      expect(state.resume).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.saveError).toBeNull();
    });
  });
});
