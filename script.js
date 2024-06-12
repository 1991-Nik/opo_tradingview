function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  
  function initOnReady() {

    class CustomDatafeed extends Datafeeds.UDFCompatibleDatafeed {}
  
    var datafeed = new CustomDatafeed(
      "https://demo-feed-data.tradingview.com",
      undefined,
      {
        maxResponseLength: 1000,
        expectedOrder: "latestFirst"
      }
    );
  
    class CustomBroker extends Brokers.BrokerSample {
      async previewOrder(order) {
        console.log(JSON.stringify(order));
        const confirmId = (Math.random() * 1000).toString(26);
        const response = {
          confirmId: confirmId,
          sections: [
            {
              header: "Custom section header",
              rows: [
                { title: "Value 1", value: "12.34" },
                { title: "Value 2", value: "56.78" }
              ]
            }
          ],
          warnings: ["This is a warning!"]
        };
        return Promise.resolve(response);
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
          bracketType: 1 /* BracketType.TakeProfit */
        });
        this._updateOrdersBracket({
          parent: order,
          bracket: stopLossBracket,
          newPrice: order.stopLoss,
          bracketType: 0 /* BracketType.StopLoss */
        });
      }
    }
  
    var widget = (window.tvWidget = new TradingView.widget({
      library_path:
        "charting_library/",
      fullscreen: true,
      symbol: "AAPL",
      interval: "1D",
      container: "tv_chart_container",
      datafeed: datafeed,
      locale: "en",
      disabled_features: ["show_right_widgets_panel_by_default"],
  
      broker_factory: function (host) {
        return new CustomBroker(host, datafeed);
      },
      broker_config: {
        configFlags: {
          supportPlaceOrderPreview: true,
          supportModifyOrderPreview: true,
          supportClosePosition: true,
          showQuantityInsteadOfAmount: true,
          supportEditAmount: false,
          calculatePLUsingLast: true,
          showNotificationsLog: false
        },
      }
    }));
  }
  
  window.addEventListener("DOMContentLoaded", initOnReady, false);

  