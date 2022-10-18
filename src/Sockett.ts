import { EventEmitter } from "events";
import WebSocketServer from "ws";

export interface SockettOptions extends WebSocketServer.ClientOptions {
    protocols?: string | string[];
    timeout?: number;
    maxAttempts?: number;
}
interface EventMap {
    open: (ev: Event) => WebSocket;
    message: (ev: MessageEvent) => void;
    reconnect: (ev: ErrorEvent) => void;
    maximum: (ev: CloseEvent) => void;
    close: (ev: CloseEvent) => void;
    error: (ev: ErrorEvent) => void;
}

const CLOSE_CODE = 1e3;
const defaultOptions = {
    timeout: 1e3
};

export class Sockett extends EventEmitter {
    public wss!: WebSocket;
    public num: number;
    public timer: NodeJS.Timeout | number;
    public max: number;
    public opts: Partial<SockettOptions> & typeof defaultOptions;
    public url: string;
    /**
     * 缓存opened之前调用的消息
     */
    public messageCache: (ArrayBufferLike | string)[];
    constructor(url: string, opts: SockettOptions = {}) {
        super();
        this.url = url;
        this.max = opts.maxAttempts === undefined ? Infinity : opts.maxAttempts;
        delete opts.maxAttempts;
        this.opts = Object.assign({}, defaultOptions, opts);
        this.num = 0;
        this.timer = 1;
        this.messageCache = [];
        this.open();
    }
    /**
     * @override
     */
    public emit = <T extends keyof EventMap>(
        event: T,
        ...arg: Parameters<EventMap[T]>
    ) => {
        return super.emit(event, arg);
    };
    /**
     * @override
     */
    public on = <E extends keyof EventMap>(
        event: E,
        listener: (...arg: Parameters<EventMap[E]>) => void
    ) => {
        return super.on(event, listener);
    };
    public open = () => {
        if ('WebSocket' in window) {
            this.wss = new WebSocket(this.url, this.opts.protocols || []);
        } else {
            this.wss = new WebSocketServer(this.url, this.opts.protocols || [], this.opts) as any;
        }
    
        this.wss.onmessage = e => {
            this.emit("message", e);
        };
        this.wss.onopen = e => {
            this.emit("open", e);
            this.num = 0;
            this.messageCache.forEach(msg => {
                this.send(msg);
            });
            this.messageCache = [];
        };

        this.wss.onclose = e => {
            if (e.code === CLOSE_CODE || e.code === 1001 || e.code === 1005) {
                this.reconnect(e);
            }
            this.emit("close", e);
        };

        this.wss.onerror = e => {
            e && e.type === "ECONNREFUSED"
                ? this.reconnect(e)
                : this.emit("error", e as ErrorEvent);
        };
    };

    public reconnect = e => {
        if (this.timer && this.num++ < this.max) {
            this.timer = setTimeout(() => {
                this.emit("reconnect", e);
                this.open();
            }, this.opts.timeout);
        } else {
            this.emit("maximum", e);
        }
    };

    public json = (message: Record<string, any>) => {
        this.send(JSON.stringify(message));
    };

    public send = (message: string | ArrayBufferLike) => {
        // opening
        if (this.wss.readyState === this.wss.CONNECTING && !this.messageCache.includes(message)) {
            this.messageCache.push(message);
            return;
        }
        if (!this.isOpen()) {
            this.emit("error", new ErrorEvent("error", {
                message: "ws is not opening",
            }));
            return;
        }
        this.wss.send(message);
    };

    public close = (code = CLOSE_CODE, reason?: string) => {
        if (!this.isOpen()) {
            return;
        }
        clearTimeout(this.timer);
        this.timer = -1;
        this.wss.close(code, reason);
    };
    public isOpen() {
        return this.wss && this.wss.readyState === (WebSocket || WebSocketServer).OPEN;
    }
}
