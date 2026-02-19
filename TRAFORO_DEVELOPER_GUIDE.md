# Traforo Developer Guide

**For developers integrating traforo or extending its functionality.**

---

## Getting Started

### Understanding the Codebase in 5 Minutes

1. **types.ts** - Read first
   - All message types defined here
   - ~10 message types total
   - No logic, just TypeScript interfaces

2. **client.ts** - Read second
   - How local tunnel client works
   - Handles incoming messages from DO
   - Makes fetch() calls to local server
   - Manages local WebSocket connections

3. **tunnel.ts** - Read third
   - Cloudflare Worker code
   - Durable Object implementation
   - Routes HTTP/WebSocket to upstream or users
   - Most complex file (812 lines)

4. **run-tunnel.ts** - Read for CLI understanding
   - How subprocess spawning works
   - Port waiting logic
   - Cleanup on shutdown

5. **tunnel.test.ts** - Reference for behavior
   - 23 integration tests
   - Shows expected behavior
   - Examples of all protocol usage

---

## Code Flow Walkthrough

### Example 1: Simple HTTP GET Request

**User makes request**:
```bash
curl https://my-app-tunnel.traforo.dev/api/users
```

**Cloudflare Worker receives**:
```typescript
// tunnel.ts:52-82
// fetch() handler in Worker entrypoint
const tunnelId = extractTunnelId(host)  // Extract "my-app"
const doId = env.TUNNEL_DO.idFromName(tunnelId)
const stub = env.TUNNEL_DO.get(doId)
const res = await stub.fetch(new Request(...))
```

**Durable Object routes**:
```typescript
// tunnel.ts:115-150
async fetch(req: Request): Promise<Response> {
  const isUpgrade = req.headers.get('Upgrade') === 'websocket'
  
  if (isUpgrade) {
    // WebSocket upgrade path
    return this.handleUserWsConnection(...)
  }
  
  if (url.pathname === '/traforo-status') {
    return Response.json({ online: !!upstream })
  }
  
  // HTTP request proxying
  return this.handleHttpProxy(tunnelId, req)
}
```

**Proxy sends message to local client**:
```typescript
// tunnel.ts:194-253
private async handleHttpProxy(tunnelId, req): Promise<Response> {
  const upstream = this.getUpstream(tunnelId)
  if (!upstream) {
    return new Response(offlineHtml(tunnelId), { status: 503 })
  }
  
  const reqId = crypto.randomUUID()
  const message: HttpRequestMessage = {
    type: 'http_request',
    id: reqId,
    method: req.method,
    path: url.pathname + url.search,
    headers: { /* filtered */ },
    body: body ? arrayBufferToBase64(buffer) : null
  }
  
  upstream.send(JSON.stringify(message))
  
  return new Promise<Response>((resolve) => {
    const timeout = setTimeout(() => {
      this.pendingHttpRequests.delete(reqId)
      resolve(new Response('Tunnel timeout', { status: 504 }))
    }, HTTP_TIMEOUT_MS)
    
    this.pendingHttpRequests.set(reqId, { resolve, reject, timeout })
  })
}
```

**Local client receives**:
```typescript
// client.ts:129-152
private handleMessage(rawMessage: string): void {
  const msg = JSON.parse(rawMessage) as UpstreamMessage
  
  switch (msg.type) {
    case 'http_request':
      this.handleHttpRequest(msg)
      break
    // ...
  }
}
```

**Local client makes fetch call**:
```typescript
// client.ts:154-263
private async handleHttpRequest(msg: HttpRequestMessage): Promise<void> {
  const url = `http://localhost:3000${msg.path}`
  
  let body: Buffer | undefined
  if (msg.body) {
    body = Buffer.from(msg.body, 'base64')  // Decode base64
  }
  
  const res = await fetch(url, {
    method: msg.method,
    headers: msg.headers,
    body: msg.method !== 'GET' ? body : undefined
  })
  
  // Check for streaming
  const contentType = res.headers.get('content-type') || ''
  const shouldStream = contentType.includes('text/event-stream') || ...
  
  if (shouldStream && res.body) {
    // Send start + chunks
    this.send({
      type: 'http_response_start',
      id: msg.id,
      status: res.status,
      headers: resHeaders
    })
    
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      this.send({
        type: 'http_response_chunk',
        id: msg.id,
        chunk: Buffer.from(value).toString('base64')
      })
    }
    
    this.send({
      type: 'http_response_end',
      id: msg.id
    })
  } else {
    // Send complete response
    const resBuffer = await res.arrayBuffer()
    this.send({
      type: 'http_response',
      id: msg.id,
      status: res.status,
      headers: resHeaders,
      body: Buffer.from(resBuffer).toString('base64')
    })
  }
}
```

**DO receives response**:
```typescript
// tunnel.ts:479-496
private handleHttpResponse(msg: HttpResponseMessage) {
  const pending = this.pendingHttpRequests.get(msg.id)
  
  clearTimeout(pending.timeout)
  this.pendingHttpRequests.delete(msg.id)
  
  let body: BodyInit | null = null
  if (msg.body) {
    body = base64ToArrayBuffer(msg.body)
  }
  
  const headers = buildHeaders(msg.headers)
  pending.resolve(new Response(body, {
    status: msg.status,
    headers
  }))
}
```

**User receives response**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"id": 1, "name": "Alice"}
```

