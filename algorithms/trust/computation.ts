/**
 * Trust Score Computation Algorithm
 * Implements PageRank-style trust propagation with reputation signals
 */

import type { TrustGraph, RegistryURL, TrustScore, RegistryNode, CachedScore } from './types'

/**
 * TrustRank Algorithm - Modified PageRank for trust networks
 */
export class TrustComputation {
  private damping = 0.85  // Trust decay factor
  private iterations = 20 // Convergence iterations
  
  /**
   * Compute trust scores for all registries
   * Based on PageRank with personalized teleportation
   */
  computeTrustScores(graph: TrustGraph): Map<RegistryURL, number> {
    const scores = new Map<RegistryURL, number>()
    const newScores = new Map<RegistryURL, number>()
    
    // Initialize: user-trusted registries get score 1.0, others get 0
    for (const [url] of graph.nodes) {
      scores.set(url, graph.userTrusted.has(url) ? 1.0 : 0.0)
    }
    
    // Iterate until convergence
    for (let iter = 0; iter < this.iterations; iter++) {
      // For each node
      for (const [url] of graph.nodes) {
        let score = 0
        
        // Teleportation (return to trusted set)
        const teleportProb = 1 - this.damping
        if (graph.userTrusted.has(url)) {
          score += teleportProb
        }
        
        // Random walk (trust propagation)
        const incomingEdges = this.getIncomingEdges(graph, url)
        for (const sourceUrl of incomingEdges) {
          const sourceScore = scores.get(sourceUrl) || 0
          const sourceOutDegree = graph.edges.get(sourceUrl)?.size || 1
          
          // Trust flows from source, divided by out-degree
          score += this.damping * (sourceScore / sourceOutDegree)
        }
        
        newScores.set(url, score)
      }
      
      // Swap for next iteration
      scores.clear()
      for (const [url, score] of newScores) {
        scores.set(url, score)
      }
      newScores.clear()
    }
    
    // Normalize to 0-1 range
    const maxScore = Math.max(...scores.values())
    if (maxScore > 0) {
      for (const [url, score] of scores) {
        scores.set(url, score / maxScore)
      }
    }
    
    return scores
  }
  
  private getIncomingEdges(graph: TrustGraph, target: RegistryURL): Set<RegistryURL> {
    const incoming = new Set<RegistryURL>()
    for (const [source, targets] of graph.edges) {
      if (targets.has(target)) {
        incoming.add(source)
      }
    }
    return incoming
  }
}

/**
 * Reputation Score Computation
 * Uses Wilson Score for statistical confidence
 */
export class ReputationComputation {
  /**
   * Compute reputation from multiple signals
   * Uses Wilson Score for statistical confidence
   */
  computeReputation(node: RegistryNode): number {
    const scores: number[] = []
    
    // 1. Install-based reputation
    const installScore = this.wilsonScore(
      node.installCount,
      node.appCount * 100 // Assume avg 100 installs = success
    )
    scores.push(installScore)
    
    // 2. Quality score (ratings)
    if (node.avgAppRating > 0) {
      scores.push(node.avgAppRating / 5.0) // Normalize to 0-1
    }
    
    // 3. Longevity bonus
    const ageBonus = Math.min(node.age / 365, 1.0) // Cap at 1 year
    scores.push(ageBonus * 0.5) // Half weight
    
    // 4. Activity score
    const activityScore = Math.min(node.updateFrequency / 4, 1.0) // Cap at 4 updates/month
    scores.push(activityScore)
    
    // 5. Penalty for reports
    const reportPenalty = Math.max(0, 1 - (node.reportCount / 10))
    
    // Weighted average
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    return avgScore * reportPenalty
  }
  
  /**
   * Wilson Score Interval (lower bound)
   * Gives statistical confidence for ratings
   */
  private wilsonScore(positive: number, total: number): number {
    if (total === 0) return 0
    
    const z = 1.96 // 95% confidence
    const phat = positive / total
    
    const numerator = phat + (z * z) / (2 * total) - 
                      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total)
    const denominator = 1 + (z * z) / total
    
    return Math.max(0, numerator / denominator)
  }
}

/**
 * Sybil Attack Detection
 * Detects suspicious patterns that indicate Sybil attack
 */
