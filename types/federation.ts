/**
 * Federation interfaces - Decentralized app discovery and distribution
 */

import type { GlyphAppManifest, AppID, RegistryURL } from './gam.js'

export interface FederationClient {
  /** Follow a registry */
  follow(registry: RegistryURL): Promise<void>
  
  /** Unfollow a registry */
  unfollow(registry: RegistryURL): Promise<void>
  
  /** List followed registries */
  listFollowed(): Registry[]
  
  /** Sync all registries */
  syncAll(): Promise<Update[]>
  
  /** Search apps across all registries */
  search(query: string, filters?: SearchFilters): Promise<SearchResult[]>
  
  /** Get app by ID */
  getApp(appId: AppID): Promise<GlyphAppManifest | null>
  
  /** Install app */
  install(appId: AppID, registry?: RegistryURL): Promise<void>
  
  /** Update app */
  update(appId: AppID): Promise<void>
  
  /** Uninstall app */
  uninstall(appId: AppID): Promise<void>
  
  /** List installed apps */
  listInstalled(): InstalledApp[]
}

export interface Registry {
  url: RegistryURL
  name: string
  description?: string
  pubkey: string
  trustScore: number
  followedAt: number
  lastSync?: number
}

export interface Update {
  type: "new" | "update" | "removed"
  manifest: GlyphAppManifest
  registry: RegistryURL
}

export interface SearchResult {
  manifest: GlyphAppManifest
  score: number
  registry: RegistryURL
  trustScore: number
}

export interface SearchFilters {
  categories?: string[]
  tags?: string[]
  minTrustScore?: number
  maxResults?: number
}

export interface InstalledApp {
  manifest: GlyphAppManifest
  installedAt: number
  updatedAt?: number
  registry: RegistryURL
  state: "installed" | "updating" | "error"
}

/**
 * Registry Index Format
 */
export interface RegistryIndex {
  registry: RegistryURL
  pubkey: string
  name: string
  description: string
  version: string
  updated: string
  
  apps: string[] // URLs to manifest files
  
  signature: {
    algorithm: "ed25519"
    publicKey: string
    signature: string
    timestamp: string
  }
}

/**
 * Trust Graph - Computes trust scores for registries
 */
export interface TrustGraph {
  /** Add trust relationship */
  addTrust(from: RegistryURL, to: RegistryURL, weight: number): void
  
  /** Remove trust relationship */
  removeTrust(from: RegistryURL, to: RegistryURL): void
  
  /** Compute trust score */
  computeTrust(registry: RegistryURL): TrustScore
  
  /** Get trust path */
  getTrustPath(from: RegistryURL, to: RegistryURL): TrustPath | null
}

export interface TrustScore {
  direct: number       // 0-1, user explicitly trusted
  transitive: number   // 0-1, trusted by trusted registries
  reputation: number   // 0-1, community signals
  final: number        // Weighted combination
}

export interface TrustPath {
  path: RegistryURL[]
  score: number
}

/**
 * Verifier - Cryptographic signature verification
 */
export interface Verifier {
  /** Verify manifest signature */
  verifyManifest(manifest: GlyphAppManifest): Promise<boolean>
  
  /** Verify registry index signature */
  verifyRegistryIndex(index: RegistryIndex): Promise<boolean>
  
  /** Verify app bundle integrity */
  verifyBundle(url: string, expectedHash: string): Promise<boolean>
  
  /** Add trusted public key */
  addTrustedKey(pubkey: string, name?: string): void
  
  /** Remove trusted public key */
  removeTrustedKey(pubkey: string): void
  
  /** List trusted keys */
  listTrustedKeys(): TrustedKey[]
}

export interface TrustedKey {
  pubkey: string
  name?: string
  addedAt: number
}
