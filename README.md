# ArcGIS JS + AI

Interactive Svelte + ArcGIS JS SDK mapping application with AI-powered chat by Groq LLM for natural language map navigation and more.

## Features

- AI chat sidebar for map navigation
- Real-time coordinate display
- Draggable and resizable interface
- Tool calling with Groq API

### Tech Stacks
![Tech stacks](https://skillicons.dev/icons?i=svelte,typescript,js,vite,docker,bash,vercel,ai)

## Setup

### Prerequisites
- Node.js 20+
- Docker (optional)
- Groq API key

### Installation

1. Copy `.env` file and put your API key:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Or with Docker:
```bash
docker-compose up --build
```

Open `http://localhost:3000`

## Usage

The AI chat sidebar opens by default. Ask it to navigate the map:

- "Take me to New York"
- "Zoom to Singapore" 
- "Show me Tokyo at zoom level 15"
- "What's my current location?"

The chat sidebar can be dragged and resized horizontally.