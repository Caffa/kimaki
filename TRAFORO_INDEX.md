# Traforo Documentation Index

Complete exploration of the traforo/ directory with comprehensive documentation.

---

## 📚 Documentation Files

### 1. **TRAFORO_COMPREHENSIVE_GUIDE.md** (21 KB)
**Start here for deep technical understanding.**

Covers:
- Executive summary and architecture overview
- 3-layer system architecture with diagrams
- All 12 source files with detailed descriptions
- Complete message protocol documentation
  - 4 upstream message types
  - 8 downstream message types
  - Full message definitions with examples
- How WebSocket proxying works (full flow)
- Streaming HTTP support (detection & implementation)
- CLI and runtime execution details
- Test infrastructure (1,083 line test suite)
- Key APIs and usage patterns
- Dependencies and deployment configuration
- Insights and architectural strengths

**Best for**: Understanding the complete system, message protocol, and design decisions

---

### 2. **TRAFORO_QUICK_REFERENCE.md** (8 KB)
**Use for quick lookups while coding.**

Contains:
- File structure overview
- Core concepts cheat sheet
- Message types quick list (10 total)
- Base64 encoding reference
- WebSocket flow diagram
- HTTP proxying flow diagram
- CLI usage examples
- TunnelClient API quick reference
- Test endpoints list
- Streaming detection rules
- Deployment checklist
- Headers handling reference
- Error codes and meanings
- Protocol examples (HTTP GET, WebSocket)
- Test patterns
- Common issues table
- Performance characteristics

**Best for**: Quick lookups, examples, checklists during development

---

### 3. **TRAFORO_DEVELOPER_GUIDE.md** (16 KB)
**Read for implementation details and patterns.**

Includes:
- Getting started (read files in order)
- Code flow walkthroughs
  - Simple HTTP GET request (full trace)
  - WebSocket connection (full trace)
- Common implementation patterns
  - Adding new message types
  - Handling binary data
  - Timeout patterns
  - Error handling
- Debugging guide
  - Enable logging
  - Common issues & solutions
- Testing strategy
  - Unit vs integration testing
  - Test patterns with code examples
- Performance considerations
  - Limits
  - Optimization tips
  - Monitoring
- Deployment checklist
- Extension ideas
- References to other docs

**Best for**: Implementing features, debugging, writing tests, extending the system

---

## 🗂️ Traforo Source Files

### Core Implementation (1,357 lines)

```
traforo/src/
├── types.ts (179 lines)
│   └── Message protocol definitions
│       - 4 upstream message types (http_request, ws_open, ws_frame, ws_close)
│       - 8 downstream message types (http_response variants, ws_response variants)
│       - Helper functions for type-safe messaging
│
├── client.ts (388 lines)
│   └── Local tunnel client (runs on dev machine)
│       - Connects via WebSocket to Cloudflare DO
│       - Makes fetch() calls to local server
│       - Manages local WebSocket connections
│       - Handles HTTP requests, streaming, WebSocket messages
│
└── tunnel.ts (812 lines)
    └── Cloudflare Worker + Durable Object
        - Worker entrypoint: routes to DO based on tunnel ID
        - DO implementation: manages upstream/downstream connections
        - HTTP proxying: forwards requests to local client
        - WebSocket proxying: relays bidirectional messages
        - Message handlers: processes all message types
        - Timeouts: 30s HTTP, 10s WebSocket open
```

### Tests & Examples

```
traforo/src/
├── tunnel.test.ts (1,083 lines)
│   └── 23 integration tests
│       - 12 HTTP request tests
│       - 1 SSE streaming test
│       - 7 WebSocket tests
│       - 2 tunnel status tests
│       - 1 reconnection test
│       - Test server implementation (255 lines)
│
└── example-static/server.ts (315 lines)
    └── Bun test server example
        - HTTP endpoints (echo, json, post, etc.)
        - WebSocket endpoint
        - SSE endpoint
        - Static file serving
```

### Configuration & CLI

```
traforo/
├── cli.ts (52 lines)
│   └── CLI entrypoint using goke framework
│
├── run-tunnel.ts (157 lines)
│   └── Runner with subprocess spawning
│       - Spawns child process with PORT env
│       - Waits for port to be available
│       - Handles cleanup on SIGINT/SIGTERM
│
├── package.json
│   └── Dependencies: ws, goke, string-dedent
│
├── wrangler.json
│   └── Cloudflare Worker configuration
│       - Durable Object binding
│       - Routes for traforo.dev and kimaki.xyz
│       - Preview environment
│
└── vitest.config.ts
    └── Test runner configuration
        - 60s timeout
        - Includes typecheck support
```

