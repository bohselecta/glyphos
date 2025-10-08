/**
 * Window Management Integration Example
 * Shows how to use the new deterministic window lifecycle
 */

import { useWindowStore } from './lib/store';
import { generateWindowId } from './lib/windows';

// Example: Opening a new window
export function openAppWindow(appId: string, title: string) {
  const store = useWindowStore.getState();
  
  const windowId = generateWindowId();
  
  store.dispatch({
    type: "OPEN",
    id: windowId,
    appId,
    title,
    bounds: {
      x: 100 + (store.windows.length * 30),
      y: 100 + (store.windows.length * 30),
      width: 800,
      height: 600,
    }
  });
  
  console.log(`Opened window ${windowId} for app ${appId}`);
  return windowId;
}

// Example: Closing a window with proper cleanup
export function closeAppWindow(windowId: string) {
  const store = useWindowStore.getState();
  
  // Check if window exists
  if (!store.isWindowOpen(windowId)) {
    console.warn(`Window ${windowId} is not open`);
    return false;
  }
  
  // Start closing process
  store.dispatch({ type: "CLOSE", id: windowId });
  
  // The actual cleanup will be handled by the WindowShell component
  // after the transition animation completes
  return true;
}

// Example: Getting window information
export function getWindowInfo(windowId: string) {
  const store = useWindowStore.getState();
  return store.getWindow(windowId);
}

// Example: Getting all visible windows
export function getAllVisibleWindows() {
  const store = useWindowStore.getState();
  return store.getVisibleWindows();
}

// Example: Focusing a window
export function focusWindow(windowId: string) {
  const store = useWindowStore.getState();
  store.dispatch({ type: "FOCUS", id: windowId });
}

// Example: Minimizing a window
export function minimizeWindow(windowId: string) {
  const store = useWindowStore.getState();
  store.dispatch({ type: "MINIMIZE", id: windowId });
}

// Example: Maximizing a window
export function maximizeWindow(windowId: string) {
  const store = useWindowStore.getState();
  store.dispatch({ type: "MAXIMIZE", id: windowId });
}

// Example: Moving a window
export function moveWindow(windowId: string, x: number, y: number) {
  const store = useWindowStore.getState();
  store.dispatch({ type: "MOVE", id: windowId, x, y });
}

// Example: Resizing a window
export function resizeWindow(windowId: string, width: number, height: number) {
  const store = useWindowStore.getState();
  store.dispatch({ type: "RESIZE", id: windowId, width, height });
}
