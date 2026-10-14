---
'kimaki': minor
---

Voice messages prefer the local parakeet ASR service before any cloud provider. Set `ASR_SERVICE_URL` to transcribe on another machine (a Mac Studio), or let the bot auto-start the bundled `asr-service/` on Apple Silicon; when the local service is unavailable, transcription falls through to the OpenAI, ChatGPT, Gemini and hosted Whisper providers as before.
