# Traforo Comprehensive Technical Guide

## Executive Summary

**Traforo** is an HTTP tunnel system that exposes local development servers to the internet via **Cloudflare Durable Objects** and **WebSockets**. It's deployed as a Cloudflare Worker with serverless infrastructure, enabling secure tunneling without any central server management.

**Core Mechanism**: Local client ↔ WebSocket bridge ↔ Cloudflare DO ↔ HTTP/WebSocket users

**Key Innovation**: Full WebSocket proxying support with bidirectional message relaying through a JSON-based protocol.

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Remote Users (Browsers, APIs)                              │
│  https://{tunnelId}-tunnel.traforo.dev/path                 │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     │
┌────────────────────▼────────────────────────────────────────┐
│  Cloudflare Worker + Durable Object (tunnel.ts)             │
│  - HTTP proxy: req → DO → upstream → local server           │
│  - WebSocket proxy: user WS ↔ DO ↔ upstream WS ↔ local WS   │
│  - Status tracking: /traforo-status                         │
│  - Streaming: Handles HTTP streaming (SSE, chunked)         │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket (traforo protocol)
                     │ /traforo-upstream endpoint
                     │
┌────────────────────▼────────────────────────────────────────┐
│  Local Tunnel Client (client.ts, running on dev machine)    │
│  - Accepts HTTP requests via traforo protocol               │
│  - Opens local HTTP connections (http://localhost:PORT)     │
│  - Proxies local WebSocket connections                      │
│  - Auto-reconnect with 3s delay                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     │
┌────────────────────▼────────────────────────────────────────┐
│  Local Development Server (user's app)                      │
│  - Listens on localhost:{port}                              │
│  - Can be Vite, Next.js, Node.js, etc.                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Points

1. **Tunnel ID based routing**: Cloudflare Worker extracts tunnel ID from hostname subdomain
2. **Durable Objects for state**: One DO per tunnel ID maintains upstream/downstream connections
3. **Protocol-based messaging**: JSON messages for HTTP/WebSocket proxying (not raw forwarding)
4. **WebSocket hibernation**: DO uses WebSocket hibernation for efficient resource usage
5. **Streaming support**: HTTP streaming responses (SSE, chunked) detected by content-type

---

## Source Files Overview

### Core Files (2,671 total lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/tunnel.ts` | 812 | Cloudflare Worker + Durable Object implementation |
| `src/client.ts` | 388 | Local tunnel client (runs on user's machine) |
| `src/types.ts` | 179 | Message protocol definitions (JSON schema) |
| `src/run-tunnel.ts` | 157 | CLI runner with subprocess spawning |
| `src/cli.ts` | 52 | CLI entrypoint using goke parser |
| `src/tunnel.test.ts` | 1,083 | Comprehensive integration tests |

### Configuration Files

- `package.json` - Dependencies: `ws`, `goke`, `string-dedent`
- `wrangler.json` - Cloudflare Worker config (routes, DO binding)
- `tsconfig.json` - TS config for tunnel.ts + types.ts (Worker code)
- `tsconfig.client.json` - TS config for client code (Node.js target)
- `vitest.config.ts` - Test runner (60s timeout, supports typecheck)

### Example Files

- `example-static/server.ts` - Bun test server with HTTP, WebSocket, SSE endpoints

---

## Message Protocol (JSON-based)

### Upstream Messages (Worker/DO → Local Client)

Messages sent to the local client over the main WebSocket connection:

#### HTTP Requests
```typescript
type HttpRequestMessage = {
  type: 'http_request'
  id: string              // UUID for request tracking
  method: string          // GET, POST, etc.
  path: string            // Full path + query string
  headers: Record<string, string>  // HTTP headers
  body: string | null     // Base64-encoded request body (or null)
}
```

#### WebSocket Open
```typescript
type WsOpenMessage = {
  type: 'ws_open'
  connId: string          // Unique connection ID (UUID)
  path: string            // WebSocket path
  headers: Record<string, string>  // Headers
}
```

#### WebSocket Frame (User → Local)
```typescript
type WsFrameMessage = {
  type: 'ws_frame'
  connId: string
  data: string            // Text or base64-encoded binary
  binary?: boolean        // True if data is binary
}
```

#### WebSocket Close
```typescript
type WsCloseMessage = {
  type: 'ws_close'
  connId: string
  code: number            // Close code (1000, 1011, etc.)
  reason: string
}
```

### Downstream Messages (Local Client → Worker/DO)

Messages sent from local client back to the DO:

#### HTTP Response (complete)
```typescript
type HttpResponseMessage = {
  type: 'http_response'
  id: string              // Matches HttpRequestMessage.id
  status: number          // HTTP status code
  headers: ResponseHeaders  // Record<string, string | string[]>
  body: string | null     // Base64-encoded response body
}
```

#### HTTP Response Start (streaming)
```typescript
type HttpResponseStartMessage = {
  type: 'http_response_start'
  id: string
  status: number
  headers: ResponseHeaders
}
```

#### HTTP Response Chunk
```typescript
type HttpResponseChunkMessage = {
  type: 'http_response_chunk'
  id: string
  chunk: string           // Base64-encoded chunk
}
```

#### HTTP Response End
```typescript
type HttpResponseEndMessage = {
  type: 'http_response_end'
  id: string
}
```

#### HTTP Error
```typescript
type HttpErrorMessage = {
  type: 'http_error'
  id: string
  error: string           // Error message
}
```

#### WebSocket Opened
```typescript
type WsOpenedMessage = {
  type: 'ws_opened'
  connId: string          // Local WS successfully connected
}
```

#### WebSocket Frame (Local → User)
```typescript
type WsFrameResponseMessage = {
  type: 'ws_frame'
  connId: string
  data: string            // Text or base64 binary
  binary?: boolean
}
```

#### WebSocket Closed
```typescript
type WsClosedMessage = {
  type: 'ws_closed'
  connId: string
  code: number
  reason: string
}
```

#### WebSocket Error
```typescript
type WsErrorMessage = {
  type: 'ws_error'
  connId: string
  error: string
}
```

---

## How WebSocket Proxying Works

### Full Bidirectional Flow

```
1. User connects to /some/path via WebSocket
   ↓
2. Cloudflare Worker detects WebSocket upgrade
   ↓
3. DO creates downstream WebSocket pair (user side)
   Sends WsOpenMessage to upstream
   ↓
4. Local client receives WsOpenMessage
   Opens local WebSocket to ws://localhost:PORT/some/path
   ↓
5. Local WS opens successfully
   Sends WsOpenedMessage back to DO
   ↓
6. DO clears pending timeout, ready to relay messages
   ↓
7. User sends binary/text frame
   ↓
8. DO receives on downstream WebSocket
   Encodes as WsFrameMessage, sends to upstream
   ↓
9. Local client receives, decodes base64 if binary
   Sends to local WebSocket
   ↓
10. Local WS sends response frame
    Local client sends WsFrameResponseMessage to DO
    ↓
11. DO receives, decodes if binary
    Sends frame to user WebSocket
    ↓
12. User receives message
```

### Key Implementation Details

#### Message Type Detection (tunnel.ts)
```typescript
const isUpgrade = req.headers.get('Upgrade') === 'websocket'

if (isUpgrade) {
  if (url.pathname === '/traforo-upstream') {
    return this.handleUpstreamConnection(tunnelId)
  }
  // User WebSocket connection to be proxied
  return this.handleUserWsConnection(tunnelId, url.pathname, req.headers)
}
```

#### Attachment Tagging
- **Upstream** attachment: `{ role: 'upstream', tunnelId }`
- **Downstream** attachment: `{ role: 'downstream', tunnelId }`
- **Connection tracking**: WebSocket tags like `ws:{connId}` for each user connection

#### Pending Connection Timeout
```typescript
const WS_OPEN_TIMEOUT_MS = 10_000  // 10 seconds to establish local WS

// Clears if local server doesn't open connection in time
// Closes user WebSocket with code 4010
```

#### Binary Handling
```typescript
// Client (client.ts)
if (msg.binary) {
  const buffer = Buffer.from(msg.data, 'base64')
  localWs.send(buffer)  // Send as binary
} else {
  localWs.send(msg.data)  // Send as text
}

// Both text and binary are base64-encoded during transmission
// in the JSON message protocol to ensure safe JSON serialization
```

---

## Streaming HTTP Support

### Detection Logic (client.ts)
```typescript
const shouldStream =
  contentType.includes('text/event-stream') ||
  contentType.includes('application/x-ndjson') ||
  transferEncoding.includes('chunked')
```

### Streaming Response Flow
```
1. Local client detects streaming response
   ↓
2. Sends HttpResponseStartMessage (status + headers only)
   DO immediately resolves with TransformStream
   ↓
3. User receives response and begins reading
   ↓
4. Local client reads chunks from res.body.getReader()
   ↓
5. For each chunk: base64 encode, send HttpResponseChunkMessage
   ↓
6. DO writes decoded chunk to TransformStream
   User receives data as it arrives
   ↓
7. When local response ends: send HttpResponseEndMessage
   ↓
8. DO closes the TransformStream writer
```

### Streaming in Tunnel (tunnel.ts)
```typescript
const { readable, writable } = new TransformStream<Uint8Array>()
const writer = writable.getWriter()

// Store for chunk handling
this.streamingHttpRequests.set(msg.id, {
  writer,
  timeout: pending.timeout,
  status: msg.status,
  headers,
})

// Resolve immediately with streaming response
pending.resolve(new Response(readable, { status: msg.status, headers }))
```

---

## CLI and Runtime Execution

### Entry Points

#### 1. CLI (cli.ts)
```bash
traforo -p 3000
traforo -p 3000 -t my-tunnel-id
traforo -p 5173 -- vite
```

Uses **goke** CLI framework (replaces cac):
- Option parsing with auto-type inference
- Example-based help text
- No manual type annotations needed

#### 2. Run Tunnel (run-tunnel.ts)
```typescript
export async function runTunnel(options: RunTunnelOptions): Promise<void>

interface RunTunnelOptions {
  port: number
  tunnelId?: string      // Random 8 chars if omitted
  localHost?: string     // Default: 'localhost'
  baseDomain?: string    // Default: 'traforo.dev'
  serverUrl?: string     // Custom DO URL
  command?: string[]     // Command to spawn (e.g., ['next', 'start'])
}
```

### Subprocess Spawning Flow

```
1. Parse arguments and extract command after '--'
   ↓
2. If command provided:
   - spawn(cmd, args, { stdio: 'inherit' })
   - Set PORT env var
   - Wait for port to be available (socket connection test)
   ↓
3. Create TunnelClient
   ↓
4. Connect to DO WebSocket
   ↓
5. Handle SIGINT/SIGTERM for cleanup
   - Close tunnel
   - Kill child process
```

### Port Wait Logic (run-tunnel.ts)
```typescript
async function waitForPort(port: number, host = 'localhost'): Promise<void>
  - Attempts every 500ms to connect
  - 60s timeout
  - Used when spawning child process to wait for server startup
```

---

## Test Infrastructure

### Test Setup (tunnel.test.ts - 1,083 lines)

#### Test Server
- **Port**: Random 19876 + 0-1000 (prevents conflicts)
- **Endpoints**: echo, json, post, binary-echo, large, empty, error, slow, sse, ws
- **WebSocket**: Echo server with broadcast capability
- **SSE**: Sends 5 events, 100ms apart

#### Connection
```typescript
const tunnelId = `test-${Date.now()}-${Math.random()...}`  // Unique ID
const tunnelUrl = `https://${tunnelId}-tunnel-preview.traforo.dev`
const serverUrl = `wss://${tunnelId}-tunnel-preview.traforo.dev`

const client = new TunnelClient({ localPort, tunnelId, serverUrl })
await client.connect()  // Connects to preview deployment
```

### Test Categories

#### 1. HTTP Requests (12 tests)
- GET static HTML, JSON
- GET with query params
- POST with JSON body
- Custom headers forwarding
- PUT, DELETE, PATCH requests
- Empty response (204)
- Server error (500)
- Large responses (100KB)
- Large request bodies (50KB)
- Binary request/response
- Concurrent requests (5 simultaneous)

#### 2. SSE Streaming (1 test)
- Receives all 5 events in order
- Validates event parsing

#### 3. WebSocket Connections (7 tests)
- Connect and receive welcome
- Send and receive echo messages
- Bidirectional message exchange
- Multiple concurrent connections (3)
- Server broadcasts to all clients
- Binary WebSocket messages
- Large WebSocket messages (50KB)
- Rapid message sending (20 messages)

#### 4. Tunnel Status (2 tests)
- Status endpoint shows offline when no client
- HTTP to offline tunnel returns 503
- WebSocket to offline tunnel fails gracefully (code 4008)

#### 5. Reconnection (1 test)
- New upstream connection replaces old one
- Tunnel remains online

### Test Patterns

**Timeout Management**:
```typescript
const TEST_TIMEOUT = 30_000  // 30s per test

test('name', async () => {
  // test code
}, TEST_TIMEOUT)  // Pass timeout to test()
```

**Promise/Event Handling**:
```typescript
const welcomeMessage = await new Promise<string>((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('timeout'))
  }, 10_000)
  
  ws.on('message', (data) => {
    clearTimeout(timeout)
    resolve(data.toString())
  })
})
```

**Cleanup**:
```typescript
beforeAll(async () => {
  testServer = await createTestServer(localPort)
  tunnelClient = new TunnelClient({...})
  await tunnelClient.connect()
})

