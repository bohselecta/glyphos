/**
 * Glyphd App Manifest (GAM) - Complete specification for app metadata, capabilities, and runtime requirements
 */

// Core types
export type AppID = string // e.g. "com.glyphd.fractal-encoder"
export type SemVer = string // e.g. "1.2.3"
export type URL = string
export type IPFSURL = string // "ipfs://Qm..."
export type RegistryURL = string
export type Ed25519PublicKey = string
export type Base64Signature = string
export type ISO8601 = string
export type HexColor = string // "#RRGGBB"
export type ByteSize = string // "100MB", "1GB"
export type LanguageCode = string // "en", "es"
export type SubresourceIntegrity = string // "sha384-..."
export type SPDXLicense = string // "MIT", "Apache-2.0"

export type Category = 
  | "utility" 
  | "creative" 
  | "experimental" 
  | "tools" 
  | "ai" 
  | "social"
  | "productivity"
  | "games"

export type AIProvider = "openai" | "anthropic" | "xai" | "ollama" | string

export type Capability = 
  | { type: "storage", scope: string }
  | { type: "network", origin: URLPattern }
  | { type: "ai", provider: AIProvider }
  | { type: "ipc", target: AppID }
  | { type: "media", device: "camera" | "microphone" | "screen" }
  | { type: "notifications" }
  | { type: "clipboard", mode: "read" | "write" }
  | { type: "geolocation" }

export interface CapabilityToken {
  capability: Capability
  grantedAt: number
  expiresAt?: number
}

export type URLPattern = string // "*", "https://api.example.com/*"
export type ServicePattern = string // "storage.*", "ai.complete"
export type KeyboardShortcut = string // "Cmd+E", "Ctrl+Shift+P"

// Manifest interfaces
export interface Icon {
  src: URL
  sizes: string // "192x192", "any"
  type: string  // "image/png", "image/svg+xml"
  purpose?: "any" | "maskable" | "monochrome"
}

export interface Screenshot {
  src: URL
  sizes: string
  type: string
  label?: string
}

export interface FileHandler {
  extensions: string[]      // [".glyph", ".fractal"]
  accept: Record<string, string[]> // {"image/glyph": [".glyph"]}
  action?: URL             // Handler endpoint
  icons?: Icon[]
}

export interface ProtocolHandler {
  protocol: string         // "glyph"
  url: URL                 // Handler URL with %s placeholder
}

export interface ContextMenu {
  selector: string         // "img", "text", "selection"
  items: MenuItem[]
}

export interface MenuItem {
  id: string
  label: string
  icon?: URL
  shortcut?: KeyboardShortcut
}

export interface Command {
  id: string
  name: string
  description?: string
  keyboardShortcut?: KeyboardShortcut
  category?: string
  handler?: () => void
  action?: {
    type: 'navigate' | 'execute' | 'toggle'
    url?: string
    function?: string
    target?: string
    class?: string
  }
}

export interface ShareTarget {
  action: URL
  method?: "GET" | "POST"
  enctype?: string
  params: {
    title?: string
    text?: string
    url?: string
    files?: FileShareParams[]
  }
}

export interface FileShareParams {
  name: string
  accept: string[]
}

export interface MethodSignature {
  name: string
  params: ParamDef[]
  returns: TypeDef
}

export interface ParamDef {
  name: string
  type: TypeDef
  optional?: boolean
}

export type TypeDef = "string" | "number" | "boolean" | "object" | "array" | string

export interface AppDependency {
  id: AppID
  version: SemVer | VersionRange // "1.2.3" or "^1.0.0"
}

export type VersionRange = string // "^1.0.0", "~1.2.3", ">=1.0.0"

export interface RuntimeRequirement {
  minimum: SemVer         // Minimum GlyphOS version
}

export interface Signature {
  algorithm: "ed25519"
  publicKey: Ed25519PublicKey
  signature: Base64Signature
  timestamp: ISO8601
}

/**
 * Glyphd App Manifest (GAM)
 * Complete specification for app metadata, capabilities, and runtime requirements
 */
