"use strict";
// Slack API types for the digital twin server.
// Response types (User, Channel, Message, Reaction, File) are extracted from
// the official @slack/web-api SDK response types to guarantee shape compliance.
// Events API envelope types stay custom — they represent inbound webhook
// payloads that aren't modeled by the SDK's response types.
Object.defineProperty(exports, "__esModule", { value: true });
