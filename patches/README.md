# system-prompt lean patch

`system-prompt-lean.patch` is the diff from the pre-upstream-merge lean stub (`a2e5cc8c`)
to the current `kimaki/src/system-prompt.ts`. After a future upstream merge re-fattens the
three untagged sections, restore the lean stubs by reversing the patch:

```bash
cd ~/Local-Projects-2026/kimaki-v2
git apply -R patches/system-prompt-lean.patch
npx tsc
```

This reverts only the sections that were stubbed; tagged sections should be disabled via
the `--disable-prompt` launcher flags instead.