---

### Example 2: WebSocket Connection

**User connects**:
```javascript
const ws = new WebSocket('wss://my-app-tunnel.traforo.dev/ws')
```

**DO detects upgrade**:
```typescript
// tunnel.ts:115-150
const isUpgrade = req.headers.get('Upgrade') === 'websocket'

if (isUpgrade && url.pathname !== '/traforo-upstream') {
  return this.handleUserWsConnection(tunnelId, url.pathname, req.headers)
}
```

**DO creates user-side connection**:
```typescript
// tunnel.ts:259-318
private handleUserWsConnection(
  tunnelId: string,
  path: string,
  reqHeaders: Headers
): Response {
  const upstream = this.getUpstream(tunnelId)
  if (!upstream) {
    // Tunnel offline - close immediately
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    server.accept()
    server.close(4008, 'Tunnel offline')
    return new Response(null, { status: 101, webSocket: client })
  }
  
  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)
  const connId = crypto.randomUUID()
  
  // Tag for message routing
  this.ctx.acceptWebSocket(server, [`downstream:${tunnelId}`, `ws:${connId}`])
  server.serializeAttachment({
    role: 'downstream',
    tunnelId
  })
  
  // Send open request to local client
  const message: WsOpenMessage = {
    type: 'ws_open',
    connId,
    path,
    headers: { /* filtered */ }
  }
  
  upstream.send(JSON.stringify(message))
  
  // Wait for local connection (10s timeout)
  const timeout = setTimeout(() => {
    this.pendingWsConnections.delete(connId)
    server.close(4010, 'Local connection timeout')
  }, WS_OPEN_TIMEOUT_MS)
  
  this.pendingWsConnections.set(connId, { userWs: server, timeout })
  
  return new Response(null, { status: 101, webSocket: client })
}
```

