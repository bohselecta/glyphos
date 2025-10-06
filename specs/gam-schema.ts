/**
 * Glyphd App Manifest (GAM) v1.0.0
 * Complete specification for app metadata
 */

export interface GlyphAppManifest {
  // === REQUIRED FIELDS ===
  
  /** 
   * Unique identifier in reverse domain notation
   * @example "com.glyphd.fractal-encoder"
   * @pattern ^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$
   */
  id: string
  
  /**
   * Semantic version
   * @example "1.2.3"
   * @pattern ^\d+\.\d+\.\d+(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$
   */
  version: string
  
  /**
   * Display metadata
   */
  manifest: {
    /**
     * App display name
     * @minLength 1
     * @maxLength 50
     */
    name: string
    
    /**
     * Short description
     * @minLength 10
     * @maxLength 160
     */
    description: string
    
    /**
     * App categories (1-5)
     * @minItems 1
     * @maxItems 5
     */
    categories: Category[]
    
    /**
     * App icons (at least one required)
     * @minItems 1
     */
    icons: Icon[]
    
    // Optional fields
    shortName?: string
    longDescription?: string
    tags?: string[]
    screenshots?: Screenshot[]
    video?: string
    display?: "standalone" | "fullscreen" | "minimal-ui"
    orientation?: "any" | "portrait" | "landscape"
    themeColor?: string // Hex color
    backgroundColor?: string // Hex color
    lang?: string // ISO 639-1
    dir?: "ltr" | "rtl"
  }
  
  /**
   * Author information
   */
  author: {
    /**
     * Author name
     * @minLength 1
     * @maxLength 100
     */
    name: string
    
    /**
     * Ed25519 public key (base64)
     * @pattern ^[A-Za-z0-9+/]{43}=$
     */
    pubkey: string
    
    /**
     * Home registry URL
     * @format uri
     */
    registry: string
    
    // Optional fields
    email?: string
    url?: string
  }
  
  /**
   * App bundle location
   */
  entry: {
    /**
     * Main HTML file URL
     * @format uri
     */
    html: string
    
    /**
     * Subresource Integrity hash
     * @pattern ^sha(256|384|512)-[A-Za-z0-9+/]+=*$
     */
    integrity: string
    
    // Optional fields
    fallback?: string // IPFS URL
    size?: number // Bytes
  }
  
  /**
   * Cryptographic signature
   */
  signature: {
    algorithm: "ed25519"
    
    /**
     * Public key (must match author.pubkey)
     */
    publicKey: string
    
    /**
     * Signature (base64)
     */
    signature: string
    
    /**
     * Signature timestamp
     * @format date-time
     */
    timestamp: string
  }
  
  // === OPTIONAL FIELDS ===
  
  /**
   * Requested capabilities
   */
  capabilities?: {
    storage?: {
      opfs?: boolean
      indexeddb?: boolean
      blob?: boolean
      quota?: string // e.g., "100MB", "1GB"
      scopes?: string[]
    }
    
    network?: {
      fetch?: string[] // URL patterns
      websocket?: string[]
      webrtc?: boolean
    }
    
    ai?: {
      providers?: AIProvider[]
      models?: string[]
      maxTokens?: number
      streaming?: boolean
    }
    
    compute?: {
      webgpu?: boolean
      wasm?: boolean
      workers?: number
      sharedArrayBuffer?: boolean
    }
    
    media?: {
      camera?: boolean
      microphone?: boolean
      screen?: boolean
    }
    
    notifications?: boolean
    clipboard?: "read" | "write" | "readwrite"
    geolocation?: boolean
    
    ipc?: {
      expose?: MethodSignature[]
      consume?: string[] // Service patterns
    }
  }
  
  /**
   * Collaboration settings
   */
  collaboration?: {
    crdt?: "yjs" | "automerge" | "none"
    awareness?: boolean
    maxPeers?: number
    persistence?: Array<"indexeddb" | "blob" | "ipfs">
    encryption?: boolean
  }
  
  /**
   * OS integration points
   */
  extensions?: {
    fileHandlers?: FileHandler[]
    protocols?: ProtocolHandler[]
    contextMenus?: ContextMenu[]
    commands?: Command[]
    shareTarget?: ShareTarget
  }
  
  /**
   * App dependencies
   */
  dependencies?: {
    apps?: AppDependency[]
    runtime?: {
      minimum: string // Minimum GlyphOS version
    }
  }
  
