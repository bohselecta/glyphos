# Window Lifecycle & Sandbox Security Fixes

This document outlines the fixes implemented to resolve two critical issues:

1. **Windows don't reliably close/re-open** → lifecycle + state cleanup bug
2. **"Prevented recursive OS loading in iframe" + sandbox warning** → app iframe accidentally loading OS entry

## 🔧 Fixes Implemented

### 1. Deterministic Window Lifecycle

**Problem**: Windows disappeared visually but iframe/process remained mounted, causing collisions on next open.

**Solution**: Centralized lifecycle management with hard unmount.

#### Files Created/Modified:
- `lib/windows.ts` - Centralized window reducer with deterministic state management
- `lib/store.ts` - Zustand store using the window reducer
- `components/WindowShell.tsx` - React component with hard unmount on close
- `components/AppIframe.tsx` - Safe iframe component preventing recursive loading

#### Key Features:
- **State Management**: `"open" | "closing" | "closed"` states
- **Hard Unmount**: `iframe.src = "about:blank"` → `iframe.remove()` → `dispatch({ type: "KILL" })`
- **Transition Animation**: 220ms fade-out before hard kill
- **Event Cleanup**: Breaks all event loops, media, and workers

### 2. Sandbox Security & Recursive Loading Prevention

**Problem**: `allow-same-origin` + `allow-scripts` allowed iframe sandbox escape and recursive OS loading.

**Solution**: Removed `allow-same-origin` and added URL validation.

#### Files Modified:
- `index.html` - Updated iframe sandbox attributes and OS embed guard
- `runtime/sandbox.ts` - Removed `allow-same-origin` from sandbox config

#### Security Changes:
```html
<!-- OLD (VULNERABLE) -->
sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"

<!-- NEW (SECURE) -->
sandbox="allow-scripts allow-downloads allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-modals"
```

#### URL Validation:
- Apps must use absolute URLs (no `/` roots)
- Validates entry URLs don't point to OS root
- Falls back to `about:blank` for invalid URLs

### 3. OS Embed Guard (Quiet Mode)

**Problem**: Noisy error when OS accidentally loads in iframe.

**Solution**: Silent prevention with graceful degradation.

#### Before:
```javascript
throw new Error('Prevented recursive OS loading in iframe');
```

#### After:
```javascript
// We're in an iframe — don't boot the OS here.
document.open(); 
document.write(''); 
document.close();

// Optionally post a message so the parent knows
try { 
  parent.postMessage({ type: "glyph:prevented-os-embed" }, "*"); 
} catch {}

console.warn('Prevented recursive OS loading in iframe');
```

## 🚀 Usage Examples

### Opening a Window
```typescript
import { openAppWindow } from './lib/window-integration';

const windowId = openAppWindow('notes', 'My Notes');
```

### Closing a Window
```typescript
import { closeAppWindow } from './lib/window-integration';

closeAppWindow(windowId); // Handles transition + hard unmount
```

### Using the Store Directly
```typescript
import { useWindowStore } from './lib/store';

const { windows, dispatch } = useWindowStore();

// Open window
dispatch({
  type: "OPEN",
  appId: "notes",
  title: "My Notes",
  bounds: { x: 100, y: 100, width: 800, height: 600 }
});

// Close window
dispatch({ type: "CLOSE", id: windowId });
```

## 🔍 Expected Behavior

### Before Fixes:
```
Rendering windows: 1 windows
Window IDs: ['window-1759940239107-cyvggyveb']
Uncaught Error: Prevented recursive OS loading in iframe
```

### After Fixes:
```
Rendering windows: 1
window mount → hello
app iframe handshake ack for window-1759940239107-cyvggyveb
```

### Window Close:
```
request close → closing → kill → removed
```

## 🛡️ Security Benefits

1. **No Sandbox Escape**: Removed `allow-same-origin` prevents iframe from accessing parent
2. **No Recursive Loading**: URL validation prevents apps from loading OS root
3. **Clean Communication**: Apps must use `postMessage` for OS communication
4. **Hard Cleanup**: Complete iframe removal prevents zombie processes

## 📋 Checklist

- ✅ Each app manifest has absolute entry URL (no `/` roots)
- ✅ App HTML has proper `<base href="…/app-root/">`
- ✅ AppIframe does not include `allow-same-origin`
- ✅ Window close: `iframe.src = "about:blank"` → `remove()` → `dispatch KILL`
- ✅ OS top-level script no longer throws when iframed; it noops
- ✅ Sandbox attributes updated in both HTML and runtime

## 🔄 Migration Notes

If you're using the old window management system:

1. Replace direct `windowManager.closeWindow()` calls with the new `closeAppWindow()` helper
2. Update iframe sandbox attributes to remove `allow-same-origin`
3. Ensure app entry URLs are absolute and don't point to OS root
4. Use `postMessage` for app ↔ OS communication instead of direct window access

## 🧪 Testing

To test the fixes:

1. **Window Lifecycle**: Open multiple windows, close them, verify they're completely removed
2. **Sandbox Security**: Try to access `window.parent` from an app (should fail)
3. **Recursive Loading**: Check console for "Prevented recursive OS loading" warnings
4. **Hard Unmount**: Verify iframes are completely removed from DOM after close