---

## 🎯 Quick Start

### For Understanding Traforo

1. **Read TRAFORO_COMPREHENSIVE_GUIDE.md** (30 min)
   - Get overview of architecture
   - Understand message protocol
   - Learn about WebSocket proxying

2. **Read TRAFORO_DEVELOPER_GUIDE.md** (20 min)
   - Follow HTTP GET flow walkthrough
   - Follow WebSocket flow walkthrough
   - See implementation patterns

3. **Reference TRAFORO_QUICK_REFERENCE.md** (ongoing)
   - Keep open while coding
   - Use for message type lookups
   - Check deployment checklist

### For Modifying Traforo

1. Understand the message protocol (COMPREHENSIVE_GUIDE.md, types.ts)
2. Pick a code flow example (DEVELOPER_GUIDE.md)
3. Trace through tunnel.ts and client.ts
4. Look at tunnel.test.ts for test patterns
5. Add your feature, add tests, deploy

### For Debugging Issues

1. Check common issues table (QUICK_REFERENCE.md)
2. Enable logging (DEVELOPER_GUIDE.md)
3. Trace the relevant code flow (DEVELOPER_GUIDE.md)
4. Check timeout values (HTTP_TIMEOUT_MS, WS_OPEN_TIMEOUT_MS)
5. Review test examples for expected behavior

---

## 📊 Code Statistics

| Metric | Value |
|--------|-------|
| Total Source Lines | 2,671 |
| Core Implementation | 1,357 lines |
| Tests | 1,083 lines |
| Config/Entry | 231 lines |
| Documentation | 45 KB (3 files) |

---

## 🔑 Key Concepts

### Message Protocol
- **Upstream** (DO → Client): 4 message types
- **Downstream** (Client → DO): 8 message types
- **Binary safety**: Base64 encoding in JSON
- **Headers**: Hop-by-hop filtering + multi-value support

### WebSocket Proxying
- **Bidirectional**: Messages relay both directions
- **Connection tracking**: connId for each user connection
- **Timeout**: 10s for local connection opening
- **Auto-close**: On error or timeout

### HTTP Proxying
- **Complete responses**: Small responses sent in one message
- **Streaming**: Auto-detected (text/event-stream, chunked, etc.)
- **Timeout**: 30s for response
- **Error handling**: http_error message on failure

### Timeouts
- **HTTP Request**: 30 seconds (HTTP_TIMEOUT_MS)
- **WebSocket Open**: 10 seconds (WS_OPEN_TIMEOUT_MS)
- **Reconnect Delay**: 3 seconds

---

## ✨ Key Features

✓ **HTTP Tunneling**
  - GET, POST, PUT, DELETE, PATCH, HEAD
  - Custom headers, query params
  - Binary request/response bodies
  - Large payloads (100KB+ tested)

✓ **WebSocket Tunneling**
  - Bidirectional message relaying
  - Binary frames
  - Connection opening/closing
  - Error handling

✓ **Streaming Support**
  - Server-Sent Events (SSE)
  - Chunked Transfer-Encoding
  - NDJSON streaming
  - Efficient with TransformStream

✓ **Robust Design**
  - Connection timeouts
  - Error recovery
  - Auto-reconnect
  - Multi-value header preservation

✓ **Test Coverage**
  - 23 integration tests
  - All features tested
  - Edge cases covered

---

## 🚀 Deployment

### Environments
- **Production**: *-tunnel.traforo.dev, *-tunnel.kimaki.xyz
- **Preview**: *-tunnel-preview.traforo.dev, *-tunnel-preview.kimaki.xyz

### Deploy Steps
```bash
pnpm typecheck        # Verify types
pnpm build           # Build client libraries
pnpm test            # Run tests (requires preview)
pnpm deploy          # Deploy to production
pnpm deploy:preview  # Deploy to preview
```

---

## 📖 Reading Order

### Beginner (New to Traforo)
1. TRAFORO_QUICK_REFERENCE.md - File structure & concepts
2. TRAFORO_COMPREHENSIVE_GUIDE.md - Architecture & protocol
3. TRAFORO_DEVELOPER_GUIDE.md - Code flows

