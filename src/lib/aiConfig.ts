// AI Configuration
export const AI_CONFIG = {
  // Model settings
  model: 'llama-3.1-8b-instant',

  // API settings
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',

  // Response settings
  maxTokens: 1000,
  temperature: 0.7,

  // UI settings
  loadingMessage: 'Thinking...',
  errorMessage: 'Sorry, there was an error processing your request.',

  // Map-specific settings
  defaultZoom: 10,
  maxZoom: 20,
  minZoom: 1,

  // Supported map operations
  supportedOperations: [
    'setMapCenter',
    'setMapZoom',
    'findCoordinates',
    'geographicInfo',
  ],
};

// Environment variable names
export const ENV_VARS = {
  GROQ_API_KEY: 'VITE_GROQ_API_KEY',
};

// Helper function to get API key
export function getApiKey(): string {
  return import.meta.env[ENV_VARS.GROQ_API_KEY] || '';
}

// Helper function to validate API key
export function hasValidApiKey(): boolean {
  const key = getApiKey();
  return Boolean(
    key && key.length > 0 && key !== 'your_actual_groq_api_key_here'
  );
}