export interface GlyphAppManifest {
  /** Unique identifier (reverse domain notation) */
  id: AppID
  
  /** Semantic version */
  version: SemVer
  
  /** Display metadata */
  manifest: {
    name: string
    shortName?: string
    description: string
    longDescription?: string
    
    categories: Category[]
    tags?: string[]
    
    /** Visual assets */
    icons: Icon[]
    screenshots?: Screenshot[]
    video?: URL
    
    /** UI hints */
    display: "standalone" | "fullscreen" | "minimal-ui"
    orientation?: "any" | "portrait" | "landscape"
    themeColor?: HexColor
    backgroundColor?: HexColor
    
    /** Locale support */
    lang?: LanguageCode
    dir?: "ltr" | "rtl"
  }
  
  /** Author & provenance */
  author: {
    name: string
    email?: string
    url?: URL
    pubkey: Ed25519PublicKey // For signature verification
    registry: RegistryURL     // Home registry
  }
  
  /** App bundle */
  entry: {
    html: URL                 // Main entry point
    integrity: SubresourceIntegrity // SRI hash
    fallback?: IPFSURL        // Decentralized fallback
    size?: number             // Bytes for storage quota
  }
  
  /** Requested capabilities */
  capabilities: {
    /** Storage permissions */
    storage?: {
      opfs?: boolean          // Origin Private File System
      indexeddb?: boolean     // Structured storage
      blob?: boolean          // Large binary storage
      quota?: ByteSize        // e.g. "500MB"
      scopes?: string[]       // Namespaces: ["documents", "cache", "temp"]
    }
    
    /** Network access */
    network?: {
      fetch?: URLPattern[]    // Allowed fetch origins
      websocket?: URLPattern[]// Allowed WS origins
      webrtc?: boolean        // P2P connections
    }
    
    /** AI integration */
    ai?: {
      providers?: AIProvider[] // ["openai", "anthropic", "ollama"]
      models?: string[]        // Specific models if restricted
      maxTokens?: number       // Budget cap per session
      streaming?: boolean      // Server-sent events support
    }
    
    /** Compute resources */
    compute?: {
      webgpu?: boolean        // GPU compute
      wasm?: boolean          // WebAssembly
      workers?: number        // Max web workers
      sharedArrayBuffer?: boolean // Advanced threading
    }
    
    /** Media access */
    media?: {
      camera?: boolean
      microphone?: boolean
      screen?: boolean        // Screen capture
    }
    
    /** Notifications */
    notifications?: boolean
    
    /** Clipboard */
    clipboard?: "read" | "write" | "readwrite"
    
    /** Geolocation */
    geolocation?: boolean
    
    /** IPC capabilities */
    ipc?: {
      expose?: MethodSignature[]  // Methods this app provides
      consume?: ServicePattern[]  // Services this app calls
    }
  }
  
  /** Collaboration settings */
  collaboration?: {
    crdt?: "yjs" | "automerge" | "none"
    awareness?: boolean       // Presence/cursors
    maxPeers?: number        // Room size limit
    persistence?: ("indexeddb" | "blob" | "ipfs")[]
    encryption?: boolean     // E2E encrypted rooms
  }
  
  /** OS integration */
  extensions?: {
    /** File type handlers */
    fileHandlers?: FileHandler[]
    
    /** Protocol handlers */
    protocols?: ProtocolHandler[]
    
    /** Context menu contributions */
    contextMenus?: ContextMenu[]
    
    /** Global commands */
    commands?: Command[]
    
    /** Share targets */
    shareTarget?: ShareTarget
  }
  
  /** Dependencies */
  dependencies?: {
    apps?: AppDependency[]    // Required apps
    runtime?: RuntimeRequirement
  }
  
  /** Lineage (for remixes) */
  fork?: {
    originalId: AppID
    originalVersion: SemVer
    changes: string          // Changelog
  }
  
  /** License */
  license?: SPDXLicense
  
  /** Repository */
  repository?: {
    type: "git" | "svn" | "hg"
    url: URL
    directory?: string       // Monorepo path
  }
  
  /** Cryptographic signature */
  signature: Signature
}
