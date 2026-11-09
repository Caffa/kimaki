---
'kimaki': minor
---

Coordinator mode is now off by default. Channel messages create a thread per message again instead of one long coordinator session in the channel; pass `--coordinator` to turn coordinator mode on, and `/toggle-coordinator` still sets it per channel. Existing channels keep their saved `/toggle-coordinator` choice.