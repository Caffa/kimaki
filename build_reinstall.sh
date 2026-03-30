#!/bin/bash
cd discord
pnpm build

npm uninstall -g kimaki
# npm link (no args) from within the package creates a global symlink to this local package
npm link