export class SybilDetection {
  /**
   * Detect suspicious patterns that indicate Sybil attack
   */
  detectSybilCluster(graph: TrustGraph, registry: RegistryURL): number {
    const node = graph.nodes.get(registry)!
    let suspicionScore = 0
    
    // Red flags:
    
    // 1. Many followers, few following (fake popularity)
    if (node.followerCount > 100 && node.followingCount < 10) {
      suspicionScore += 0.3
    }
    
    // 2. New registry with high install count (buying installs)
    if (node.age < 30 && node.installCount > 10000) {
      suspicionScore += 0.4
    }
    
    // 3. Circular following patterns
    const circularityScore = this.detectCircularity(graph, registry)
    suspicionScore += circularityScore * 0.3
    
    // 4. Low diversity in followers (same IPs, patterns)
    // Note: would need server-side data for this
    
    return Math.min(suspicionScore, 1.0)
  }
  
  /**
   * Detect circular following (A→B→C→A)
   */
  private detectCircularity(graph: TrustGraph, start: RegistryURL): number {
    const visited = new Set<RegistryURL>()
    const path = new Set<RegistryURL>()
    
    const dfs = (current: RegistryURL, depth: number): boolean => {
      if (depth > 5) return false // Limit search depth
      if (path.has(current)) return true // Cycle found
      if (visited.has(current)) return false
      
      visited.add(current)
      path.add(current)
      
      const neighbors = graph.edges.get(current) || new Set()
      for (const neighbor of neighbors) {
        if (dfs(neighbor, depth + 1)) return true
      }
      
      path.delete(current)
      return false
    }
    
    return dfs(start, 0) ? 1.0 : 0.0
  }
}

/**
 * Final Trust Score Calculator
 * Combines direct trust, transitive trust, and reputation
 */
export class TrustScoreCalculator {
  private weights = {
    direct: 1.0,      // Direct trust is absolute
    transitive: 0.6,  // Transitive trust decays
    reputation: 0.3   // Reputation is a weak signal
  }
  
  computeFinalScore(registry: RegistryURL, graph: TrustGraph): TrustScore {
    // 1. Direct trust
    const direct = graph.userTrusted.has(registry) ? 1.0 : 0.0
    
    // 2. Transitive trust (from PageRank)
    const trustRank = new TrustComputation()
    const transitiveScores = trustRank.computeTrustScores(graph)
    const transitive = transitiveScores.get(registry) || 0.0
    
    // 3. Reputation
    const node = graph.nodes.get(registry)!
    const repComputation = new ReputationComputation()
    const reputation = repComputation.computeReputation(node)
    
    // Compute hops from user
    const hops = this.computeHops(graph, registry)
    
    // Decay transitive trust by distance
    const decayedTransitive = transitive * Math.pow(0.8, hops - 1)
    
    // Weighted combination
    const totalWeight = this.weights.direct + this.weights.transitive + this.weights.reputation
    const final = (
      direct * this.weights.direct +
      decayedTransitive * this.weights.transitive +
      reputation * this.weights.reputation
    ) / totalWeight
    
    return {
      direct,
      transitive: decayedTransitive,
      reputation,
      final,
      computedAt: Date.now(),
      hops
    }
  }
  
  /**
   * BFS to find shortest path (hops) from user to registry
   */
  private computeHops(graph: TrustGraph, target: RegistryURL): number {
    if (graph.userTrusted.has(target)) return 0
    
    const queue: Array<[RegistryURL, number]> = []
    const visited = new Set<RegistryURL>()
    
    // Start from all user-trusted registries
    for (const trusted of graph.userTrusted) {
      queue.push([trusted, 0])
      visited.add(trusted)
    }
    
    while (queue.length > 0) {
      const [current, depth] = queue.shift()!
      
      // Check neighbors
      const neighbors = graph.edges.get(current) || new Set()
      for (const neighbor of neighbors) {
        if (neighbor === target) {
          return depth + 1
        }
        
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([neighbor, depth + 1])
        }
      }
    }
    
    return Infinity // Not reachable
  }
}

/**
 * Trust Score Cache
 * Caches computed trust scores with TTL
 */
export class TrustScoreCache {
  private cache = new Map<RegistryURL, CachedScore>()
  private cacheTTL = 1000 * 60 * 60 // 1 hour
  
  get(registry: RegistryURL, graph: TrustGraph): TrustScore {
    const cached = this.cache.get(registry)
    
    // Cache hit and still fresh
    if (cached && Date.now() - cached.computedAt < this.cacheTTL) {
      return cached.score
    }
    
    // Recompute
    const calculator = new TrustScoreCalculator()
    const score = calculator.computeFinalScore(registry, graph)
    
    this.cache.set(registry, { score, computedAt: Date.now() })
    return score
  }
  
  /**
   * Invalidate cache when graph changes
   */
  invalidate(registry?: RegistryURL) {
    if (registry) {
      this.cache.delete(registry)
      
      // Also invalidate anything that depends on this registry
      // (anything it follows or that follows it)
    } else {
      this.cache.clear() // Full invalidation
    }
  }
}
