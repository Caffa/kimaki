# Traforo Quick Reference

## File Structure

```
traforo/
├── src/
│   ├── types.ts              (179 lines) - Message protocol types
│   ├── client.ts             (388 lines) - Local tunnel client
│   ├── tunnel.ts             (812 lines) - Cloudflare Worker + DO
│   ├── cli.ts                (52 lines)  - CLI entrypoint
│   ├── run-tunnel.ts         (157 lines) - Runner with subprocess spawn
│   └── tunnel.test.ts        (1,083 lines) - Integration tests
├── example-static/server.ts  (315 lines) - Example Bun test server
├── package.json              - Dependencies: ws, goke, string-dedent
├── wrangler.json             - Cloudflare Worker config
├── vitest.config.ts          - Test runner config
└── tsconfig*.json            - TypeScript configs
```

## Core Concepts

### Message Types (10 total)

**Upstream (DO → Client)**:
1. `http_request` - HTTP to forward
2. `ws_open` - WebSocket connection request
3. `ws_frame` - WebSocket message
4. `ws_close` - WebSocket disconnect

**Downstream (Client → DO)**:
5. `http_response` - Complete HTTP response
6. `http_response_start` - Streaming response headers
7. `http_response_chunk` - Streaming response data
8. `http_response_end` - Streaming response complete
9. `http_error` - HTTP error
10. `ws_opened` / `ws_frame` / `ws_closed` / `ws_error` - WebSocket responses

### Base64 Encoding
- All binary data encoded as base64 in JSON
- Applied to: HTTP bodies, WebSocket binary frames
- Decoded at endpoints before forwarding

### WebSocket Connection Flow
```
User WS → DO ← → Client WS ← → Local WS
```

1. User connects: DO creates downstream pair
2. DO sends `ws_open` to upstream client
3. Client connects locally, sends `ws_opened`
4. Messages relay via `ws_frame` messages
5. Either side closes: `ws_close` sent

### HTTP Proxying Flow
```
User HTTP → DO ← → Client HTTP ← → Local HTTP
```

1. HTTP request arrives at DO
2. DO sends `http_request` message
3. Client makes fetch() to local server
4. Client decides: stream or complete
5. Client sends `http_response` or `http_response_start` + chunks

## Key Timeouts

| Timeout | Value | Purpose |
|---------|-------|---------|
| HTTP Request | 30s | Waiting for local server response |
| WebSocket Open | 10s | Waiting for local WS connection |
| Reconnect Delay | 3s | Before retrying connection |

## CLI Usage

```bash
# Basic tunnel
traforo -p 3000

# Custom tunnel ID
traforo -p 3000 -t my-app

# Run command and tunnel
traforo -p 5173 -- vite
traforo -p 3000 -- next start
traforo -p 3000 -- pnpm dev

# Tunnel URL
https://{tunnelId}-tunnel.traforo.dev
```

## TunnelClient API

```typescript
// Create client
const client = new TunnelClient({
  localPort: 3000,
  tunnelId: 'my-app',
  serverUrl: 'wss://...',  // Optional, custom DO
})

// Connect
await client.connect()

// Get tunnel URL
const url = client.url  // https://my-app-tunnel.traforo.dev

// Disconnect
client.close()
```

## Test Endpoints

```
GET  /              - Static HTML
GET  /echo          - Echo request info
GET  /json          - JSON response
GET  /post          - Accept POST data
GET  /binary-echo   - Binary data echo
GET  /large?size=N  - Large response (N bytes)
GET  /empty         - 204 No Content
GET  /error         - 500 Server Error
GET  /slow?delay=N  - Delayed response (N ms)
GET  /sse           - Server-Sent Events (5 events)
WS   /ws            - WebSocket echo
```

## Streaming Detection

Automatic when response has:
- `Content-Type: text/event-stream`
- `Content-Type: application/x-ndjson`
- `Transfer-Encoding: chunked`

Otherwise sent as complete response.

## Deployment

```bash
# Check types
pnpm typecheck
pnpm typecheck:client
pnpm typecheck:test

# Build (client libraries only)
pnpm build

# Deploy to production
pnpm deploy

# Deploy to preview
pnpm deploy:preview

# Run tests (requires preview deployment)
pnpm test
```

## Headers Handling

### Hop-by-hop Headers (Filtered)
```
connection, keep-alive, proxy-authenticate,
proxy-authorization, te, trailers,
transfer-encoding, upgrade
```