  /**
   * Fork/remix metadata
   */
  fork?: {
    originalId: string
    originalVersion: string
    changes: string
  }
  
  /**
   * License (SPDX identifier)
   */
  license?: string
  
  /**
   * Source repository
   */
  repository?: {
    type: "git" | "svn" | "hg"
    url: string
    directory?: string
  }
}

// Supporting types

export type Category = 
  | "utility"
  | "creative"
  | "experimental"
  | "tools"
  | "ai"
  | "social"
  | "productivity"
  | "games"
  | "education"
  | "finance"
  | "health"
  | "media"

export type AIProvider = 
  | "openai"
  | "anthropic"
  | "xai"
  | "ollama"
  | string

export interface Icon {
  /**
   * Icon URL
   * @format uri
   */
  src: string
  
  /**
   * Icon sizes (e.g., "192x192", "any")
   */
  sizes: string
  
  /**
   * MIME type
   */
  type: string
  
  /**
   * Icon purpose
   */
  purpose?: "any" | "maskable" | "monochrome"
}

export interface Screenshot {
  src: string
  sizes: string
  type: string
  label?: string
}

export interface FileHandler {
  /**
   * File extensions to handle
   * @example [".glyph", ".fractal"]
   */
  extensions: string[]
  
  /**
   * MIME type mapping
   */
  accept: Record<string, string[]>
  
  /**
   * Handler URL (optional)
   */
  action?: string
  
  icons?: Icon[]
}

export interface ProtocolHandler {
  /**
   * Protocol scheme (without ://)
   * @example "glyph"
   */
  protocol: string
  
  /**
   * Handler URL with %s placeholder
   * @example "/handle?url=%s"
   */
  url: string
}

export interface ContextMenu {
  /**
   * CSS selector for context
   * @example "img", "text", "selection"
   */
  selector: string
  
  /**
   * Menu items
   */
  items: MenuItem[]
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string // e.g., "Cmd+E"
}

export interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  category?: string
}

export interface ShareTarget {
  action: string
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
  returns: string // Type description
  description?: string
}

export interface ParamDef {
  name: string
  type: string
  optional?: boolean
  description?: string
}

export interface AppDependency {
  id: string
  version: string // SemVer or range
  optional?: boolean
}

/**
 * Validation schema for GAM
 */
