"use strict";
// In-process WebSocket-to-TCP bridge (websockify replacement).
// Accepts WebSocket connections and pipes raw bytes to/from a TCP target.
// Used by /screenshare to bridge noVNC (WebSocket) to a VNC server (TCP).
// Supports the 'binary' subprotocol required by noVNC.
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebsockify = startWebsockify;
var ws_1 = require("ws");
var node_net_1 = require("node:net");
var logger_js_1 = require("./logger.js");
var logger = (0, logger_js_1.createLogger)('SCREEN');
function startWebsockify(_a) {
    var wsPort = _a.wsPort, tcpHost = _a.tcpHost, tcpPort = _a.tcpPort;
    return new Promise(function (resolve, reject) {
        var wss = new ws_1.WebSocketServer({
            port: wsPort,
            // noVNC negotiates the 'binary' subprotocol
            handleProtocols: function (protocols) {
                if (protocols.has('binary')) {
                    return 'binary';
                }
                return false;
            },
        });
        wss.on('listening', function () {
            var addr = wss.address();
            var port = typeof addr === 'object' && addr ? addr.port : wsPort;
            logger.log("Websockify listening on port ".concat(port, " \u2192 ").concat(tcpHost, ":").concat(tcpPort));
            resolve({
                wss: wss,
                port: port,
                close: function () {
                    for (var _i = 0, _a = wss.clients; _i < _a.length; _i++) {
                        var client = _a[_i];
                        client.close();
                    }
                    wss.close();
                },
            });
        });
        wss.on('error', function (err) {
            reject(new Error('Websockify failed to start', { cause: err }));
        });
        wss.on('connection', function (ws) {
            var tcp = node_net_1.default.createConnection(tcpPort, tcpHost, function () {
                logger.log("TCP connection established to ".concat(tcpHost, ":").concat(tcpPort));
            });
            tcp.on('data', function (data) {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(data);
                }
            });
            ws.on('message', function (data) {
                if (!tcp.destroyed) {
                    tcp.write(data);
                }
            });
            ws.on('close', function () {
                tcp.destroy();
            });
            ws.on('error', function (err) {
                logger.error('WebSocket error:', err);
                tcp.destroy();
            });
            tcp.on('close', function () {
                ws.close();
            });
            tcp.on('error', function (err) {
                logger.error('TCP connection error:', err);
                ws.close();
            });
        });
    });
}
