/**
 * =============================================================================
 * UI SLICE - User Interface State Management
 * =============================================================================
 *
 * Manages global UI state like modals, notifications, theme, and loading states.
 *
 * INTERVIEW NOTES:
 * - UI state should be kept separate from data state
 * - This pattern allows for easy UI testing and state management
 * - Theme persistence can be handled via localStorage + system preference
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// =============================================================================
// TYPES
// =============================================================================

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
}

interface Modal {
  id: string;
  component: string; // Component name to render
  props?: Record<string, unknown>;
}

type Theme = 'light' | 'dark' | 'system';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface UIState {
  /** Current theme setting */
  theme: Theme;
  /** Resolved theme (light or dark) */
  resolvedTheme: 'light' | 'dark';
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Active notifications */
  notifications: Notification[];
  /** Open modals stack */
  modals: Modal[];
  /** Global loading overlay */
  globalLoading: boolean;
  /** Loading message */
  loadingMessage: string | null;
  /** Mobile menu open state */
  mobileMenuOpen: boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

const initialState: UIState = {
  theme: 'system',
  resolvedTheme: 'light',
  sidebarCollapsed: false,
  notifications: [],
  modals: [],
  globalLoading: false,
  loadingMessage: null,
  mobileMenuOpen: false,
};

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const uiSlice = createSlice({
  name: 'ui',
  initialState,

  reducers: {
    /**
     * Initialize UI state from persisted values
     */
    initializeUI: (state) => {
      const theme = getInitialTheme();
      state.theme = theme;
      state.resolvedTheme = resolveTheme(theme);
      state.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    },

    /**
     * Set theme and persist to localStorage
     */
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      state.resolvedTheme = resolveTheme(action.payload);
      localStorage.setItem('theme', action.payload);

      // Apply theme to document
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.resolvedTheme);
      }
    },

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },

    /**
     * Set sidebar collapsed state
     */
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', String(action.payload));
    },

    /**
     * Add a notification
     */
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        duration: action.payload.duration ?? 5000,
      };
      state.notifications.push(notification);
    },

    /**
     * Remove a notification by ID
     */
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    /**
     * Clear all notifications
     */
    clearNotifications: (state) => {
      state.notifications = [];
    },

    /**
     * Open a modal
     */
    openModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      state.modals.push(modal);
    },

    /**
     * Close the topmost modal
     */
    closeModal: (state) => {
      state.modals.pop();
    },

    /**
     * Close a specific modal by ID
     */
    closeModalById: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },

    /**
     * Close all modals
     */
    closeAllModals: (state) => {
      state.modals = [];
    },

    /**
     * Set global loading state
     */
    setGlobalLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
      state.globalLoading = action.payload.loading;
      state.loadingMessage = action.payload.message ?? null;
    },

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    /**
     * Set mobile menu state
     */
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectResolvedTheme = (state: RootState) => state.ui.resolvedTheme;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectModals = (state: RootState) => state.ui.modals;
export const selectTopModal = (state: RootState) => state.ui.modals[state.ui.modals.length - 1];
export const selectGlobalLoading = (state: RootState) => state.ui.globalLoading;
export const selectLoadingMessage = (state: RootState) => state.ui.loadingMessage;
export const selectMobileMenuOpen = (state: RootState) => state.ui.mobileMenuOpen;

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  initializeUI,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeModalById,
  closeAllModals,
  setGlobalLoading,
  toggleMobileMenu,
  setMobileMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