afterAll(async () => {
  tunnelClient?.close()
  await testServer?.close()
})
```

---

## Key APIs and Usage

### TunnelClient (client.ts)

```typescript
const client = new TunnelClient({
  localPort: 3000,              // Required: local server port
  tunnelId: 'my-app',           // Required: tunnel identifier
  localHost?: 'localhost',       // Optional: local hostname
  baseDomain?: 'traforo.dev',    // Optional: tunnel domain
  serverUrl?: 'wss://...',       // Optional: custom DO URL
  localHttps?: false,            // Optional: use HTTPS for local
  autoReconnect?: true,          // Optional: auto-reconnect on disconnect
  reconnectDelay?: 3000,         // Optional: delay before reconnect
})

// Connect to tunnel
await client.connect()
// Prints: "Connected with Traforo! Tunnel URL: https://my-app-tunnel.traforo.dev"

// Tunnel URL
const url = client.url  // "https://my-app-tunnel.traforo.dev"

// Close tunnel
client.close()
```

### HTTP Request Handling (client.ts)

```typescript
private async handleHttpRequest(msg: HttpRequestMessage): Promise<void>
  1. Decode base64 body
  2. Make fetch() to local server
  3. Collect response headers (preserve Set-Cookie arrays)
  4. Decide: stream or non-stream
  5. Send response message(s)
  6. Handle errors
