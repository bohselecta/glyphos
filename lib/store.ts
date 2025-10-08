/**
 * Zustand Store for Window Management
 * Uses the centralized window reducer for deterministic state management
 */

import { create } from "zustand";
import { windowsReducer, type Win, type WindowAction } from "./windows";

interface WindowStore {
  windows: Win[];
  dispatch: (action: WindowAction) => void;
  zOrder: string[];
  
  // Helper methods
  getWindow: (id: string) => Win | undefined;
  getActiveWindow: () => Win | undefined;
  getVisibleWindows: () => Win[];
  isWindowOpen: (id: string) => boolean;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  zOrder: [],
  
  dispatch: (action) => {
    set((state) => {
      const newWindows = windowsReducer(state.windows, action);
      
      // Update z-order based on window state
      const newZOrder = newWindows
        .filter(w => w.state === "open")
        .sort((a, b) => b.zIndex - a.zIndex)
        .map(w => w.id);
      
      return { 
        windows: newWindows,
        zOrder: newZOrder
      };
    });
  },
  
  getWindow: (id: string) => {
    return get().windows.find(w => w.id === id);
  },
  
  getActiveWindow: () => {
    return get().windows.find(w => w.focused && w.state === "open");
  },
  
  getVisibleWindows: () => {
    return get().windows.filter(w => w.state === "open");
  },
  
  isWindowOpen: (id: string) => {
    const window = get().windows.find(w => w.id === id);
    return window?.state === "open" || false;
  },
}));

// Export types for use in components
export type { Win, WindowAction } from "./windows";
