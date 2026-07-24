import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError, getAccessToken, setAccessToken } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  describe('ApiError', () => {
    it('creates an error with status and message', () => {
      const err = new ApiError(404, 'Not found');
      expect(err.status).toBe(404);
      expect(err.message).toBe('Not found');
      expect(err.name).toBe('ApiError');
    });
  });

  describe('token management', () => {
    it('setAccessToken stores the token', () => {
      setAccessToken('my-token');
      expect(getAccessToken()).toBe('my-token');
    });

    it('setAccessToken(null) clears the token', () => {
      setAccessToken('my-token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('request methods', () => {
    it('api.get sends a GET request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', title: 'Test' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.get('/resumes/1');
      expect(result).toEqual({ id: '1', title: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/resumes/1',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('api.post sends a POST request with body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '2' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const body = { title: 'New Resume' };
      const result = await api.post('/resumes', body);
      expect(result).toEqual({ id: '2' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/resumes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
    });

    it('api.patch sends a PATCH request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.patch('/resumes/1', { title: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('api.del sends a DELETE request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.del('/resumes/1/sections/sec-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('api.get includes query parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/resumes', { status: 'DRAFT' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=DRAFT'),
        expect.any(Object),
      );
    });
  });

  describe('authorization header', () => {
    it('includes Authorization header when token is set', async () => {
      setAccessToken('my-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/resumes/1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });

    it('does not include Authorization header when token is null', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/resumes/1');
      const callArgs = mockFetch.mock.calls[0]?.[1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Resume not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/resumes/999')).rejects.toThrow(ApiError);
      await expect(api.get('/resumes/999')).rejects.toThrow('Resume not found');
    });

    it('throws ApiError with fallback message when body has no message', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/error')).rejects.toThrow('Request failed');
    });

    it('propagates network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/fail')).rejects.toThrow('Network error');
    });
  });

  describe('credentials', () => {
    it('sends credentials: include on all requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/resumes/1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' }),
      );
    });
  });

  describe('abort signal', () => {
    it('passes abort signal through', async () => {
      const abortController = new AbortController();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/resumes/1', {}, {}, { signal: abortController.signal });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: abortController.signal }),
      );
    });
  });
});
