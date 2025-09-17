<script lang="ts">
  import { fly } from 'svelte/transition'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { aiService } from '$lib/services/aiService'
  import { chatStateService } from '$lib/services/chatStateService'
  import { hasValidApiKey } from '$lib/aiConfig'
  import { mapController } from './mapController'

  export let isOpen = true

  let input = ''
  let messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp?: Date}> = []
  let isLoading = false
  let locationPermissionDenied = false
  
  // Initialize with AI greeting
  async function initializeChat() {
    if (messages.length === 0) {
      try {
        // Generate a dynamic greeting using AI
        const greeting = await generateAIGreeting()
        aiService.addMessage('assistant', greeting)
        updateMessages()
      } catch (error) {
        console.error('Error generating AI greeting:', error)
        // Fallback to a simple greeting if AI fails
        aiService.addMessage('assistant', 'Hi! I\'m your AI Map Assistant. How can I help you navigate and explore the map today?')
        updateMessages()
      }
    }
  }

  // Generate AI greeting using the greeting service
  async function generateAIGreeting(): Promise<string> {
    const { greetingService } = await import('$lib/services/greetingService')
    return await greetingService.generateAIGreeting()
  }
  
  // Draggable and resizable state
  let chatWidth = 320 // Default width
  let isDragging = false
  let isResizing = false
  let dragStartX = 0
  let resizeStartX = 0
  let resizeStartWidth = 0
  
  // Get maximum width (half screen)
  function getMaxWidth() {
    return Math.floor(window.innerWidth / 2)
  }
  
  // Auto-scroll reference
  let messagesContainer: HTMLDivElement

  // Update messages when they change
  function updateMessages() {
    messages = aiService.getMessages()
  }

  // Auto-scroll to bottom
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  // Initialize chat on component mount (only once)
  let initialized = false
  $: if (typeof window !== 'undefined' && !initialized) {
    initializeChat()
    initialized = true
  }

  // Auto-scroll when messages change (debounced)
  let scrollTimeout: ReturnType<typeof setTimeout>
  $: if (messages.length > 0) {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(scrollToBottom, 100)
  }

  function toggleSidebar() {
    isOpen = !isOpen
    chatStateService.toggleSidebar()
    
    // Auto-scroll when opening sidebar
    if (isOpen) {
      setTimeout(scrollToBottom, 200)
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const userInput = input.trim()
    
    if (!userInput || isLoading) return

    // Clear input immediately
    input = ''
    
    // Set loading state
    isLoading = true
    updateMessages()

    try {
      // Process user input through AI service
      const result = await aiService.processUserInput(userInput)
      
      // Update messages after processing
      updateMessages()
    } catch (error) {
      console.error('Error processing user input:', error)
      
      // Add user-friendly error message with retry option
      let errorMessage = 'Sorry, I encountered an issue processing your request. '
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage += 'Please check your API configuration.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += 'Please check your internet connection and try again.'
        } else if (error.message.includes('rate limit')) {
          errorMessage += 'Too many requests. Please wait a moment and try again.'
        } else {
          errorMessage += 'Please try rephrasing your question or try again in a moment.'
        }
      } else {
        errorMessage += 'Please try again or rephrase your question.'
      }
      
      aiService.addMessage('assistant', errorMessage)
      updateMessages()
    } finally {
      // Clear loading state
      isLoading = false
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(new Event('submit') as SubmitEvent)
    }
  }

  // Handle quick action buttons
  function handleQuickAction(action: string) {
    // Check if action requires geolocation
    if (action.includes('current location') || action.includes('geolocation')) {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        aiService.addMessage('assistant', 'Geolocation is not supported by your browser. Please use a modern browser with location services enabled.')
        updateMessages()
        return
      }
      
      // Check if permission was previously denied
      if (locationPermissionDenied) {
        aiService.addMessage('assistant', 'Location access was previously denied. Please enable location permissions in your browser settings and refresh the page.')
        updateMessages()
        return
      }
      
      // Don't show prompt immediately - let the AI try geolocation first
      // The prompt will only show if geolocation actually fails
    }
    
    input = action
    handleSubmit(new Event('submit') as SubmitEvent)
  }

  // Copy message to clipboard
  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content)
      // You could add a toast notification here
      console.log('Message copied to clipboard')
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  // Delete message
  function deleteMessage(messageId: string) {
    // This would need to be implemented in aiService
    console.log('Delete message:', messageId)
  }


  // Drag functions
  function handleDragStart(event: MouseEvent) {
    isDragging = true
    dragStartX = event.clientX
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    event.preventDefault()
  }

  function handleDragMove(event: MouseEvent) {
    if (!isDragging) return
    const deltaX = event.clientX - dragStartX
    const maxWidth = getMaxWidth()
    const newWidth = Math.max(280, Math.min(maxWidth, chatWidth - deltaX))
    chatWidth = newWidth
    dragStartX = event.clientX
  }

  function handleDragEnd() {
    isDragging = false
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
  }

  // Resize functions
  function handleResizeStart(event: MouseEvent) {
    isResizing = true
    resizeStartX = event.clientX
    resizeStartWidth = chatWidth
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    event.preventDefault()
    event.stopPropagation()
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return
    const deltaX = event.clientX - resizeStartX
    const maxWidth = getMaxWidth()
    const newWidth = Math.max(280, Math.min(maxWidth, resizeStartWidth - deltaX))
    chatWidth = newWidth
  }

  function handleResizeEnd() {
    isResizing = false
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }
</script>

