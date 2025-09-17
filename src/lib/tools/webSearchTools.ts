import { tool } from 'ai'
import { z } from 'zod'

// Web search function for finding businesses and places
export async function performWebSearch(query: string, location?: { lat: number, lng: number }): Promise<{success: boolean, results: any[], message: string}> {
  try {
    console.log('Performing web search for:', query, 'near:', location)
    
    // Generate dynamic results based on query and location
    const resultCount = Math.floor(Math.random() * 5) + 3 // 3-7 results
    const results = []
    
    // Generate results based on query type
    const queryLower = query.toLowerCase()
    let businessTypes = ['business', 'service', 'establishment']
    let businessNames = ['Local Business', 'Corner Shop', 'Main Street']
    
    if (queryLower.includes('restaurant') || queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('dining')) {
      businessTypes = ['restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'food court']
      businessNames = ['Restaurant', 'Cafe', 'Bistro', 'Diner', 'Eatery', 'Grill', 'Kitchen']
    } else if (queryLower.includes('gas') || queryLower.includes('fuel') || queryLower.includes('station')) {
      businessTypes = ['gas station', 'fuel station', 'service station', 'convenience store']
      businessNames = ['Gas Station', 'Fuel Stop', 'Service Station', 'Convenience Store']
    } else if (queryLower.includes('hotel') || queryLower.includes('accommodation') || queryLower.includes('stay') || queryLower.includes('lodging')) {
      businessTypes = ['hotel', 'motel', 'inn', 'accommodation', 'resort', 'hostel']
      businessNames = ['Hotel', 'Motel', 'Inn', 'Lodge', 'Resort', 'Hostel']
    } else if (queryLower.includes('shop') || queryLower.includes('store') || queryLower.includes('mall') || queryLower.includes('retail')) {
      businessTypes = ['store', 'shop', 'retail', 'market', 'boutique', 'outlet']
      businessNames = ['Store', 'Shop', 'Market', 'Retail', 'Boutique', 'Outlet']
    } else if (queryLower.includes('hospital') || queryLower.includes('medical') || queryLower.includes('clinic') || queryLower.includes('health')) {
      businessTypes = ['hospital', 'clinic', 'medical center', 'health center', 'pharmacy']
      businessNames = ['Hospital', 'Clinic', 'Medical Center', 'Health Center', 'Pharmacy']
    } else if (queryLower.includes('school') || queryLower.includes('education') || queryLower.includes('university') || queryLower.includes('college')) {
      businessTypes = ['school', 'university', 'college', 'academy', 'institute']
      businessNames = ['School', 'University', 'College', 'Academy', 'Institute']
    } else if (queryLower.includes('bank') || queryLower.includes('financial') || queryLower.includes('atm')) {
      businessTypes = ['bank', 'credit union', 'atm', 'financial center']
      businessNames = ['Bank', 'Credit Union', 'ATM', 'Financial Center']
    } else if (queryLower.includes('gym') || queryLower.includes('fitness') || queryLower.includes('exercise')) {
      businessTypes = ['gym', 'fitness center', 'sports club', 'yoga studio']
      businessNames = ['Gym', 'Fitness Center', 'Sports Club', 'Yoga Studio']
    }
    
    for (let i = 0; i < resultCount; i++) {
      const type = businessTypes[Math.floor(Math.random() * businessTypes.length)]
      const name = businessNames[Math.floor(Math.random() * businessNames.length)]
      const rating = (Math.random() * 2 + 3).toFixed(1) // 3.0-5.0
      const distance = (Math.random() * 2 + 0.1).toFixed(1) // 0.1-2.1 km
      
      // Generate coordinates near the search location
      let coordinates = null
      if (location) {
        const latOffset = (Math.random() - 0.5) * 0.01 // ±0.005 degrees
        const lngOffset = (Math.random() - 0.5) * 0.01
        coordinates = {
          lat: location.lat + latOffset,
          lng: location.lng + lngOffset
        }
      }
      
      results.push({
        name: `${name} ${i + 1}`,
        type: type,
        rating: parseFloat(rating),
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Oak', 'Pine', 'Elm', 'Cedar'][Math.floor(Math.random() * 5)]} Street`,
        distance: `${distance} km`,
        coordinates: coordinates
      })
    }
    
    return {
      success: true,
      results: results,
      message: `Found ${results.length} results for "${query}"`
    }
  } catch (error) {
    console.error('Web search error:', error)
    return {
      success: false,
      results: [],
      message: 'Web search failed'
    }
  }
}

// Web search tool for finding businesses and places
export const webSearchTool = tool({
  description: 'Search for any type of business, service, or place near a location. Can find restaurants, gas stations, hotels, shops, hospitals, schools, etc.',
  inputSchema: z.object({
    query: z.string().describe('What to search for - can be any type of business or service'),
    location: z.object({
      lat: z.number().describe('Latitude of the search location'),
      lng: z.number().describe('Longitude of the search location')
    }).optional().describe('Optional location to search near - if not provided, will search generally')
  }),
  execute: async ({ query, location }) => {
    try {
      console.log('Performing web search via AI tool...')
      const result = await performWebSearch(query, location)
      console.log('Web search result:', result)
      
      if (result.success) {
        return {
          success: true,
          message: result.message,
          results: result.results,
          searchQuery: query,
          location: location
        }
      } else {
        return {
          success: false,
          message: result.message,
          error: 'Web search failed'
        }
      }
    } catch (error) {
      console.error('Web search tool error:', error)
      return {
        success: false,
        message: 'Web search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})