### Intermediate (Making Changes)
1. TRAFORO_DEVELOPER_GUIDE.md - Implementation patterns
2. TRAFORO_COMPREHENSIVE_GUIDE.md - Details as needed
3. Source code: types.ts → client.ts → tunnel.ts

### Advanced (Extending System)
1. Source code review (all files)
2. TRAFORO_DEVELOPER_GUIDE.md - Extension ideas
3. tunnel.test.ts - Test patterns

---

## 🔗 File References

### Documentation Files (in this repo)
- `/TRAFORO_COMPREHENSIVE_GUIDE.md` - Full technical reference
- `/TRAFORO_QUICK_REFERENCE.md` - Quick lookup tables
- `/TRAFORO_DEVELOPER_GUIDE.md` - Implementation guide
- `/TRAFORO_INDEX.md` - This file

### Source Code (in traforo/)
- `traforo/src/types.ts` - Message protocol
- `traforo/src/client.ts` - Local client implementation
- `traforo/src/tunnel.ts` - DO + Worker implementation
- `traforo/src/tunnel.test.ts` - Integration tests
- `traforo/example-static/server.ts` - Example Bun server

### Configuration
- `traforo/package.json` - Dependencies
- `traforo/wrangler.json` - Cloudflare config
- `traforo/vitest.config.ts` - Test config
- `traforo/tsconfig*.json` - TypeScript configs

---

## 💡 Tips

### For Understanding Code
- types.ts is the best starting point (no logic, just data structures)
- Read tunnel.ts with tunnel.test.ts side-by-side
- Focus on message handlers (switch statements on msg.type)

### For Writing Tests
- Use tunnel.test.ts as template
- Follow the pattern: setup → action → assert
- Remember TEST_TIMEOUT is 30_000 (30 seconds)
- Create unique tunnel IDs to avoid conflicts

### For Debugging
- Add console.log() before/after key operations
- Check WebSocket.readyState (0=connecting, 1=open, 2=closing, 3=closed)
- Verify message encoding (base64 for binary)
- Check timeout values if requests hang

### For Performance
- Use streaming for large responses
- Minimize message size (headers, base64 overhead)
- Pool connections when possible
- Monitor pending request/connection queues

---

## ✅ Verification Checklist

Before deploying changes:
- [ ] Types compile without errors (`pnpm typecheck`)
- [ ] Client code compiles (`pnpm typecheck:client`)
- [ ] Tests pass (`pnpm test`)
- [ ] New tests added for new features
- [ ] Message protocol backward compatible
- [ ] Timeouts still appropriate
- [ ] Error messages helpful
- [ ] Documentation updated

---

## 🎓 Learning Resources

### In This Repo
1. **Architecture**: COMPREHENSIVE_GUIDE.md sections 1-2
2. **Protocol**: COMPREHENSIVE_GUIDE.md section 3-4
3. **WebSocket**: COMPREHENSIVE_GUIDE.md section 5
4. **Tests**: COMPREHENSIVE_GUIDE.md section 6 or tunnel.test.ts
5. **Code**: DEVELOPER_GUIDE.md code walkthroughs

### External
- Cloudflare Durable Objects: https://developers.cloudflare.com/workers/platform/
- WebSocket Protocol: RFC 6455
- HTTP Streaming: MDN Web Docs
- TypeScript: TypeScript Handbook

---

## 🔴 Known Limitations

- **Message size**: Limited by WebSocket frame size (~1MB typical)
- **Response size**: Limited by Cloudflare Worker limit (25MB)
- **Concurrent connections**: Limited by DO resource constraints
- **Latency**: Added by DO relay (typically <50ms)
- **Binary**: Must base64 encode (1.33x overhead)

---

## 🟢 Production Ready

✓ Production deployed on traforo.dev
✓ Preview tested extensively  
✓ 23 integration tests passing
✓ Error handling comprehensive
✓ Timeouts configured appropriately
✓ Documentation complete

---

## 📞 Support

For questions about:
- **Architecture**: See COMPREHENSIVE_GUIDE.md
- **Implementation**: See DEVELOPER_GUIDE.md
- **Quick lookups**: See QUICK_REFERENCE.md
- **Specific files**: See source code comments
- **Testing**: See tunnel.test.ts examples

---

**Last Updated**: February 19, 2026
**Total Files Analyzed**: 12
**Total Lines Analyzed**: 2,671
**Documentation Created**: 45 KB (4 files)
