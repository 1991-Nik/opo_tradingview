(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Brokers = {}));
})(this, (function (exports) { 'use strict';

    const ordersPageColumns = [
        {
            label: 'Symbol',
            formatter: "symbol" /* StandardFormatterName.Symbol */,
            id: "symbol" /* CommonAccountManagerColumnId.Symbol */,
            dataFields: ['symbol', 'symbol', 'message'],
        },
        {
            label: 'Side',
            id: 'side',
            dataFields: ['side'],
            formatter: "side" /* StandardFormatterName.Side */,
        },
        {
            label: 'Type',
            id: 'type',
            dataFields: ['type', 'parentId', 'stopType'],
            formatter: "type" /* StandardFormatterName.Type */,
        },
        {
            label: 'Qty',
            alignment: 'right',
            id: 'qty',
            dataFields: ['qty'],
            help: 'Size in lots',
        },
        {
            label: 'Limit Price',
            alignment: 'right',
            id: 'limitPrice',
            dataFields: ['limitPrice'],
            formatter: "formatPrice" /* StandardFormatterName.FormatPrice */,
        },
        {
            label: 'Stop Price',
            alignment: 'right',
            id: 'stopPrice',
            dataFields: ['stopPrice'],
            formatter: "formatPrice" /* StandardFormatterName.FormatPrice */,
        },
        {
            label: 'Last',
            alignment: 'right',
            id: 'last',
            dataFields: ['last'],
            formatter: "formatPriceForexSup" /* StandardFormatterName.FormatPriceForexSup */,
            highlightDiff: true,
        },
        {
            label: 'Execution',
            id: 'execution',
            dataFields: ['execution'],
        },
        {
            label: 'Status',
            id: 'status',
            dataFields: ['status'],
            formatter: "status" /* StandardFormatterName.Status */,
            supportedStatusFilters: [0 /* OrderStatusFilter.All */],
        },
        {
            label: 'Order id',
            id: 'id',
            dataFields: ['id'],
        },
    ];
    const positionsPageColumns = [
        {
            label: 'Symbol',
            formatter: "symbol" /* StandardFormatterName.Symbol */,
            id: "symbol" /* CommonAccountManagerColumnId.Symbol */,
            dataFields: ['symbol', 'symbol', 'message'],
        },
        {
            label: 'Side',
            id: 'side',
            dataFields: ['side'],
            formatter: "side" /* StandardFormatterName.Side */,
        },
        {
            label: 'Qty',
            alignment: 'right',
            id: 'qty',
            dataFields: ['qty'],
            help: 'Size in lots',
        },
        {
            label: 'Avg Fill Price',
            alignment: 'right',
            id: 'avgPrice',
            dataFields: ['avgPrice'],
            formatter: "formatPrice" /* StandardFormatterName.FormatPrice */,
        },
        {
            label: 'Last',
            alignment: 'right',
            id: 'last',
            dataFields: ['last'],
            formatter: "formatPriceForexSup" /* StandardFormatterName.FormatPriceForexSup */,
            highlightDiff: true,
        },
        {
            label: 'Profit',
            alignment: 'right',
            id: 'pl',
            dataFields: ['pl'],
            formatter: "profit" /* StandardFormatterName.Profit */,
        },
        {
            label: 'Stop Loss',
            alignment: 'right',
            id: 'stopLoss',
            dataFields: ['stopLoss'],
        },
        {
            label: 'Take Profit',
            alignment: 'right',
            id: 'takeProfit',
            dataFields: ['takeProfit'],
        },
    ];
    const accountSummaryColumns = [
        {
            label: 'Title',
            notSortable: true,
            id: 'title',
            dataFields: ['title'],
            formatter: 'custom_uppercase',
        },
        {
            label: 'Balance',
            alignment: 'right',
            id: 'balance',
            dataFields: ['balance'],
            formatter: "fixed" /* StandardFormatterName.Fixed */,
        },
        {
            label: 'Open PL',
            alignment: 'right',
            id: 'pl',
            dataFields: ['pl'],
            formatter: "profit" /* StandardFormatterName.Profit */,
            notSortable: true,
        },
        {
            label: 'Equity',
            alignment: 'right',
            id: 'equity',
            dataFields: ['equity'],
            formatter: "fixed" /* StandardFormatterName.Fixed */,
            notSortable: true,
        },
    ];

    /**
     * @module Make sure that you include Promise polyfill in your bundle to support old browsers
     * @see {@link https://caniuse.com/#search=Promise | Browsers with native Promise support}
     * @see {@link https://www.npmjs.com/package/promise-polyfill | Polyfill}
     */
    const activeOrderStatuses = [3 /* OrderStatus.Inactive */, 6 /* OrderStatus.Working */];
    class BrokerSample {
        constructor(host, quotesProvider) {
            this._accountManagerData = { title: 'Trading Sample', balance: 10000000, equity: 10000000, pl: 0 };
            this._positionById = {};
            this._positions = [];
            this._orderById = {};
            this._executions = [];
            this._idsCounter = 1;
            this._handleEquityUpdate = (value) => {
                this._host.equityUpdate(value);
            };
            this._quotesProvider = quotesProvider;
            this._host = host;
            this._amChangeDelegate = this._host.factory.createDelegate();
            this._balanceValue = this._host.factory.createWatchedValue(this._accountManagerData.balance);
            this._equityValue = this._host.factory.createWatchedValue(this._accountManagerData.equity);
            this._amChangeDelegate.subscribe(null, (values) => {
                this._balanceValue.setValue(values.balance);
                this._equityValue.setValue(values.equity);
            });
        }
        subscribeEquity() {
            this._equityValue.subscribe(this._handleEquityUpdate, { callWithLast: true });
        }
        unsubscribeEquity() {
            this._equityValue.unsubscribe(this._handleEquityUpdate);
        }
        connectionStatus() {
            return 1 /* ConnectionStatus.Connected */;
        }
        chartContextMenuActions(context, options) {
            return this._host.defaultContextMenuActions(context);
        }
        isTradable(symbol) {
            return Promise.resolve(true);
        }
        async placeOrder(preOrder) {
            console.log('place order get called');
            console.log(JSON.stringify(preOrder));
            if (preOrder.duration) {
                // tslint:disable-next-line:no-console
                console.log('Durations are not implemented in this sample.');
            }
            this._host.activateBottomWidget();
            if ((preOrder.type === 2 /* OrderType.Market */ || preOrder.type === undefined)
                && this._getBrackets(preOrder.symbol).length > 0) {
                this._updateOrder(this._createOrder(preOrder));
                return {};
            }
            const orders = this._createOrderWithBrackets(preOrder);
            orders.forEach((order) => {
                this._updateOrder(order);
            });
            return {};
        }
        async modifyOrder(order) {
            const originalOrder = this._orderById[order.id];
            if (originalOrder === undefined) {
                return;
            }
            this._updateOrder(order);
            if (order.parentId !== undefined) {
                return;
            }
            const takeProfitBracket = this._getTakeProfitBracket(order);
            const stopLossBracket = this._getStopLossBracket(order);
            this._updateOrdersBracket({
                parent: order,
                bracket: takeProfitBracket,
                newPrice: order.takeProfit,
                bracketType: 1 /* BracketType.TakeProfit */,
            });
            this._updateOrdersBracket({
                parent: order,
                bracket: stopLossBracket,
                newPrice: order.stopLoss,
                bracketType: 0 /* BracketType.StopLoss */,
            });
        }
        async editPositionBrackets(positionId, modifiedBrackets) {
            var _a, _b;
            const position = this._positionById[positionId];
            const positionBrackets = this._getBrackets(positionId);
            const modifiedPosition = { ...position };
            (_a = modifiedPosition.takeProfit) !== null && _a !== void 0 ? _a : (modifiedPosition.takeProfit = modifiedBrackets.takeProfit);
            (_b = modifiedPosition.stopLoss) !== null && _b !== void 0 ? _b : (modifiedPosition.stopLoss = modifiedBrackets.stopLoss);
            this._updatePosition(modifiedPosition);
            const takeProfitBracket = positionBrackets.find((bracket) => bracket.limitPrice !== undefined);
            const stopLossBracket = positionBrackets.find((bracket) => bracket.stopPrice !== undefined);
            this._updatePositionsBracket({
                parent: modifiedPosition,
                bracket: takeProfitBracket,
                bracketType: 1 /* BracketType.TakeProfit */,
                newPrice: modifiedBrackets.takeProfit,
            });
            this._updatePositionsBracket({
                parent: modifiedPosition,
                bracket: stopLossBracket,
                bracketType: 0 /* BracketType.StopLoss */,
                newPrice: modifiedBrackets.stopLoss,
            });
        }
        async closePosition(positionId) {
            const position = this._positionById[positionId];
            const handler = () => {
                this.placeOrder({
                    symbol: position.symbol,
                    side: position.side === -1 /* Side.Sell */ ? 1 /* Side.Buy */ : -1 /* Side.Sell */,
                    type: 2 /* OrderType.Market */,
                    qty: position.qty,
                });
            };
            await handler();
        }
        async orders() {
            return this._orders();
        }
        positions() {
            return Promise.resolve(this._positions.slice());
        }
        executions(symbol) {
            return Promise.resolve(this._executions
                .filter((data) => {
                return data.symbol === symbol;
            }));
        }
        async reversePosition(positionId) {
            const position = this._positionById[positionId];
            const handler = () => {
                return this.placeOrder({
                    symbol: position.symbol,
                    side: position.side === -1 /* Side.Sell */ ? 1 /* Side.Buy */ : -1 /* Side.Sell */,
                    type: 2 /* OrderType.Market */,
                    qty: position.qty * 2,
                });
            };
            await handler();
        }
        cancelOrder(orderId) {
            const order = this._orderById[orderId];
            const handler = () => {
                order.status = 1 /* OrderStatus.Canceled */;
                this._updateOrder(order);
                this._getBrackets(order.id)
                    .forEach((bracket) => this.cancelOrder(bracket.id));
                return Promise.resolve();
            };
            return handler();
        }
        cancelOrders(symbol, side, ordersIds) {
            const closeHandler = () => {
                return Promise.all(ordersIds.map((orderId) => {
                    return this.cancelOrder(orderId);
                })).then(() => { }); // tslint:disable-line:no-empty
            };
            return closeHandler();
        }
        accountManagerInfo() {
            const summaryProps = [
                {
                    text: 'Balance',
                    wValue: this._balanceValue,
                    formatter: "fixed" /* StandardFormatterName.Fixed */, // default value
                    isDefault: true,
                },
                {
                    text: 'Equity',
                    wValue: this._equityValue,
                    formatter: "fixed" /* StandardFormatterName.Fixed */, // default value
                    isDefault: true,
                },
            ];
            return {
                accountTitle: 'Trading Sample',
                summary: summaryProps,
                orderColumns: ordersPageColumns,
                positionColumns: positionsPageColumns,
                pages: [
                    {
                        id: 'accountsummary',
                        title: 'Account Summary',
                        tables: [
                            {
                                id: 'accountsummary',
                                columns: accountSummaryColumns,
                                getData: () => {
                                    return Promise.resolve([this._accountManagerData]);
                                },
                                initialSorting: {
                                    property: 'balance',
                                    asc: false,
                                },
                                changeDelegate: this._amChangeDelegate,
                            },
                        ],
                    },
                ],
                contextMenuActions: (contextMenuEvent, activePageActions) => {
                    return Promise.resolve(this._bottomContextMenuItems(activePageActions));
                },
            };
        }
        async symbolInfo(symbol) {
            const mintick = await this._host.getSymbolMinTick(symbol);
            const pipSize = mintick; // pip size can differ from minTick
            const accountCurrencyRate = 1; // account currency rate
            const pointValue = 1; // USD value of 1 point of price
            return {
                qty: {
                    min: 1,
                    max: 1e12,
                    step: 1,
                },
                pipValue: pipSize * pointValue * accountCurrencyRate || 1,
                pipSize: pipSize,
                minTick: mintick,
                description: '',
            };
        }
        currentAccount() {
            return '1';
        }
        async accountsMetainfo() {
            return [
                {
                    id: '1',
                    name: 'Test account',
                },
            ];
        }
        _bottomContextMenuItems(activePageActions) {
            const separator = { separator: true };
            const sellBuyButtonsVisibility = this._host.sellBuyButtonsVisibility();
            if (activePageActions.length) {
                activePageActions.push(separator);
            }
            return activePageActions.concat([
                {
                    text: 'Show Buy/Sell Buttons',
                    action: () => {
                        if (sellBuyButtonsVisibility) {
                            sellBuyButtonsVisibility.setValue(!sellBuyButtonsVisibility.value());
                        }
                    },
                    checkable: true,
                    checked: sellBuyButtonsVisibility !== null && sellBuyButtonsVisibility.value(),
                },
                {
                    text: 'Trading Settings...',
                    action: () => {
                        this._host.showTradingProperties();
                    },
                },
            ]);
        }
        _createPositionForOrder(order) {
            //MT 5 get Position
            // Replace 'https://api.example.com/data' with your API endpoint URL
            const apiUrl = 'https://opomt5.azurewebsites.net/api/Position/get?login=599976187&symbol=EURUSD';
            // Fetch function to make GET request
            fetch(apiUrl)
                .then(response => {
                // Check if response is successful
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Parse JSON response
                return response.json();
            })
                .then(data => {
                // Data from the API
                console.log('Data:', data);
                // Perform operations with data
                // Example: Display data on the webpage
                // const resultsElement = document.getElementById('results');
                console.log('Position data');
                console.log(JSON.stringify(data, null, 2)); // Display data as JSON string with formatting
            })
                .catch(error => {
                console.error('Error fetching data:', error);
                // Handle errors gracefully
            });
            //	console.log("Order for Position ** ");
            //console.log(JSON.stringify(order));
            //	console.log('Order for Position ****');
            const positionId = order.symbol;
            let position = this._positionById[positionId];
            const orderSide = order.side;
            const orderQty = order.qty;
            const isPositionClosedByBracket = order.parentId !== undefined;
            order.avgPrice = order.price;
            if (position) {
                const sign = order.side === position.side ? 1 : -1;
                if (sign > 0) {
                    position.avgPrice = (position.qty * position.avgPrice + order.qty * order.price) / (position.qty + order.qty);
                }
                else {
                    position.avgPrice = position.avgPrice;
                    const amountToClose = Math.min(orderQty, position.qty);
                    this._accountManagerData.balance += (order.price - position.avgPrice) * amountToClose * (position.side === -1 /* Side.Sell */ ? -1 : 1);
                }
                position.qty = position.qty + order.qty * sign;
                const brackets = this._getBrackets(position.id);
                if (position.qty <= 0) {
                    brackets.forEach((bracket) => {
                        if (isPositionClosedByBracket) {
                            this._setFilledStatusAndUpdate(bracket);
                            return;
                        }
                        this._setCanceledStatusAndUpdate(bracket);
                    });
                    position.side = changeSide(position.side);
                    position.qty *= -1;
                }
                else {
                    brackets.forEach((bracket) => {
                        bracket.side = changeSide(position.side);
                        bracket.qty = position.qty;
                        this._updateOrder(bracket);
                    });
                }
            }
            else {
                position = {
                    ...order,
                    id: positionId,
                    avgPrice: order.price,
                };
            }
            const execution = {
                id: `${this._idsCounter++}`,
                brokerSymbol: order.brokerSymbol,
                price: order.price,
                qty: orderQty,
                side: orderSide,
                symbol: order.symbol,
                time: Date.now(),
            };
            this._executions.push(execution);
            this._host.executionUpdate(execution);
            this._updatePosition(position);
            this._recalculateAMData();
            this._host.plUpdate(position.symbol, position.profit);
            this._host.positionPartialUpdate(position.id, position);
            this._recalculateAMData();
            return position;
        }
        _updateOrderLast(order) {
            this._host.orderPartialUpdate(order.id, { last: order.last });
        }
        _orders() {
            return Object.values(this._orderById);
        }
        _updateOrder(order) {
            const executionChecks = {
                [-1 /* Side.Sell */]: {
                    [2 /* OrderType.Market */]: () => !!order.price,
                    [1 /* OrderType.Limit */]: () => order.limitPrice !== undefined && order.last >= order.limitPrice,
                    [3 /* OrderType.Stop */]: () => order.stopPrice !== undefined && order.last <= order.stopPrice,
                    [4 /* OrderType.StopLimit */]: () => false,
                },
                [1 /* Side.Buy */]: {
                    [2 /* OrderType.Market */]: () => !!order.price,
                    [1 /* OrderType.Limit */]: () => order.limitPrice !== undefined && order.last <= order.limitPrice,
                    [3 /* OrderType.Stop */]: () => order.stopPrice !== undefined && order.last >= order.stopPrice,
                    [4 /* OrderType.StopLimit */]: () => false,
                },
            };
            const hasOrderAlready = Boolean(this._orderById[order.id]);
            this._orderById[order.id] = order;
            Object.assign(this._orderById[order.id], order);
            if (!hasOrderAlready) {
                //	console.log('Has Order Already :'+ hasOrderAlready);
                this._subscribeData(order.symbol, order.id, (last) => {
                    if (order.last === last) {
                        return;
                    }
                    order.last = last;
                    if (order.price == null) {
                        order.price = order.last;
                    }
                    if (order.status === 6 /* OrderStatus.Working */ && executionChecks[order.side][order.type]()) {
                        const positionData = { ...order };
                        console.log('Update position get called.**');
                        console.log(JSON.stringify(positionData));
                        console.log('**');
                        order.price = order.last;
                        order.avgPrice = order.last;
                        const position = this._createPositionForOrder(positionData);
                        order.status = 2 /* OrderStatus.Filled */;
                        this._updateOrder(order);
                        this._getBrackets(order.id).forEach((bracket) => {
                            bracket.status = 6 /* OrderStatus.Working */;
                            bracket.parentId = position.id;
                            bracket.parentType = 2 /* ParentType.Position */;
                            this._updateOrder(bracket);
                        });
                    }
                    this._updateOrderLast(order);
                    // *** START Code to call MT5 API 
                    var side = 0;
                    var type = "0";
                    if (order.type == 2) {
                        type = "200";
                    }
                    if (order.side == -1) {
                        side = 1;
                    }
                    else if (order.side == 1) {
                        side = 0;
                    }
                    // *** START Code to call MT5 API 
                    const apiUrl = 'https://opomt5.azurewebsites.net/api/Trade/send_request';
                    //const apiUrl = 'https://localhost:7274/api/Trade/send_request';
                    const data = {
                        "action": type,
                        "login": 599976187,
                        "symbol": "EURUSD",
                        "volume": order.qty,
                        "typeFill": 0,
                        "type": side,
                        "priceOrder": 0,
                        "digits": 5,
                        "source": "tv"
                    };
                    const requestOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    };
                    fetch(apiUrl, requestOptions)
                        .then(response => {
                        console.log(JSON.stringify(response));
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                        .then(data => {
                        console.log(JSON.stringify(data, null, 2));
                    })
                        .catch(error => {
                        console.error('Error:', error);
                    });
                    // *** END
                });
            }
            this._host.orderUpdate(order);
            if (order.parentId !== undefined) {
                const entity = order.parentType === 2 /* ParentType.Position */
                    ? this._positionById[order.parentId]
                    : this._orderById[order.parentId];
                if (entity === undefined) {
                    return;
                }
                if (order.limitPrice !== undefined) {
                    entity.takeProfit = order.status !== 1 /* OrderStatus.Canceled */
                        ? order.limitPrice
                        : undefined;
                }
                if (order.stopPrice !== undefined) {
                    entity.stopLoss = order.status !== 1 /* OrderStatus.Canceled */
                        ? order.stopPrice
                        : undefined;
                }
                if (order.parentType === 2 /* ParentType.Position */) {
                    return this._updatePosition(entity);
                }
                this._updateOrder(entity);
            }
        }
        _updatePosition(position) {
            const hasPositionAlready = Boolean(this._positionById[position.id]);
            if (hasPositionAlready && !position.qty) {
                this._unsubscribeData(position.id);
                const index = this._positions.indexOf(position);
                if (index !== -1) {
                    this._positions.splice(index, 1);
                }
                delete this._positionById[position.id];
                this._host.positionUpdate(position);
                return;
            }
            if (!hasPositionAlready) {
                this._positions.push(position);
                this._subscribeData(position.symbol, position.id, (last) => {
                    if (position.last === last) {
                        return;
                    }
                    position.last = last;
                    position.profit = (position.last - position.price) * position.qty * (position.side === -1 /* Side.Sell */ ? -1 : 1);
                    this._host.plUpdate(position.symbol, position.profit);
                    this._host.positionPartialUpdate(position.id, position);
                    this._recalculateAMData();
                });
            }
            this._positionById[position.id] = position;
            this._host.positionUpdate(position);
        }
        _subscribeData(symbol, id, updateFunction) {
            this._quotesProvider.subscribeQuotes([], [symbol], (symbols) => {
                const deltaData = symbols[0];
                if (deltaData.s !== 'ok') {
                    return;
                }
                if (typeof deltaData.v.lp === 'number') {
                    updateFunction(deltaData.v.lp);
                }
            }, getDatafeedSubscriptionId(id));
        }
        _unsubscribeData(id) {
            this._quotesProvider.unsubscribeQuotes(getDatafeedSubscriptionId(id));
        }
        _recalculateAMData() {
            let pl = 0;
            this._positions.forEach((position) => {
                pl += position.profit || 0;
            });
            this._accountManagerData.pl = pl;
            this._accountManagerData.equity = this._accountManagerData.balance + pl;
            this._amChangeDelegate.fire(this._accountManagerData);
        }
        _createOrderWithBrackets(preOrder) {
            const orders = [];
            const order = this._createOrder(preOrder);
            orders.push(order);
            if (order.takeProfit !== undefined) {
                const takeProfit = this._createTakeProfitBracket(order);
                orders.push(takeProfit);
            }
            if (order.stopLoss !== undefined) {
                const stopLoss = this._createStopLossBracket(order);
                orders.push(stopLoss);
            }
            return orders;
        }
        _getBrackets(parentId) {
            return this._orders().filter((order) => order.parentId === parentId
                && activeOrderStatuses.includes(order.status));
        }
        _createOrder(preOrder) {
            return {
                id: `${this._idsCounter++}`,
                duration: preOrder.duration, // duration is not used in this sample
                limitPrice: preOrder.limitPrice,
                profit: 0,
                qty: preOrder.qty,
                side: preOrder.side || 1 /* Side.Buy */,
                status: 6 /* OrderStatus.Working */,
                stopPrice: preOrder.stopPrice,
                symbol: preOrder.symbol,
                type: preOrder.type || 2 /* OrderType.Market */,
                takeProfit: preOrder.takeProfit,
                stopLoss: preOrder.stopLoss,
            };
        }
        _createTakeProfitBracket(entity) {
            return {
                symbol: entity.symbol,
                qty: entity.qty,
                id: `${this._idsCounter++}`,
                parentId: entity.id,
                parentType: 1 /* ParentType.Order */,
                limitPrice: entity.takeProfit,
                side: changeSide(entity.side),
                status: 3 /* OrderStatus.Inactive */,
                type: 1 /* OrderType.Limit */,
            };
        }
        _createStopLossBracket(entity) {
            return {
                symbol: entity.symbol,
                qty: entity.qty,
                id: `${this._idsCounter++}`,
                parentId: entity.id,
                parentType: 1 /* ParentType.Order */,
                stopPrice: entity.stopLoss,
                price: entity.stopPrice,
                side: changeSide(entity.side),
                status: 3 /* OrderStatus.Inactive */,
                type: 3 /* OrderType.Stop */,
            };
        }
        _getTakeProfitBracket(entity) {
            return this._getBrackets(entity.id).find((bracket) => bracket.limitPrice !== undefined);
        }
        _getStopLossBracket(entity) {
            return this._getBrackets(entity.id).find((bracket) => bracket.stopPrice !== undefined);
        }
        _updateOrdersBracket(params) {
            const { parent, bracket, bracketType, newPrice, } = params;
            const shouldCancelBracket = bracket !== undefined && newPrice === undefined;
            if (shouldCancelBracket) {
                this._setCanceledStatusAndUpdate(bracket);
                return;
            }
            if (newPrice === undefined) {
                return;
            }
            const shouldCreateNewBracket = bracket === undefined;
            if (bracketType === 1 /* BracketType.TakeProfit */) {
                const takeProfitBracket = shouldCreateNewBracket
                    ? this._createTakeProfitBracket(parent)
                    : { ...bracket, limitPrice: newPrice };
                this._updateOrder(takeProfitBracket);
                return;
            }
            if (bracketType === 0 /* BracketType.StopLoss */) {
                const stopLossBracket = shouldCreateNewBracket
                    ? this._createStopLossBracket(parent)
                    : { ...bracket, stopPrice: newPrice };
                this._updateOrder(stopLossBracket);
                return;
            }
        }
        _updatePositionsBracket(params) {
            const { parent, bracket, bracketType, newPrice, } = params;
            const shouldCancelBracket = bracket !== undefined && newPrice === undefined;
            if (shouldCancelBracket) {
                this._setCanceledStatusAndUpdate(bracket);
                return;
            }
            if (newPrice === undefined) {
                return;
            }
            const shouldCreateNewBracket = bracket === undefined;
            if (bracketType === 1 /* BracketType.TakeProfit */) {
                if (shouldCreateNewBracket) {
                    const takeProfitBracket = this._createTakeProfitBracket(parent);
                    takeProfitBracket.status = 6 /* OrderStatus.Working */;
                    takeProfitBracket.parentType = 2 /* ParentType.Position */;
                    this._updateOrder(takeProfitBracket);
                    return;
                }
                bracket.limitPrice = newPrice;
                bracket.takeProfit = newPrice;
                this._updateOrder(bracket);
                return;
            }
            if (bracketType === 0 /* BracketType.StopLoss */) {
                if (shouldCreateNewBracket) {
                    const stopLossBracket = this._createStopLossBracket(parent);
                    stopLossBracket.status = 6 /* OrderStatus.Working */;
                    stopLossBracket.parentType = 2 /* ParentType.Position */;
                    this._updateOrder(stopLossBracket);
                    return;
                }
                bracket.stopPrice = newPrice;
                bracket.stopLoss = newPrice;
                this._updateOrder(bracket);
                return;
            }
        }
        _setCanceledStatusAndUpdate(order) {
            order.status = 1 /* OrderStatus.Canceled */;
            this._updateOrder(order);
        }
        _setFilledStatusAndUpdate(order) {
            order.status = 2 /* OrderStatus.Filled */;
            this._updateOrder(order);
        }
    }
    function changeSide(side) {
        return side === 1 /* Side.Buy */ ? -1 /* Side.Sell */ : 1 /* Side.Buy */;
    }
    function getDatafeedSubscriptionId(id) {
        return `SampleBroker-${id}`;
    }

    exports.BrokerSample = BrokerSample;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
