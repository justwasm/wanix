// SharedBufferConn implements the same read/write/close interface as duplex.PortConn
// but uses SharedArrayBuffer + Atomics instead of MessagePort postMessage/onmessage.
//
// SAB layout (128KB):
//   [0-3]    w2h_ctrl  (Int32)  - worker→host: 0=idle, 1=data ready, 2=closed
//   [4-7]    w2h_len   (Int32)  - length of data in w2h_data
//   [8-65535] w2h_data (Uint8Array) - data buffer for worker→host
//
//   [65536-65539] h2w_ctrl  (Int32)  - host→worker: 0=idle, 1=data ready, 2=closed
//   [65540-65543] h2w_len   (Int32)  - length of data in h2w_data
//   [65544-131071] h2w_data (Uint8Array) - data buffer for host→worker

const SAB_SIZE = 131072; // 128KB
const H2W_OFFSET = 65536;

export class SharedBufferConn {
	constructor(sab) {
		this.sab = sab;
		this.isClosed = false;

		// Worker→Host direction (worker writes, host reads)
		this.w2h_ctrl = new Int32Array(sab, 0, 1);
		this.w2h_len = new Int32Array(sab, 4, 1);
		this.w2h_data = new Uint8Array(sab, 8, SAB_SIZE - 8);

		// Host→Worker direction (host writes, worker reads)
		this.h2w_ctrl = new Int32Array(sab, H2W_OFFSET, 1);
		this.h2w_len = new Int32Array(sab, H2W_OFFSET + 4, 1);
		this.h2w_data = new Uint8Array(sab, H2W_OFFSET + 8, SAB_SIZE - H2W_OFFSET - 8);

		this.maxData = this.h2w_data.length - 16; // margin for variance
	}

	async write(p) {
		if (this.isClosed) return 0;
		const len = Math.min(p.length, this.maxData);

		// Wait until w2h channel is idle (host has consumed previous write)
		Atomics.wait(this.w2h_ctrl, 0, 1);

		// Write data
		this.w2h_data.set(p.subarray(0, len));
		Atomics.store(this.w2h_len, 0, len);

		// Signal host
		Atomics.store(this.w2h_ctrl, 0, 1);
		Atomics.notify(this.w2h_ctrl, 0);

		return len;
	}

	async read(p) {
		if (this.isClosed) return null;

		// Wait for host to write data
		Atomics.wait(this.h2w_ctrl, 0, 0);

		if (Atomics.load(this.h2w_ctrl) === 2) {
			this.isClosed = true;
			return null;
		}

		// Read data
		const n = Math.min(Atomics.load(this.h2w_len), p.length);
		p.set(this.h2w_data.subarray(0, n));

		// Acknowledge (signal host that we've consumed the data)
		Atomics.store(this.h2w_ctrl, 0, 0);
		Atomics.notify(this.h2w_ctrl, 0);

		return n;
	}

	close() {
		if (this.isClosed) return;
		this.isClosed = true;
		Atomics.store(this.w2h_ctrl, 0, 2);
		Atomics.store(this.h2w_ctrl, 0, 2);
		Atomics.notify(this.w2h_ctrl, 0);
		Atomics.notify(this.h2w_ctrl, 0);
	}
}
