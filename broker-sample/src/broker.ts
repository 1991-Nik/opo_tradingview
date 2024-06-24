/**
 * @module Make sure that you include Promise polyfill in your bundle to support old browsers
 * @see {@link https://caniuse.com/#search=Promise | Browsers with native Promise support}
 * @see {@link https://www.npmjs.com/package/promise-polyfill | Polyfill}
 */

import {
	AccountManagerInfo,
	AccountManagerSummaryField,
	ActionMetaInfo,
	ConnectionStatus,
	DefaultContextMenuActionsParams,
	Execution,
	IBrokerConnectionAdapterHost,
	IBrokerWithoutRealtime,
	IDelegate,
	InstrumentInfo,
	TradeContext,
	IWatchedValue,
	MenuSeparator,
	Order,
	OrderStatus,
	OrderType,
	Position,
	PreOrder,
	Side,
	Brackets,
	AccountId,
	AccountMetainfo,
	PlaceOrderResult,
	StandardFormatterName,
	ParentType,
} from '../../charting_library/broker-api';

import { IDatafeedQuotesApi, QuoteData } from '../../charting_library/datafeed-api';

import {
	accountSummaryColumns,
	ordersPageColumns,
	positionsPageColumns,
} from './columns';

const enum BracketType {
	StopLoss,
	TakeProfit,
	TrailingStop,
}

interface SimpleMap<TValue> {
	[key: string]: TValue;
}

interface AccountManagerData {
	title: string;
	balance: number;
	equity: number;
	pl: number;
}


interface UpdateParentBracketParams {
	parent: Position | Order;
	bracket: Order | undefined;
	bracketType: BracketType;
	newPrice: number | undefined;
}

const activeOrderStatuses = [OrderStatus.Inactive, OrderStatus.Working];

export class BrokerSample implements IBrokerWithoutRealtime {
	private readonly _host: IBrokerConnectionAdapterHost;

	private readonly _accountManagerData: AccountManagerData = { title: 'Trading Sample', balance: 10000000, equity: 10000000, pl: 0 };
	private readonly _amChangeDelegate: IDelegate<(values: AccountManagerData) => void>;
	private readonly _balanceValue: IWatchedValue<number>;
	private readonly _equityValue: IWatchedValue<number>;

	private readonly _positionById: SimpleMap<Position> = {};
	private readonly _positions: Position[] = [];

	private readonly _orderById: SimpleMap<Order> = {};

	private readonly _executions: Execution[] = [];

	private readonly _quotesProvider: IDatafeedQuotesApi;

	private _idsCounter: number = 1;

	public constructor(host: IBrokerConnectionAdapterHost, quotesProvider: IDatafeedQuotesApi) {
		this._quotesProvider = quotesProvider;
		this._host = host;

		this._amChangeDelegate = this._host.factory.createDelegate();
		this._balanceValue = this._host.factory.createWatchedValue(this._accountManagerData.balance);
		this._equityValue = this._host.factory.createWatchedValue(this._accountManagerData.equity);

		this._amChangeDelegate.subscribe(null, (values: AccountManagerData) => {
			this._balanceValue.setValue(values.balance);
			this._equityValue.setValue(values.equity);
		});
	}

	public subscribeEquity(): void {
		this._equityValue.subscribe(this._handleEquityUpdate, { callWithLast: true });
	}

	public unsubscribeEquity(): void {
		this._equityValue.unsubscribe(this._handleEquityUpdate);
	}

	public connectionStatus(): ConnectionStatus {
		return ConnectionStatus.Connected;
	}

	public chartContextMenuActions(context: TradeContext, options?: DefaultContextMenuActionsParams): Promise<ActionMetaInfo[]> {
		return this._host.defaultContextMenuActions(context);
	}

	public isTradable(symbol: string): Promise<boolean> {
		return Promise.resolve(true);
	}

