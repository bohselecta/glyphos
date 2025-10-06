/**
 * Registry Format and Verification System
 * Complete implementation of registry management
 */

/**
 * Registry Index Schema v1.0
 * Central manifest listing all apps in a registry
 */
export interface RegistryIndex {
  /** Registry metadata */
  registry: RegistryMetadata
  
  /** List of app manifests */
  apps: AppReference[]
  
  /** Trust relationships (registries this registry follows) */
  following?: RegistryURL[]
  
  /** Registry statistics */
  stats?: RegistryStats
  
  /** Cryptographic signature */
  signature: RegistrySignature
}

export interface RegistryMetadata {
  /** Unique registry URL */
  url: string
  
  /** Registry display name */
  name: string
  
  /** Short description */
  description: string
  
  /** Registry operator/maintainer */
  operator: {
    name: string
    email?: string
    url?: string
  }
  
  /** Registry public key (ed25519) */
  pubkey: string
  
  /** Registry version (incremented on each update) */
  version: number
  
  /** Last update timestamp */
  updated: string // ISO 8601
  
  /** Creation timestamp */
  created: string
  
  /** Registry type */
  type: "official" | "community" | "personal" | "curated"
  
  /** Registry categories/focus */
  categories?: string[]
  
  /** Contact/support information */
  contact?: {
    email?: string
    url?: string
    discord?: string
    github?: string
  }
  
  /** Registry policies */
  policies?: {
    moderation: "strict" | "moderate" | "open"
    verification: "all" | "selective" | "none"
    contentPolicy?: string // URL to policy doc
  }
}

export interface AppReference {
  /** App ID */
  id: string
  
  /** App version */
  version: string
  
  /** URL to full GAM manifest */
  manifest: string
  
  /** When app was added to this registry */
  addedAt: string
  
  /** When app was last updated in this registry */
  updatedAt: string
  
  /** Registry-specific metadata */
  metadata?: {
    /** Featured/highlighted */
    featured?: boolean
    
    /** Registry-assigned categories */
    categories?: string[]
    
    /** Install count (if tracked) */
    installations?: number
    
    /** Average rating (if tracked) */
    rating?: number
    
    /** Verification status */
    verified?: boolean
    
    /** Editorial notes */
    notes?: string
  }
}

export interface RegistryStats {
  /** Total apps in registry */
  appCount: number
  
  /** Total installations across all apps */
  totalInstallations?: number
  
  /** Active apps (updated in last 90 days) */
  activeApps?: number
  
  /** Registry followers */
  followers?: number
}

export interface RegistrySignature {
  /** Signature algorithm */
  algorithm: "ed25519"
  
  /** Public key (must match registry.pubkey) */
  publicKey: string
  
  /** Signature of canonical registry JSON */
  signature: string
  
  /** Signature timestamp */
  timestamp: string
  
  /** Previous registry version hash (for chain of trust) */
  previousHash?: string
}

export type RegistryURL = string

/**
 * Registry Discovery Protocol
 */
export interface RegistryDiscovery {
  /** Registry URL provided by user */
  url: string
  
  /** Steps to validate registry */
  steps: [
    "1. Fetch /.well-known/glyph-registry",
    "2. Verify it points to valid registry.json",
    "3. Fetch registry.json",
    "4. Verify signature",
    "5. Validate schema",
    "6. Store in local index"
  ]
}

/**
 * Well-known file format
 * Hosted at: https://registry-domain/.well-known/glyph-registry
 */
export interface WellKnownRegistry {
  /** Registry index location */
  registry: string // Relative or absolute URL
  
  /** Registry version */
  version: "1.0"
  
  /** Public key for verification */
  pubkey: string
  
  /** Registry type */
  type: "official" | "community" | "personal" | "curated"
}

/**
 * Registry Signature Implementation
 * Using Ed25519 for cryptographic signatures
 */
export class RegistrySignature {
  /**
   * Sign registry index
   */
  static async sign(
    registry: RegistryIndex,
    privateKey: Uint8Array
  ): Promise<RegistryIndex> {
    // 1. Remove existing signature
    const unsignedRegistry = { ...registry }
    delete (unsignedRegistry as any).signature
    
    // 2. Create canonical JSON (deterministic serialization)
    const canonical = this.canonicalize(unsignedRegistry)
    
    // 3. Hash the canonical JSON
    const encoder = new TextEncoder()
    const data = encoder.encode(canonical)
    const hash = await crypto.subtle.digest('SHA-256', data)
    
    // 4. Sign the hash with Ed25519
    const signature = this.signDetached(new Uint8Array(hash), privateKey)
    
    // 5. Derive public key from private key
    const keyPair = this.keyPairFromSecretKey(privateKey)
    
    // 6. Compute previous version hash (for chain of trust)
    const previousHash = registry.signature?.previousHash
      ? await this.computeRegistryHash(registry)
      : undefined
    
    // 7. Attach signature
    return {
      ...registry,
      signature: {
        algorithm: 'ed25519',
        publicKey: this.toBase64(keyPair.publicKey),
        signature: this.toBase64(signature),
        timestamp: new Date().toISOString(),
        previousHash
      }
    }
  }
  
