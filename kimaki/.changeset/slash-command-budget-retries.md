---
'kimaki': patch
---

Stop hanging slash command registration on Discord's daily command-create budget. A catalog of ~100 commands re-registered on every bot start burned the 200-per-day create budget (error 30034), and @discordjs/rest then slept for hours inside the request with no timeout and no log, so agent commands went missing and startup stalled. Now the last-registered command list is persisted per guild (an unchanged catalog skips the PUT entirely), dynamic shortcuts are capped at 50 with agents first, pathologically long 429 retry-after values are clamped to 60s, guild PUTs are serialized to fit the shared rate-limit bucket, and each PUT is bounded by a 2-minute timeout with a logged retry pass.