```

**Streaming Decision**:
```typescript
const shouldStream =
  contentType.includes('text/event-stream') ||
  contentType.includes('application/x-ndjson') ||
  transferEncoding.includes('chunked')
```

### Cloudflare Worker (tunnel.ts)

```typescript
// Extract tunnel ID from hostname
extractTunnelId(host: string): string | null
// Matches: {tunnelId}-tunnel[.preview].{domain}

// Handle upstream connection
handleUpstreamConnection(tunnelId: string): Response
// Creates WebSocketPair, accepts server side, returns 101

// Handle HTTP proxy
handleHttpProxy(tunnelId: string, req: Request): Promise<Response>
// Sends HttpRequestMessage, waits for response (30s timeout)

// Handle user WebSocket
handleUserWsConnection(
  tunnelId: string,
  path: string,
  headers: Headers
): Response
// Sends WsOpenMessage, waits for WsOpenedMessage (10s timeout)
```

---

## Existing Vite-Related Code/Tests

**Vite is NOT explicitly tested** in tunnel.test.ts, but:

1. **Vite compatible**: README mentions `traforo -p 5173 -- vite`
2. **PORT env var**: Set during subprocess spawn, which Vite respects
3. **Streaming support**: Vite HMR uses WebSocket (fully proxied)
4. **SSE/streaming**: Tests cover `text/event-stream` which is compatible with Vite's dev server updates

**No Vite-specific code** in traforo source - uses generic HTTP/WebSocket proxying.

---

## Dependencies

### Production
- **ws** (^8.19.0) - WebSocket client for local connections
- **goke** (^6.1.2) - CLI framework
- **string-dedent** (^3.0.2) - Template literal dedentation

### Dev
- **@cloudflare/workers-types** (^4.20250712.0) - Cloudflare Worker types
- **@types/node** (^22.0.0) - Node.js types
- **@types/ws** (^8.18.1) - WebSocket types
- **typescript** (^5.7.0) - TypeScript compiler
- **vitest** (^3.2.4) - Test framework
- **wrangler** (^4.24.3) - Cloudflare Worker CLI
- **tsx** (^4.20.5) - TypeScript executor

---

## Deployment and Configuration

### Cloudflare Worker Routes (wrangler.json)

**Production**:
```
*-tunnel.traforo.dev/*       → zone: traforo.dev
*-tunnel.kimaki.xyz/*        → zone: kimaki.xyz
```

**Preview**:
```
*-tunnel-preview.traforo.dev/*   → zone: traforo.dev
*-tunnel-preview.kimaki.xyz/*    → zone: kimaki.xyz
```

### Durable Object Configuration
```json
{
  "durable_objects": {
    "bindings": [{
      "name": "TUNNEL_DO",
      "class_name": "Tunnel"
    }]
  },
  "migrations": [{
    "tag": "v1",
    "new_classes": ["Tunnel"]
  }]
}
```

### Build & Deploy

```bash
# Build client libraries
pnpm build  # Compiles tsconfig.client.json

# Type check
pnpm typecheck         # Worker code
pnpm typecheck:client  # Client code
pnpm typecheck:test    # Test code

# Deploy
pnpm deploy           # Production: *-tunnel.traforo.dev
pnpm deploy:preview   # Preview: *-tunnel-preview.traforo.dev

# Run tests (requires preview deployment)
pnpm test
```

---

## Summary of Key Insights

### What Makes Traforo Unique

1. **Full WebSocket Proxying**: Not just HTTP tunneling - complete bidirectional WebSocket support with message-level protocol
2. **Streaming Support**: Automatically detects and handles streaming responses (SSE, chunked transfers)
3. **No Central Server**: Uses Cloudflare Durable Objects for scalable per-tunnel state
4. **Base64 Encoding**: Binary-safe message protocol over JSON
5. **Multi-value Headers**: Preserves Set-Cookie arrays via JSON array encoding
6. **Hop-by-hop Header Filtering**: Removes connection-specific headers during proxying

### Architecture Strengths

- **Decoupled messaging**: Local client doesn't need HTTP; uses JSON protocol
- **Timeouts**: 30s for HTTP, 10s for WebSocket open, prevents hanging requests
- **Connection tags**: Efficient DO WebSocket routing via tag-based lookups
- **Hibernation friendly**: Uses DO WebSocket hibernation for efficient scaling
- **Auto-reconnect**: Client automatically reconnects with exponential backoff

### Testing Approach

- **Integration tests only** (no unit tests)
- **Real preview deployment**: Tests against actual Cloudflare workers
- **Unique tunnel IDs**: Prevents test conflicts
- **Comprehensive coverage**: HTTP, WebSocket, SSE, streaming, binary, concurrent connections
- **Test server**: Implements all protocol variations locally

---

## File Dependency Graph

```
cli.ts
  ↓ imports
run-tunnel.ts
  ↓ imports
client.ts
  ↓ imports
types.ts (pure data definitions)

tunnel.ts (Cloudflare Worker)
  ↓ imports
types.ts

tunnel.test.ts
  ↓ imports
client.ts, types.ts

example-static/server.ts (standalone example)
```

---

## Conclusion

Traforo is a **production-grade HTTP/WebSocket tunneling system** built on Cloudflare's serverless infrastructure. It provides:

- **HTTP request/response proxying** with streaming support
- **Full WebSocket proxying** with bidirectional message relaying
- **JSON-based protocol** for safe binary transmission
- **Comprehensive test coverage** with integration tests
- **Simple CLI** for easy local server exposure

The architecture is elegant: local client communicates with a Cloudflare Durable Object via a typed JSON protocol, while remote users interact with standard HTTP/WebSocket interfaces. No direct connections, no firewall issues, just pure protocol-based tunneling.