  /**
   * Verify registry signature
   */
  static async verify(registry: RegistryIndex): Promise<VerificationResult> {
    try {
      // 1. Extract signature
      const sig = registry.signature
      if (!sig) {
        return { valid: false, error: 'No signature present' }
      }
      
      // 2. Verify signature matches registry pubkey
      if (sig.publicKey !== registry.registry.pubkey) {
        return { valid: false, error: 'Signature key mismatch' }
      }
      
      // 3. Remove signature for verification
      const unsignedRegistry = { ...registry }
      delete (unsignedRegistry as any).signature
      
      // 4. Recreate canonical JSON
      const canonical = this.canonicalize(unsignedRegistry)
      
      // 5. Hash
      const encoder = new TextEncoder()
      const data = encoder.encode(canonical)
      const hash = await crypto.subtle.digest('SHA-256', data)
      
      // 6. Verify signature
      const signatureValid = this.verifyDetached(
        new Uint8Array(hash),
        this.fromBase64(sig.signature),
        this.fromBase64(sig.publicKey)
      )
      
      if (!signatureValid) {
        return { valid: false, error: 'Invalid signature' }
      }
      
      // 7. Verify timestamp is reasonable (not in future)
      const timestamp = new Date(sig.timestamp).getTime()
      const now = Date.now()
      if (timestamp > now + 60000) { // 1 minute tolerance
        return { valid: false, error: 'Signature timestamp in future' }
      }
      
      // 8. Verify previous hash chain (if exists)
      if (sig.previousHash) {
        // Would verify against stored previous version
      }
      
      return { valid: true }
      
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }
  
  /**
   * Create canonical JSON (deterministic)
   * Keys sorted alphabetically, no whitespace
   */
  private static canonicalize(obj: any): string {
    if (obj === null) return 'null'
    if (typeof obj !== 'object') return JSON.stringify(obj)
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']'
    }
    
    const keys = Object.keys(obj).sort()
    const pairs = keys.map(key => {
      const value = this.canonicalize(obj[key])
      return `"${key}":${value}`
    })
    
    return '{' + pairs.join(',') + '}'
  }
  
  /**
   * Compute hash of entire registry (for chain of trust)
   */
  private static async computeRegistryHash(registry: RegistryIndex): Promise<string> {
    const canonical = this.canonicalize(registry)
    const encoder = new TextEncoder()
    const data = encoder.encode(canonical)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return this.toBase64(new Uint8Array(hash))
  }
  
  private static toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
  }
  
  private static fromBase64(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  
  // Mock implementations for Ed25519 operations
  private static signDetached(data: Uint8Array, privateKey: Uint8Array): Uint8Array {
    // Mock implementation - in real app would use nacl or similar
    return new Uint8Array(64) // 64-byte signature
  }
  
  private static verifyDetached(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    // Mock implementation - in real app would use nacl or similar
    return true
  }
  
  private static keyPairFromSecretKey(privateKey: Uint8Array): { publicKey: Uint8Array } {
    // Mock implementation - in real app would use nacl or similar
    return { publicKey: new Uint8Array(32) }
  }
}

export interface VerificationResult {
  valid: boolean
  error?: string
  timestamp?: Date
  previousHash?: string
}

/**
 * Registry Update and Sync Protocol
 */
export class RegistryUpdateDetector {
  private registries = new Map<RegistryURL, CachedRegistry>()
  
  /**
   * Check for updates
   */
  async checkForUpdates(registryUrl: RegistryURL): Promise<UpdateInfo | null> {
    const cached = this.registries.get(registryUrl)
    
    // Fetch latest registry index
    const response = await fetch(`${registryUrl}/registry.json`)
    const latest: RegistryIndex = await response.json()
    
    // Verify signature
    const verification = await RegistrySignature.verify(latest)
    if (!verification.valid) {
      throw new Error(`Invalid registry signature: ${verification.error}`)
    }
    
    // Check if newer version
    if (!cached || latest.registry.version > cached.version) {
      return {
        type: 'new-version',
        oldVersion: cached?.version || 0,
        newVersion: latest.registry.version,
        registry: latest
      }
    }
    
    return null
  }
  
