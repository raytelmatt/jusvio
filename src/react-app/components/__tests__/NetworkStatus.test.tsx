import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NetworkStatus from '../NetworkStatus';

describe('NetworkStatus', () => {
  let onlineEventListeners: ((event: Event) => void)[] = [];
  let offlineEventListeners: ((event: Event) => void)[] = [];
  let originalNavigator: typeof window.navigator;

  beforeEach(() => {
    onlineEventListeners = [];
    offlineEventListeners = [];

    // Save original navigator
    originalNavigator = window.navigator;

    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: EventListener) => {
      if (event === 'online') {
        onlineEventListeners.push(handler as (event: Event) => void);
      } else if (event === 'offline') {
        offlineEventListeners.push(handler as (event: Event) => void);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event: string, handler: EventListener) => {
      if (event === 'online') {
        onlineEventListeners = onlineEventListeners.filter(h => h !== handler);
      } else if (event === 'offline') {
        offlineEventListeners = offlineEventListeners.filter(h => h !== handler);
      }
    });

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: originalNavigator,
    });
  });

  it('should not display anything when online', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    render(<NetworkStatus />);

    // Should not show any network status message when online
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reconnected/i)).not.toBeInTheDocument();
  });

  it('should display offline message when offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<NetworkStatus />);

    // Trigger offline event
    offlineEventListeners.forEach(listener => listener(new Event('offline')));

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  it('should display reconnected message when coming back online', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<NetworkStatus />);

    // Go offline first
    offlineEventListeners.forEach(listener => listener(new Event('offline')));

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Come back online
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    onlineEventListeners.forEach(listener => listener(new Event('online')));

    await waitFor(() => {
      expect(screen.getByText(/reconnected/i)).toBeInTheDocument();
    });
  });

  it('should register event listeners on mount', () => {
    render(<NetworkStatus />);

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = render(<NetworkStatus />);

    const onlineHandler = onlineEventListeners[0];
    const offlineHandler = offlineEventListeners[0];

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', onlineHandler);
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', offlineHandler);
  });

  it('should handle multiple offline/online transitions', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    render(<NetworkStatus />);

    // Go offline
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });
    offlineEventListeners.forEach(listener => listener(new Event('offline')));

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Come back online
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    onlineEventListeners.forEach(listener => listener(new Event('online')));

    await waitFor(() => {
      expect(screen.getByText(/reconnected/i)).toBeInTheDocument();
    });

    // Go offline again
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });
    offlineEventListeners.forEach(listener => listener(new Event('offline')));

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });
});