**Local client receives open**:
```typescript
// client.ts:265-344
private handleWsOpen(msg: WsOpenMessage): void {
  const url = `ws://localhost:3000${msg.path}`
  
  const localWs = new WebSocket(url)
  
  localWs.on('open', () => {
    this.localWsConnections.set(msg.connId, localWs)
    
    // Notify DO that local connection opened
    this.send({
      type: 'ws_opened',
      connId: msg.connId
    })
  })
  
  localWs.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
    let frameData: string
    let binary = false
    
    if (isBinary) {
      frameData = Buffer.isBuffer(data)
        ? data.toString('base64')
        : Buffer.from(data as ArrayBuffer).toString('base64')
      binary = true
    } else {
      frameData = data.toString()
    }
    
    // Send frame to DO
    this.send({
      type: 'ws_frame',
      connId: msg.connId,
      data: frameData,
      binary
    })
  })
  
  localWs.on('close', (code, reason) => {
    this.send({
      type: 'ws_closed',
      connId: msg.connId,
      code,
      reason: reason.toString()
    })
    this.localWsConnections.delete(msg.connId)
  })
}
```

**DO receives opened notification**:
```typescript
// tunnel.ts:565-574
private handleWsOpened(msg: WsOpenedMessage) {
  const pending = this.pendingWsConnections.get(msg.connId)
  if (!pending) {
    return
  }
  
  clearTimeout(pending.timeout)
  this.pendingWsConnections.delete(msg.connId)
  // WebSocket is now ready for messages via webSocketMessage handler
}
```

**User sends frame**:
```javascript
ws.send('Hello server')
```

**DO receives user frame**:
```typescript
// tunnel.ts:324-346
async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  const attachment = ws.deserializeAttachment() as Attachment | undefined
  
  if (attachment.role === 'downstream') {
    const binary = typeof message !== 'string'
    const data = binary ? arrayBufferToBase64(message) : message
    
    this.handleDownstreamMessage(attachment.tunnelId, ws, data, binary)
  }
}
```

**DO forwards to local client**:
```typescript
// tunnel.ts:446-477
private handleDownstreamMessage(
  tunnelId: string,
  ws: WebSocket,
  rawMessage: string,
  binary: boolean
) {
  const upstream = this.getUpstream(tunnelId)
  if (!upstream) {
    return
  }
  
  // Find connId from tags
  const tags = this.ctx.getTags(ws)
  const wsTag = tags.find((t) => t.startsWith('ws:'))
  const connId = wsTag.replace('ws:', '')
  
  const message: WsFrameMessage = {
    type: 'ws_frame',
    connId,
    data: rawMessage,
    binary
  }
  
  upstream.send(JSON.stringify(message))
}
```

**Local client receives frame**:
```typescript
// client.ts:346-363
private handleWsFrame(msg: WsFrameMessage): void {
  const localWs = this.localWsConnections.get(msg.connId)
  if (!localWs) {
    return
  }
  
  if (msg.binary) {
    const buffer = Buffer.from(msg.data, 'base64')
    localWs.send(buffer)
  } else {
    localWs.send(msg.data)
  }
}
```

**Local server responds**:
```
// Local WebSocket receives "Hello server"
// Echoes: {"type": "echo", "message": "Hello server"}
```

**Local client sends response**:
```typescript
// Triggers localWs.on('message', ...) handler
// Sends to DO:
{
  "type": "ws_frame",
  "connId": "...",
  "data": "eyJ0eXBlIjogImVjaG8iLCAibWVzc2FnZSI6ICJIZWxsbyBzZXJ2ZXIifQ==",
  "binary": false
}
```

**DO forwards to user**:
```typescript
// tunnel.ts:576-587
private handleWsFrame(tunnelId: string, msg: WsFrameResponseMessage) {
  const sockets = this.ctx.getWebSockets(`ws:${msg.connId}`)
  for (const ws of sockets) {
    if (msg.binary) {
      ws.send(base64ToArrayBuffer(msg.data))
    } else {
      ws.send(msg.data)
    }
  }
}
```

**User receives response**:
```javascript
// ws.on('message', (data) => {
//   console.log(data)  // {"type": "echo", "message": "Hello server"}
// })
```

---

## Common Implementation Patterns

### Adding a New Feature

**Pattern: Add new message type**

1. **types.ts** - Define message type
```typescript
export type MyNewMessage = {
  type: 'my_new_message'
  // fields
}

// Add to union
export type UpstreamMessage = 
  | HttpRequestMessage
  | MyNewMessage  // Add here
```

2. **tunnel.ts** - Handle in DO
```typescript
private handleUpstreamMessage(tunnelId: string, rawMessage: string) {
  const msg = JSON.parse(rawMessage) as DownstreamMessage
  
  switch (msg.type) {
    case 'my_new_message':
      this.handleMyNewMessage(msg)
      break
  }
}

private handleMyNewMessage(msg: MyNewMessage) {
  // Logic here
}
```

3. **client.ts** - Handle in local client
```typescript
private handleMessage(rawMessage: string): void {
  const msg = JSON.parse(rawMessage) as UpstreamMessage
  
  switch (msg.type) {
    case 'my_new_message':
      this.handleMyNewMessage(msg)
      break
  }
}

private handleMyNewMessage(msg: MyNewMessage) {
  // Logic here
}
```

4. **tunnel.test.ts** - Add test
```typescript
test('my new feature', async () => {
  // Test code
}, TEST_TIMEOUT)
```

### Handling Binary Data

**Always use base64**:
```typescript
// Encoding (binary → string)
const base64 = Buffer.from(binaryData).toString('base64')