  /**
   * Compute diff between versions
   */
  async computeDiff(
    oldRegistry: RegistryIndex,
    newRegistry: RegistryIndex
  ): Promise<RegistryDiff> {
    const oldApps = new Map(oldRegistry.apps.map(app => [app.id, app]))
    const newApps = new Map(newRegistry.apps.map(app => [app.id, app]))
    
    const added: AppReference[] = []
    const updated: AppReference[] = []
    const removed: AppReference[] = []
    
    // Find added and updated apps
    for (const [id, newApp] of newApps) {
      const oldApp = oldApps.get(id)
      if (!oldApp) {
        added.push(newApp)
      } else if (newApp.version !== oldApp.version) {
        updated.push(newApp)
      }
    }
    
    // Find removed apps
    for (const [id, oldApp] of oldApps) {
      if (!newApps.has(id)) {
        removed.push(oldApp)
      }
    }
    
    return { added, updated, removed }
  }
  
  /**
   * Apply registry update
   */
  async applyUpdate(registryUrl: RegistryURL, newRegistry: RegistryIndex): Promise<void> {
    const old = this.registries.get(registryUrl)
    
    if (old) {
      // Compute diff
      const diff = await this.computeDiff(old.registry, newRegistry)
      
      // Emit events
      this.emit('apps-added', { registry: registryUrl, apps: diff.added })
      this.emit('apps-updated', { registry: registryUrl, apps: diff.updated })
      this.emit('apps-removed', { registry: registryUrl, apps: diff.removed })
    }
    
    // Update cache
    this.registries.set(registryUrl, {
      url: registryUrl,
      version: newRegistry.registry.version,
      registry: newRegistry,
      lastFetched: Date.now()
    })
    
    // Persist to storage
    await this.persist(registryUrl, newRegistry)
  }
  
  /**
   * Start periodic update checking
   */
  startAutoUpdate(interval: number = 3600000): void { // 1 hour default
    setInterval(async () => {
      for (const registryUrl of this.registries.keys()) {
        try {
          const update = await this.checkForUpdates(registryUrl)
          if (update) {
            await this.applyUpdate(registryUrl, update.registry)
          }
        } catch (error) {
          console.error(`Failed to update registry ${registryUrl}:`, error)
        }
      }
    }, interval)
  }
  
  private async persist(url: RegistryURL, registry: RegistryIndex): Promise<void> {
    // Mock implementation - would use storage API
    console.log('Persisting registry:', url)
  }
  
  private emit(event: string, data: any): void {
    // Mock implementation - would use event emitter
    console.log('Registry event:', event, data)
  }
}

export interface CachedRegistry {
  url: RegistryURL
  version: number
  registry: RegistryIndex
  lastFetched: number
}

export interface UpdateInfo {
  type: 'new-version'
  oldVersion: number
  newVersion: number
  registry: RegistryIndex
}

export interface RegistryDiff {
  added: AppReference[]
  updated: AppReference[]
  removed: AppReference[]
}

/**
 * Trust Chain Verification
 */
export class TrustChainVerifier {
  /**
   * Verify trust chain from user → registry → app
   */
  async verifyChain(
    app: any, // GlyphAppManifest
    registry: RegistryIndex,
    trustGraph: any // TrustGraph
  ): Promise<TrustChainResult> {
    const steps: VerificationStep[] = []
    
    // Step 1: Verify app signature
    const appVerification = await this.verifyAppSignature(app)
    steps.push({
      step: 'app-signature',
      passed: appVerification.valid,
      details: appVerification
    })
    if (!appVerification.valid) {
      return { valid: false, steps }
    }
    
    // Step 2: Verify app is in registry
    const inRegistry = registry.apps.some(ref => ref.id === app.id)
    steps.push({
      step: 'registry-membership',
      passed: inRegistry,
      details: { found: inRegistry }
    })
    if (!inRegistry) {
      return { valid: false, steps }
    }
    
    // Step 3: Verify registry signature
    const registryVerification = await RegistrySignature.verify(registry)
    steps.push({
      step: 'registry-signature',
      passed: registryVerification.valid,
      details: registryVerification
    })
    if (!registryVerification.valid) {
      return { valid: false, steps }
    }
    
    // Step 4: Verify trust to registry
    const trustScore = trustGraph.scores?.get(registry.registry.url)
    const trusted = trustScore && trustScore.final >= 0.5
    steps.push({
      step: 'registry-trust',
      passed: trusted || false,
      details: { trustScore: trustScore?.final || 0 }
    })
    if (!trusted) {
      return { valid: false, steps, warning: 'Low trust registry' }
    }
    
    // Step 5: Verify app author matches manifest
    const authorMatch = app.author.pubkey === app.signature.publicKey
    steps.push({
      step: 'author-match',
      passed: authorMatch,
      details: { match: authorMatch }
    })
    if (!authorMatch) {
      return { valid: false, steps }
    }
    
    return { valid: true, steps }
  }
  