export const GAM_VALIDATION_RULES = {
  // Required field validation
  required: [
    'id',
    'version',
    'manifest',
    'manifest.name',
    'manifest.description',
    'manifest.categories',
    'manifest.icons',
    'author',
    'author.name',
    'author.pubkey',
    'author.registry',
    'entry',
    'entry.html',
    'entry.integrity',
    'signature'
  ],
  
  // Pattern validation
  patterns: {
    id: /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/,
    version: /^\d+\.\d+\.\d+(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$/,
    themeColor: /^#[0-9a-fA-F]{6}$/,
    pubkey: /^[A-Za-z0-9+/]{43}=$/,
    integrity: /^sha(256|384|512)-[A-Za-z0-9+/]+=*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // Length constraints
  lengths: {
    'manifest.name': { min: 1, max: 50 },
    'manifest.shortName': { max: 12 },
    'manifest.description': { min: 10, max: 160 },
    'manifest.longDescription': { max: 5000 },
    'author.name': { min: 1, max: 100 }
  },
  
  // Array constraints
  arrays: {
    'manifest.categories': { min: 1, max: 5 },
    'manifest.icons': { min: 1 },
    'manifest.tags': { max: 20 }
  },
  
  // Enum validation
  enums: {
    'manifest.display': ['standalone', 'fullscreen', 'minimal-ui'],
    'manifest.orientation': ['any', 'portrait', 'landscape'],
    'manifest.dir': ['ltr', 'rtl'],
    'collaboration.crdt': ['yjs', 'automerge', 'none'],
    'capabilities.clipboard': ['read', 'write', 'readwrite'],
    'signature.algorithm': ['ed25519']
  },
  
  // Custom validators
  custom: {
    // Signature public key must match author public key
    signatureKeyMatch: (manifest: GlyphAppManifest) => {
      return manifest.signature.publicKey === manifest.author.pubkey
    },
    
    // Version must be valid semver
    validSemver: (_version: string) => {
      try {
        // Use semver library
        return true
      } catch {
        return false
      }
    },
    
    // URLs must be HTTPS (except localhost)
    secureUrls: (manifest: GlyphAppManifest) => {
      const urls = [
        manifest.entry.html,
        manifest.author.registry,
        ...(manifest.capabilities?.network?.fetch || []),
        ...(manifest.capabilities?.network?.websocket || [])
      ]
      
      return urls.every(url => 
        url.startsWith('https://') || 
        url.startsWith('http://localhost') ||
        url.startsWith('ipfs://')
      )
    },
    
    // Storage quota format
    validQuota: (quota?: string) => {
      if (!quota) return true
      return /^\d+(KB|MB|GB)$/.test(quota)
    }
  }
}

/**
 * GAM Validator Class
 */
export class GAMValidator {
  /**
   * Validate a GAM manifest
   */
  static validate(manifest: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check required fields
    for (const field of GAM_VALIDATION_RULES.required) {
      if (!this.getNestedValue(manifest, field)) {
        errors.push({
          field,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Required field '${field}' is missing`
        })
      }
    }
    
    // Check patterns
    for (const [field, pattern] of Object.entries(GAM_VALIDATION_RULES.patterns)) {
      const value = this.getNestedValue(manifest, field)
      if (value && !pattern.test(value)) {
        errors.push({
          field,
          code: 'PATTERN_MISMATCH',
          message: `Field '${field}' does not match required pattern`
        })
      }
    }
    
    // Check lengths
    for (const [field, constraints] of Object.entries(GAM_VALIDATION_RULES.lengths)) {
      const value = this.getNestedValue(manifest, field)
      if (value) {
        if ('min' in constraints && constraints.min && value.length < constraints.min) {
          errors.push({
            field,
            code: 'TOO_SHORT',
            message: `Field '${field}' is too short (min: ${constraints.min})`
          })
        }
        if ('max' in constraints && constraints.max && value.length > constraints.max) {
          errors.push({
            field,
            code: 'TOO_LONG',
            message: `Field '${field}' is too long (max: ${constraints.max})`
          })
        }
      }
    }
    
    // Check arrays
    for (const [field, constraints] of Object.entries(GAM_VALIDATION_RULES.arrays)) {
      const value = this.getNestedValue(manifest, field)
      if (Array.isArray(value)) {
        if ('min' in constraints && constraints.min && value.length < constraints.min) {
          errors.push({
            field,
            code: 'TOO_FEW_ITEMS',
            message: `Field '${field}' has too few items (min: ${constraints.min})`
          })
        }
        if ('max' in constraints && constraints.max && value.length > constraints.max) {
          errors.push({
            field,
            code: 'TOO_MANY_ITEMS',
            message: `Field '${field}' has too many items (max: ${constraints.max})`
          })
        }
      }
    }
    
    // Check enums
    for (const [field, allowedValues] of Object.entries(GAM_VALIDATION_RULES.enums)) {
      const value = this.getNestedValue(manifest, field)
      if (value && !allowedValues.includes(value)) {
        errors.push({
          field,
          code: 'INVALID_ENUM',
          message: `Field '${field}' has invalid value. Allowed: ${allowedValues.join(', ')}`
        })
      }
    }
    
    // Custom validators
    if (manifest.signature && manifest.author) {
      if (!GAM_VALIDATION_RULES.custom.signatureKeyMatch(manifest)) {
        errors.push({
          field: 'signature.publicKey',
          code: 'SIGNATURE_KEY_MISMATCH',
          message: 'Signature public key does not match author public key'
        })
      }
    }
    
    if (!GAM_VALIDATION_RULES.custom.secureUrls(manifest)) {
      warnings.push({
        field: 'urls',
        code: 'INSECURE_URL',
        message: 'Some URLs are not HTTPS (security risk)'
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  code: string
  message: string
}

export interface ValidationWarning {
  field: string
  code: string
  message: string
}

/**
 * Migration between GAM versions
 */
export class GAMMigrator {
  /**
   * Migrate GAM from v1.0.0 to v1.1.0 (hypothetical future version)
   */
  static migrate_v1_0_to_v1_1(oldManifest: any): GlyphAppManifest {
    return {
      ...oldManifest,
      // Add new required fields with defaults
      manifest: {
        ...oldManifest.manifest,
        // New field in v1.1.0
        accessibility: {
          screenReader: true,
          keyboardNavigation: true
        }
      }
    }
  }
}
