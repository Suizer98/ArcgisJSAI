<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'

  export let isLoading: boolean
  export let onQuickAction: (action: string) => void
</script>

<div class="mb-3">
  <div class="text-sm font-medium text-gray-600 mb-2">Quick Actions:</div>
  <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
    <Button 
      variant="outline" 
      size="sm" 
      onclick={() => onQuickAction('Get my current location using geolocation')}
      disabled={isLoading}
      class="text-xs flex-1 sm:flex-none"
    >
      📍 Current Location
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      onclick={() => onQuickAction('What is the current zoom level?')}
      disabled={isLoading}
      class="text-xs flex-1 sm:flex-none"
    >
      🔍 Current Zoom
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      onclick={() => onQuickAction('Draw a line from my current location to a nearby point')}
      disabled={isLoading}
      class="text-xs flex-1 sm:flex-none"
    >
      📏 Draw Line
    </Button>
  </div>
</div>
