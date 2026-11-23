---
'kimaki': minor
---

Local fork: only agents whose id or name contains `orchestrator` get a `/<agent>-agent` slash shortcut; all other agents stay reachable through `/agent`. Override the substring with `KIMAKI_AGENT_SHORTCUT_FILTER` (empty registers every agent). Fewer shortcuts also shrink the daily Discord command-create cost of catalog churn.
