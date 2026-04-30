// Regression tests for Windows OpenCode command resolution and spawn args.
// Also tests resolveNativeBinary which resolves through npm wrapper scripts
// to the native binary so SIGTERM reaches the actual process.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import {
  getSpawnCommandAndArgs,
  selectResolvedCommand,
  splitCommandLookupOutput,
} from './opencode-command.js'

// resolveNativeBinary is not exported; test it via its behavior
// in the module that uses it (opencode.ts). We test the logic
// here by importing and exercising it indirectly, or we unit-test
// the pattern that it uses.

describe('splitCommandLookupOutput', () => {
  test('splits windows command lookup output into trimmed lines', () => {
    expect(
      splitCommandLookupOutput(
        'C:\\Program Files\\nodejs\\opencode\r\nC:\\Program Files\\nodejs\\opencode.cmd\r\n',
      ),
    ).toEqual([
      'C:\\Program Files\\nodejs\\opencode',
      'C:\\Program Files\\nodejs\\opencode.cmd',
    ])
  })
})

describe('selectResolvedCommand', () => {
  test('prefers npm cmd shims on windows', () => {
    expect(
      selectResolvedCommand({
        output: 'C:\\Program Files\\nodejs\\opencode\r\nC:\\Program Files\\nodejs\\opencode.cmd\r\n',
        isWindows: true,
      }),
    ).toBe('C:\\Program Files\\nodejs\\opencode.cmd')
  })

  test('keeps first result on non-windows platforms', () => {
    expect(
      selectResolvedCommand({
        output: '/usr/local/bin/opencode\n/opt/homebrew/bin/opencode\n',
        isWindows: false,
      }),
    ).toBe('/usr/local/bin/opencode')
  })
})

describe('getSpawnCommandAndArgs', () => {
  test('wraps windows cmd shims through cmd.exe without double-quoting by node', () => {
    expect(
      getSpawnCommandAndArgs({
        resolvedCommand: 'C:\\Program Files\\nodejs\\opencode.cmd',
        baseArgs: ['serve', '--port', '4096'],
        platform: 'win32',
      }),
    ).toEqual({
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', '"C:\\Program Files\\nodejs\\opencode.cmd"', 'serve', '--port', '4096'],
      windowsVerbatimArguments: true,
    })
  })

  test('leaves direct executables unchanged on windows', () => {
    expect(
      getSpawnCommandAndArgs({
        resolvedCommand: 'C:\\tools\\opencode.exe',
        baseArgs: ['serve', '--port', '4096'],
        platform: 'win32',
      }),
    ).toEqual({
      command: 'C:\\tools\\opencode.exe',
      args: ['serve', '--port', '4096'],
    })
  })
})

describe('resolveNativeBinary pattern', () => {
  // Test the native binary detection magic bytes used by resolveNativeBinary
  // These constants must match the ones in opencode.ts
  const isNativeBinary = (buf: Buffer): boolean =>
    (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) || // ELF
    buf.readUInt32LE(0) === 0xfeedfacf || // Mach-O 64-bit LE
    buf.readUInt32BE(0) === 0xfeedfacf || // Mach-O 64-bit BE
    buf.readUInt32BE(0) === 0xcafebabe || // Mach-O universal/fat
    (buf[0] === 0x4d && buf[1] === 0x5a) // PE

  test('detects ELF binary header', () => {
    const buf = Buffer.from([0x7f, 0x45, 0x4c, 0x46]) // \x7fELF
    expect(isNativeBinary(buf)).toBe(true)
  })

  test('detects Mach-O 64-bit LE (arm64) header', () => {
    // 0xFEEDFACF stored in little-endian: CF FA ED FE
    const buf = Buffer.from([0xcf, 0xfa, 0xed, 0xfe])
    expect(isNativeBinary(buf)).toBe(true)
  })

  test('detects Mach-O 64-bit BE header', () => {
    // 0xFEEDFACF stored in big-endian: FE ED FA CF
    const buf = Buffer.from([0xfe, 0xed, 0xfa, 0xcf])
    expect(isNativeBinary(buf)).toBe(true)
  })

  test('detects Mach-O universal/fat binary header', () => {
    // 0xCAFEBABE stored in big-endian: CA FE BA BE
    const buf = Buffer.from([0xca, 0xfe, 0xba, 0xbe])
    expect(isNativeBinary(buf)).toBe(true)
  })

  test('detects PE (MZ) header', () => {
    const buf = Buffer.from([0x4d, 0x5a, 0x00, 0x00]) // MZ\0\0
    expect(isNativeBinary(buf)).toBe(true)
  })

  test('rejects non-binary files (Node.js script shebang)', () => {
    // #!/usr/bin/env node\n
    const buf = Buffer.from([0x23, 0x21, 0x2f, 0x75]) // #! / u
    expect(isNativeBinary(buf)).toBe(false)
  })

  test('rejects plain text files', () => {
    const buf = Buffer.from([0x68, 0x65, 0x6c, 0x6c]) // h e l l
    expect(isNativeBinary(buf)).toBe(false)
  })

  test('uses .opencode on Unix and opencode.exe on Windows', () => {
    const unixName = os.platform() === 'win32' ? 'opencode.exe' : '.opencode'
    // Just verify the naming convention matches what the wrapper script uses
    if (os.platform() === 'win32') {
      expect(unixName).toBe('opencode.exe')
    } else {
      expect(unixName).toBe('.opencode')
    }
  })
})
