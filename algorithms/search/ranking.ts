/**
 * Search Ranking Algorithms
 * Implements fuzzy matching, TF-IDF, and personalized ranking
 */

import type { MatchResult, SearchMatch, SearchOptions, SearchResult, HighlightedText } from '../crdt/types'

export interface UserProfile {
  appUsage: Map<string, number>      // App → usage count
  lastUsed: Map<string, number>      // App → timestamp
  categoryPreferences: Map<string, number> // Category → 0-1 preference
}

/**
 * Fuzzy string matching with position bonus
 * Based on Sublime Text's algorithm
 */
export class FuzzyMatcher {
  /**
   * Match query against target
   * Returns score (0-1) and match positions
   */
  match(query: string, target: string): MatchResult {
    query = query.toLowerCase()
    target = target.toLowerCase()
    
    const matches: number[] = []
    let queryIndex = 0
    let score = 0
    let consecutiveBonus = 0
    
    for (let targetIndex = 0; targetIndex < target.length; targetIndex++) {
      if (queryIndex >= query.length) break
      
      if (target[targetIndex] === query[queryIndex]) {
        matches.push(targetIndex)
        
        // Base score
        score += 1
        
        // Position bonus (earlier matches score higher)
        const positionBonus = 1 - (targetIndex / target.length)
        score += positionBonus * 0.5
        
        // Consecutive match bonus
        if (matches.length > 1 && matches[matches.length - 1] === matches[matches.length - 2] + 1) {
          consecutiveBonus += 0.3
        } else {
          consecutiveBonus = 0
        }
        score += consecutiveBonus
        
        // Word boundary bonus (match at start of word)
        if (targetIndex === 0 || target[targetIndex - 1] === ' ' || target[targetIndex - 1] === '-') {
          score += 0.8
        }
        
        // Case match bonus (original case preserved)
        const origQuery = query[queryIndex]
        const origTarget = target[targetIndex]
        if (origQuery === origTarget) {
          score += 0.1
        }
        
        queryIndex++
      }
    }
    
    // Did we match entire query?
    if (queryIndex < query.length) {
      return { score: 0, matches: [] }
    }
    
    // Normalize score by target length
    const normalizedScore = score / target.length
    
    return {
      score: Math.min(normalizedScore, 1),
      matches
    }
  }
}

/**
 * Search across multiple fields with different weights
 */
export class MultiFieldSearch {
  private weights = {
    name: 3.0,        // Highest priority
    description: 1.5,
    tags: 2.0,
    categories: 1.0,
    author: 0.5
  }
  
  search(query: string, app: any): SearchMatch {
    const matcher = new FuzzyMatcher()
    const fieldScores: Record<string, number> = {}
    
    // Match against each field
    const nameMatch = matcher.match(query, app.manifest.name)
    fieldScores.name = nameMatch.score
    
    const descMatch = matcher.match(query, app.manifest.description)
    fieldScores.description = descMatch.score
    
    // Tags (check each tag)
    if (app.manifest.tags) {
      const tagScores = app.manifest.tags.map((tag: string) => matcher.match(query, tag).score)
      fieldScores.tags = Math.max(...tagScores, 0)
    }
    
    // Categories
    const catScores = app.manifest.categories.map((cat: string) => matcher.match(query, cat).score)
    fieldScores.categories = Math.max(...catScores, 0)
    
    // Author
    const authorMatch = matcher.match(query, app.author.name)
    fieldScores.author = authorMatch.score
    
    // Weighted combination
    let totalScore = 0
    let totalWeight = 0
    
    for (const [field, score] of Object.entries(fieldScores)) {
      const weight = this.weights[field as keyof typeof this.weights]
      totalScore += score * weight
      totalWeight += weight
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0
    
    return {
      app,
      score: finalScore,
      fieldScores
    }
  }
}

/**
 * Personalize search results based on user behavior
 */
export class PersonalizedRanking {
  private userProfile: UserProfile
  
  constructor(userProfile: UserProfile) {
    this.userProfile = userProfile
  }
  
