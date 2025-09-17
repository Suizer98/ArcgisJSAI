<script lang="ts">
  import { fly } from 'svelte/transition'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { aiService } from '$lib/services/aiService'
  import { chatStateService } from '$lib/services/chatStateService'

  export let isOpen = true

  let input = ''
  let messages: Array<{id: string, role: 'user' | 'assistant', content: string}> = []
  let isLoading = false
  
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

  // Auto-scroll when messages change
  $: if (messages.length > 0) {
    // Use setTimeout to ensure DOM is updated
    setTimeout(scrollToBottom, 100)
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
      // Add error message
      aiService.addMessage('assistant', 'Sorry, there was an error processing your request.')
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
  style="width: {chatWidth}px;"
>
  <Card class="h-full rounded-none border-r-0 border-t-0 border-b-0 flex flex-col w-full relative">
    <!-- Draggable Header -->
    <CardHeader 
      class="pb-3 flex-shrink-0 cursor-move select-none"
      onmousedown={handleDragStart}
    >
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg">AI Map Assistant</CardTitle>
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
          class="p-3 rounded-lg"
          class:max-w-xs={chatWidth < 400}
          class:max-w-sm={chatWidth >= 400}
          class:ml-auto={message.role === 'user'}
          class:bg-primary={message.role === 'user'}
          class:text-primary-foreground={message.role === 'user'}
          class:bg-muted={message.role === 'assistant'}
          transition:fly={{ x: message.role === 'user' ? 200 : -200, duration: 300, delay: messageIndex * 100 }}
        >
          <div class="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      {/each}
    </div>
    
    <!-- Input Container - Fixed at bottom -->
    <div class="flex-shrink-0 p-4 border-t bg-background">
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