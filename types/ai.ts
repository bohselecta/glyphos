/**
 * AI Provider interfaces - Multi-provider AI integration
 */

import type { AIProvider } from './gam.js'

export interface AIManager {
  /** Text completion */
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  
  /** Streaming completion */
  stream(prompt: string, options?: CompletionOptions): AsyncIterator<string>
  
  /** Generate embeddings */
  embed(text: string, options?: EmbedOptions): Promise<number[]>
  
  /** Chat completion */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatMessage>
  
  /** Get usage stats */
  getUsage(): AIUsage
  
  /** Set API keys */
  setKey(provider: AIProvider, key: string): void
  
  /** List available providers */
  listProviders(): ProviderInfo[]
}

export interface CompletionOptions {
  provider?: AIProvider
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  stop?: string[]
  stream?: boolean
}

export interface EmbedOptions {
  provider?: AIProvider
  model?: string
}

export interface ChatOptions extends CompletionOptions {
  systemPrompt?: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AIUsage {
  tokensUsed: number
  tokensRemaining: number
  requestCount: number
  providers: Record<AIProvider, ProviderUsage>
}

export interface ProviderUsage {
  tokensUsed: number
  requestCount: number
  cost?: number  // If we track costs
}

export interface ProviderInfo {
  name: AIProvider
  configured: boolean  // Has API key
  models: ModelInfo[]
}

export interface ModelInfo {
  id: string
  name: string
  contextWindow: number
  pricing?: {
    input: number  // Per token
    output: number
  }
}