  /**
   * Boost results based on user history
   */
  personalize(results: SearchMatch[]): SearchMatch[] {
    return results.map(match => {
      let boost = 1.0
      
      // Frequently used apps
      const usageCount = this.userProfile.appUsage.get(match.app.id) || 0
      if (usageCount > 0) {
        boost *= 1 + Math.log10(usageCount + 1) * 0.3
      }
      
      // Recently used
      const lastUsed = this.userProfile.lastUsed.get(match.app.id)
      if (lastUsed) {
        const hoursSince = (Date.now() - lastUsed) / (1000 * 60 * 60)
        if (hoursSince < 24) {
          boost *= 1.5 // Used in last 24h
        } else if (hoursSince < 168) {
          boost *= 1.2 // Used in last week
        }
      }
      
      // Category preference
      for (const category of match.app.manifest.categories) {
        const categoryScore = this.userProfile.categoryPreferences.get(category) || 0
        boost *= 1 + categoryScore * 0.2
      }
      
      // Recency bias (newer apps slightly boosted)
      const daysSincePublish = (Date.now() - new Date(match.app.signature.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublish < 30) {
        boost *= 1.1 // Published in last month
      }
      
      return {
        ...match,
        score: match.score * boost
      }
    })
  }
}

/**
 * TF-IDF (Term Frequency-Inverse Document Frequency)
 * For searching within app descriptions/content
 */
export class TFIDFSearch {
  private idf = new Map<string, number>() // Term → IDF score
  private totalDocs = 0
  
  /**
   * Build IDF index from all apps
   */
  buildIndex(apps: any[]) {
    this.totalDocs = apps.length
    const docFrequency = new Map<string, number>()
    
    // Count document frequency for each term
    for (const app of apps) {
      const terms = this.extractTerms(app)
      const uniqueTerms = new Set(terms)
      
      for (const term of uniqueTerms) {
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1)
      }
    }
    
    // Compute IDF
    for (const [term, df] of docFrequency) {
      this.idf.set(term, Math.log(this.totalDocs / df))
    }
  }
  
  /**
   * Score document for query
   */
  score(query: string, app: any): number {
    const queryTerms = this.tokenize(query)
    const docTerms = this.extractTerms(app)
    
    // Term frequency in document
    const tf = new Map<string, number>()
    for (const term of docTerms) {
      tf.set(term, (tf.get(term) || 0) + 1)
    }
    
    // Normalize by doc length
    const maxFreq = Math.max(...tf.values(), 1)
    for (const [term, freq] of tf) {
      tf.set(term, freq / maxFreq)
    }
    
    // Compute TF-IDF score
    let score = 0
    for (const queryTerm of queryTerms) {
      const termTF = tf.get(queryTerm) || 0
      const termIDF = this.idf.get(queryTerm) || 0
      score += termTF * termIDF
    }
    
    return score
  }
  
  private extractTerms(app: any): string[] {
    const text = [
      app.manifest.name,
      app.manifest.description,
      app.manifest.longDescription || '',
      ...(app.manifest.tags || [])
    ].join(' ')
    
    return this.tokenize(text)
  }
  
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2) // Remove short words
  }
}

/**
 * Complete search pipeline
 */
export class SearchEngine {
  private fuzzyMatcher = new FuzzyMatcher()
  private multiField = new MultiFieldSearch()
  private tfidf = new TFIDFSearch()
  private personalizer: PersonalizedRanking
  
  constructor(userProfile: UserProfile) {
    this.personalizer = new PersonalizedRanking(userProfile)
  }
  
  search(query: string, apps: any[], options?: SearchOptions): SearchResult[] {
    // Stage 1: Fuzzy match filter
    const candidates = apps
      .map(app => this.multiField.search(query, app))
      .filter(match => match.score > 0.1) // Minimum threshold
    
    // Stage 2: TF-IDF boost for content relevance
    for (const match of candidates) {
      const tfidfScore = this.tfidf.score(query, match.app)
      match.score = match.score * 0.7 + tfidfScore * 0.3 // Combine scores
    }
    
    // Stage 3: Trust score boost
    for (const match of candidates) {
      const trustScore = this.getTrustScore(match.app)
      match.score *= 1 + trustScore * 0.5 // Up to 50% boost from trust
    }
    
    // Stage 4: Personalization
    const personalized = this.personalizer.personalize(candidates)
    
    // Stage 5: Apply filters
    let filtered = personalized
    if (options?.categories) {
      filtered = filtered.filter(m => 
        m.app.manifest.categories.some((c: string) => options.categories!.includes(c))
      )
    }
    if (options?.minTrust) {
      filtered = filtered.filter(m => this.getTrustScore(m.app) >= options.minTrust!)
    }
    
    // Stage 6: Sort and return
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit || 50)
      .map(match => ({
        app: match.app,
        score: match.score,
        trustScore: this.getTrustScore(match.app),
        highlights: this.getHighlights(query, match.app)
      }))
  }
  
  private getTrustScore(_app: any): number {
    // Integrate with trust score system
    return 0.8 // Placeholder
  }
  
  private getHighlights(query: string, app: any): HighlightedText {
    // Return text snippets with query highlighted
    const matcher = this.fuzzyMatcher
    const nameMatch = matcher.match(query, app.manifest.name)
    
    return {
      name: {
        text: app.manifest.name,
        matches: nameMatch.matches
      }
    }
  }
}
