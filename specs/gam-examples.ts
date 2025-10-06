/**
 * GAM Examples
 * Complete examples of Glyphd App Manifests
 */

import { GlyphAppManifest } from './gam-schema.js'

/**
 * Minimal GAM Example
 */
export const minimalGAMExample: GlyphAppManifest = {
  id: "com.example.hello",
  version: "1.0.0",
  
  manifest: {
    name: "Hello World",
    description: "A simple hello world app",
    categories: ["utility"],
    icons: [
      {
        src: "https://cdn.example.com/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  },
  
  author: {
    name: "Jane Developer",
    pubkey: "AbCdEf1234567890AbCdEf1234567890AbCdEf12345=",
    registry: "https://apps.example.com"
  },
  
  entry: {
    html: "https://cdn.example.com/hello/index.html",
    integrity: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "AbCdEf1234567890AbCdEf1234567890AbCdEf12345=",
    signature: "XyZaBc9876543210XyZaBc9876543210XyZaBc98765=",
    timestamp: "2025-10-04T12:00:00Z"
  }
}

/**
 * Full-Featured GAM Example
 */
export const fullFeaturedGAMExample: GlyphAppManifest = {
  id: "com.glyphd.fractal-encoder",
  version: "2.3.1",
  
  manifest: {
    name: "Fractal Encoder",
    shortName: "Fractal",
    description: "Encode data into fractal patterns with advanced compression",
    longDescription: "A powerful tool for encoding arbitrary data into visually stunning fractal patterns. Uses iterative function systems and chaos theory to create unique, reversible encodings.",
    categories: ["creative", "tools", "experimental"],
    tags: ["fractal", "encoding", "compression", "visualization", "generative"],
    
    icons: [
      {
        src: "https://cdn.glyphd.com/fractal/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://cdn.glyphd.com/fractal/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "https://cdn.glyphd.com/fractal/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ],
    
    screenshots: [
      {
        src: "https://cdn.glyphd.com/fractal/screenshot1.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Encoding interface"
      },
      {
        src: "https://cdn.glyphd.com/fractal/screenshot2.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Generated fractal"
      }
    ],
    
    video: "https://cdn.glyphd.com/fractal/demo.mp4",
    
    display: "standalone",
    orientation: "any",
    themeColor: "#6366f1",
    backgroundColor: "#0f172a",
    lang: "en",
    dir: "ltr"
  },
  
  author: {
    name: "GlyphD Team",
    email: "team@glyphd.com",
    url: "https://glyphd.com",
    pubkey: "rL3k8mPn5vQw9xYz2aBcDeFgHiJkLmNoPqRsTuVwXyZ=",
    registry: "https://apps.glyphd.com"
  },
  
  entry: {
    html: "https://cdn.glyphd.com/fractal/v2.3.1/index.html",
    integrity: "sha384-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    fallback: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    size: 524288
  },
  
  capabilities: {
    storage: {
      opfs: true,
      indexeddb: true,
      blob: true,
      quota: "500MB",
      scopes: ["fractals", "cache", "exports"]
    },
    
    network: {
      fetch: [
        "https://api.glyphd.com/*",
        "https://cdn.glyphd.com/*"
      ],
      websocket: [
        "wss://realtime.glyphd.com"
      ],
      webrtc: true
    },
    
    ai: {
      providers: ["openai", "anthropic"],
      models: ["gpt-4", "claude-3-opus"],
      maxTokens: 50000,
      streaming: true
    },
    
    compute: {
      webgpu: true,
      wasm: true,
      workers: 4,
      sharedArrayBuffer: true
    },
    
    media: {
      camera: true,
      screen: true
    },
    
    clipboard: "readwrite",
    
    ipc: {
      expose: [
        {
          name: "encode",
          params: [
            {
              name: "data",
              type: "Uint8Array",
              description: "Data to encode"
            },
            {
              name: "options",
              type: "EncodeOptions",
              optional: true,
              description: "Encoding parameters"
            }
          ],
          returns: "FractalImage",
          description: "Encode data into fractal image"
        },
        {
          name: "decode",
          params: [
            {
              name: "fractal",
              type: "FractalImage",
              description: "Fractal to decode"
            }
          ],
          returns: "Uint8Array",
          description: "Decode fractal back to data"
        }
      ],
      
      consume: [
        "storage.*",
        "ai.complete"
      ]
    }
  },
  
  collaboration: {
    crdt: "yjs",
    awareness: true,
    maxPeers: 20,
    persistence: ["indexeddb", "blob"],
    encryption: true
  },
  
  extensions: {
    fileHandlers: [
      {
        extensions: [".fractal", ".frc"],
        accept: {
          "image/x-fractal": [".fractal", ".frc"]
        },
        icons: [
          {
            src: "https://cdn.glyphd.com/fractal/file-icon.svg",
            sizes: "any",
            type: "image/svg+xml"
          }
        ]
      }
    ],
    
    protocols: [
      {
        protocol: "fractal",
        url: "/open?url=%s"
      }
    ],
    
    contextMenus: [
      {
        selector: "img",
        items: [
          {
            id: "encode-image",
            label: "Encode as fractal",
            icon: "fractal-icon",
            shortcut: "Cmd+E"
          }
        ]
      }
    ],
    
    commands: [
      {
        id: "new-fractal",
        label: "Create new fractal",
        description: "Start a new fractal encoding project",
        shortcut: "Cmd+N",
        category: "File"
      },
      {
        id: "export-png",
        label: "Export as PNG",
        shortcut: "Cmd+Shift+E",
        category: "Export"
      }
    ],
    
    shareTarget: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          {
            name: "file",
            accept: ["image/*", "application/octet-stream"]
          }
        ]
      }
    }
  },
  
  dependencies: {
    apps: [
      {
        id: "com.glyphd.image-tools",
        version: "^1.0.0",
        optional: true
      }
    ],
    runtime: {
      minimum: "1.0.0"
    }
  },
  
  license: "MIT",
  
  repository: {
    type: "git",
    url: "https://github.com/glyphd/fractal-encoder",
    directory: "apps/fractal-encoder"
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "rL3k8mPn5vQw9xYz2aBcDeFgHiJkLmNoPqRsTuVwXyZ=",
    signature: "dGhpcyBpcyBub3QgYSByZWFsIHNpZ25hdHVyZSBqdXN0IGFuIGV4YW1wbGU=",
    timestamp: "2025-10-04T12:00:00Z"
  }
}

/**
 * Creative App Example
 */
export const creativeAppExample: GlyphAppManifest = {
  id: "com.artist.canvas-studio",
  version: "1.5.2",
  
  manifest: {
    name: "Canvas Studio",
    shortName: "Canvas",
    description: "Professional digital art creation tool",
    longDescription: "A comprehensive digital art studio with advanced brush engines, layer management, and real-time collaboration features.",
    categories: ["creative", "tools"],
    tags: ["art", "drawing", "painting", "digital", "creative"],
    
    icons: [
      {
        src: "https://cdn.artist.com/canvas/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "https://cdn.artist.com/canvas/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ],
    
    screenshots: [
      {
        src: "https://cdn.artist.com/canvas/screenshot1.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Main canvas interface"
      }
    ],
    
    display: "standalone",
    themeColor: "#8b5cf6",
    backgroundColor: "#1a1a1a",
    lang: "en"
  },
  
  author: {
    name: "Digital Artist",
    email: "artist@example.com",
    url: "https://artist.example.com",
    pubkey: "Artist1234567890Artist1234567890Artist12345=",
    registry: "https://apps.artist.com"
  },
  
  entry: {
    html: "https://cdn.artist.com/canvas/v1.5.2/index.html",
    integrity: "sha384-CanvasStudioHash1234567890abcdef"
  },
  
  capabilities: {
    storage: {
      opfs: true,
      indexeddb: true,
      quota: "2GB",
      scopes: ["artworks", "brushes", "presets"]
    },
    
    compute: {
      webgpu: true,
      wasm: true,
      workers: 8
    },
    
    media: {
      camera: true
    },
    
    clipboard: "readwrite"
  },
  
  collaboration: {
    crdt: "yjs",
    awareness: true,
    maxPeers: 10,
    persistence: ["indexeddb"]
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "Artist1234567890Artist1234567890Artist12345=",
    signature: "CanvasStudioSignature1234567890abcdef",
    timestamp: "2025-10-04T12:00:00Z"
  }
}

/**
 * Productivity App Example
 */
export const productivityAppExample: GlyphAppManifest = {
  id: "com.productivity.task-manager",
  version: "3.1.0",
  
  manifest: {
    name: "Task Manager Pro",
    shortName: "Tasks",
    description: "Advanced task and project management",
    longDescription: "Comprehensive task management with Gantt charts, team collaboration, and AI-powered scheduling.",
    categories: ["productivity", "tools"],
    tags: ["tasks", "project", "management", "collaboration"],
    
    icons: [
      {
        src: "https://cdn.productivity.com/tasks/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      }
    ],
    
    display: "standalone",
    themeColor: "#10b981",
    backgroundColor: "#ffffff",
    lang: "en"
  },
  
  author: {
    name: "Productivity Solutions",
    email: "team@productivity.com",
    pubkey: "Productivity1234567890Productivity12345=",
    registry: "https://apps.productivity.com"
  },
  
  entry: {
    html: "https://cdn.productivity.com/tasks/v3.1.0/index.html",
    integrity: "sha384-TaskManagerHash1234567890abcdef"
  },
  
  capabilities: {
    storage: {
      indexeddb: true,
      quota: "100MB",
      scopes: ["tasks", "projects", "settings"]
    },
    
    network: {
      fetch: ["https://api.productivity.com/*"]
    },
    
    ai: {
      providers: ["openai"],
      models: ["gpt-3.5-turbo"],
      maxTokens: 4000
    },
    
    notifications: true
  },
  
  collaboration: {
    crdt: "yjs",
    awareness: true,
    maxPeers: 50,
    persistence: ["indexeddb"]
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "Productivity1234567890Productivity12345=",
    signature: "TaskManagerSignature1234567890abcdef",
    timestamp: "2025-10-04T12:00:00Z"
  }
}

/**
 * Game App Example
 */
export const gameAppExample: GlyphAppManifest = {
  id: "com.games.space-adventure",
  version: "2.0.1",
  
  manifest: {
    name: "Space Adventure",
    shortName: "Space",
    description: "Epic space exploration game",
    longDescription: "Explore the galaxy, build ships, and discover new worlds in this immersive space adventure.",
    categories: ["games"],
    tags: ["space", "adventure", "exploration", "strategy"],
    
    icons: [
      {
        src: "https://cdn.games.com/space/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      }
    ],
    
    display: "fullscreen",
    orientation: "landscape",
    themeColor: "#1e40af",
    backgroundColor: "#000000",
    lang: "en"
  },
  
  author: {
    name: "Game Studio",
    email: "studio@games.com",
    pubkey: "GameStudio1234567890GameStudio12345=",
    registry: "https://apps.games.com"
  },
  
  entry: {
    html: "https://cdn.games.com/space/v2.0.1/index.html",
    integrity: "sha384-SpaceAdventureHash1234567890abcdef"
  },
  
  capabilities: {
    storage: {
      indexeddb: true,
      quota: "500MB",
      scopes: ["savegames", "settings"]
    },
    
    compute: {
      webgpu: true,
      wasm: true,
      workers: 4
    },
    
    network: {
      websocket: ["wss://multiplayer.games.com"]
    }
  },
  
  collaboration: {
    crdt: "none",
    awareness: true,
    maxPeers: 8
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "GameStudio1234567890GameStudio12345=",
    signature: "SpaceAdventureSignature1234567890abcdef",
    timestamp: "2025-10-04T12:00:00Z"
  }
}

/**
 * Fork Example
 */
export const forkAppExample: GlyphAppManifest = {
  id: "com.myname.fractal-fork",
  version: "1.0.0",
  
  manifest: {
    name: "My Fractal Fork",
    description: "Personal fork of Fractal Encoder with custom features",
    categories: ["creative", "tools"],
    icons: [
      {
        src: "https://cdn.myname.com/fractal-fork/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  },
  
  author: {
    name: "My Name",
    email: "me@myname.com",
    pubkey: "MyName1234567890MyName1234567890MyName12345=",
    registry: "https://apps.myname.com"
  },
  
  entry: {
    html: "https://cdn.myname.com/fractal-fork/index.html",
    integrity: "sha384-MyFractalForkHash1234567890abcdef"
  },
  
  fork: {
    originalId: "com.glyphd.fractal-encoder",
    originalVersion: "2.3.1",
    changes: "Added custom brush patterns and improved UI"
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "MyName1234567890MyName1234567890MyName12345=",
    signature: "MyFractalForkSignature1234567890abcdef",
    timestamp: "2025-10-04T12:00:00Z"
  }
}
