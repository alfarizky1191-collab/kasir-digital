"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftController = void 0;
var common_1 = require("@nestjs/common");
var ShiftController = function () {
    var _classDecorators = [(0, common_1.Controller)('api/shifts')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getActiveShift_decorators;
    var _getAllShifts_decorators;
    var _openShift_decorators;
    var _closeShift_decorators;
    var ShiftController = _classThis = /** @class */ (function () {
        function ShiftController_1(shiftService) {
            this.shiftService = (__runInitializers(this, _instanceExtraInitializers), shiftService);
        }
        ShiftController_1.prototype.getActiveShift = function () {
            return this.shiftService.getActiveShift();
        };
        ShiftController_1.prototype.getAllShifts = function () {
            return this.shiftService.getAllShifts();
        };
        ShiftController_1.prototype.openShift = function (body) {
            return this.shiftService.openShift(body);
        };
        ShiftController_1.prototype.closeShift = function (body) {
            return this.shiftService.closeShift(body);
        };
        return ShiftController_1;
    }());
    __setFunctionName(_classThis, "ShiftController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getActiveShift_decorators = [(0, common_1.Get)('active')];
        _getAllShifts_decorators = [(0, common_1.Get)()];
        _openShift_decorators = [(0, common_1.Post)('open')];
        _closeShift_decorators = [(0, common_1.Post)('close')];
        __esDecorate(_classThis, null, _getActiveShift_decorators, { kind: "method", name: "getActiveShift", static: false, private: false, access: { has: function (obj) { return "getActiveShift" in obj; }, get: function (obj) { return obj.getActiveShift; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllShifts_decorators, { kind: "method", name: "getAllShifts", static: false, private: false, access: { has: function (obj) { return "getAllShifts" in obj; }, get: function (obj) { return obj.getAllShifts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _openShift_decorators, { kind: "method", name: "openShift", static: false, private: false, access: { has: function (obj) { return "openShift" in obj; }, get: function (obj) { return obj.openShift; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _closeShift_decorators, { kind: "method", name: "closeShift", static: false, private: false, access: { has: function (obj) { return "closeShift" in obj; }, get: function (obj) { return obj.closeShift; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ShiftController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ShiftController = _classThis;
}();
exports.ShiftController = ShiftController;
