# AI Tools

This directory contains custom AI tools that can be used by the chatbot.

## Available Tools

### changelog

The changelog tool allows users to query Vercel's changelog articles and recent feature launches. It provides access to Vercel's official changelog and can also search additional Vercel resources like guides, documentation, and blog posts.

**Usage:**

- Ask about Vercel features, updates, or recent launches
- Query specific date ranges (e.g., "What was released in the last month?")
- Search for specific features or functionality
- Get detailed information about Vercel's product updates

**Features:**

- Automatic date range detection and filtering
- Integration with Vercel's changelog database
- Web search capabilities for additional context
- Support for relative date queries (e.g., "last week", "this month")
- Chronological sorting of articles (most recent first)

**Parameters:**

- `question`: The user's query about Vercel's changelog or features
- `messages`: Conversation history for context

### Other Tools

- `echo`: Echo messages with server timestamp
- `sum`: Perform mathematical calculations
- `createImage`: Generate images based on prompts
- `modifyImage`: Modify existing images

## Tool Integration

Tools are automatically available in the main chat interface. The AI will choose the appropriate tool based on the user's request. For changelog-related queries, the system will automatically use the changelog tool to provide accurate and up-to-date information from Vercel's official sources.
