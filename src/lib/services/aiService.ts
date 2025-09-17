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
  private minRequestInterval: number = 3000; // 3 seconds between requests to avoid rate limiting
  private retryCount: number = 0;
  private maxRetries: number = 3;

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

  // Clear old messages but keep recent ones
  clearOldMessages(): void {
    if (this.messages.length <= 2) {
      return; // Keep at least the current user message and system message
    }

    // Keep only the last 2 messages
    this.messages = this.messages.slice(-2);
    console.log(
      `Cleared old messages, keeping ${this.messages.length} recent messages`
    );
  }

  // Trim conversation history to reduce token usage
  private trimConversationHistory(): void {
    if (this.messages.length <= 2) {
      return; // Keep at least the current user message and system message
    }

    // Keep the last 3 messages (system messages are handled in the prompt)
    this.messages = this.messages.slice(-3);
    console.log(
      `Trimmed conversation history to ${this.messages.length} messages`
    );
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

    // Proactively trim conversation if it's getting too long
    if (this.messages.length > 10) {
      console.log('Conversation getting long, trimming proactively...');
      this.trimConversationHistory();
    }

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

      let result;
      let lastError;

      // Retry logic for rate limiting
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          result = await generateText({
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
          this.retryCount = 0; // Reset retry count on success
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.log(`AI call attempt ${attempt + 1} failed:`, error);

          // Check if it's a rate limit error
          const isRateLimit =
            error instanceof Error &&
            (error.message.includes('429') ||
              error.message.includes('Rate limit') ||
              error.message.includes('Too Many Requests') ||
              error.message.includes('tokens per minute'));

          if (isRateLimit) {
            console.log(
              'Rate limit detected, trimming conversation history...'
            );

            // More aggressive trimming on subsequent rate limit hits
            if (attempt > 0) {
              this.clearOldMessages(); // Keep only last 2 messages
            } else {
              this.trimConversationHistory(); // Keep last 3 messages
            }

            // For rate limits, wait longer before retry
            const waitTime = Math.min(5000 * Math.pow(2, attempt), 30000); // 5s, 10s, 20s, 30s max
            console.log(
              `Rate limit hit, waiting ${waitTime}ms before retry...`
            );
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (attempt < this.maxRetries) {
            // For other errors, use shorter wait time
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      if (!result) {
        throw lastError || new Error('All retry attempts failed');
      }
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

      // Handle malformed responses from AI
      const malformedPattern = /<function[^>]*>/g;

      console.log('AI result:', {
        text: responseText,
        toolCalls: toolCalls,
        toolResults: toolResults,
        hasMalformedTags: malformedPattern.test(responseText),
        rawResponse: result,
      });

      // Process the response
      responseText = responseText.trim();
      if (malformedPattern.test(responseText)) {
        console.log(
          'AI returned malformed response with HTML-like tags:',
          responseText
        );
        console.log(
          'This suggests the AI model is not properly configured for tool calling'
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
          error.message.includes('Too Many Requests') ||
          error.message.includes('Rate limit') ||
          error.message.includes('tokens per minute')
        ) {
          errorMessage =
            "I'm hitting rate limits right now. I've trimmed our conversation to reduce token usage. Please wait a moment and try again.";
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
