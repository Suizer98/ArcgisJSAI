import { tool } from 'ai';
import { z } from 'zod';
import { mapController } from '../mapController';

// Helper function to parse and validate colors
function parseColor(colorInput: string): string {
  if (!colorInput) return 'red';

  const color = colorInput.toLowerCase().trim();

  // Handle common color variations
  const colorMap: { [key: string]: string } = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    brown: '#A52A2A',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    grey: '#808080',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    lime: '#00FF00',
    navy: '#000080',
    maroon: '#800000',
    olive: '#808000',
    teal: '#008080',
    silver: '#C0C0C0',
    gold: '#FFD700',
    crimson: '#DC143C',
    darkred: '#8B0000',
    lightblue: '#ADD8E6',
    darkblue: '#00008B',
    lightgreen: '#90EE90',
    darkgreen: '#006400',
  };

  // If it's a mapped color, return the hex value
  if (colorMap[color]) {
    return colorMap[color];
  }

  // If it's already a hex color, return as is
  if (color.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  // If it's an RGB format, convert to hex
  if (color.startsWith('rgb(') && color.endsWith(')')) {
    const rgb = color
      .slice(4, -1)
      .split(',')
      .map(n => parseInt(n.trim()));
    if (rgb.length === 3 && rgb.every(n => n >= 0 && n <= 255)) {
      return `#${rgb
        .map(n => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
    }
  }

  // Default to red if color is not recognized
  return '#FF0000';
}

// Draw line tool
export const drawLineTool = tool({
  description: 'Draw a line between two points on the map',
  inputSchema: z.object({
    startLatitude: z
      .number()
      .min(-90)
      .max(90)
      .describe('The starting latitude coordinate'),
    startLongitude: z
      .number()
      .min(-180)
      .max(180)
      .describe('The starting longitude coordinate'),
    endLatitude: z
      .number()
      .min(-90)
      .max(90)
      .describe('The ending latitude coordinate'),
    endLongitude: z
      .number()
      .min(-180)
      .max(180)
      .describe('The ending longitude coordinate'),
    color: z
      .string()
      .optional()
      .describe(
        'Optional: Color of the line (supports: color names like "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "cyan", "magenta", "lime", "navy", "maroon", "olive", "teal", "silver", "gold", "crimson", "darkred", "lightblue", "darkblue", "lightgreen", "darkgreen", or hex codes like "#FF0000", or RGB like "rgb(255,0,0)")'
      ),
  }),
  execute: async ({
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
    color = 'red',
  }) => {
    try {
      const parsedColor = parseColor(color);
      console.log(
        'Drawing line from',
        startLatitude,
        startLongitude,
        'to',
        endLatitude,
        endLongitude,
        'in color',
        parsedColor
      );

      // Actually draw the line on the map
      const result = await mapController.drawLine(
        startLatitude,
        startLongitude,
        endLatitude,
        endLongitude,
        parsedColor
      );

      if (result.success) {
        return {
          success: true,
          message: `Line drawn from (${startLatitude.toFixed(4)}, ${startLongitude.toFixed(4)}) to (${endLatitude.toFixed(4)}, ${endLongitude.toFixed(4)}) in ${parsedColor}`,
          coordinates: {
            start: { lat: startLatitude, lng: startLongitude },
            end: { lat: endLatitude, lng: endLongitude },
          },
          color: parsedColor,
          originalColor: color,
          type: 'line',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to draw line on map',
          error: 'Map drawing failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to draw line',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Draw point/marker tool
export const drawPointTool = tool({
  description: 'Draw a point or marker on the map',
  inputSchema: z.object({
    latitude: z.number().min(-90).max(90).describe('The latitude coordinate'),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe('The longitude coordinate'),
    color: z
      .string()
      .optional()
      .describe(
        'Optional: Color of the point (supports: color names like "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "cyan", "magenta", "lime", "navy", "maroon", "olive", "teal", "silver", "gold", "crimson", "darkred", "lightblue", "darkblue", "lightgreen", "darkgreen", or hex codes like "#FF0000", or RGB like "rgb(255,0,0)")'
      ),
    size: z
      .number()
      .optional()
      .describe('Optional: Size of the point in pixels'),
    label: z.string().optional().describe('Optional: Label text for the point'),
  }),
  execute: async ({ latitude, longitude, color = 'red', size = 10, label }) => {
    try {
      const parsedColor = parseColor(color);
      console.log(
        'Drawing point at',
        latitude,
        longitude,
        'in color',
        parsedColor
      );

      // Actually draw the point on the map
      const result = await mapController.drawPoint(
        latitude,
        longitude,
        parsedColor,
        size,
        label
      );

      if (result.success) {
        return {
          success: true,
          message: `Point drawn at (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) in ${parsedColor}${label ? ` with label "${label}"` : ''}`,
          coordinates: { lat: latitude, lng: longitude },
          color: parsedColor,
          size: size,
          label: label,
          type: 'point',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to draw point on map',
          error: 'Map drawing failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to draw point',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Clear graphics tool
export const clearGraphicsTool = tool({
  description: 'Clear all drawn graphics (lines, points, shapes) from the map',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      console.log('Clearing all graphics from map...');

      // Actually clear graphics from the map
      const result = await mapController.clearGraphics();

      if (result.success) {
        return {
          success: true,
          message: 'All drawn graphics cleared from the map',
          type: 'clear',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to clear graphics',
          error: 'Map clearing failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear graphics',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
