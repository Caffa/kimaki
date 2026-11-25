---
'kimaki': minor
---

Setting `KIMAKI_DISABLE_CLOUD_TRANSCRIPTION=1` (or true/yes) drops the OpenAI, ChatGPT and Gemini transcription providers from the voice chain, so voice messages never leave the machine when the local ASR service (parakeet, Whisper fallback) handles them. When no local provider is reachable, transcription then fails naming the flag instead of asking for API keys.
