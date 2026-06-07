"use strict";
// Discord Gateway WebSocket server for the Slack bridge.
// Reuses the same protocol as discord-digital-twin: Hello -> Identify -> Ready
// -> GUILD_CREATE, plus heartbeat keep-alive. The bridge pushes translated
// Slack events via broadcast().
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackBridgeGateway = void 0;
var ws_1 = require("ws");
var gateway_session_manager_js_1 = require("./gateway-session-manager.js");
var SlackBridgeGateway = /** @class */ (function () {
    function SlackBridgeGateway(_a) {
        var httpServer = _a.httpServer, port = _a.port, loadState = _a.loadState, expectedToken = _a.expectedToken, gatewayUrlOverride = _a.gatewayUrlOverride, authorize = _a.authorize, workspaceId = _a.workspaceId;
        var _this = this;
        this.clients = [];
        this.port = port;
        this.expectedToken = expectedToken;
        this.gatewayUrlOverride = gatewayUrlOverride;
        this.authorize = authorize;
        this.workspaceId = workspaceId;
        this.sessionManager = new gateway_session_manager_js_1.GatewaySessionManager({
            loadState: loadState,
            expectedToken: expectedToken,
            workspaceId: workspaceId,
            authorize: authorize,
            gatewayUrlProvider: function () {
                var _a;
                return (_a = _this.gatewayUrlOverride) !== null && _a !== void 0 ? _a : "ws://127.0.0.1:".concat(_this.port, "/slack/gateway");
            },
        });
        this.wss = new ws_1.WebSocketServer({ noServer: true });
        this.wss.on('connection', function (ws) {
            _this.handleConnection(ws);
        });
        httpServer.on('upgrade', function (request, socket, head) {
            var _a;
            var pathname = new URL((_a = request.url) !== null && _a !== void 0 ? _a : '/', "http://".concat(request.headers.host)).pathname;
            if (pathname === '/slack/gateway' || pathname === '/slack/gateway/') {
                _this.wss.handleUpgrade(request, socket, head, function (ws) {
                    _this.wss.emit('connection', ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
    }
    SlackBridgeGateway.prototype.broadcast = function (event, data) {
        this.sessionManager.broadcast(event, data);
    };
    SlackBridgeGateway.prototype.broadcastMessageCreate = function (message, guildId) {
        this.sessionManager.broadcastMessageCreate(message, guildId);
    };
    /** Update the port used in resume_gateway_url. Call after server bind
     *  when using port:0 (OS-assigned) so READY payloads have the real port. */
    SlackBridgeGateway.prototype.setPort = function (port) {
        this.port = port;
    };
    SlackBridgeGateway.prototype.close = function () {
        this.sessionManager.closeAll();
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            client.ws.close();
        }
        this.clients = [];
        this.wss.close();
    };
    SlackBridgeGateway.prototype.handleConnection = function (ws) {
        var _this = this;
        var transport = {
            send: function (payload) {
                if (ws.readyState !== ws_1.WebSocket.OPEN) {
                    return;
                }
                ws.send(payload);
            },
            close: function (code, reason) {
                ws.close(code, reason);
            },
            isOpen: function () {
                return ws.readyState === ws_1.WebSocket.OPEN;
            },
        };
        var id = this.sessionManager.registerClient(transport);
        var client = {
            ws: ws,
            id: id,
        };
        this.clients.push(client);
        ws.on('message', function (raw) {
            void _this.sessionManager.handleRawMessage({
                clientId: client.id,
                raw: raw.toString(),
            });
        });
        ws.on('close', function () {
            _this.sessionManager.removeClient(client.id);
            var idx = _this.clients.indexOf(client);
            if (idx !== -1) {
                _this.clients.splice(idx, 1);
            }
        });
    };
    return SlackBridgeGateway;
}());
exports.SlackBridgeGateway = SlackBridgeGateway;
