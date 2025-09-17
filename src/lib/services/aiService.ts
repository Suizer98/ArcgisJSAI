import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { getSystemPrompt } from '../prompts';
import { AI_CONFIG, getApiKey, hasValidApiKey } from '../aiConfig';
import { mapTools } from '../tools/mapTools';
import { ToolExecutor } from './toolExecutor';
import { ResponseProcessor } from './responseProcessor';
import type { ChatMessage, AIResponse } from './types';

// Remove webSearch from available tools since it provides fake data
const { webSearch, ...realMapTools } = mapTools;

export class AIService {
  private messages: ChatMessage[] = [];
  private groq: any;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 seconds between requests to avoid rate limiting

  constructor() {
    // Initialize Groq client
    this.groq = createGroq({
      apiKey: getApiKey(),
    });
  }

  // Add a message to the conversation
  addMessage(role: 'user' | 'assistant', content: string): ChatMessage {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  // Get all messages
  getMessages(): ChatMessage[] {
    return this.messages;
  }

  // Clear all messages
  clearMessages(): void {
    this.messages = [];
  }

  // Process user input and get AI response with tool calling
  async processUserInput(userInput: string): Promise<AIResponse> {
    // Check if API key is valid
    if (!hasValidApiKey()) {
      const userMessage = this.addMessage('user', userInput);
      const aiMessage = this.addMessage(
        'assistant',
        'Please set your VITE_GROQ_API_KEY in the .env file to use the AI chat.'
      );
      return { userMessage, aiMessage, isLoading: false };
    }

    // Add user message
    const userMessage = this.addMessage('user', userInput);

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();

    try {
      // Convert our messages to AI SDK format
      const aiMessages = this.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Use AI SDK with tool calling
      console.log('Available tools:', Object.keys(realMapTools));
      console.log('Calling AI with tools...');
      const result = await generateText({
        model: this.groq(AI_CONFIG.model),
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          ...aiMessages,
        ],
        tools: realMapTools,
        temperature: AI_CONFIG.temperature,
      });
      console.log('AI call completed, processing result...');

      // Get response text and tool results
      let responseText = result.text || '';
      let toolCalls: any[] = result.toolCalls || [];
      let toolResults: any[] = result.toolResults || [];

      // Execute missing tools if needed
      toolResults = await ToolExecutor.executeMissingTools(
        toolCalls,
        toolResults,
        aiMessages
      );

      console.log('Tool calls found:', toolCalls.length);
      console.log('Tool results found:', toolResults.length);

      console.log('AI result:', {
        text: responseText,
        toolCalls: toolCalls,
        toolResults: toolResults,
      });

      // Process the response
      responseText = responseText.trim();

      // Handle malformed responses from AI
      if (
        responseText.includes('<function=') ||
        responseText.includes('<function>')
      ) {
        console.log(
          'AI returned malformed response with HTML-like tags:',
          responseText
        );
        responseText =
          'I encountered an issue with the response format. Please try asking again.';
      }

      // If AI didn't provide text but called tools, provide a helpful response
      if (!responseText && toolCalls.length > 0) {
        console.log(
          'AI called tools but provided no text - providing helpful response'
        );
        responseText =
          "I've performed the requested operations. Here are the results:";
      }

      // Process tool calls and results
      responseText = ResponseProcessor.processToolCalls(
        toolCalls,
        responseText
      );
      responseText = ResponseProcessor.processToolResults(
        toolResults,
        responseText
      );

      // Fallback: If geolocation was called but no results, try direct geolocation
      if (toolCalls && toolCalls.length > 0) {
        const geolocationCall = toolCalls.find(
          call =>
            call.toolName === 'getCurrentLocation' ||
            call.toolName === 'centerOnCurrentLocation'
        );

        if (geolocationCall && (!toolResults || toolResults.length === 0)) {
          console.log(
            'Geolocation tool called but no results - trying direct fallback'
          );
          try {
            const { mapController } = await import('../Map/mapController');
            const directResult = await mapController.getCurrentLocation();

            if (directResult.success && directResult.coordinates) {
              // Add fallback results seamlessly without showing "Fallback Results" label
              responseText += '\n\n**Results:**';
              responseText += `\n✅ Location: ${directResult.coordinates.lat.toFixed(6)}, ${directResult.coordinates.lng.toFixed(6)}`;
              if (directResult.accuracy) {
                responseText += `\n🎯 Accuracy: ±${Math.round(directResult.accuracy)}m`;
              }
              responseText += `\n🏙️ ${directResult.message}`;
            }
          } catch (fallbackError) {
            console.error('Fallback geolocation failed:', fallbackError);
          }
        }
      }

      const aiMessage = this.addMessage('assistant', responseText);

      return { userMessage, aiMessage, isLoading: false };
    } catch (error) {
      console.error('Error calling AI:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });

      // Handle specific error types
      let errorMessage = AI_CONFIG.errorMessage;

      if (error instanceof Error) {
        if (
          error.message.includes('429') ||
          error.message.includes('Too Many Requests')
        ) {
          errorMessage =
            "I'm getting too many requests right now. Please wait a moment and try again.";
        } else if (
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
        ) {
          errorMessage = 'API key issue. Please check your configuration.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        }
      }

      const aiMessage = this.addMessage('assistant', errorMessage);

      return { userMessage, aiMessage, isLoading: false };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
