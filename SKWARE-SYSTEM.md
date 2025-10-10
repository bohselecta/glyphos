# SKWARE System Implementation

## What is a SKWARE?

A **SKWARE** (pronounced "square") is GlyphOS's term for an app container window. We renamed "windows" to "SKWAREs" to avoid confusion with the JavaScript `Window` object and to give the system a unique identity.

## Critical Bugs Fixed

### 1. Recursive OS Loading Issue
**Problem**: When opening Notes app, the entire OS was loading inside the iframe instead of the Notes app content.

**Root Cause**: `renderWindows()` was calling `container.innerHTML = ''` which destroyed ALL iframes on every render, including active ones. This caused iframes to reload, and if the URL was invalid or undefined, they would default to loading the current page (the OS).

**Fix**: Changed to selective removal - only remove DOM elements for SKWAREs that no longer exist in state:
```javascript
// Only remove SKWAREs that no longer exist
const existingIds = new Set(windows.map(w => w.id))
Array.from(container.children).forEach(el => {
  if (!existingIds.has(el.id)) el.remove()
})

// Skip if already rendered
if (document.getElementById(window.id)) return
```

### 2. URL Validation
**Added**: Validation before rendering iframes to catch invalid URLs:
```javascript
if (!window.url || window.url === '' || window.url === window.location.href) {
  console.error('INVALID URL for window:', window.id, 'URL:', window.url)
  return
}
```

### 3. Enhanced Logging
**Added**: Comprehensive logging throughout the launch → render → display pipeline:
- WindowManager logs URL when creating window
- launchApp logs entry URL validation
- renderWindows logs all window URLs and states

## SKWARE System Architecture

### SKWAREManager (`desktop/skware-manager.ts`)

New manager class with SKWARE-specific methods:
- `createSKWARE(options)` - Create a new SKWARE
- `closeSKWARE(id)` - Close and clean up SKWARE
- `focusSKWARE(id)` - Bring SKWARE to front
- `minimizeSKWARE(id)` - Minimize SKWARE
- `maximizeSKWARE(id)` - Maximize SKWARE
- `getSKWAREs()` - Get all SKWAREs
- `getActiveSKWARE()` - Get focused SKWARE

### Backwards Compatibility

The SKWAREManager includes legacy methods for smooth transition:
- `createWindow()` → calls `createSKWARE()`
- `closeWindow()` → calls `closeSKWARE()`
- `getWindows()` → calls `getSKWAREs()`

This means existing code continues to work while we transition to SKWARE terminology.

### Global API

```javascript
// New SKWARE API
window.GlyphOS.getSKWAREManager()

// Legacy (still works)
window.GlyphOS.getWindowManager()
```

## Expected Behavior After Fixes

### Opening Notes App

**Before**:
```
❌ App com.glyphd.notes entry URL points to OS root
❌ Entire OS loads inside Notes window
❌ Console shows "Prevented recursive OS loading in iframe"
```

**After**:
```
✅ Launching Notes from: https://domain.com/apps/notes/index.html
✅ App ID: com.glyphd.notes
✅ Entry URL validated: https://domain.com/apps/notes/index.html
✅ WindowManager: Creating window skware-123... with URL: https://domain.com/apps/notes/index.html
✅ Rendering NEW window: skware-123 Notes URL: https://domain.com/apps/notes/index.html
✅ Notes app loads correctly inside SKWARE
```

### Closing a SKWARE

**Before**:
```
❌ SKWARE disappears but iframe still mounted
❌ OS loads again inside closing SKWARE
❌ Next open fails due to stale state
```

**After**:
```
✅ Closing window: skware-123
✅ Hard killing window skware-123
✅ Window element removed from DOM
✅ Window skware-123 completely removed
✅ Clean blank desktop
✅ Next open works perfectly
```

## Testing Instructions

1. **Test Opening Notes**:
   - Click Notes app from launcher
   - Should see detailed logs in console
   - Notes app interface should load (not the OS)
   - No "Prevented recursive OS loading" errors

2. **Test Closing SKWARE**:
   - Click X button on SKWARE
   - Should see "Hard killing window" log
   - SKWARE should fade out and disappear
   - Desktop should be clean/blank
   - No OS loading inside closing SKWARE

3. **Test Re-opening**:
   - Close Notes
   - Open Notes again
   - Should open fresh without errors
   - Multiple open/close cycles should work reliably

## Migration Guide

### For New Code

Use SKWARE terminology:
```javascript
const skwareManager = window.GlyphOS.getSKWAREManager()
const skwareId = skwareManager.createSKWARE({ ... })
skwareManager.closeSKWARE(skwareId)
```

### For Existing Code

Legacy methods still work:
```javascript
const windowManager = window.GlyphOS.getWindowManager()
const windowId = windowManager.createWindow({ ... })
windowManager.closeWindow(windowId)
```

## Next Steps

The system is now working reliably with:
- ✅ No recursive OS loading
- ✅ Clean SKWARE lifecycle
- ✅ Proper URL handling
- ✅ Enhanced debugging logs
- ✅ SKWARE branding introduced
- ✅ Backwards compatibility maintained

Future work:
- Gradually migrate all code to use SKWARE terminology
- Remove legacy WindowManager once all code migrated
- Add SKWARE-specific features (snap zones, workspace management, etc.)

