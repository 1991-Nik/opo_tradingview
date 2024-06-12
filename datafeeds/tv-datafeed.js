!function(e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.TradingViewDatafeed = t() : e.TradingViewDatafeed = t()
}(globalThis, (()=>(()=>{
    "use strict";
    var e = {
        137: (e,t)=>{
            function s(e, t) {
                if (void 0 === e)
                    throw new Error("".concat(null != t ? t : "Value", " is undefined"));
                return e
            }
            function o(e, t) {
                if (null === e)
                    throw new Error("".concat(null != t ? t : "Value", " is null"));
                return e
            }
            t.hu = void 0,
            t.hu = function(e, t) {
                if (!e)
                    throw new Error("Assertion failed".concat(t ? ": ".concat(t) : ""))
            }
        }
    }
      , t = {};
    function s(o) {
        var n = t[o];
        if (void 0 !== n)
            return n.exports;
        var i = t[o] = {
            exports: {}
        };
        return e[o](i, i.exports, s),
        i.exports
    }
    s.d = (e,t)=>{
        for (var o in t)
            s.o(t, o) && !s.o(e, o) && Object.defineProperty(e, o, {
                enumerable: !0,
                get: t[o]
            })
    }
    ,
    s.o = (e,t)=>Object.prototype.hasOwnProperty.call(e, t),
    s.r = e=>{
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }),
        Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }
    ,
    (()=>{
        const {miniCssF: e} = s;
        s.miniCssF = t=>self.document && "rtl" === self.document.dir ? e(t).replace(/\.css$/, ".rtl.css") : e(t)
    }
    )();
    var o = {};
    return (()=>{
        function e(e, t=!1) {
            const {searchParams: s} = new URL(String(location));
            let o = "true" === s.get("mobileapp_new")
              , n = "true" === s.get("mobileapp");
            if (!t) {
                const e = function(e) {
                    const t = e + "="
                      , s = document.cookie.split(";");
                    for (let e = 0; e < s.length; e++) {
                        let o = s[e];
                        for (; " " === o.charAt(0); )
                            o = o.substring(1, o.length);
                        if (0 === o.indexOf(t))
                            return o.substring(t.length, o.length)
                    }
                    return null
                }("tv_app") || "";
                o || (o = ["android", "android_nps"].includes(e)),
                n || (n = "ios" === e)
            }
            return !("new" !== e && "any" !== e || !o) || !("new" === e || !n)
        }
        s.r(o),
        s.d(o, {
            TradingViewDatafeed: ()=>we
        });
        const t = ()=>{}
          , n = "~m~";
        class i {
            constructor(e, t={}) {
                this.sessionid = null,
                this.connected = !1,
                this._timeout = null,
                this._base = e,
                this._options = {
                    timeout: t.timeout || 2e4,
                    connectionType: t.connectionType
                }
            }
            connect() {
                this._socket = new WebSocket(this._prepareUrl()),
                this._socket.onmessage = e=>{
                    if ("string" != typeof e.data)
                        throw new TypeError(`The WebSocket message should be a string. Recieved ${Object.prototype.toString.call(e.data)}`);
                    this._onData(e.data)
                }
                ,
                this._socket.onclose = this._onClose.bind(this),
                this._socket.onerror = this._onError.bind(this)
            }
            send(e) {
                this._socket && this._socket.send(this._encode(e))
            }
            disconnect() {
                this._clearIdleTimeout(),
                this._socket && (this._socket.onmessage = t,
                this._socket.onclose = t,
                this._socket.onerror = t,
                this._socket.close())
            }
            _clearIdleTimeout() {
                null !== this._timeout && (clearTimeout(this._timeout),
                this._timeout = null)
            }
            _encode(e) {
                let t, s = "";
                const o = Array.isArray(e) ? e : [e]
                  , r = o.length;
                for (let e = 0; e < r; e++)
                    t = null === o[e] || void 0 === o[e] ? "" : i._stringify(o[e]),
                    s += n + t.length + n + t;
                return s
            }
            _decode(e) {
                const t = [];
                let s, o;
                do {
                    if (e.substring(0, 3) !== n)
                        return t;
                    s = "",
                    o = "";
                    const i = (e = e.substring(3)).length;
                    for (let t = 0; t < i; t++) {
                        if (o = Number(e.substring(t, t + 1)),
                        Number(e.substring(t, t + 1)) !== o) {
                            e = e.substring(s.length + n.length),
                            s = Number(s);
                            break
                        }
                        s += o
                    }
                    t.push(e.substring(0, s)),
                    e = e.substring(s)
                } while ("" !== e);
                return t
            }
            _onData(e) {
                this._setTimeout();
                const t = this._decode(e)
                  , s = t.length;
                for (let e = 0; e < s; e++)
                    this._onMessage(t[e])
            }
            _setTimeout() {
                this._clearIdleTimeout(),
                this._timeout = setTimeout(this._onTimeout.bind(this), this._options.timeout)
            }
            _onTimeout() {
                this.disconnect(),
                this._onDisconnect({
                    code: 4e3,
                    reason: "socket.io timeout",
                    wasClean: !1
                })
            }
            _onMessage(e) {
                this.sessionid ? this._checkIfHeartbeat(e) ? this._onHeartbeat(e.slice(3)) : this._checkIfJson(e) ? this._base.onMessage(JSON.parse(e.slice(3))) : this._base.onMessage(e) : (this.sessionid = e,
                this._onConnect())
            }
            _checkIfHeartbeat(e) {
                return this._checkMessageType(e, "h")
            }
            _checkIfJson(e) {
                return this._checkMessageType(e, "j")
            }
            _checkMessageType(e, t) {
                return e.substring(0, 3) === "~" + t + "~"
            }
            _onHeartbeat(e) {
                this.send("~h~" + e)
            }
            _onConnect() {
                this.connected = !0,
                this._base.onConnect()
            }
            _onDisconnect(e) {
                this._clear(),
                this._base.onDisconnect(e),
                this.sessionid = null
            }
            _clear() {
                this.connected = !1
            }
            _prepareUrl() {
                const t = c(this._base.host);
                if (t.pathname += "socket.io/websocket",
                t.protocol = "wss:",
                t.searchParams.append("from", window.location.pathname.slice(1, 50)),
                t.searchParams.append("date", window.BUILD_TIME || ""),
                e("any") && t.searchParams.append("client", "mobile"),
                this._options.connectionType && t.searchParams.append("type", this._options.connectionType),
                window.WEBSOCKET_PARAMS_ANALYTICS) {
                    const {ws_page_uri: e, ws_ancestor_origin: s} = window.WEBSOCKET_PARAMS_ANALYTICS;
                    e && t.searchParams.append("page-uri", e),
                    s && t.searchParams.append("ancestor-origin", s)
                }
                return t.href
            }
            _onClose(e) {
                this._clearIdleTimeout(),
                this._onDisconnect(e)
            }
            _onError(e) {
                this._clearIdleTimeout(),
                this._clear(),
                this._base.emit("error", [e]),
                this.sessionid = null
            }
            static _stringify(e) {
                return "[object Object]" === Object.prototype.toString.call(e) ? "~j~" + JSON.stringify(e) : String(e)
            }
        }
        class r {
            constructor(e, t) {
                this.host = e,
                this._connecting = !1,
                this._events = {},
                this.transport = this._getTransport(t)
            }
            isConnected() {
                return !!this.transport && this.transport.connected
            }
            isConnecting() {
                return this._connecting
            }
            connect() {
                this.isConnected() || (this._connecting && this.disconnect(),
                this._connecting = !0,
                this.transport.connect())
            }
            send(e) {
                this.transport && this.transport.connected && this.transport.send(e)
            }
            disconnect() {
                this.transport && this.transport.disconnect()
            }
            on(e, t) {
                e in this._events || (this._events[e] = []),
                this._events[e].push(t)
            }
            offAll() {
                this._events = {}
            }
            onMessage(e) {
                this.emit("message", [e])
            }
            emit(e, t=[]) {
                if (e in this._events) {
                    const s = this._events[e].concat()
                      , o = s.length;
                    for (let e = 0; e < o; e++)
                        s[e].apply(this, t)
                }
            }
            onConnect() {
                this.clear(),
                this.emit("connect")
            }
            onDisconnect(e) {
                this.emit("disconnect", [e])
            }
            clear() {
                this._connecting = !1
            }
            _getTransport(e) {
                return new i(this,e)
            }
        }
        function c(e) {
            const t = -1 !== e.indexOf("/") ? new URL(e) : new URL("wss://" + e);
            if ("wss:" !== t.protocol && "https:" !== t.protocol)
                throw new Error("Invalid websocket base " + e);
            return t.pathname.endsWith("/") || (t.pathname += "/"),
            t.search = "",
            t.username = "",
            t.password = "",
            t
        }
        const a = Number(window.TELEMETRY_WS_ERROR_LOGS_THRESHOLD) || 0;
        class l {
            constructor(e, t={}) {
                this._queueStack = [],
                this._logsQueue = [],
                this._telemetryObjectsQueue = [],
                this._reconnectCount = 0,
                this._redirectCount = 0,
                this._errorsCount = 0,
                this._errorsInfoSent = !1,
                this._connectionStart = null,
                this._connectionEstablished = null,
                this._reconnectTimeout = null,
                this._onlineCancellationToken = null,
                this._isConnectionForbidden = !1,
                this._initialHost = t.initialHost || null,
                this._suggestedHost = e,
                this._proHost = t.proHost,
                this._reconnectHost = t.reconnectHost,
                this._noReconnectAfterTimeout = !0 === t.noReconnectAfterTimeout,
                this._dataRequestTimeout = t.dataRequestTimeout,
                this._connectionType = t.connectionType,
                this._doConnect(),
                t.pingRequired && -1 === window.location.search.indexOf("noping") && this._startPing()
            }
            connect() {
                this._tryConnect()
            }
            resetCounters() {
                this._reconnectCount = 0,
                this._redirectCount = 0
            }
            setLogger(e, t) {
                this._logger = e,
                this._getLogHistory = t,
                this._flushLogs()
            }
            setTelemetry(e) {
                this._telemetry = e,
                this._telemetry.reportSent.subscribe(this, this._onTelemetrySent),
                this._flushTelemetry()
            }
            onReconnect(e) {
                this._onReconnect = e
            }
            isConnected() {
                return !!this._socket && this._socket.isConnected()
            }
            isConnecting() {
                return !!this._socket && this._socket.isConnecting()
            }
            on(e, t) {
                return !!this._socket && ("connect" === e && this._socket.isConnected() ? t() : "disconnect" === e ? this._disconnectCallbacks.push(t) : this._socket.on(e, t),
                !0)
            }
            getSessionId() {
                return this._socket && this._socket.transport ? this._socket.transport.sessionid : null
            }
            send(e) {
                return this.isConnected() ? (this._socket.send(e),
                !0) : (this._queueMessage(e),
                !1)
            }
            getConnectionEstablished() {
                return this._connectionEstablished
            }
            getHost() {
                const e = this._tryGetProHost();
                return null !== e ? e : this._reconnectHost && this._reconnectCount > 3 ? this._reconnectHost : this._suggestedHost
            }
            getReconnectCount() {
                return this._reconnectCount
            }
            getRedirectCount() {
                return this._redirectCount
            }
            getConnectionStart() {
                return this._connectionStart
            }
            disconnect() {
                this._clearReconnectTimeout(),
                (this.isConnected() || this.isConnecting()) && (this._propagateDisconnect(),
                this._disconnectCallbacks = [],
                this._closeSocket())
            }
            forbidConnection() {
                this._isConnectionForbidden = !0,
                this.disconnect()
            }
            allowConnection() {
                this._isConnectionForbidden = !1,
                this.connect()
            }
            isMaxRedirects() {
                return this._redirectCount >= 20
            }
            isMaxReconnects() {
                return this._reconnectCount >= 20
            }
            getPingInfo() {
                return this._pingInfo || null
            }
            _tryGetProHost() {
                return window.TradingView && window.TradingView.onChartPage && "battle" === window.environment && !this._redirectCount && -1 === window.location.href.indexOf("ws_host") ? this._initialHost ? this._initialHost : void 0 !== window.user && window.user.pro_plan ? this._proHost || this._suggestedHost : null : null
            }
            _queueMessage(e) {
                0 === this._queueStack.length && this._logMessage(0, "Socket is not connected. Queued a message"),
                this._queueStack.push(e)
            }
            _processMessageQueue() {
                0 !== this._queueStack.length && (this._logMessage(0, "Processing queued messages"),
                this._queueStack.forEach(this.send.bind(this)),
                this._logMessage(0, "Processed " + this._queueStack.length + " messages"),
                this._queueStack = [])
            }
            _onDisconnect(e) {
                this._noReconnectAfterTimeout || null !== this._reconnectTimeout || (this._reconnectTimeout = setTimeout(this._tryReconnect.bind(this), 5e3)),
                this._clearOnlineCancellationToken();
                let t = "disconnect session:" + this.getSessionId();
                e && (t += ", code:" + e.code + ", reason:" + e.reason,
                1005 === e.code && this._sendTelemetry("websocket_code_1005")),
                this._logMessage(0, t),
                this._propagateDisconnect(e),
                this._closeSocket(),
                this._queueStack = []
            }
            _closeSocket() {
                null !== this._socket && (this._socket.offAll(),
                this._socket.disconnect(),
                this._socket = null)
            }
            _logMessage(e, t) {
                const s = {
                    method: e,
                    message: t
                };
                this._logger ? this._flushLogMessage(s) : (s.message = `[${(new Date).toISOString()}] ${s.message}`,
                this._logsQueue.push(s))
            }
            _flushLogMessage(e) {
                switch (e.method) {
                case 2:
                    this._logger.logDebug(e.message);
                    break;
                case 3:
                    this._logger.logError(e.message);
                    break;
                case 0:
                    this._logger.logInfo(e.message);
                    break;
                case 1:
                    this._logger.logNormal(e.message)
                }
            }
            _flushLogs() {
                this._flushLogMessage({
                    method: 1,
                    message: "messages from queue. Start."
                }),
                this._logsQueue.forEach((e=>{
                    this._flushLogMessage(e)
                }
                )),
                this._flushLogMessage({
                    method: 1,
                    message: "messages from queue. End."
                }),
                this._logsQueue = []
            }
            _sendTelemetry(e, t) {
                const s = {
                    event: e,
                    params: t
                };
                this._telemetry ? this._flushTelemetryObject(s) : this._telemetryObjectsQueue.push(s)
            }
            _flushTelemetryObject(e) {
                this._telemetry.sendChartReport(e.event, e.params, !1)
            }
            _flushTelemetry() {
                this._telemetryObjectsQueue.forEach((e=>{
                    this._flushTelemetryObject(e)
                }
                )),
                this._telemetryObjectsQueue = []
            }
            _doConnect() {
                this._socket && (this._socket.isConnected() || this._socket.isConnecting()) || (this._clearOnlineCancellationToken(),
                this._host = this.getHost(),
                this._socket = new r(this._host,{
                    timeout: this._dataRequestTimeout,
                    connectionType: this._connectionType
                }),
                this._logMessage(0, "Connecting to " + this._host),
                this._bindEvents(),
                this._disconnectCallbacks = [],
                this._connectionStart = performance.now(),
                this._connectionEstablished = null,
                this._socket.connect(),
                performance.mark("SWSC", {
                    detail: "Start WebSocket connection"
                }),
                this._socket.on("connect", (()=>{
                    performance.mark("EWSC", {
                        detail: "End WebSocket connection"
                    }),
                    performance.measure("WebSocket connection delay", "SWSC", "EWSC")
                }
                )))
            }
            _propagateDisconnect(e) {
                const t = this._disconnectCallbacks.length;
                for (let s = 0; s < t; s++)
                    this._disconnectCallbacks[s](e || {})
            }
            _bindEvents() {
                this._socket && (this._socket.on("connect", (()=>{
                    const e = this.getSessionId();
                    if ("string" == typeof e) {
                        const t = JSON.parse(e);
                        if (t.redirect)
                            return this._redirectCount += 1,
                            this._suggestedHost = t.redirect,
                            this.isMaxRedirects() && this._sendTelemetry("redirect_bailout"),
                            void this._redirect()
                    }
                    this._connectionEstablished = performance.now(),
                    this._processMessageQueue(),
                    this._logMessage(0, "connect session:" + e)
                }
                )),
                this._socket.on("disconnect", this._onDisconnect.bind(this)),
                this._socket.on("close", this._onDisconnect.bind(this)),
                this._socket.on("error", (e=>{
                    this._logMessage(0, new Date + " session:" + this.getSessionId() + " websocket error:" + JSON.stringify(e)),
                    this._sendTelemetry("websocket_error"),
                    this._errorsCount++,
                    !this._errorsInfoSent && this._errorsCount >= a && (void 0 !== this._lastConnectCallStack && (this._sendTelemetry("websocket_error_connect_stack", {
                        text: this._lastConnectCallStack
                    }),
                    delete this._lastConnectCallStack),
                    void 0 !== this._getLogHistory && this._sendTelemetry("websocket_error_log", {
                        text: this._getLogHistory(50).join("\n")
                    }),
                    this._errorsInfoSent = !0)
                }
                )))
            }
            _redirect() {
                this.disconnect(),
                this._reconnectWhenOnline()
            }
            _tryReconnect() {
                this._tryConnect() && (this._reconnectCount += 1)
            }
            _tryConnect() {
                return !this._isConnectionForbidden && (this._clearReconnectTimeout(),
                this._lastConnectCallStack = new Error(`WebSocket connect stack. Is connected: ${this.isConnected()}.`).stack || "",
                !this.isConnected() && (this.disconnect(),
                this._reconnectWhenOnline(),
                !0))
            }
            _clearOnlineCancellationToken() {
                this._onlineCancellationToken && (this._onlineCancellationToken(),
                this._onlineCancellationToken = null)
            }
            _clearReconnectTimeout() {
                null !== this._reconnectTimeout && (clearTimeout(this._reconnectTimeout),
                this._reconnectTimeout = null)
            }
            _reconnectWhenOnline() {
                if (navigator.onLine)
                    return this._logMessage(0, "Network status: online - trying to connect"),
                    this._doConnect(),
                    void (this._onReconnect && this._onReconnect());
                this._logMessage(0, "Network status: offline - wait until online"),
                this._onlineCancellationToken = function(e) {
                    let t = e;
                    const s = ()=>{
                        window.removeEventListener("online", s),
                        t && t()
                    }
                    ;
                    return window.addEventListener("online", s),
                    ()=>{
                        t = null
                    }
                }((()=>{
                    this._logMessage(0, "Network status changed to online - trying to connect"),
                    this._doConnect(),
                    this._onReconnect && this._onReconnect()
                }
                ))
            }
            _onTelemetrySent(e) {
                "websocket_error"in e && (this._errorsCount = 0,
                this._errorsInfoSent = !1)
            }
            _startPing() {
                if (this._pingIntervalId)
                    return;
                const e = c(this.getHost());
                e.pathname += "ping",
                e.protocol = "https:";
                let t = 0
                  , s = 0;
                const o = e=>{
                    this._pingInfo = this._pingInfo || {
                        max: 0,
                        min: 1 / 0,
                        avg: 0
                    };
                    const o = (new Date).getTime() - e;
                    o > this._pingInfo.max && (this._pingInfo.max = o),
                    o < this._pingInfo.min && (this._pingInfo.min = o),
                    t += o,
                    s++,
                    this._pingInfo.avg = t / s,
                    s >= 10 && this._pingIntervalId && (clearInterval(this._pingIntervalId),
                    delete this._pingIntervalId)
                }
                ;
                this._pingIntervalId = setInterval((()=>{
                    const t = (new Date).getTime()
                      , s = new XMLHttpRequest;
                    s.open("GET", e, !0),
                    s.send(),
                    s.onreadystatechange = ()=>{
                        s.readyState === XMLHttpRequest.DONE && 200 === s.status && o(t)
                    }
                }
                ), 1e4)
            }
        }
        const h = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        function d() {
            return function(e) {
                let t = "";
                for (let s = 0; s < e; ++s) {
                    const e = Math.floor(Math.random() * h.length);
                    t += h[e]
                }
                return t
            }(12)
        }
        function _(e) {
            return e.index = e.i,
            e.value = e.v,
            delete e.i,
            delete e.v,
            e
        }
        function u(e) {
            for (const t of Object.keys(e))
                e[t].t && (e[t].turnaround = e[t].t),
                e[t].s && !e[t].series && (e[t].series = e[t].s.map(_)),
                e[t].st && !e[t].series && (e[t].series = e[t].st.map(_))
        }
        class g {
            chart_create_session(e) {
                return [e, "library_datafeed"]
            }
            resolve_symbol(e, t, s) {
                return [e, t, s]
            }
            create_series(e, t, s, o, n, i) {
                return [e, t, s, o, n, i, ""]
            }
            remove_series(e, t) {
                return [e, t]
            }
            unpack(e) {
                const t = JSON.parse(e);
                t.m && t.p && (t.method = t.m,
                t.params = t.p,
                t.time = t.t);
                const s = t.params[1];
                switch (t.method) {
                case "du":
                    t.method = "data_update",
                    u(s);
                    break;
                case "timescale_update":
                    u(s)
                }
                return t
            }
        }
        var m = s(137);
        const b = "undefined" != typeof window ? window : {};
        let f = !1;
        try {
            localStorage.getItem(""),
            f = !0
        } catch (e) {}
        var y;
        !function(e) {
            e[e.ERROR = 1] = "ERROR",
            e[e.WARNING = 2] = "WARNING",
            e[e.INFO = 3] = "INFO",
            e[e.NORMAL = 4] = "NORMAL",
            e[e.DEBUG = 5] = "DEBUG"
        }(y || (y = {}));
        let p = 0;
        const S = "tv.logger.loglevel"
          , C = "tv.logger.logHighRate"
          , I = [];
        let v = null
          , E = null
          , w = null
          , k = NaN
          , T = y.WARNING
          , R = !1;
        function O(e) {
            e = Math.max(y.ERROR, Math.min(y.DEBUG, e)),
            T = e,
            N()
        }
        function B(e) {
            return new Date(e.timestamp).toISOString() + ":" + e.subSystemId + ":" + e.message.replace(/"/g, "'")
        }
        b.lget = (e,t)=>{
            const s = function(e, t) {
                let s = I.reduce(((e,t)=>e.concat(t)), []);
                return s.sort(((e,t)=>e.id - t.id)),
                void 0 !== t && (s = s.filter((e=>e.subSystemId === t))),
                "number" == typeof e && (s = s.slice(-e)),
                s
            }(e, t).map(B);
            return function(e, t) {
                let s, o = 0, n = 0;
                for (s = e.length - 1; s >= 1 && (o += 8 * (1 + encodeURIComponent(e[s]).length),
                !(s - 1 > 0 && (n = 8 * (1 + encodeURIComponent(e[s - 1]).length),
                o + n > t))); s--)
                    ;
                return e.slice(s)
            }(s, 75497472)
        }
        ;
        function M(e, t, s, o) {
            if (t === E && o.id === w)
                return;
            const n = new Date;
            if (e <= y.NORMAL && function(e, t, s, o, n) {
                "function" == typeof structuredClone && (t = structuredClone(t));
                const i = {
                    id: p,
                    message: t,
                    subSystemId: o,
                    timestamp: Number(e)
                };
                p += 1,
                s.push(i),
                void 0 !== n && s.length > n && s.splice(0, 1)
            }(n, t, s, o.id, o.maxCount),
            e <= T && (!o.highRate || R) && (!v || o.id.match(v))) {
                const s = n.toISOString() + ":" + o.id + ":" + t;
                switch (e) {
                case y.DEBUG:
                    console.debug(s);
                    break;
                case y.INFO:
                case y.NORMAL:
                    o.color ? console.log("%c" + s, "color: " + o.color) : console.log(s);
                    break;
                case y.WARNING:
                    console.warn(s);
                    break;
                case y.ERROR:
                    console.error(s)
                }
                E = t,
                w = o.id,
                k && clearTimeout(k),
                k = setTimeout((()=>{
                    E = null,
                    w = null,
                    k = NaN
                }
                ), 1e3)
            }
        }
        function A(e, t={}) {
            const s = [];
            I.push(s);
            const o = Object.assign(t, {
                id: e
            });
            function n(e) {
                return t=>M(e, String(t), s, o)
            }
            return {
                logDebug: n(y.DEBUG),
                logError: n(y.ERROR),
                logInfo: n(y.INFO),
                logNormal: n(y.NORMAL),
                logWarn: n(y.WARNING)
            }
        }
        const P = A("logger");
        b.lon = (e,t)=>{
            O(y.DEBUG),
            P.logNormal("Debug logging enabled"),
            R = Boolean(e),
            v = t || null,
            N()
        }
        ,
        b.loff = ()=>{
            O(y.INFO),
            P.logInfo("Debug logging disabled")
        }
        ;
        function N() {
            try {
                f && (localStorage.setItem(C, String(R)),
                localStorage.setItem(S, String(T)))
            } catch (e) {
                P.logWarn(`Cannot save logger state (level: ${T}, high-rate: ${R}) to localStorage: ${e.message}`)
            }
        }
        !function() {
            R = !!f && "true" === localStorage.getItem(C);
            let e = parseInt(f && localStorage.getItem(S) || "");
            Number.isNaN(e) && (e = y.WARNING),
            O(e),
            P.logNormal(`Init with settings - level: ${T}, high-rate: ${R}`)
        }(),
        b.performance && b.performance.now ? P.logNormal(`Sync logger and perf times, now is ${b.performance.now()}`) : P.logWarn("Perf time is not available");
        A("Common.InitData"),
        window.initData;
        var D;
        !function(e) {
            e[e.Medium = 0] = "Medium",
            e[e.Large = 1] = "Large"
        }(D || (D = {}));
        class L {
            constructor(e) {
                (0,
                m.hu)("" !== e, "S3 base url must be a non-empty string"),
                this._baseUrl = e
            }
            getSymbolLogoUrl(e, t) {
                switch ((0,
                m.hu)("" !== e, "logo id must be a non-empty string"),
                t) {
                case D.Medium:
                    return this._baseUrl + `${e}.svg`;
                case D.Large:
                    return this._baseUrl + `${e}--big.svg`
                }
            }
            getCountryFlagUrl(e, t) {
                return this.getSymbolLogoUrl("country/" + e, t)
            }
            getCryptoLogoUrl(e, t) {
                return this.getSymbolLogoUrl("crypto/" + e, t)
            }
            getProviderLogoUrl(e, t) {
                return this.getSymbolLogoUrl("provider/" + e, t)
            }
            getSourceLogoUrl(e, t) {
                return this.getSymbolLogoUrl("source/" + e, t)
            }
        }
        const U = "https://s3-symbol-logo.tradingview.com/"
          , H = new L(U);
        function q(e) {
            return 2 !== e.length ? e : function(e) {
                return e.some((e=>X(e)))
            }(e) && !function(e) {
                return e.some((e=>(e.includes("currency") || e.includes("country")) && !X(e)))
            }(e) ? e.filter((e=>!X(e))) : e
        }
        function X(e) {
            return e.includes("currency/USD") || e.includes("country/US")
        }
        function x(e) {
            const t = {}
              , s = q(function(e, t=D.Medium) {
                const s = e.logoid
                  , o = e["base-currency-logoid"]
                  , n = e["currency-logoid"]
                  , i = s && H.getSymbolLogoUrl(s, t);
                if (i)
                    return [i];
                const r = o && H.getSymbolLogoUrl(o, t)
                  , c = n && H.getSymbolLogoUrl(n, t);
                return r && c ? [r, c] : r ? [r] : c ? [c] : []
            }(e, D.Medium));
            s.length >= 1 && (t.logo_urls = s);
            const o = e.country ? H.getCountryFlagUrl(e.country, D.Medium) : void 0
              , n = e.provider_id ? H.getProviderLogoUrl(e.provider_id, D.Medium) : void 0;
            return (o || n) && (t.exchange_logo = o || n),
            t
        }
        function W() {
            let e, t;
            return {
                promise: new Promise(((s,o)=>{
                    e = s,
                    t = o
                }
                )),
                reject: t,
                resolve: e
            }
        }
        function G(e) {
            return "=" + JSON.stringify(F(e))
        }
        function F(e) {
            return Object.keys(e).sort().reduce(((t,s)=>("[object Object]" === Object.prototype.toString.call(e[s]) ? t[s] = F(e[s]) : t[s] = e[s],
            t)), {})
        }
        function $(e) {
            return Boolean(e.inputs) || function(e) {
                return Boolean(e.replay)
            }(e) || e.session || e.adjustment || e["currency-id"] || e["unit-id"] ? G(e) : e.symbol
        }
        const Q = ["1", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "5D", "1W", "1M"]
          , j = {
            supports_marks: !1,
            supports_timescale_marks: !0,
            supported_resolutions: Q,
            exchanges: [{
                value: "",
                name: "",
                desc: ""
            }],
            symbols_types: [{
                name: "All",
                value: ""
            }, {
                name: "Stock",
                value: "stock"
            }, {
                name: "Forex",
                value: "forex"
            }, {
                name: "Index",
                value: "index"
            }, {
                name: "Crypto",
                value: "crypto"
            }],
            is_tradingview_data: !0
        }
          , V = A("LibraryTVDatafeed.Session", {
            highRate: !0
        });
        function Y(e) {
            return `r,${e.from}:${e.to}`
        }
        function K(e) {
            return [e.ticker, e.currency_code, e.unit_id, e.subsession_id].filter((e=>!!e)).join("_#_")
        }
        function J(e) {
            return "series_completed" === e.method
        }
        function Z(e) {
            return "series_error" === e.method
        }
        function z(e) {
            return "series_loading" === e.method
        }
        function ee(e) {
            return "symbol_error" === e.method
        }
        function te(e) {
            return "symbol_resolved" === e.method
        }
        function se(e) {
            return "timescale_update" === e.method
        }
        function oe(e) {
            return "data_update" === e.method
        }
        function ne(e, t) {
            const s = []
              , [,o] = t.params;
            if (void 0 === o[e])
                return s;
            const n = o[e].s || [];
            for (let e = 0; e < n.length; e++) {
                const [t,o,i,r,c,a] = n[e].value;
                s.push({
                    time: 1e3 * t,
                    open: o,
                    high: i,
                    low: r,
                    close: c,
                    volume: a
                })
            }
            return s
        }
        function ie() {
            return "lib_sess_" + d()
        }
        function re() {
            return "s_" + d()
        }
        function ce() {
            return "sym_" + d()
        }
        class ae {
            constructor(e, t, s) {
                var o, n;
                this._dataHandleModule = new g,
                this._realtimeSubscriberCallbacks = {},
                this._getBarsResult = {
                    bars: [],
                    meta: {}
                },
                this._symbolInfoHashes = new Set,
                this._sessionId = ie(),
                this._seriesId = re(),
                this._symbolId = ce(),
                this._isSessionCreated = !1,
                this._isSeriesCreated = !1,
                this._isSeriesLoading = !1,
                this._deferredGetBarsPromise = W(),
                this._deferredResolveSymbolPromise = W(),
                this._wsBackendConnection = e,
                this._quotesProvider = t,
                this._partialSymbolInfoForResolve = s,
                this._symbolStringForResolve = (o = s.ticker,
                void 0 === (n = {
                    currencyCode: s.currency_code,
                    unitId: s.unit_id,
                    session: s.subsession_id
                }) ? o : $({
                    symbol: o,
                    session: n.session
                })),
                this._symbolInfoHashes.add(K(s)),
                this._wsBackendConnection.on("message", (e=>setTimeout((()=>this._onWsBackendMessage(e)), 0)))
            }
            hasSymbol(e, t) {
                const s = this._symbolInfoHashes.has(K(e))
                  , o = t === this._resolution;
                return s && (!this._isSeriesCreated || o)
            }
            hasSubscriber(e) {
                return void 0 !== this._realtimeSubscriberCallbacks[e]
            }
            async resolveSymbol() {
                return void 0 !== this._symbolInfo ? this._symbolInfo : (this._isSessionCreated || (this._isSessionCreated = !0,
                this._sessionId = ie(),
                this._sendRequest("chart_create_session", [this._sessionId])),
                this._symbolId = ce(),
                this._sendRequest("resolve_symbol", [this._sessionId, this._symbolId, this._symbolStringForResolve]),
                this._deferredResolveSymbolPromise.promise)
            }
            async getBars(e, t) {
                return await this.resolveSymbol(),
                this._isSeriesCreated ? (this._sendRequest("request_more_data", [this._sessionId, this._seriesId, t.countBack]),
                this._deferredGetBarsPromise.promise) : (this._resolution = e,
                this._isSeriesCreated = !0,
                this._seriesId = re(),
                this._sendRequest("create_series", [this._sessionId, this._seriesId, "t", this._symbolId, this._resolution, t.countBack, Y(t)]),
                this._deferredGetBarsPromise.promise)
            }
            subscribeBars(e, t) {
                this._realtimeSubscriberCallbacks[t] = e
            }
            unsubscribeBars(e) {
                delete this._realtimeSubscriberCallbacks[e],
                0 === Object.keys(this._realtimeSubscriberCallbacks).length && (V.logInfo("Deleting session because there are no realtime subscribers"),
                this._isSessionCreated = !1,
                this._isSeriesCreated = !1,
                this._symbolInfo = void 0,
                this._sendRequest("chart_delete_session", [this._sessionId]))
            }
            _sendRequest(e, t) {
                const s = JSON.stringify({
                    m: e,
                    p: t
                });
                V.logDebug(`Send message ${s}`),
                this._wsBackendConnection.send(s)
            }
            async _onWsBackendMessage(e) {
                if ("string" != typeof e)
                    return;
                const t = this._dataHandleModule.unpack(e);
                if (function(e) {
                    return Z(e) || J(e) || z(e) || ee(e) || te(e) || se(e) || oe(e)
                }(t) && function(e) {
                    return Z(e) ? e.params[1] : e.params[0]
                }(t) === this._sessionId)
                    if (V.logDebug(`Receive message ${e}`),
                    ee(t))
                        this._deferredResolveSymbolPromise.reject(t.params[2]);
                    else {
                        if (te(t)) {
                            const e = function(e) {
                                const t = {
                                    ...e,
                                    base_name: e.base_name ? [e.base_name] : void 0,
                                    timezone: e.timezone,
                                    format: e.format || "price",
                                    supported_resolutions: e.supported_resolutions || Q,
                                    data_status: void 0,
                                    subsessions: e.subsessions,
                                    ticker: e.full_name
                                };
                                switch (e.delay) {
                                case void 0:
                                case 0:
                                    t.data_status = "streaming";
                                    break;
                                case -1:
                                    t.data_status = "endofday";
                                    break;
                                default:
                                    t.data_status = "delayed_streaming"
                                }
                                return e.listed_exchange && (t.exchange = e.listed_exchange),
                                t
                            }(t.params[2]);
                            await this._tryInjectLogosFromQuoteData(this._partialSymbolInfoForResolve.ticker, e),
                            this._symbolInfo = e,
                            this._symbolInfoHashes.add(K(this._symbolInfo)),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: t.params[2].pro_name
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: this._partialSymbolInfoForResolve.ticker
                            }));
                            const s = void 0 === this._symbolInfo.original_currency_code
                              , o = void 0 === this._symbolInfo.original_unit_id;
                            return s && (this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                currency_code: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: t.params[2].pro_name,
                                currency_code: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: this._partialSymbolInfoForResolve.ticker,
                                currency_code: void 0
                            }))),
                            o && (this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                unit_id: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: t.params[2].pro_name,
                                unit_id: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: this._partialSymbolInfoForResolve.ticker,
                                unit_id: void 0
                            }))),
                            s && o && (this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                unit_id: void 0,
                                currency_code: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: t.params[2].pro_name,
                                unit_id: void 0,
                                currency_code: void 0
                            })),
                            this._symbolInfoHashes.add(K({
                                ...this._symbolInfo,
                                ticker: this._partialSymbolInfoForResolve.ticker,
                                unit_id: void 0,
                                currency_code: void 0
                            }))),
                            V.logInfo(`Resolved ${this._symbolInfo.ticker} hashes ${[...this._symbolInfoHashes.values()].join(", ")}`),
                            void this._deferredResolveSymbolPromise.resolve(e)
                        }
                        if (Z(t))
                            this._deferredGetBarsPromise.reject(t.params[4]);
                        else {
                            if (z(t))
                                return this._isSeriesLoading = !0,
                                void this._clearGetBarsResult();
                            if (oe(t) || se(t))
                                if (this._isSeriesLoading)
                                    this._getBarsResult.bars = ne(this._seriesId, t).concat(this._getBarsResult.bars);
                                else {
                                    const e = ne(this._seriesId, t)[0];
                                    for (const t of Object.keys(this._realtimeSubscriberCallbacks))
                                        this._realtimeSubscriberCallbacks[t](e)
                                }
                            else {
                                if (J(t)) {
                                    this._isSeriesLoading = !1;
                                    const e = t.params[4]
                                      , s = void 0 !== e && void 0 !== e.data_completed;
                                    return 0 === this._getBarsResult.bars.length && s && (this._getBarsResult.meta.noData = !0),
                                    this._deferredGetBarsPromise.resolve(this._getBarsResult),
                                    void (this._deferredGetBarsPromise = W())
                                }
                                V.logError(`Unhandled message: ${t.method}, ${JSON.stringify(t.params)}`)
                            }
                        }
                    }
            }
            _clearGetBarsResult() {
                this._getBarsResult.bars = [],
                this._getBarsResult.meta = {}
            }
            async _tryInjectLogosFromQuoteData(e, t) {
                try {
                    const s = e
                      , o = function(e, t) {
                        const s = t.filter((t=>"ok" === t.s && t.n === e)).map((e=>e.v));
                        return s.length < 1 ? null : s[0]
                    }(s, await this._quotesProvider.getQuoteData(s));
                    if (!o)
                        throw new Error;
                    const n = function(e) {
                        const t = {};
                        return e["base-currency-logoid"] && !e["base-currency-logoid"].startsWith(U) && (t["base-currency-logoid"] = H.getSymbolLogoUrl(e["base-currency-logoid"], D.Medium)),
                        e["currency-logoid"] && !e["currency-logoid"].startsWith(U) && (t["currency-logoid"] = H.getSymbolLogoUrl(e["currency-logoid"], D.Medium)),
                        e.logoid && !e.logoid.startsWith(U) && (t.logoid = H.getSymbolLogoUrl(e.logoid, D.Medium)),
                        e.provider_id && !e.provider_id.startsWith(U) && (t.provider_id = H.getProviderLogoUrl(e.provider_id, D.Medium)),
                        e.country_code && !e.country_code.startsWith(U) && (t.country = H.getCountryFlagUrl(e.country_code, D.Medium)),
                        t
                    }(o);
                    n.logoid && (t.logo_urls = [n.logoid]),
                    n["base-currency-logoid"] && n["currency-logoid"] && (t.logo_urls = [n["base-currency-logoid"], n["currency-logoid"]]),
                    t.exchange_logo = n.country || n.provider_id
                } catch (t) {
                    const s = t instanceof Error ? t.message : "(no error message)";
                    V.logError(`Unable to get quote data for ${e} while resolving symbol info: ${s}`)
                }
            }
        }
        const le = A("LibraryTVDatafeed.HistoryResolveDataPulseProvider");
        function he(e) {
            if (void 0 === e.ticker)
                throw new Error("ticker is undefined in symbol information");
            return e
        }
        class de {
            constructor(e, t, s) {
                this._sessions = [],
                this._wsBackendConnection = e,
                this._quotesProvider = t,
                this._exchangeAllowDeny = s
            }
            async resolveSymbol(e, t) {
                const s = {
                    ticker: e,
                    currency_code: null == t ? void 0 : t.currencyCode,
                    unit_id: null == t ? void 0 : t.unitId,
                    subsession_id: (null == t ? void 0 : t.session) || "regular"
                }
                  , o = this._ensureSessionForSymbol(s)
                  , n = await o.resolveSymbol();
                if (!this._exchangeAllowDeny.isExchangeAllowed(n.listed_exchange))
                    throw new Error("unknown_symbol");
                return n
            }
            async getBars(e, t, s) {
                const o = this._ensureSessionForSymbol(he(e), t);
                return await o.getBars(t, s)
            }
            subscribeBars(e, t, s, o) {
                this._ensureSessionForSymbol(he(e), t).subscribeBars(s, o)
            }
            unsubscribeBars(e) {
                const t = this._findSymbolSeriesSessionBySubscriber(e);
                void 0 !== t && t.unsubscribeBars(e)
            }
            _ensureSessionForSymbol(e, t) {
                let s = this._sessions.find((s=>s.hasSymbol(e, t)));
                return void 0 === s && (le.logInfo(`Creating session for ${e.ticker} ${t || "(no resolution)"}`),
                s = new ae(this._wsBackendConnection,this._quotesProvider,e),
                this._sessions.push(s)),
                s
            }
            _findSymbolSeriesSessionBySubscriber(e) {
                return this._sessions.find((t=>t.hasSubscriber(e)))
            }
        }
        const _e = A("LibraryTVDatafeed.QuotesProvider", {
            highRate: !0
        })
          , ue = ["ch", "chp", "short_name", "exchange", "original_name", "description", "lp", "ask", "bid", "open_price", "high_price", "low_price", "prev_close_price", "volume", "spread", "logoid", "base-currency-logoid", "currency-logoid", "country", "country_code", "provider_id", "sector", "listed_exchange", "industry"]
          , ge = ["dividend_amount_recent", "dividend_ex_date_recent", "dividend_payout_ratio_ttm", "earnings_release_date_fq_h", "earnings_per_share_forecast_fq_h", "earnings_per_share_fq_h", "earnings_fiscal_period_fq_h"];
        class me {
            constructor(e) {
                this._isConnected = !1,
                this._sessionId = "qs_" + d(),
                this._mostRecentQuoteDataBySymbol = new Map,
                this._dataHandleModule = new g,
                this._listenerGuidsBySymbol = new Map,
                this._callbackByListenerGuid = new Map,
                this._completedQuotes = new Set,
                this._quoteCompletionPromises = new Map,
                this._quoteCompletionPromiseRevolvers = new Map,
                this._currentSymbols = new Set,
                this._wsBackendConnection = e,
                this._bindSocketEvents()
            }
            async getQuotes(e, t, s) {
                try {
                    const s = await this._getQuoteData(e);
                    _e.logDebug(`getQuotes ${JSON.stringify(e)} ${JSON.stringify(s)}`),
                    t(s)
                } catch (e) {
                    s(e instanceof Error ? e.message : "Unknown error")
                }
            }
            subscribeQuotes(e, t, s, o) {
                const n = e.concat(t)
                  , i = [];
                for (const e of n) {
                    const t = this._listenerGuidsBySymbol.get(e);
                    void 0 === t ? (i.push(e),
                    this._listenerGuidsBySymbol.set(e, new Set([o]))) : t.add(o)
                }
                this._callbackByListenerGuid.set(o, s),
                this._addSymbols(i),
                this._sendRequest("quote_fast_symbols", [this._sessionId, ...t])
            }
            unsubscribeQuotes(e) {
                const t = [];
                for (const [s,o] of this._listenerGuidsBySymbol)
                    o.has(e) && (t.push(s),
                    o.delete(e));
                this._callbackByListenerGuid.delete(e),
                t.forEach((e=>this._currentSymbols.delete(e))),
                this._sendRequest("quote_remove_symbols", [this._sessionId, ...t])
            }
            async getQuoteData(e) {
                return this._getQuoteData([e])
            }
            async _getQuoteData(e) {
                const t = []
                  , s = e.filter((e=>!this._currentSymbols.has(e)));
                this._addSymbols(s);
                const o = e.map((e=>this._quoteCompletionPromises.get(e))).filter(Boolean)
                  , n = new Promise((e=>setTimeout(e, 2e3)));
                await Promise.race([n, Promise.all(o)]);
                for (const s of e) {
                    const e = this._mostRecentQuoteDataBySymbol.get(s);
                    void 0 !== e && t.push({
                        s: "ok",
                        v: e,
                        n: s
                    })
                }
                return t
            }
            _addSymbols(e) {
                const t = new Set;
                for (let s = 0; s < e.length; s++)
                    t.has(e[s]) || this._currentSymbols.has(e[s]) || t.add(e[s]);
                t.forEach((e=>{
                    this._quoteCompletionPromises.set(e, new Promise((t=>{
                        this._quoteCompletionPromiseRevolvers.set(e, t)
                    }
                    ))),
                    this._currentSymbols.add(e)
                }
                )),
                this._sendRequest("quote_add_symbols", [this._sessionId, ...t])
            }
            _bindSocketEvents() {
                this._wsBackendConnection.on("connect", (()=>{
                    this._onConnect()
                }
                )),
                this._wsBackendConnection.on("message", (e=>{
                    this._onMessage(e)
                }
                )),
                this._wsBackendConnection.on("disconnect", (()=>{
                    _e.logError("disconnect")
                }
                ))
            }
            _onMessage(e) {
                var t, s;
                const o = this._unpack(e);
                if ("protocol_switched" !== o.method) {
                    if ("protocol_error" === o.method)
                        return _e.logError(e),
                        void this._wsBackendConnection.disconnect();
                    if ("critical_error" === o.method)
                        return _e.logError(e),
                        void this._wsBackendConnection.disconnect();
                    var n;
                    if ("qsd" === o.method || "quote_completed" === o.method)
                        switch (_e.logDebug(`Receive message ${e}`),
                        o.method) {
                        case "qsd":
                            {
                                const [,e] = o.params;
                                if ("error" === e.s) {
                                    _e.logError(e.errmsg || "qsd error");
                                    break
                                }
                                const i = e.n
                                  , r = null !== (t = this._listenerGuidsBySymbol.get(i)) && void 0 !== t ? t : []
                                  , c = {
                                    ...this._mostRecentQuoteDataBySymbol.get(i) || {},
                                    ...e.v
                                };
                                c.listed_exchange && (c.exchange = c.listed_exchange),
                                this._mostRecentQuoteDataBySymbol.set(i, c),
                                e.v = (n = c,
                                {
                                    ...n,
                                    logoid: void 0,
                                    provider_id: void 0,
                                    "base-currency-logoid": void 0,
                                    "currency-logoid": void 0
                                });
                                for (const t of r)
                                    null === (s = this._callbackByListenerGuid.get(t)) || void 0 === s || s([e]);
                                break
                            }
                        case "quote_completed":
                            {
                                const [,e] = o.params;
                                this._completedQuotes.add(e);
                                const t = this._quoteCompletionPromiseRevolvers.get(e);
                                t && t();
                                break
                            }
                        }
                }
            }
            _unpack(e) {
                return this._dataHandleModule.unpack(e)
            }
            _onConnect() {
                this._isConnected ? _e.logWarn("_onConnected called again") : (this._isConnected = !0,
                this._sendRequest("quote_create_session", [this._sessionId]),
                this._sendRequest("quote_set_fields", [this._sessionId, ...ue, ...ge]))
            }
            _sendRequest(e, t) {
                const s = JSON.stringify({
                    m: e,
                    p: t
                });
                _e.logDebug(`Send message ${s}`),
                this._wsBackendConnection.send(s)
            }
        }
        const be = A("Fetch");
        function fe(e, t, s={}) {
            {
                const {logOnErrorStatus: o=!0, logBodyOnError: n=!1} = s;
                t = t || {},
                function(e) {
                    return new URL(e,document.baseURI).origin === location.origin
                }(e) && (t.headers ? t.headers instanceof Headers || (t.headers = new Headers(t.headers)) : t.headers = new Headers,
                window.locale && t.headers.set("X-Language", window.locale),
                t.headers.set("X-Requested-With", "XMLHttpRequest")),
                void 0 === t.credentials && (t.credentials = "same-origin");
                const i = window.fetch(e, t);
                return i.then((s=>{
                    if (!s.ok && o) {
                        let o = "";
                        t.method && (o += `${t.method.toUpperCase()} `),
                        o += e,
                        o += `. Status ${s.status}`,
                        s.statusText && (o += `. ${s.statusText}`),
                        s.headers.via && (o += `. Via: ${s.headers.via}`),
                        n && "string" == typeof t.body && (o += `. Body: ${t.body.slice(0, 1024)}`),
                        be.logError(o)
                    }
                    return s
                }
                ), (s=>{
                    if (s && "AbortError" === s.name)
                        return;
                    let o = "";
                    t.method && (o += `${t.method.toUpperCase()} `),
                    o += e,
                    navigator.onLine ? o += `. ${s}` : o += ". User is offline.",
                    be.logError(o)
                }
                )),
                i
            }
        }
        class ye {
            constructor(e) {
                this._quoteDataProvider = e
            }
            async getTimescaleMarks(e, t, s, o) {
                const n = []
                  , i = e.name
                  , r = await this._getQuoteValues(i);
                return r ? (this._populateEarningsMarkers(r, n, i, t, s),
                this._populateDividendsMarkers(r, n, i, t, s),
                n) : n
            }
            async getMarks(e, t, s, o) {
                return []
            }
            async _getQuoteValues(e) {
                const t = (await this._quoteDataProvider(e)).find((t=>t.n === e));
                return t && "ok" === t.s ? t.v : null
            }
            _populateEarningsMarkers(e, t, s, o, n) {
                var i;
                if (i = e,
                Boolean(i.earnings_release_date_fq_h && i.earnings_per_share_forecast_fq_h && i.earnings_fiscal_period_fq_h && i.earnings_per_share_fq_h))
                    for (let i = 0; i < e.earnings_release_date_fq_h.length; i++) {
                        const r = e.earnings_release_date_fq_h[i];
                        if (r > n || r < o)
                            continue;
                        const c = e.earnings_fiscal_period_fq_h[i]
                          , a = e.earnings_per_share_forecast_fq_h[i]
                          , l = e.earnings_per_share_fq_h[i]
                          , h = l >= a;
                        t.push({
                            id: `${s}-E-${c}`,
                            time: r,
                            color: h ? "green" : "red",
                            label: "E",
                            shape: h ? "earningUp" : "earningDown",
                            tooltip: [`Earnings \t${c}`, `Forecast: \t${a}`, `Actual: \t${l}`]
                        })
                    }
            }
            _populateDividendsMarkers(e, t, s, o, n) {
                if (i = e,
                !Boolean(i.dividend_ex_date_recent && i.dividend_amount_recent))
                    return;
                var i;
                const r = e.dividend_ex_date_recent;
                if (r > n || r < o)
                    return;
                const c = e.dividend_amount_recent
                  , a = e.dividend_payout_ratio_ttm
                  , l = ["Dividends", `Ex Date: \t${new Date(1e3 * r).toDateString()}`, `Amount: \t${c.toFixed(2)}`];
                a && l.push(`Payout Ratio (TTM): ${a.toFixed()}%`),
                t.push({
                    id: `${s}-D-${r}`,
                    time: r,
                    color: "blue",
                    label: "D",
                    shape: "circle",
                    tooltip: l
                })
            }
        }
        const pe = JSON.parse('["ACTIVTRADES","ADX","AFTERPRIME","AMEX","ASX","ASX24","ATHEX","BCS","BER","BET","BINANCE","BINANCEUS","BINGX","BIST","BISWAP","BITBNS","BITFINEX","BITFLYER","BITGET","BITHUMB","BITKUB","BITMART","BITMEX","BITPANDAPRO","BITRUE","BITSTAMP","BITTREX","BLACKBULL","BLACKBULLC","BLOFIN","BMFBOVESPA","BNC","BSE","BTSE","BVB","BVC","BX","BYBIT","CAPITALCOM","CAPITALCOMSB","CBOE","CBOEEU","CBOT","CBOT_MINI","CFI","CHIXAU","CITYINDEX","CITYINDEXSB","CME","CME_MINI","COINBASE","COINEX","COMEX","COMEX_MINI","COT","COT2","COT3","COVID19","CRYPTO","CRYPTOCAP","CRYPTOCAP_OLD","CRYPTOHIDDEN","CRYPTOINDEX","CSE","CSECY","CSELK","CURRENCYCOM","CURRENCYCOMLEV","DEFILLAMA","DELTA","DERIBIT","DUS","DYDX","EASYMARKETS","ECONOMICS","EGX","EIGHTCAP","EUREX","EXMO","FINRA","FOREXCOM","FPMARKETS","FRED","FTX","FUSIONMARKETS","FWB","FX","FXOPEN","FX_IDC","GATEIO","GBEBROKERS","GEMINI","GETTEX","GPW","HAM","HAN","HITBTC","HNX","HONEYSWAP","HONEYSWAPPOLYGON","HSI","HTX","IBKR","ICEEUR","ICMARKETS","IDX","INDEX","JFX","JSE","KRAKEN","KRX","KSE","KUCOIN","MATBAROFEX","MERCADO","MEXC","MGEX","MIL","MILSEDEX","MSEI","MTGOX","MULTPL","MUN","NASDAQ","NCDEX","NEO","NEWCONNECT","NGM","NSENG","NYMEX","NYMEX_MINI","NYSE","OANDA","OKCOIN","OKX","OMXBALTIC","OMXCOP","OMXHEX","OMXICE","OMXNORDIC","OMXRSE","OMXSTO","OMXTSE","OMXVSE","OSE","OSMOSIS","OTC","PANCAKESWAP","PANGOLIN","PEPPERSTONE","PEPPERSTONESB","PHEMEX","PHILLIPNOVA","PIONEX","POLONIEX","PSECZ","PYTH","QSE","QUICKSWAP","SAXO","SIX","SKILLING","SPARKS","SPOOKYSWAP","SPREADEX","SPREADEXSB","SSE","SUSHISWAP","SUSHISWAPPOLYGON","SWB","SZSE","TASE","TIMEX","TOCOM","TPEX","TRADEGATE","TRADERJOE","TRADESTATION","TSX","TSXV","TURQUOISE","TVC","UNISWAP","UNISWAP3ARBITRUM","UNISWAP3ETH","UNISWAP3OPTIMISM","UNISWAP3POLYGON","UPBIT","UPCOM","US","USI","VANTAGE","VELOCITY","VERSEETH","VIE","VOLMEX","WAGYUSWAP","WHITEBIT","WHSELFINVEST","WOONETWORK","XETR","XEXCHANGE","ZOOMEX"]')
          , Se = new Set(pe);
        class Ce {
            constructor(e) {
                this._exchangeAllowDeny = new Map(Object.entries(null != e ? e : {}))
            }
            isExchangeAllowed(e) {
                const t = this._exchangeAllowDeny.has("*") && !1 === this._exchangeAllowDeny.get("*")
                  , s = this._exchangeAllowDeny.has(e) && !1 === this._exchangeAllowDeny.get(e)
                  , o = this._exchangeAllowDeny.has(e) && !0 === this._exchangeAllowDeny.get(e)
                  , n = Se.has(e);
                return !s && (o || n && !t)
            }
        }
        const Ie = A("LibraryTVDatafeed.TradingViewDatafeed");
        function ve() {
            if (document.location.ancestorOrigins && document.location.ancestorOrigins.length)
                return document.location.ancestorOrigins[document.location.ancestorOrigins.length - 1];
            try {
                return new URL(document.referrer).origin
            } catch (e) {
                return document.location.origin
            }
        }
        const Ee = new RegExp("^http(s)?://");
        class we extends class {
            constructor(e, t, s, o, n, i, r, c) {
                var a;
                this._isConnected = !1,
                this._wsBackendConnection = e,
                this._historyProvider = t,
                this._resolveProvider = s,
                this._dataPulseProvider = o,
                this._quotesProvider = n,
                this._marksProvider = i,
                this._token = (a = null == c ? void 0 : c.token) ? `widget_user_token-${a}Â£-!${ve()}` : void 0,
                this._exchangeAllowDeny = r,
                this._bindSocketEvents()
            }
            onReady(e) {
                this._onReadyCallback = e,
                this._isConnected && setTimeout((()=>{
                    this._callOnReadyCallback()
                }
                ), 0),
                this._wsBackendConnection.isConnected() || this._wsBackendConnection.isConnecting() || (this._wsBackendConnection.onReconnect(this._bindSocketEvents.bind(this)),
                this._wsBackendConnection.connect())
            }
            async searchSymbols(e, t, s, o) {
                const n = new URL("https://symbol-search.tradingview.com/local_search/");
                n.searchParams.set("text", e),
                n.searchParams.set("exchange", t),
                n.searchParams.set("type", s),
                n.searchParams.set("tradable", "1");
                try {
                    const e = await fe(n.toString());
                    if (!e.ok)
                        throw new Error(`${e.status}: ${e.statusText}`);
                    o((await e.json()).filter((e=>this._exchangeAllowDeny.isExchangeAllowed(e.exchange))).map((e=>{
                        var t;
                        const s = x(e)
                          , o = `${e.prefix || e.exchange}:${e.symbol}`;
                        return {
                            ...s,
                            ...e,
                            full_name: o,
                            ticker: null !== (t = e.ticker) && void 0 !== t ? t : o
                        }
                    }
                    )))
                } catch (e) {
                    "string" == typeof e && Ie.logError(e),
                    e instanceof Error && Ie.logError(e.message),
                    o([])
                }
            }
            resolveSymbol(e, t, s, o) {
                this._resolveProvider.resolveSymbol(e, o).then((e=>t(e))).catch((e=>{
                    e instanceof Error ? s(e.message) : s("string" != typeof e ? "An unknown error has occurred while trying to resolve the symbol." : e)
                }
                ))
            }
            getBars(e, t, s, o, n) {
                this._historyProvider.getBars(e, t, s).then((e=>o(e.bars, e.meta))).catch((e=>{
                    e instanceof Error ? n(`An error has occurred within the datafeed. Error reported: ${e.message}`) : n("An unknown error has occurred with the datafeed.")
                }
                ))
            }
            subscribeBars(e, t, s, o, n) {
                this._dataPulseProvider.subscribeBars(e, t, s, o)
            }
            unsubscribeBars(e) {
                this._dataPulseProvider.unsubscribeBars(e)
            }
            getQuotes(e, t, s) {
                this._quotesProvider.getQuotes(e, t, s)
            }
            subscribeQuotes(e, t, s, o) {
                this._quotesProvider.subscribeQuotes(e, t, s, o)
            }
            unsubscribeQuotes(e) {
                this._quotesProvider.unsubscribeQuotes(e)
            }
            async getTimescaleMarks(e, t, s, o, n) {
                o(await this._marksProvider.getTimescaleMarks(e, t, s, n))
            }
            _bindSocketEvents() {
                this._wsBackendConnection.on("connect", (()=>{
                    this._onConnect()
                }
                )),
                this._wsBackendConnection.on("disconnect", (()=>{
                    Ie.logError("disconnect")
                }
                ))
            }
            _onConnect() {
                this._isConnected ? Ie.logError("_onConnected called again") : (this._wsBackendConnection.send(JSON.stringify({
                    m: "set_auth_token",
                    p: [this._token || "widget_user_token"]
                })),
                this._isConnected = !0,
                this._onReadyCallback && this._callOnReadyCallback())
            }
            _callOnReadyCallback() {
                this._onReadyCallback && this._onReadyCallback(j)
            }
        }
        {
            constructor(e) {
                var t;
                window.WEBSOCKET_PARAMS_ANALYTICS = {
                    ws_page_uri: window.location.href.replace(Ee, "")
                };
                const s = ve().replace(Ee, "");
                s && (window.WEBSOCKET_PARAMS_ANALYTICS.ws_ancestor_origin = s);
                const o = new Ce(null == e ? void 0 : e.exchangeAllowDeny)
                  , n = new l(null !== (t = null == e ? void 0 : e.websocketUrl) && void 0 !== t ? t : "widgetdata.tradingview.com")
                  , i = new me(n)
                  , r = new de(n,i,o)
                  , c = new ye((e=>i.getQuoteData(e)));
                super(n, r, r, r, i, c, o, e)
            }
        }
    }
    )(),
    o
}
)()));
