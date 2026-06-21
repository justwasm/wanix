//go:build js && wasm

package jsutil

import (
	"io"
	"syscall/js"
)

// SABPortJS is the JavaScript source for the SABPort class.
// SABPort wraps a SharedArrayBuffer to provide read(buf)/write(buf)/close() for the Go WASM side.
// Uses Atomics.waitAsync (non-blocking on main thread) and Atomics.store/notify for signaling.
const SABPortJS = `
class SABPort {
	constructor(sab) {
		this._sab = sab;
		this._closed = false;

		this._w2h_ctrl = new Int32Array(sab, 0, 1);
		this._w2h_len = new Int32Array(sab, 4, 1);
		this._w2h_data = new Uint8Array(sab, 8, 65528);
		this._h2w_ctrl = new Int32Array(sab, 65536, 1);
		this._h2w_len = new Int32Array(sab, 65540, 1);
		this._h2w_data = new Uint8Array(sab, 65544, 65528);

		this._readQueue = [];
		this._pendingData = [];
		this._startMonitor();
	}

	_startMonitor() {
		const ctrl = this._w2h_ctrl;
		const len = this._w2h_len;
		const data = this._w2h_data;
		const self = this;
		const loop = () => {
			const r = Atomics.waitAsync(ctrl, 0, 0);
			(r.async ? r.value : Promise.resolve()).then(() => {
				if (self._closed) return;
				const n = Atomics.load(len);
				if (n === 0) { loop(); return; }
				const buf = new Uint8Array(n);
				buf.set(data.subarray(0, n));
				Atomics.store(ctrl, 0, 0);
				Atomics.notify(ctrl, 0);
				self._pendingData.push(buf);
				self._drainReadQueue();
				loop();
			});
		};
		loop();
	}

	_drainReadQueue() {
		while (this._readQueue.length > 0 && this._pendingData.length > 0) {
			const { buf, resolve } = this._readQueue.shift();
			const data = this._pendingData.shift();
			const n = Math.min(data.length, buf.length);
			buf.set(data.subarray(0, n));
			resolve(n);
		}
	}

	async _waitH2WIdle() {
		const ctrl = this._h2w_ctrl;
		while (Atomics.load(ctrl) === 1) {
			const r = Atomics.waitAsync(ctrl, 0, 1);
			if (r.async) await r.value;
		}
	}

	async write(buf) {
		if (this._closed) return 0;
		await this._waitH2WIdle();
		this._h2w_data.set(buf);
		Atomics.store(this._h2w_len, 0, buf.length);
		Atomics.store(this._h2w_ctrl, 0, 1);
		Atomics.notify(this._h2w_ctrl, 0);
		return buf.length;
	}

	async read(buf) {
		if (this._closed) return null;
		if (this._pendingData.length > 0) {
			const data = this._pendingData.shift();
			const n = Math.min(data.length, buf.length);
			buf.set(data.subarray(0, n));
			return n;
		}
		return new Promise((resolve) => {
			this._readQueue.push({ buf, resolve });
		});
	}

	close() {
		this._closed = true;
		Atomics.store(this._w2h_ctrl, 0, 2);
		Atomics.store(this._h2w_ctrl, 0, 2);
		Atomics.notify(this._w2h_ctrl, 0);
		Atomics.notify(this._h2w_ctrl, 0);
	}
}
`

var sabPortCtor js.Value

// CreateSABPort creates a SharedArrayBuffer and a SABPort JS instance.
// Returns the SAB (for transfer to a Worker), an io.ReadCloser, and an io.WriteCloser.
func CreateSABPort(bufSize int) (sab js.Value, rd io.ReadCloser, wr io.WriteCloser, err error) {
	if bufSize <= 0 {
		bufSize = 131072 // 128KB default
	}

	// Evaluate SABPort class once and hold the constructor reference.
	// We use eval returning the class (by appending "\nSABPort") instead of
	// looking it up from global scope, which may not work in all contexts.
	if sabPortCtor.IsUndefined() {
		sabPortCtor = js.Global().Call("eval", SABPortJS+"\nSABPort")
	}

	// Create SharedArrayBuffer
	sab = js.Global().Get("SharedArrayBuffer").New(bufSize)

	// Create SABPort instance
	port := sabPortCtor.New(sab)

	rd = &SABReadCloser{port: port, rbuf: js.Global().Get("Uint8Array").New(65528)}
	wr = &SABWriteCloser{port: port, wbuf: js.Global().Get("Uint8Array").New(65528)}

	return sab, rd, wr, nil
}

type SABReadCloser struct {
	port js.Value
	rbuf js.Value
}

func (r *SABReadCloser) Read(p []byte) (n int, err error) {
	var buf js.Value
	if r.rbuf.IsUndefined() || r.rbuf.Length() < len(p) {
		buf = js.Global().Get("Uint8Array").New(len(p))
	} else {
		buf = r.rbuf.Call("subarray", 0, len(p))
	}
	nn, e := AwaitErr(r.port.Call("read", buf))
	if e != nil {
		return 0, e
	}
	if nn.IsNull() {
		return 0, io.EOF
	}
	n = nn.Int()
	if n > 0 {
		js.CopyBytesToGo(p[:n], buf)
	}
	return n, nil
}

func (r *SABReadCloser) Close() error {
	r.port.Call("close")
	return nil
}

type SABWriteCloser struct {
	port js.Value
	wbuf js.Value
}

func (w *SABWriteCloser) Write(p []byte) (n int, err error) {
	var buf js.Value
	if w.wbuf.IsUndefined() || w.wbuf.Length() < len(p) {
		buf = js.Global().Get("Uint8Array").New(len(p))
	} else {
		buf = w.wbuf.Call("subarray", 0, len(p))
	}
	js.CopyBytesToJS(buf, p)
	nn, e := AwaitErr(w.port.Call("write", buf))
	if e != nil {
		return 0, e
	}
	n = nn.Int()
	return n, nil
}

func (w *SABWriteCloser) Close() error {
	w.port.Call("close")
	return nil
}
