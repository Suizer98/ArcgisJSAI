import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getApiKey, hasValidApiKey } from '../aiConfig'

const DEFAULT_GREETING = "Hi there! I'm your Map Explorer, here to help you chart your way, find hidden gems, and uncover new adventures. What place or route would you like to discover next?"

export class GreetingService {
  // Generate AI greeting
  async generateAIGreeting(): Promise<string> {
    // Return default greeting if no API key
    if (!hasValidApiKey()) {
      return DEFAULT_GREETING
    }

    try {
      // Generate a dynamic greeting using AI
      const groq = createGroq({ apiKey: getApiKey() })
      
      const result = await generateText({
        model: groq('llama-3.1-8b-instant'),
        messages: [{
          role: 'user',
          content: `Generate a friendly, welcoming greeting for an ArcGIS AI Map Assistant. The greeting should:
- Be concise (1-2 sentences)
- Be enthusiastic about helping with maps and navigation
- Encourage users to ask specific map-related questions
- Mention capabilities like finding locations, getting directions, or exploring areas
- Sound natural and conversational
- NOT include any technical details or map operations
- NOT be generic - make it specific to map assistance

Examples of good greetings:
- "Hi! I'm your ArcGIS Map Assistant. I can help you find locations, get directions, and explore new places. What would you like to discover today?"
- "Welcome! I'm here to help you navigate and explore the world through maps. Ask me about any location or place you'd like to know more about!"

Generate a unique, engaging greeting:`
        }],
        temperature: 0.9
      })
      
      return result.text.trim()
    } catch (error) {
      console.error('Error generating AI greeting:', error)
      return DEFAULT_GREETING
    }
  }
}

// Export singleton instance
export const greetingService = new GreetingService()
