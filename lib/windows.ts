/**
 * Centralized Window Lifecycle Management
 * Provides deterministic window state management with proper cleanup
 */

export type Win = {
  id: string;
  appId: string;
  title: string;
  state: "open" | "closing" | "closed";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zIndex: number;
  focused: boolean;
};

export type WindowAction =
  | { type: "OPEN"; appId: string; title: string; id?: string; bounds?: Partial<Win['bounds']> }
  | { type: "CLOSE"; id: string }
  | { type: "KILL"; id: string } // force cleanup
  | { type: "FOCUS"; id: string }
  | { type: "MINIMIZE"; id: string }
  | { type: "MAXIMIZE"; id: string }
  | { type: "RESTORE"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "RESIZE"; id: string; width: number; height: number }
  | { type: "SET_Z_INDEX"; id: string; zIndex: number };

export function windowsReducer(state: Win[], action: WindowAction): Win[] {
  switch (action.type) {
    case "OPEN":
      const newWindow: Win = {
        id: action.id ?? crypto.randomUUID(),
        appId: action.appId,
        title: action.title,
        state: "open",
        bounds: {
          x: action.bounds?.x ?? 100,
          y: action.bounds?.y ?? 100,
          width: action.bounds?.width ?? 800,
          height: action.bounds?.height ?? 600,
        },
        zIndex: state.length + 1,
        focused: true,
      };
      
      // Unfocus all other windows
      const unfocusedState = state.map(w => ({ ...w, focused: false }));
      return [...unfocusedState, newWindow];

    case "CLOSE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, state: "closing" as const }
          : w
      );

    case "KILL":
      return state.filter(w => w.id !== action.id);

    case "FOCUS":
      return state.map(w => ({
        ...w,
        focused: w.id === action.id,
        zIndex: w.id === action.id ? Math.max(...state.map(w => w.zIndex)) + 1 : w.zIndex
      }));

    case "MINIMIZE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, state: "minimized" as any } // Type assertion for compatibility
          : w
      );

    case "MAXIMIZE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, state: "maximized" as any, bounds: { ...w.bounds, x: 0, y: 0, width: window.innerWidth, height: window.innerHeight } }
          : w
      );

    case "RESTORE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, state: "open" as const }
          : w
      );

    case "MOVE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, bounds: { ...w.bounds, x: action.x, y: action.y } }
          : w
      );

    case "RESIZE":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, bounds: { ...w.bounds, width: action.width, height: action.height } }
          : w
      );

    case "SET_Z_INDEX":
      return state.map(w => 
        w.id === action.id 
          ? { ...w, zIndex: action.zIndex }
          : w
      );

    default:
      return state;
  }
}

/**
 * Generate a unique window ID
 */
export function generateWindowId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the next available z-index
 */
export function getNextZIndex(windows: Win[]): number {
  return windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) + 1 : 1;
}
