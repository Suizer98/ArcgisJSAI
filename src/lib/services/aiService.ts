import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getSystemPrompt } from '../prompts'
import { AI_CONFIG, getApiKey, hasValidApiKey } from '../aiConfig'
import { mapTools } from '../tools/mapTools'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export class AIService {
  private messages: ChatMessage[] = []
  private groq: any

  constructor() {
    // Initialize Groq client
    this.groq = createGroq({
      apiKey: getApiKey()
    })
  }

  // Add a message to the conversation
  addMessage(role: 'user' | 'assistant', content: string): ChatMessage {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role,
      content
    }
    this.messages.push(message)
    return message
  }

  // Get all messages
  getMessages(): ChatMessage[] {
    return this.messages
  }

  // Clear all messages
  clearMessages(): void {
    this.messages = []
  }

  // Process user input and get AI response with tool calling
  async processUserInput(userInput: string): Promise<{
    userMessage: ChatMessage
    aiMessage: ChatMessage
    isLoading: boolean
  }> {
    // Check if API key is valid
    if (!hasValidApiKey()) {
      const userMessage = this.addMessage('user', userInput)
      const aiMessage = this.addMessage('assistant', 'Please set your VITE_GROQ_API_KEY in the .env file to use the AI chat.')
      return { userMessage, aiMessage, isLoading: false }
    }

    // Add user message
    const userMessage = this.addMessage('user', userInput)

    try {
      // Convert our messages to AI SDK format
      const aiMessages = this.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Use AI SDK with tool calling
      const result = await generateText({
        model: this.groq(AI_CONFIG.model),
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          ...aiMessages
        ],
        tools: mapTools,
        temperature: AI_CONFIG.temperature
      })

      // Process the response
      let responseText = result.text.trim()
      
      // Add tool call information if any tools were used
      if (result.toolCalls && result.toolCalls.length > 0) {
        responseText += '**Map Operations Performed:**'
        result.toolCalls.forEach((toolCall, index) => {
          responseText += `\n- ${toolCall.toolName}: ${JSON.stringify(toolCall.input)}`
        })
      }

      // Add tool results if available
      if (result.toolResults && result.toolResults.length > 0) {
        responseText += '\n\n**Results:**'
        result.toolResults.forEach((toolResult, index) => {
          const toolResultData = toolResult.output as any
          
          if (toolResultData) {
            if (toolResultData.success) {
              // Show only coordinates and location, skip the generic success message
              if (toolResultData.coordinates) {
                responseText += `\n✅ ${toolResultData.coordinates.latitude.toFixed(6)}, ${toolResultData.coordinates.longitude.toFixed(6)}`
              }
              if (toolResultData.location) {
                responseText += `\n🏙️ ${toolResultData.location}`
              }
              if (toolResultData.zoomLevel) {
                responseText += `\n🔍 Zoom: ${toolResultData.zoomLevel}`
              }
              if (toolResultData.state) {
                responseText += `\n📊 Current: ${toolResultData.state.center.latitude.toFixed(6)}, ${toolResultData.state.center.longitude.toFixed(6)}, Zoom ${toolResultData.state.zoom}`
              }
              if (toolResultData.currentState) {
                responseText += `\n📊 Current: ${toolResultData.currentState.center.latitude.toFixed(6)}, ${toolResultData.currentState.center.longitude.toFixed(6)}, Zoom ${toolResultData.currentState.zoom}`
              }
              if (toolResultData.availableOperations) {
                responseText += `\n🛠️ Available Operations:`
                toolResultData.availableOperations.forEach((op: string) => {
                  responseText += `\n• ${op}`
                })
              }
            } else {
              responseText += `\n❌ ${toolResultData.message}`
              if (toolResultData.error) {
                responseText += `\nError: ${toolResultData.error}`
              }
            }
          } else {
            // Fallback if toolResultData is null/undefined
            responseText += `\n⚠️ Tool executed but no result data available`
          }
        })
      }

      const aiMessage = this.addMessage('assistant', responseText)

      return { userMessage, aiMessage, isLoading: false }

    } catch (error) {
      console.error('Error calling AI:', error)
      
      const aiMessage = this.addMessage('assistant', AI_CONFIG.errorMessage)

      return { userMessage, aiMessage, isLoading: false }
    }
  }

}

// Export singleton instance
export const aiService = new AIService();
