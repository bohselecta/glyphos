/**
 * Trust Score Computation Types
 * Defines interfaces for trust graph, nodes, and scoring algorithms
 */

export type RegistryURL = string
export type PeerID = string

export interface TrustGraph {
  // Direct edges (explicit follows)
  edges: Map<RegistryURL, Set<RegistryURL>>
  
  // Node metadata
  nodes: Map<RegistryURL, RegistryNode>
  
  // Computed scores (cached)
  scores: Map<RegistryURL, TrustScore>
  
  // User's root trust
  userTrusted: Set<RegistryURL>
  
  // Blocklist
  blocked: Set<RegistryURL>
}

export interface RegistryNode {
  url: RegistryURL
  pubkey: string
  
  // Reputation signals
  appCount: number
  installCount: number
  reportCount: number
  age: number // Days since first seen
  
  // Social signals
  followerCount: number
  followingCount: number
  
  // Quality signals
  avgAppRating: number
  updateFrequency: number // Updates per month
}

export interface TrustScore {
  // Components
  direct: number       // 0-1: User explicitly trusted
  transitive: number   // 0-1: Trusted by trusted parties
  reputation: number   // 0-1: Community reputation
  
  // Final weighted score
  final: number        // 0-1: Combined score
  
  // Metadata
  computedAt: number
  hops: number        // Distance from user (0 = direct trust)
}

export interface CachedScore {
  score: TrustScore
  computedAt: number
}

export interface ConnectionStats {
  latency: number
  packetLoss: number
  bandwidth: number
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidate
  from?: PeerID
  to?: PeerID
}