// Decoding (string → binary)
const buffer = Buffer.from(base64String, 'base64')
const arrayBuffer = buffer.buffer.slice(
  buffer.byteOffset,
  buffer.byteOffset + buffer.byteLength
)
```

### Timeout Patterns

**For HTTP requests**:
```typescript
const timeout = setTimeout(() => {
  this.pendingHttpRequests.delete(reqId)
  resolve(new Response('Timeout', { status: 504 }))
}, HTTP_TIMEOUT_MS)  // 30 seconds
```

**For WebSocket opens**:
```typescript
const timeout = setTimeout(() => {
  this.pendingWsConnections.delete(connId)
  try {
    server.close(4010, 'Local connection timeout')
  } catch {}
}, WS_OPEN_TIMEOUT_MS)  // 10 seconds
```

### Error Handling

**HTTP errors**:
```typescript
const errorMsg: HttpErrorMessage = {
  type: 'http_error',
  id: msg.id,
  error: err.message
}
this.send(errorMsg)
```

**WebSocket errors**:
```typescript
const errorMsg: WsErrorMessage = {
  type: 'ws_error',
  connId: msg.connId,
  error: err.message
}
this.send(errorMsg)
```

---

## Debugging Guide

### Enable Logging

**In client.ts**:
```typescript
console.log(`[CLIENT] Received message: ${msg.type}`)
```

**In tunnel.ts**:
```typescript
console.log(`[DO] HTTP request: ${req.method} ${url.pathname}`)
```

### Common Issues

**Issue: WebSocket connection fails**
- Check: Is tunnel client connected? (status endpoint)
- Check: Does local server listen on specified port?
- Check: Is firewall blocking localhost connection?

**Issue: Slow responses**
- Check: Is 30s timeout being hit? (HTTP_TIMEOUT_MS)
- Check: Are messages being queued? (pendingHttpRequests size)
- Check: Is streaming working? (content-type headers)

**Issue: Binary data corruption**
- Check: Is base64 encoding/decoding correct?
- Check: Is binary flag set properly in message?
- Check: Are ArrayBuffer conversions correct?

**Issue: WebSocket stuck**
- Check: Is local connection opening? (handleWsOpen logs)
- Check: Is 10s timeout being hit? (WS_OPEN_TIMEOUT_MS)
- Check: Are frames being relayed? (ws_frame messages)

---

## Testing Strategy

### Unit Testing (Limited)

Most logic requires live DO/client interaction. Unit testing not recommended for:
- WebSocket message relaying
- Streaming response handling
- Error recovery

### Integration Testing (Recommended)

See `tunnel.test.ts` for patterns:

1. **Create test server** (with endpoints)
2. **Start tunnel client** (connect to DO)
3. **Make requests** via tunnel URL
4. **Assert responses** match expected behavior
5. **Clean up** (close tunnel, close server)

**Test pattern**:
```typescript
test('description', async () => {
  // Setup: testServer already running
  // Action: fetch via tunnelUrl
  // Assert: check status, content, etc.
}, TEST_TIMEOUT)
```

---

## Performance Considerations

### Limits
- **Message size**: WebSocket frame size limits (~1MB typical)
- **Response size**: Cloudflare Worker response limit (25MB)
- **Concurrent connections**: Limited by DO resource constraints
- **Request timeout**: 30 seconds (tunable)

### Optimization
- **Streaming**: Detect content-type early, stream immediately
- **Binary**: Use base64 (1.33x overhead, but safe)
- **Headers**: Filter hop-by-hop headers (reduce message size)
- **Connections**: Reuse WebSocket connection for multiple requests

### Monitoring
- **DO hibernation**: Efficient for idle tunnels
- **Memory**: DO stores pending requests/connections (max ~100 each)
- **CPU**: Message parsing and relaying are fast (~1ms per message)

---

## Deployment Checklist

- [ ] Run `pnpm typecheck` (all configs)
- [ ] Run `pnpm build` (client libraries)
- [ ] Run `pnpm test` (integration tests)
- [ ] Check console logs (no errors)
- [ ] Verify `dist/` files generated
- [ ] Run `pnpm deploy` (production)
- [ ] Test manually: `traforo -p 3000 -- next start`
- [ ] Verify tunnel URL accessible
- [ ] Test WebSocket connection
- [ ] Monitor logs for errors

---

## Extending Traforo

### Ideas for Extension
1. **Custom headers**: Add request-level headers (auth, routing)
2. **Rate limiting**: Add per-tunnel request limits
3. **Compression**: gzip response bodies for bandwidth
4. **Metrics**: Track requests, latency, errors
5. **Authentication**: Require token to create tunnels
6. **Caching**: Cache frequently accessed responses

### Architecture for Extensions
- Keep protocol the same (append new message types)
- Add DO middleware for request/response processing
- Add client middleware for local request/response processing
- Add tests for new behavior

---

## References

- **Full Guide**: `TRAFORO_COMPREHENSIVE_GUIDE.md`
- **Quick Reference**: `TRAFORO_QUICK_REFERENCE.md`
- **Source Code**: Read in this order: types.ts → client.ts → tunnel.ts
- **Tests**: `tunnel.test.ts` for behavior examples
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/platform/webassembly/