	public async placeOrder(preOrder: PreOrder): Promise<PlaceOrderResult> {
		console.log('place order get called');
		console.log(JSON.stringify(preOrder));


		if (preOrder.duration) {
			// tslint:disable-next-line:no-console
			console.log('Durations are not implemented in this sample.');
		}

		this._host.activateBottomWidget();

		if (
			(preOrder.type === OrderType.Market || preOrder.type === undefined)
			&& this._getBrackets(preOrder.symbol).length > 0
		) {
			this._updateOrder(this._createOrder(preOrder));

			return {};
		}

		const orders = this._createOrderWithBrackets(preOrder);

		orders.forEach((order: Order) => {
			this._updateOrder(order);
		});

		return {};
	}

	public async modifyOrder(order: Order): Promise<void> {
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
			bracketType: BracketType.TakeProfit,
		});

		this._updateOrdersBracket({
			parent: order,
			bracket: stopLossBracket,
			newPrice: order.stopLoss,
			bracketType: BracketType.StopLoss,
		});
	}

	public async editPositionBrackets(positionId: string, modifiedBrackets: Brackets): Promise<void> {
		const position = this._positionById[positionId];
		const positionBrackets = this._getBrackets(positionId);

		const modifiedPosition: Position = { ...position };

		modifiedPosition.takeProfit ??= modifiedBrackets.takeProfit;
		modifiedPosition.stopLoss ??= modifiedBrackets.stopLoss;

		this._updatePosition(modifiedPosition);

		const takeProfitBracket = positionBrackets.find((bracket: Order) => bracket.limitPrice !== undefined);
		const stopLossBracket = positionBrackets.find((bracket: Order) => bracket.stopPrice !== undefined);

		this._updatePositionsBracket({
			parent: modifiedPosition,
			bracket: takeProfitBracket,
			bracketType: BracketType.TakeProfit,
			newPrice: modifiedBrackets.takeProfit,
		});

		this._updatePositionsBracket({
			parent: modifiedPosition,
			bracket: stopLossBracket,
			bracketType: BracketType.StopLoss,
			newPrice: modifiedBrackets.stopLoss,
		});
	}

	public async closePosition(positionId: string): Promise<void> {
		const position = this._positionById[positionId];

		const handler = () => {
			this.placeOrder({
				symbol: position.symbol,
				side: position.side === Side.Sell ? Side.Buy : Side.Sell,
				type: OrderType.Market,
				qty: position.qty,
			} as unknown as PreOrder);
		};

		await handler();
	}

	public async orders(): Promise<Order[]> {
		return this._orders();
	}

	public positions(): Promise<Position[]> {
		return Promise.resolve(this._positions.slice());
	}

	public executions(symbol: string): Promise<Execution[]> {
		return Promise.resolve(this._executions
			.filter((data: Execution) => {
				return data.symbol === symbol;
			})
		);
	}

	public async reversePosition(positionId: string): Promise<void> {
		const position = this._positionById[positionId];
		const handler = () => {
			return this.placeOrder({
				symbol: position.symbol,
				side: position.side === Side.Sell ? Side.Buy : Side.Sell,
				type: OrderType.Market,
				qty: position.qty * 2,
			} as unknown as PreOrder);
		};

		await handler();
	}

	public cancelOrder(orderId: string): Promise<void> {
		const order = this._orderById[orderId];
		const handler = () => {
			order.status = OrderStatus.Canceled;
			this._updateOrder(order);

			this._getBrackets(order.id)
				.forEach((bracket: Order) => this.cancelOrder(bracket.id));

			return Promise.resolve();
		};

		return handler();
	}

	public cancelOrders(symbol: string, side: Side | undefined, ordersIds: string[]): Promise<void> {
		const closeHandler = () => {
			return Promise.all(ordersIds.map((orderId: string) => {
				return this.cancelOrder(orderId);
			})).then(() => { }); // tslint:disable-line:no-empty
		};

		return closeHandler();
	}

	public accountManagerInfo(): AccountManagerInfo {
		const summaryProps: AccountManagerSummaryField[] = [
			{
				text: 'Balance',
				wValue: this._balanceValue,
				formatter: StandardFormatterName.Fixed, // default value
				isDefault: true,
			},
			{
				text: 'Equity',
				wValue: this._equityValue,
				formatter: StandardFormatterName.Fixed, // default value
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
			contextMenuActions: (contextMenuEvent: MouseEvent, activePageActions: ActionMetaInfo[]) => {
				return Promise.resolve(this._bottomContextMenuItems(activePageActions));
			},
		};
	}

	public async symbolInfo(symbol: string): Promise<InstrumentInfo> {
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

	public currentAccount(): AccountId {
		return '1' as AccountId;
	}

	public async accountsMetainfo(): Promise<AccountMetainfo[]> {
		return [
			{
				id: '1' as AccountId,
				name: 'Test account',
			},
		];
	}

	private _bottomContextMenuItems(activePageActions: ActionMetaInfo[]): ActionMetaInfo[] {
		const separator: MenuSeparator = { separator: true };
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

	private _createPositionForOrder(order: Order): Position {
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
				console.log('Position data')
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
			} else {
				position.avgPrice = position.avgPrice;

				const amountToClose = Math.min(orderQty, position.qty);
				this._accountManagerData.balance += (order.price - position.avgPrice) * amountToClose * (position.side === Side.Sell ? -1 : 1);
			}

			position.qty = position.qty + order.qty * sign;

			const brackets = this._getBrackets(position.id);

			if (position.qty <= 0) {
				brackets.forEach((bracket: Order) => {
					if (isPositionClosedByBracket) {
						this._setFilledStatusAndUpdate(bracket);

						return;
					}

					this._setCanceledStatusAndUpdate(bracket);
				});

				position.side = changeSide(position.side);
				position.qty *= -1;
			} else {
				brackets.forEach((bracket: Order) => {
					bracket.side = changeSide(position.side);
					bracket.qty = position.qty;

					this._updateOrder(bracket);
				});
			}
		} else {
			position = {
				...order,
				id: positionId,
				avgPrice: order.price,
			};
		}

		const execution: Execution = {
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

	private _handleEquityUpdate = (value: number): void => {
		this._host.equityUpdate(value);
	};

	private _updateOrderLast(order: Order): void {
		this._host.orderPartialUpdate(order.id, { last: order.last });
	}

	private _orders(): Order[] {
		return Object.values(this._orderById);
	}

	private _updateOrder(order: Order): void {

		const executionChecks = {
			[Side.Sell]: {
				[OrderType.Market]: () => !!order.price,
				[OrderType.Limit]: () => order.limitPrice !== undefined && order.last >= order.limitPrice,
				[OrderType.Stop]: () => order.stopPrice !== undefined && order.last <= order.stopPrice,
				[OrderType.StopLimit]: () => false,
			},

			[Side.Buy]: {
				[OrderType.Market]: () => !!order.price,
				[OrderType.Limit]: () => order.limitPrice !== undefined && order.last <= order.limitPrice,
				[OrderType.Stop]: () => order.stopPrice !== undefined && order.last >= order.stopPrice,
				[OrderType.StopLimit]: () => false,
			},
		};

		const hasOrderAlready = Boolean(this._orderById[order.id]);
		this._orderById[order.id] = order;

		Object.assign(this._orderById[order.id], order);

		if (!hasOrderAlready) {
			//	console.log('Has Order Already :'+ hasOrderAlready);
			this._subscribeData(order.symbol, order.id, (last: number) => {
				if (order.last === last) {
					return;
				}

				order.last = last;
				if (order.price == null) {
					order.price = order.last;
				}

				if (order.status === OrderStatus.Working && executionChecks[order.side][order.type]()) {
					const positionData = { ...order };
					console.log('Update position get called.**')
					console.log(JSON.stringify(positionData));
					console.log('**')
					order.price = order.last;
					order.avgPrice = order.last;

					const position = this._createPositionForOrder(positionData);

					order.status = OrderStatus.Filled;
					this._updateOrder(order);

					this._getBrackets(order.id).forEach((bracket: Order) => {
						bracket.status = OrderStatus.Working;
						bracket.parentId = position.id;
						bracket.parentType = ParentType.Position;

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
					"source":"tv"
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
						console.error

							('Error:', error);
					});


				// *** END

			});
		}

		this._host.orderUpdate(order);

		if (order.parentId !== undefined) {
			const entity = order.parentType === ParentType.Position
				? this._positionById[order.parentId]
				: this._orderById[order.parentId];

			if (entity === undefined) {
				return;
			}

			if (order.limitPrice !== undefined) {
				entity.takeProfit = order.status !== OrderStatus.Canceled
					? order.limitPrice
					: undefined;
			}

			if (order.stopPrice !== undefined) {
				entity.stopLoss = order.status !== OrderStatus.Canceled
					? order.stopPrice
					: undefined;
			}

			if (order.parentType === ParentType.Position) {
				return this._updatePosition(entity as Position);
			}

			this._updateOrder(entity as Order);
		}
	}

	private _updatePosition(position: Position): void {
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

			this._subscribeData(position.symbol, position.id, (last: number) => {
				if (position.last === last) {
					return;
				}

				position.last = last;
				position.profit = (position.last - position.price) * position.qty * (position.side === Side.Sell ? -1 : 1);
				this._host.plUpdate(position.symbol, position.profit);
				this._host.positionPartialUpdate(position.id, position);
				this._recalculateAMData();
			});
		}

		this._positionById[position.id] = position;

		this._host.positionUpdate(position);
	}

	private _subscribeData(symbol: string, id: string, updateFunction: (last: number) => void): void {
		this._quotesProvider.subscribeQuotes(
			[],
			[symbol],
			(symbols: QuoteData[]) => {
				const deltaData = symbols[0];
				if (deltaData.s !== 'ok') {
					return;
				}

				if (typeof deltaData.v.lp === 'number') {
					updateFunction(deltaData.v.lp);
				}
			},
			getDatafeedSubscriptionId(id)
		);
	}

	private _unsubscribeData(id: string): void {
		this._quotesProvider.unsubscribeQuotes(getDatafeedSubscriptionId(id));
	}

	private _recalculateAMData(): void {
		let pl = 0;
		this._positions.forEach((position: Position) => {
			pl += position.profit || 0;
		});

		this._accountManagerData.pl = pl;
		this._accountManagerData.equity = this._accountManagerData.balance + pl;

		this._amChangeDelegate.fire(this._accountManagerData);
	}

	private _createOrderWithBrackets(preOrder: PreOrder): Order[] {
		const orders: Order[] = [];

		const order: Order = this._createOrder(preOrder);

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

	private _getBrackets(parentId: string): Order[] {
		return this._orders().filter(
			(order: Order) => order.parentId === parentId
				&& activeOrderStatuses.includes(order.status)
		);
	}

	private _createOrder(preOrder: PreOrder): Order {
		return {
			id: `${this._idsCounter++}`,
			duration: preOrder.duration, // duration is not used in this sample
			limitPrice: preOrder.limitPrice,
			profit: 0,
			qty: preOrder.qty,
			side: preOrder.side || Side.Buy,
			status: OrderStatus.Working,
			stopPrice: preOrder.stopPrice,
			symbol: preOrder.symbol,
			type: preOrder.type || OrderType.Market,
			takeProfit: preOrder.takeProfit,
			stopLoss: preOrder.stopLoss,
		};
	}

	private _createTakeProfitBracket(entity: Order | Position): Order {
		return {
			symbol: entity.symbol,
			qty: entity.qty,
			id: `${this._idsCounter++}`,
			parentId: entity.id,
			parentType: ParentType.Order,
			limitPrice: entity.takeProfit,
			side: changeSide(entity.side),
			status: OrderStatus.Inactive,
			type: OrderType.Limit,
		};
	}

	private _createStopLossBracket(entity: Order | Position) {
		return {
			symbol: entity.symbol,
			qty: entity.qty,
			id: `${this._idsCounter++}`,
			parentId: entity.id,
			parentType: ParentType.Order,
			stopPrice: entity.stopLoss,
			price: entity.stopPrice,
			side: changeSide(entity.side),
			status: OrderStatus.Inactive,
			type: OrderType.Stop,
		};
	}

	private _getTakeProfitBracket(entity: Order | Position): Order | undefined {
		return this._getBrackets(entity.id).find((bracket: Order) => bracket.limitPrice !== undefined);
	}

	private _getStopLossBracket(entity: Order | Position): Order | undefined {
		return this._getBrackets(entity.id).find((bracket: Order) => bracket.stopPrice !== undefined);
	}

	private _updateOrdersBracket(params: UpdateParentBracketParams): void {
		const {
			parent,
			bracket,
			bracketType,
			newPrice,
		} = params;

		const shouldCancelBracket = bracket !== undefined && newPrice === undefined;

		if (shouldCancelBracket) {
			this._setCanceledStatusAndUpdate(bracket);

			return;
		}

		if (newPrice === undefined) {
			return;
		}

		const shouldCreateNewBracket = bracket === undefined;

		if (bracketType === BracketType.TakeProfit) {
			const takeProfitBracket = shouldCreateNewBracket
				? this._createTakeProfitBracket(parent)
				: { ...bracket, limitPrice: newPrice };

			this._updateOrder(takeProfitBracket);

			return;
		}

		if (bracketType === BracketType.StopLoss) {
			const stopLossBracket = shouldCreateNewBracket
				? this._createStopLossBracket(parent)
				: { ...bracket, stopPrice: newPrice };

			this._updateOrder(stopLossBracket);

			return;
		}
	}

	private _updatePositionsBracket(params: UpdateParentBracketParams): void {
		const {
			parent,
			bracket,
			bracketType,
			newPrice,
		} = params;

		const shouldCancelBracket = bracket !== undefined && newPrice === undefined;

		if (shouldCancelBracket) {
			this._setCanceledStatusAndUpdate(bracket);

			return;
		}

		if (newPrice === undefined) {
			return;
		}

		const shouldCreateNewBracket = bracket === undefined;

		if (bracketType === BracketType.TakeProfit) {
			if (shouldCreateNewBracket) {
				const takeProfitBracket = this._createTakeProfitBracket(parent);

				takeProfitBracket.status = OrderStatus.Working;
				takeProfitBracket.parentType = ParentType.Position;

				this._updateOrder(takeProfitBracket);

				return;
			}

			bracket.limitPrice = newPrice;
			bracket.takeProfit = newPrice;

			this._updateOrder(bracket);

			return;
		}

		if (bracketType === BracketType.StopLoss) {
			if (shouldCreateNewBracket) {
				const stopLossBracket = this._createStopLossBracket(parent);

				stopLossBracket.status = OrderStatus.Working;
				stopLossBracket.parentType = ParentType.Position;

				this._updateOrder(stopLossBracket);

				return;
			}

			bracket.stopPrice = newPrice;
			bracket.stopLoss = newPrice;

			this._updateOrder(bracket);

			return;
		}
	}

	private _setCanceledStatusAndUpdate(order: Order): void {
		order.status = OrderStatus.Canceled;

		this._updateOrder(order);
	}

	private _setFilledStatusAndUpdate(order: Order): void {
		order.status = OrderStatus.Filled;

		this._updateOrder(order);
	}
}

function changeSide(side: Side): Side {
	return side === Side.Buy ? Side.Sell : Side.Buy;
}

function getDatafeedSubscriptionId(id: string): string {
	return `SampleBroker-${id}`;
}
