
<h1 align="center">Sockett</h1>


<div align="center">The cutest little WebSocket wrapper! 🧦</div>

<br />

Sockette is a tiny (367 bytes) wrapper around `WebSocket` that will automatically reconnect if the connection is lost!

In addition to attaching [additional API methods](#api), Sockette allows you to **reuse** instances, avoiding the need to redeclare all event listeners.

You have direct access to the (current) underlying `WebSocket` within every `EventListener` callback (via `event.target`).


## Install

```
$ npm install --save sockett
```


## Usage

Unlike `WebSocket`, you should declare all event listeners on initialization:
```ts
import Sockett from 'sockett';

const ws = new Sockett('ws://localhost:3000', {
  timeout: 5e3,
  maxAttempts: 10,
});

ws.on('open', e => console.log('Connected!', e));
ws.on("message", e => console.log('Received:', e));
ws.on("reconnect", e => console.log('Reconnecting...', e));
ws.on("maximum" , e => console.log('Stop Attempting!', e));
ws.on('close', e => console.log('Closed!', e));
ws.on('error', e => console.log('Error:', e));

ws.send('Hello, world!');
ws.json({type: 'ping'});
ws.close(); // graceful shutdown

// Reconnect 10s later
setTimeout(ws.reconnect, 10e3);
```


## API

### Sockett(url, options)

Returns: `Sockette`

Returns the `Sockette` instance.

#### url
Type: `String`

The URL you want to connect to &mdash; Should be prefixed with `ws://` or `wss://`. This is passed directly to `WebSocket`.

#### options.protocols
Type: `String|Array`

Either a single protocol string or an array of strings used to indicate sub-protocols. See the [`WebSocket` docs][MDN] for more info.

#### options.timeout
Type: `Number`<br>
Default: `1000`

The amount of time (in `ms`) to wait in between reconnection attempts. Defaults to 1 second.

#### options.maxAttempts
Type: `Number`<br>
Default: `Infinity`

The maximum number of attempts to reconnect.

> This is called when the connection has been closed for any reason.

> **Important:** If the `event.code` is _not_ `1000`, `1001`, or `1005` an automatic reconnect attempt will be queued.

> **Important:** If the `event.code` is `ECONNREFUSED`, an automatic reconnect attempt will be queued.

### send(data)

Identical to [`WebSocket.send()`][send], capable of sending multiple data types.

### close(code, reason)

Identical to [`WebSocket.close()`][close].

> **Note:** The `code` will default to `1000` unless specified.

### json(obj)

Convenience method that passes your `obj` (Object) through `JSON.stringify` before passing it to [`WebSocket.send()`][send].

### reconnect()

If [`options.maxAttempts`](#optionsmaxattempts) has not been exceeded, enqueues a reconnection attempt. Otherwise, it runs your [`options.onmaximum`](#optionsonmaximum) callback.

### open()

Initializes a new `WebSocket` &mdash; used on initialization and by [`reconnect()`](#reconnect).


## License

MIT © [Luke Edwards](https://lukeed.com)

[MDN]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[close]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close
[send]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
