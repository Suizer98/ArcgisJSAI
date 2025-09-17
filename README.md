# ArcGIS JS + AI

Interactive Svelte + ArcGIS JS SDK mapping application with AI-powered chat by Groq LLM for natural language map navigation and more.

## Features

- AI chat for map navigation
- Drawing tools (markers, lines, polygons)
- Location services & web search
- Draggable/resizable interface

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

## Code Formatting

This project uses Prettier for code formatting. You can format your code using:

```bash
npm run format
npm run format:check

docker exec -it arcgisjsai-arcgisjsai-1 npm run format
```

## Usage

Ask the AI to navigate and interact with the map:

- "Take me to New York"
- "Add a marker here"
- "Find restaurants near me"
- "Zoom to Singapore"
- "What's my current location?"

The chat sidebar is draggable and resizable.
