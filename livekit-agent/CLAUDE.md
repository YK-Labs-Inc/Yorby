# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LiveKit voice AI agent implementation that creates an AI-powered voice assistant with multilingual support, speech recognition, natural language processing, and voice synthesis capabilities.

## Development Commands

### Running the Agent
```bash
python agent.py
```

### Virtual Environment
The project uses a Python virtual environment located in `.venv/`. To activate:
```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

## Architecture and Key Components

### Core Architecture
- **Single-file implementation**: All agent logic is contained in `agent.py`
- **Class structure**: `InterviewAssistant` extends LiveKit's `Agent` base class
- **Async execution**: Uses asyncio for concurrent operations via the `entrypoint` function
- **Session-based**: Each agent interaction is managed through an `AgentSession`

### AI Service Integration
The agent integrates multiple AI services through LiveKit's plugin system:
- **STT (Speech-to-Text)**: Deepgram with nova-3 model for multilingual support
- **LLM (Language Model)**: OpenAI GPT-4o-mini for conversation handling
- **TTS (Text-to-Speech)**: OpenAI TTS with gpt-4o-mini-tts model
- **VAD (Voice Activity Detection)**: Silero VAD for speech detection
- **Turn Detection**: Multilingual model for conversation flow management
- **Noise Cancellation**: LiveKit Cloud's BVC for audio enhancement

### Metadata Handling
The agent expects metadata in the job context containing:
- `user_name`: The name of the user interacting with the agent

### Environment Configuration
The project uses environment variables loaded from `.env`:
- `DEEPGRAM_API_KEY`: Deepgram API credentials
- `OPENAI_API_KEY`: OpenAI API credentials
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`: LiveKit service configuration

## Important Patterns

1. **Plugin Loading**: All AI service plugins are imported from `livekit.plugins.*`
2. **Session Configuration**: The `AgentSession` is configured with all AI components in the `entrypoint` function
3. **Metadata Access**: User-specific data is passed through `ctx.job.metadata` as JSON
4. **CLI Integration**: The agent uses LiveKit's CLI runner for execution

## Development Notes

- No dependency management file exists (no requirements.txt or pyproject.toml)
- No test suite is currently implemented
- The agent uses the default LiveKit agent instructions unless customized
- All configuration is handled through environment variables
- The project is set up for local development with a pre-configured virtual environment