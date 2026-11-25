---
'kimaki': patch
---

Budget-blocked slash command registration now backs off on an hourly ladder (1h doubling to 6h) instead of retrying on Discord's minute-scale 30034 retry_after, which is not the daily-budget free time: with zero commands added per pass, re-probes happen at 1h, 2h, 4h, 6h instead of every few minutes for a day. Passes where the degraded trickle still adds commands keep the fast cadence so a partial budget fills one batch per pass.
