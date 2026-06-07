"use strict";
// Per-thread state type, transition functions, and selectors.
// All transitions operate on the global store from ../store.js.
//
// ThreadRunState is a value-type: one entry per active thread in the
// global store's `threads` Map. Transition functions produce new Map +
// new ThreadRunState objects each time (immutable updates).
//
// Derived helpers (queue checks) compute from state and are never
// stored — they are always re-derived from ThreadRunState.
//
// STATE DISCIPLINE: keep as little state as possible. Before adding any new
// state field, ask if it can be derived from existing state instead.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialThreadState = initialThreadState;
exports.hasQueue = hasQueue;
exports.updateThread = updateThread;
exports.ensureThread = ensureThread;
exports.removeThread = removeThread;
exports.setSessionId = setSessionId;
exports.setSessionUsername = setSessionUsername;
exports.setSessionUserId = setSessionUserId;
exports.enqueueItem = enqueueItem;
exports.dequeueItem = dequeueItem;
exports.clearQueueItems = clearQueueItems;
exports.removeQueueItemAtPosition = removeQueueItemAtPosition;
exports.getThreadState = getThreadState;
exports.getThreadIds = getThreadIds;
var store_js_1 = require("../store.js");
// ── Initial state factory ────────────────────────────────────────
function initialThreadState() {
    return {
        sessionId: undefined,
        sessionUsername: undefined,
        sessionUserId: undefined,
        queueItems: [],
        listenerController: undefined,
        sentPartIds: new Set(),
    };
}
// ── Derived helpers (compute, never store) ───────────────────────
function hasQueue(t) {
    return t.queueItems.length > 0;
}
// ── Pure transition helpers ──────────────────────────────────────
// Immutable: produces new Map + new ThreadRunState object each time.
function updateThread(threadId, updater) {
    store_js_1.store.setState(function (s) {
        var existing = s.threads.get(threadId);
        if (!existing) {
            return s;
        }
        var newThreads = new Map(s.threads);
        newThreads.set(threadId, updater(existing));
        return { threads: newThreads };
    });
}
function ensureThread(threadId) {
    if (store_js_1.store.getState().threads.has(threadId)) {
        return;
    }
    store_js_1.store.setState(function (s) {
        var newThreads = new Map(s.threads);
        newThreads.set(threadId, initialThreadState());
        return { threads: newThreads };
    });
}
function removeThread(threadId) {
    store_js_1.store.setState(function (s) {
        if (!s.threads.has(threadId)) {
            return s;
        }
        var newThreads = new Map(s.threads);
        newThreads.delete(threadId);
        return { threads: newThreads };
    });
}
function setSessionId(threadId, sessionId) {
    updateThread(threadId, function (t) { return (__assign(__assign({}, t), { sessionId: sessionId })); });
}
function setSessionUsername(threadId, username) {
    updateThread(threadId, function (t) {
        if (t.sessionUsername) {
            return t;
        }
        return __assign(__assign({}, t), { sessionUsername: username });
    });
}
function setSessionUserId(threadId, userId) {
    updateThread(threadId, function (t) {
        if (t.sessionUserId) {
            return t;
        }
        return __assign(__assign({}, t), { sessionUserId: userId });
    });
}
function enqueueItem(threadId, item) {
    updateThread(threadId, function (t) { return (__assign(__assign({}, t), { queueItems: __spreadArray(__spreadArray([], t.queueItems, true), [item], false) })); });
}
// Atomic dequeue: read + write in one setState call to prevent
// a concurrent enqueue between read and write from losing items.
function dequeueItem(threadId) {
    var next;
    store_js_1.store.setState(function (s) {
        var t = s.threads.get(threadId);
        if (!t || t.queueItems.length === 0) {
            return s;
        }
        var _a = t.queueItems, head = _a[0], rest = _a.slice(1);
        next = head;
        var newThreads = new Map(s.threads);
        newThreads.set(threadId, __assign(__assign({}, t), { queueItems: rest }));
        return { threads: newThreads };
    });
    return next;
}
function clearQueueItems(threadId) {
    updateThread(threadId, function (t) { return (__assign(__assign({}, t), { queueItems: [] })); });
}
function removeQueueItemAtPosition(threadId, position) {
    if (position < 1) {
        return undefined;
    }
    var removedItem;
    store_js_1.store.setState(function (s) {
        var t = s.threads.get(threadId);
        if (!t) {
            return s;
        }
        var index = position - 1;
        var removed = t.queueItems[index];
        if (!removed) {
            return s;
        }
        removedItem = removed;
        var newThreads = new Map(s.threads);
        newThreads.set(threadId, __assign(__assign({}, t), { queueItems: t.queueItems.filter(function (_, itemIndex) {
                return itemIndex !== index;
            }) }));
        return { threads: newThreads };
    });
    return removedItem;
}
// ── Queries ──────────────────────────────────────────────────────
function getThreadState(threadId) {
    return store_js_1.store.getState().threads.get(threadId);
}
function getThreadIds() {
    return __spreadArray([], store_js_1.store.getState().threads.keys(), true);
}
