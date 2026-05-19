"use strict";
// backend/src/order/order.controller.ts
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
exports.OrderController = void 0;
var common_1 = require("@nestjs/common");
var OrderController = function () {
    var _classDecorators = [(0, common_1.Controller)('api/orders')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getKitchenOrders_decorators;
    var _getCashierOrders_decorators;
    var _getHistoryOrders_decorators;
    var _createOrder_decorators;
    var _updateStatus_decorators;
    var _updatePayment_decorators;
    var OrderController = _classThis = /** @class */ (function () {
        function OrderController_1(orderService) {
            this.orderService = (__runInitializers(this, _instanceExtraInitializers), orderService);
        }
        OrderController_1.prototype.getKitchenOrders = function () {
            return this.orderService.getKitchenOrders();
        };
        OrderController_1.prototype.getCashierOrders = function () {
            return this.orderService.getCashierOrders();
        };
        OrderController_1.prototype.getHistoryOrders = function () {
            return this.orderService.getHistoryOrders();
        };
        OrderController_1.prototype.createOrder = function (body) {
            return this.orderService.createOrder(body);
        };
        OrderController_1.prototype.updateStatus = function (id, status) {
            if (![
                'pending',
                'cooking',
                'ready',
            ].includes(status)) {
                throw new common_1.NotFoundException('Invalid status');
            }
            return this.orderService.updateStatus(id, status);
        };
        OrderController_1.prototype.updatePayment = function (id, paymentMethod) {
            return this.orderService.updatePayment(id, paymentMethod);
        };
        return OrderController_1;
    }());
    __setFunctionName(_classThis, "OrderController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getKitchenOrders_decorators = [(0, common_1.Get)('kitchen')];
        _getCashierOrders_decorators = [(0, common_1.Get)('cashier')];
        _getHistoryOrders_decorators = [(0, common_1.Get)('history')];
        _createOrder_decorators = [(0, common_1.Post)()];
        _updateStatus_decorators = [(0, common_1.Patch)(':id/status')];
        _updatePayment_decorators = [(0, common_1.Patch)(':id/payment')];
        __esDecorate(_classThis, null, _getKitchenOrders_decorators, { kind: "method", name: "getKitchenOrders", static: false, private: false, access: { has: function (obj) { return "getKitchenOrders" in obj; }, get: function (obj) { return obj.getKitchenOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCashierOrders_decorators, { kind: "method", name: "getCashierOrders", static: false, private: false, access: { has: function (obj) { return "getCashierOrders" in obj; }, get: function (obj) { return obj.getCashierOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getHistoryOrders_decorators, { kind: "method", name: "getHistoryOrders", static: false, private: false, access: { has: function (obj) { return "getHistoryOrders" in obj; }, get: function (obj) { return obj.getHistoryOrders; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createOrder_decorators, { kind: "method", name: "createOrder", static: false, private: false, access: { has: function (obj) { return "createOrder" in obj; }, get: function (obj) { return obj.createOrder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateStatus_decorators, { kind: "method", name: "updateStatus", static: false, private: false, access: { has: function (obj) { return "updateStatus" in obj; }, get: function (obj) { return obj.updateStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updatePayment_decorators, { kind: "method", name: "updatePayment", static: false, private: false, access: { has: function (obj) { return "updatePayment" in obj; }, get: function (obj) { return obj.updatePayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrderController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrderController = _classThis;
}();
exports.OrderController = OrderController;
