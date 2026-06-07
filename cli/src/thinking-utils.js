"use strict";
// Utilities for extracting and matching model variant (thinking level) values
// from the provider.list() API response. Used by model selector and session handler
// to validate variant preferences against what the current model actually supports.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThinkingValuesForModel = getThinkingValuesForModel;
exports.matchThinkingValue = matchThinkingValue;
function getModelVariants(model) {
    if (!model || typeof model !== 'object') {
        return undefined;
    }
    var variants = model.variants;
    if (!variants || typeof variants !== 'object') {
        return undefined;
    }
    return variants;
}
function getThinkingValuesForModel(_a) {
    var _b;
    var providers = _a.providers, providerId = _a.providerId, modelId = _a.modelId;
    var provider = providers.find(function (candidateProvider) {
        return candidateProvider.id === providerId;
    });
    var model = (_b = provider === null || provider === void 0 ? void 0 : provider.models) === null || _b === void 0 ? void 0 : _b[modelId];
    var variants = getModelVariants(model);
    if (!variants) {
        return [];
    }
    return Object.keys(variants).filter(function (variant) {
        return variant.trim().length > 0;
    });
}
function matchThinkingValue(_a) {
    var requestedValue = _a.requestedValue, availableValues = _a.availableValues;
    var normalizedRequestedValue = requestedValue.trim().toLowerCase();
    if (!normalizedRequestedValue) {
        return undefined;
    }
    return availableValues.find(function (availableValue) {
        return availableValue.toLowerCase() === normalizedRequestedValue;
    });
}
