<script lang="ts">
  import { slide } from 'svelte/transition'
  import { fly } from 'svelte/transition'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'

  export let isOpen = false
  export let messages: string[] = []
  export let newMessage = ''

  function toggleSidebar() {
    isOpen = !isOpen
  }

  function sendMessage() {
    if (newMessage.trim()) {
      messages = [...messages, newMessage]
      newMessage = ''
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }
</script>

<!-- Chat Toggle Button -->
<Button 
  class="fixed top-4 right-4 z-50 w-10 h-10 p-0"
  on:click={toggleSidebar}
  variant="outline"
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
  class="fixed top-0 right-0 h-full w-80 z-40 transform transition-transform duration-300 ease-in-out"
  class:translate-x-full={!isOpen}
  class:translate-x-0={isOpen}
>
  <Card class="h-full rounded-none border-r-0 border-t-0 border-b-0">
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">AI Chat</CardTitle>
      </CardHeader>
      
      <CardContent class="flex flex-col h-full p-0">
        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          {#each messages as message, index}
            <div 
              class="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs ml-auto"
              transition:fly={{ x: 200, duration: 300, delay: index * 100 }}
            >
              {message}
            </div>
          {/each}
        </div>
        
        <!-- Input -->
        <div class="p-4 border-t">
          <div class="flex space-x-2">
            <Input 
              bind:value={newMessage}
              placeholder="Type your message..."
              on:keydown={handleKeydown}
              class="flex-1"
            />
            <Button on:click={sendMessage} size="sm">
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
</div>