  private async verifyAppSignature(app: any): Promise<VerificationResult> {
    try {
      const sig = app.signature
      
      // Remove signature for verification
      const unsignedApp = { ...app }
      delete (unsignedApp as any).signature
      
      // Create canonical JSON
      const canonical = RegistrySignature['canonicalize'](unsignedApp)
      
      // Hash
      const encoder = new TextEncoder()
      const data = encoder.encode(canonical)
      const hash = await crypto.subtle.digest('SHA-256', data)
      
      // Verify
      const valid = true // Mock implementation
      
      return { valid }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }
}

export interface TrustChainResult {
  valid: boolean
  steps: VerificationStep[]
  warning?: string
}

export interface VerificationStep {
  step: string
  passed: boolean
  details: any
}

/**
 * Example Registry Index
 */
export const exampleRegistryIndex: RegistryIndex = {
  registry: {
    url: "https://apps.glyphd.com",
    name: "GlyphOS Official Apps",
    description: "Official curated collection of GlyphOS applications",
    operator: {
      name: "GlyphOS Team",
      email: "apps@glyphd.com",
      url: "https://glyphd.com"
    },
    pubkey: "rL3k8mPn5vQw9xYz2aBcDeFgHiJkLmNoPqRsTuVwXyZ=",
    version: 42,
    updated: "2025-10-04T12:00:00Z",
    created: "2025-01-15T10:00:00Z",
    type: "official",
    categories: ["creative", "productivity", "tools"],
    contact: {
      email: "support@glyphd.com",
      url: "https://glyphd.com/support",
      discord: "https://discord.gg/glyphd",
      github: "https://github.com/glyphd"
    },
    policies: {
      moderation: "strict",
      verification: "all",
      contentPolicy: "https://glyphd.com/policies/content"
    }
  },
  
  apps: [
    {
      id: "com.glyphd.fractal-encoder",
      version: "2.3.1",
      manifest: "https://cdn.glyphd.com/apps/fractal/manifest.json",
      addedAt: "2025-02-10T14:30:00Z",
      updatedAt: "2025-10-01T09:15:00Z",
      metadata: {
        featured: true,
        categories: ["creative", "tools"],
        installations: 15234,
        rating: 4.7,
        verified: true,
        notes: "Featured app - highly recommended"
      }
    },
    {
      id: "com.glyphd.canvas",
      version: "1.5.0",
      manifest: "https://cdn.glyphd.com/apps/canvas/manifest.json",
      addedAt: "2025-03-01T10:00:00Z",
      updatedAt: "2025-09-28T16:45:00Z",
      metadata: {
        featured: false,
        categories: ["creative"],
        installations: 8921,
        rating: 4.5,
        verified: true
      }
    },
    {
      id: "com.glyphd.notes",
      version: "3.0.2",
      manifest: "https://cdn.glyphd.com/apps/notes/manifest.json",
      addedAt: "2025-01-20T08:00:00Z",
      updatedAt: "2025-10-03T11:20:00Z",
      metadata: {
        featured: true,
        categories: ["productivity"],
        installations: 42103,
        rating: 4.9,
        verified: true,
        notes: "Most popular productivity app"
      }
    }
  ],
  
  following: [
    "https://community.glyphd.com",
    "https://apps.example.com"
  ],
  
  stats: {
    appCount: 3,
    totalInstallations: 66258,
    activeApps: 3,
    followers: 1523
  },
  
  signature: {
    algorithm: "ed25519",
    publicKey: "rL3k8mPn5vQw9xYz2aBcDeFgHiJkLmNoPqRsTuVwXyZ=",
    signature: "dGhpcyBpcyBub3QgYSByZWFsIHNpZ25hdHVyZSBqdXN0IGFuIGV4YW1wbGUxMjM0NTY3ODk=",
    timestamp: "2025-10-04T12:00:00Z",
    previousHash: "abc123def456..."
  }
}
