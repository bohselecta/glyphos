# 🔒 App Sandbox Architecture Notes

## Security Fix Applied

**Removed**: `allow-same-origin` from iframe sandbox  
**Reason**: Prevents iframe sandbox escape and recursive OS loading  

## Current Sandbox Attributes

```html
sandbox="allow-scripts allow-forms allow-modals allow-popups"
```

This means apps:
- ✅ Can run JavaScript
- ✅ Can submit forms
- ✅ Can show modals/alerts
- ✅ Can open popups
- ❌ Cannot access parent window directly (different origin)
- ❌ Cannot access parent localStorage
- ❌ Cannot make same-origin requests to OS

## How Apps Should Communicate with OS

### ✅ Correct Method: postMessage API

Apps should use `window.parent.postMessage()` to communicate:

```javascript
// In app (iframe):
window.parent.postMessage({
  type: 'os:storage:set',
  key: 'myData',
  value: 'hello world'
}, '*');

// Listen for response:
window.addEventListener('message', (event) => {
  if (event.data.type === 'os:storage:response') {
    console.log('Data saved:', event.data);
  }
});
```

```javascript
// In OS (parent):
window.addEventListener('message', (event) => {
  if (event.data.type === 'os:storage:set') {
    // Handle storage request
    const { key, value } = event.data;
    localStorage.setItem(key, value);
    
    // Send response
    event.source.postMessage({
      type: 'os:storage:response',
      success: true
    }, event.origin);
  }
});
```

## Update SDK for Cross-Origin Communication

The SDK needs to be updated to use postMessage instead of direct window access:

### Old Way (Broken with sandbox):
```javascript
// This won't work anymore
window.OS.storage.kv.set('key', 'value')
```

### New Way (Works with sandbox):
```javascript
// SDK creates a postMessage bridge
class StorageProxy {
  async set(key, value) {
    return new Promise((resolve) => {
      const messageId = Date.now();
      
      window.parent.postMessage({
        type: 'os:storage:set',
        messageId,
        key,
        value
      }, '*');
      
      const handler = (event) => {
        if (event.data.messageId === messageId) {
          window.removeEventListener('message', handler);
          resolve(event.data.result);
        }
      };
      
      window.addEventListener('message', handler);
    });
  }
}
```

## Alternative: Use ServiceWorker

Instead of iframes, we could use a ServiceWorker to:
1. Intercept app requests
2. Inject OS SDK
3. Provide isolated execution
4. Allow same-origin benefits

This is more complex but provides better integration.

## Alternative: Data URLs or Blob URLs

Load apps using blob:// URLs to ensure complete isolation:

```javascript
async function loadAppInIframe(appUrl) {
  const response = await fetch(appUrl);
  const html = await response.text();
  
  // Inject OS SDK bridge
  const modifiedHtml = html.replace(
    '</head>',
    `<script src="/sdk/iframe-bridge.js"></script></head>`
  );
  
  const blob = new Blob([modifiedHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  
  iframe.src = blobUrl;
}
```

## Recommendation

1. **Short term**: Current fix prevents security issue
2. **Medium term**: Update SDK to use postMessage bridge
3. **Long term**: Consider ServiceWorker architecture

## Testing Checklist

After deploying sandbox fix, test:
- [ ] Apps load without recursive OS loading
- [ ] Apps can display content
- [ ] If apps need OS features, implement postMessage bridge
- [ ] Storage operations work (via postMessage)
- [ ] Collaboration features work (via postMessage)

## App Migration Guide

Apps need to be updated to work with restricted sandbox:

### Before (Direct Access):
```javascript
// Doesn't work in sandboxed iframe
window.OS.storage.kv.set('data', value)
```

### After (Message Bridge):
```javascript
// Works in sandboxed iframe
const bridge = window.OSSandboxBridge;
await bridge.storage.set('data', value);
```

## Security Benefits

✅ Apps can't escape sandbox  
✅ Apps can't access parent localStorage  
✅ Apps can't navigate parent window  
✅ Apps can't access parent cookies  
✅ Apps are truly isolated  

## Trade-offs

❌ More complex communication (postMessage)  
❌ Apps need SDK updates  
❌ Async overhead for all operations  

---

**Status**: Sandbox security applied, apps may need updates for OS integration

