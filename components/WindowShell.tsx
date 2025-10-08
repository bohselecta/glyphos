/**
 * Window Shell Component
 * Provides deterministic window lifecycle with hard unmount on close
 */

"use client";
import { useEffect, useRef, useState } from "react";
import { useWindowStore } from "../lib/store";
import { AppIframe } from "./AppIframe";

interface WindowShellProps {
  win: {
    id: string;
    title: string;
    appId: string;
    state: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    zIndex: number;
    focused: boolean;
  };
}

export default function WindowShell({ win }: WindowShellProps) {
  const { dispatch } = useWindowStore();
  const [mounted, setMounted] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Handle window close with hard unmount
  function closeWindow() {
    if (isClosing) return; // Prevent double-close
    
    console.log(`Closing window ${win.id} (${win.title})`);
    setIsClosing(true);
    
    // 1) Request app to shutdown gracefully (optional IPC)
    try {
      iframeRef.current?.contentWindow?.postMessage({ 
        type: "app:beforeClose",
        windowId: win.id 
      }, "*");
    } catch (error) {
      // Cross-origin error is expected
      console.log("Cross-origin close message (expected)");
    }

    // 2) Visually transition out
    dispatch({ type: "CLOSE", id: win.id });

    // 3) HARD KILL after transition (~220ms)
    setTimeout(() => {
      console.log(`Hard killing window ${win.id}`);
      
      // Fully detach iframe to break event loops / media / workers
      if (iframeRef.current) {
        // Blank the iframe source to stop all execution
        iframeRef.current.src = "about:blank";
        
        // Remove the iframe node completely
        iframeRef.current.remove();
      }
      
      // Unmount the component
      setMounted(false);
      
      // Remove from store
      dispatch({ type: "KILL", id: win.id });
      
      console.log(`Window ${win.id} completely removed`);
    }, 220);
  }

  // Handle minimize
  function minimizeWindow() {
    console.log(`Minimizing window ${win.id}`);
    dispatch({ type: "MINIMIZE", id: win.id });
  }

  // Handle maximize/restore
  function toggleMaximize() {
    console.log(`Toggling maximize for window ${win.id}`);
    if (win.state === "maximized") {
      dispatch({ type: "RESTORE", id: win.id });
    } else {
      dispatch({ type: "MAXIMIZE", id: win.id });
    }
  }

  // Handle focus
  function focusWindow() {
    dispatch({ type: "FOCUS", id: win.id });
  }

  // Listen for close events from the app
  useEffect(() => {
    function handleCloseEvent(event: CustomEvent) {
      if (event.detail?.windowId === win.id) {
        closeWindow();
      }
    }

    window.addEventListener('window:close', handleCloseEvent as EventListener);
    return () => {
      window.removeEventListener('window:close', handleCloseEvent as EventListener);
    };
  }, [win.id]);

  // Don't render if not mounted
  if (!mounted) return null;

  return (
    <div 
      ref={windowRef}
      className={`window ${win.focused ? 'focused' : ''} ${isClosing ? 'closing' : ''}`}
      style={{
        position: 'absolute',
        left: `${win.bounds.x}px`,
        top: `${win.bounds.y}px`,
        width: `${win.bounds.width}px`,
        height: `${win.bounds.height}px`,
        zIndex: win.zIndex,
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        transition: isClosing ? 'opacity 0.2s ease-out, transform 0.2s ease-out' : 'none',
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'scale(0.95)' : 'scale(1)',
      }}
      onMouseDown={focusWindow}
    >
      {/* Window Header */}
      <div 
        className="window-header"
        style={{
          height: '40px',
          backgroundColor: '#2a2a2a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        <div 
          className="window-title"
          style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {win.title}
        </div>
        
        <div 
          className="window-controls"
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            className="window-btn minimize"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow();
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#ffa500',
              color: '#000',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Minimize"
          >
            −
          </button>
          
          <button
            className="window-btn maximize"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#00ff00',
              color: '#000',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={win.state === "maximized" ? "Restore" : "Maximize"}
          >
            {win.state === "maximized" ? "⧉" : "□"}
          </button>
          
          <button
            className="window-btn close"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow();
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#ff0000',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Window Body */}
      <div 
        className="window-body"
        style={{
          height: 'calc(100% - 40px)',
          overflow: 'hidden',
        }}
      >
        <AppIframe 
          ref={iframeRef}
          appId={win.appId} 
          winId={win.id}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