<!-- Chat Toggle Button -->
<Button 
  class="fixed top-4 right-4 z-[9999] size-10"
  onclick={toggleSidebar}
  variant="outline"
  size="icon"
>
  <svg 
    class="w-5 h-5" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      stroke-width="2" 
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
</Button>

<!-- Chat Sidebar -->
<div 
  class="fixed top-0 right-0 h-full z-40 transform transition-transform duration-300 ease-in-out flex"
  class:translate-x-full={!isOpen}
  class:translate-x-0={isOpen}
  class:w-full={chatWidth < 400}
  class:w-80={chatWidth >= 400 && chatWidth < 600}
  style="width: {chatWidth >= 600 ? chatWidth + 'px' : 'auto'};"
>
  <Card class="h-full rounded-none border-r-0 border-t-0 border-b-0 flex flex-col w-full relative">
    <!-- Draggable Header -->
    <CardHeader 
      class="pb-3 flex-shrink-0 cursor-move select-none"
      onmousedown={handleDragStart}
    >
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg">ArcGIS AI Map Assistant</CardTitle>
        <div class="flex space-x-2">
          <!-- Close Button -->
          <Button 
            variant="ghost" 
            size="sm" 
            onclick={toggleSidebar}
            class="p-1 h-8 w-8"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <!-- Messages Container - Fixed height with scroll -->
    <div 
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
    >
      {#each messages as message, messageIndex (messageIndex)}
        <div 
          class="p-3 rounded-lg group relative"
          class:max-w-xs={chatWidth < 400}
          class:max-w-sm={chatWidth >= 400}
          class:ml-auto={message.role === 'user'}
          class:bg-primary={message.role === 'user'}
          class:text-primary-foreground={message.role === 'user'}
          class:bg-muted={message.role === 'assistant'}
          transition:fly={{ x: message.role === 'user' ? 200 : -200, duration: 300, delay: messageIndex * 100 }}
        >
          <div class="whitespace-pre-wrap break-words">{message.content}</div>
          {#if message.timestamp}
            <div class="text-xs opacity-60 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          {/if}
          
          <!-- Message Actions -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => copyMessage(message.content)}
                class="h-6 w-6 p-0"
                title="Copy message"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </Button>
              {#if message.role === 'assistant'}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => deleteMessage(message.id)}
                  class="h-6 w-6 p-0"
                  title="Delete message"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </Button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
      
      <!-- Typing Indicator -->
      {#if isLoading}
        <div 
          class="p-3 rounded-lg bg-muted max-w-xs"
          transition:fly={{ x: -200, duration: 300 }}
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
            <span class="text-sm text-gray-500">AI is thinking...</span>
          </div>
        </div>
      {/if}
      
    </div>
    
    <!-- Quick Actions -->
    <div class="flex-shrink-0 p-4 border-t bg-background">
      <div class="mb-3">
        <div class="text-sm font-medium text-gray-600 mb-2">Quick Actions:</div>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => handleQuickAction('Get my current location using geolocation')}
            disabled={isLoading}
            class="text-xs flex-1 sm:flex-none"
          >
            📍 Current Location
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => handleQuickAction('What is the current zoom level?')}
            disabled={isLoading}
            class="text-xs flex-1 sm:flex-none"
          >
            🔍 Current Zoom
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => handleQuickAction('Draw a line from my current location to a nearby point')}
            disabled={isLoading}
            class="text-xs flex-1 sm:flex-none"
          >
            📏 Draw Line
          </Button>
        </div>
      </div>
      
      <!-- Input Form -->
      <form onsubmit={handleSubmit} class="flex space-x-2">
        <Input 
          bind:value={input}
          placeholder="Ask me to navigate the map..."
          onkeydown={handleKeydown}
          class="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
    
    <!-- Resize Handle -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:opacity-50 transition-opacity"
      onmousedown={handleResizeStart}
    ></div>
  </Card>
</div>