/**
 * Safe App Iframe Component
 * Prevents recursive OS loading and provides secure sandboxing
 */

import React, { forwardRef, useEffect, useMemo, useRef } from "react";

type AppIframeProps = { 
  appId: string; 
  winId: string;
  className?: string;
  style?: React.CSSProperties;
};

export const AppIframe = forwardRef<HTMLIFrameElement, AppIframeProps>(
  function AppIframe({ appId, winId, className, style }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const handshakeComplete = useRef(false);

    // Resolve the entry URL for the app
    const entryUrl = useMemo(() => {
      // Get app manifest from registry or cache
      const appRegistry = (window as any).__APP_REGISTRY__ || {};
      const manifest = appRegistry[appId];
      
      if (!manifest) {
        console.warn(`App ${appId} not found in registry`);
        return "about:blank";
      }
      
      // Ensure absolute URL to prevent recursive loading
      let url = manifest.entry?.html || manifest.entry;
      
      if (!url) {
        console.warn(`No entry URL found for app ${appId}`);
        return "about:blank";
      }
      
      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        url = `${window.location.origin}${url}`;
      } else if (!url.startsWith('http')) {
        url = `${window.location.origin}/${url}`;
      }
      
      // Validate that it's not pointing to the OS root
      if (url === window.location.href || 
          url === window.location.origin + '/index.html' ||
          url === window.location.origin + '/' ||
          (url.endsWith('/index.html') && !url.includes('/apps/'))) {
        console.error(`App ${appId} entry URL points to OS root: ${url}`);
        return "about:blank";
      }
      
      console.log(`Loading app ${appId} from: ${url}`);
      return url;
    }, [appId]);

    // Handshake: parent ↔ app
    useEffect(() => {
      function onMessage(e: MessageEvent) {
        if (!e.data || typeof e.data !== "object") return;
        
        // Handle app handshake
        if (e.data.type === "glyph:hello") {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow && !handshakeComplete.current) {
            iframe.contentWindow.postMessage({ 
              type: "glyph:hello:ack", 
              winId,
              appId 
            }, "*");
            handshakeComplete.current = true;
            console.log(`App ${appId} handshake complete for window ${winId}`);
          }
        }
        
        // Handle app close request
        if (e.data.type === "glyph:close" && e.data.winId === winId) {
          console.log(`App ${appId} requested close for window ${winId}`);
          // Dispatch close action to store
          const event = new CustomEvent('window:close', { 
            detail: { windowId: winId } 
          });
          window.dispatchEvent(event);
        }
      }
      
      window.addEventListener("message", onMessage);
      return () => window.removeEventListener("message", onMessage);
    }, [winId, appId]);

    // Handle iframe load errors
    const handleLoad = () => {
      const iframe = iframeRef.current;
      if (iframe) {
        try {
          // Check if iframe loaded successfully
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log(`App ${appId} loaded successfully in window ${winId}`);
          }
        } catch (error) {
          // Cross-origin error is expected for sandboxed iframes
          console.log(`App ${appId} loaded (cross-origin, expected)`);
        }
      }
    };

    const handleError = () => {
      console.error(`Failed to load app ${appId} in window ${winId}`);
    };

    return (
      <iframe
        ref={(node) => {
          iframeRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        title={`${appId} - ${winId}`}
        src={entryUrl}
        // Safe sandbox: NO allow-same-origin to prevent escape
        sandbox="allow-scripts allow-downloads allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-modals"
        allow="clipboard-write; fullscreen; autoplay; microphone; camera"
        style={{ 
          width: "100%", 
          height: "100%", 
          border: "0", 
          borderRadius: 12,
          ...style 
        }}
        className={className}
        loading="eager"
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }
);

/**
 * Resolve app entry URL safely
 */
export function resolveAppEntryUrl(appId: string): string {
  const appRegistry = (window as any).__APP_REGISTRY__ || {};
  const manifest = appRegistry[appId];
  
  if (!manifest) {
    console.warn(`App ${appId} not found in registry`);
    return "about:blank";
  }
  
  let url = manifest.entry?.html || manifest.entry;
  
  if (!url) {
    console.warn(`No entry URL found for app ${appId}`);
    return "about:blank";
  }
  
  // Convert relative URLs to absolute
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`;
  } else if (!url.startsWith('http')) {
    url = `${window.location.origin}/${url}`;
  }
  
  // Validate that it's not pointing to the OS root
  if (url === window.location.href || 
      url === window.location.origin + '/index.html' ||
      url === window.location.origin + '/' ||
      (url.endsWith('/index.html') && !url.includes('/apps/'))) {
    console.error(`App ${appId} entry URL points to OS root: ${url}`);
    return "about:blank";
  }
  
  return url;
}