### Multi-value Headers (Preserved)
```
Set-Cookie: a=1
Set-Cookie: b=2
→ { 'set-cookie': ['a=1', 'b=2'] }
```

## Error Handling

**HTTP Errors**:
- `http_error` message with error text
- Client → `502 Bad Gateway`

**WebSocket Errors**:
- `ws_error` message
- DO closes user WS with code `4012`

**Connection Errors**:
- `4008` - Tunnel offline (user WS to offline tunnel)
- `4009` - Replaced by new connection
- `4010` - Local connection timeout
- `4011` - Tunnel disconnected mid-request

## Protocol Example

### HTTP GET Request

```
User → DO:
GET /api/users HTTP/1.1
Host: my-app-tunnel.traforo.dev
Authorization: Bearer token

DO → Client (WebSocket):
{
  "type": "http_request",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/users",
  "headers": {
    "host": "my-app-tunnel.traforo.dev",
    "authorization": "Bearer token"
  },
  "body": null
}

Client → Local:
GET /api/users HTTP/1.1
Host: localhost:3000
Authorization: Bearer token

Local → Client:
HTTP/1.1 200 OK
Content-Type: application/json
[{"id": 1, "name": "Alice"}]

Client → DO (WebSocket):
{
  "type": "http_response",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": "W3siaWQiOiAxLCAibmFtZSI6ICJBbGljZSJ9XQ=="
}

DO → User:
HTTP/1.1 200 OK
Content-Type: application/json
[{"id": 1, "name": "Alice"}]
```

### WebSocket Message

```
User → DO (WS frame):
Hello server

DO → Client (WebSocket message):
{
  "type": "ws_frame",
  "connId": "e8a5f3d2-6c1b-4e9a-8f7d-3c2b1a9e8f7d",
  "data": "SGVsbG8gc2VydmVy",
  "binary": false
}

Client → Local (WS):
Hello server

Local → Client (WS):
{"type": "echo", "message": "Hello server"}

Client → DO (WebSocket message):
{
  "type": "ws_frame",
  "connId": "e8a5f3d2-6c1b-4e9a-8f7d-3c2b1a9e8f7d",
  "data": "eyJ0eXBlIjogImVjaG8iLCAibWVzc2FnZSI6ICJIZWxsbyBzZXJ2ZXIifQ==",
  "binary": false
}

DO → User (WS):
{"type": "echo", "message": "Hello server"}
```

## Test Patterns

**Timeout per test**:
```typescript
test('name', async () => {
  // code
}, 30_000)  // 30 seconds
```

**Promise with timeout**:
```typescript
const result = await new Promise<T>((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('timeout'))
  }, 10_000)
  
  ws.once('message', (data) => {
    clearTimeout(timeout)
    resolve(parseData(data))
  })
})
```

**Event-based waiting**:
```typescript
ws.on('open', () => {
  // Connection established
})

ws.once('message', (data) => {
  // First message received
})

ws.on('close', (code, reason) => {
  // Connection closed
})
```

## Important Notes

1. **WebSocket Hibernation**: DO uses hibernation for efficient resource usage
2. **Connection Attachment**: Each WS gets attachment with role/tunnelId for routing
3. **Connection Tags**: Used to find downstream WS for relaying
4. **One Upstream per Tunnel**: New connection replaces old one (5 replaces 1)
5. **All Binary = Base64**: Safe for JSON transmission
6. **No Real HTTP**: Just JSON protocol between DO and client

## Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Tunnel offline | Client disconnected | Client must reconnect |
| 503 response | No upstream connected | Start/reconnect tunnel client |
| WebSocket fails | Local server not listening | Check port/host |
| Slow SSE | Buffering issue | Not detected as streaming | Ensure content-type header |
| Large message timeout | 30s+ response time | May exceed timeout |

## Performance Characteristics

- **Latency**: Low (WebSocket relay)
- **Throughput**: Limited by Cloudflare Worker response size (25MB)
- **Connections**: Limited by DO resource constraints
- **Messages**: 1-4KB typical (headers + base64 overhead)
- **Scaling**: Horizontal via multiple DOs (one per tunnel ID)

## See Also

- **Full Guide**: `TRAFORO_COMPREHENSIVE_GUIDE.md`
- **Source Code**: `traforo/src/`
- **Tests**: `traforo/src/tunnel.test.ts` (1,083 lines of examples)
- **Example**: `traforo/example-static/server.ts` (Bun test server)
