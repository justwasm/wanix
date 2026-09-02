import { Terminal } from "@xterm/xterm";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { ImageAddon } from "@xterm/addon-image";
import { ProgressAddon } from "@xterm/addon-progress";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebLinksAddon } from "@xterm/addon-web-links";
import xtermCss from "@xterm/xterm/css/xterm.css";
import { CursorTrailAddon } from "xterm-addon-cursor-trail";
import { WanixElement } from "./base.js";

if (typeof document !== "undefined" && !document.getElementById("wanix-xterm-css")) {
    const style = document.createElement("style");
    style.id = "wanix-xterm-css";
    style.textContent = `${xtermCss}
.wanix-term-progress {
    position: relative;
    flex: none;
    height: 3px;
    background: #21262d;
    overflow: hidden;
}
.wanix-term-progress[hidden] { display: none; }
.wanix-term-progress-fill {
    height: 100%;
    width: 0;
    background: #58a6ff;
    transition: width 160ms ease-out;
}
.wanix-term-progress[data-state="2"] .wanix-term-progress-fill { background: #f85149; }
.wanix-term-progress[data-state="4"] .wanix-term-progress-fill { background: #d29922; }
.wanix-term-progress[data-state="3"] .wanix-term-progress-fill {
    width: 32% !important;
    background: linear-gradient(90deg, transparent, #58a6ff, transparent);
    animation: wanix-term-progress-indeterminate 1.2s ease-in-out infinite;
}
@keyframes wanix-term-progress-indeterminate {
    from { transform: translateX(-120%); }
    to { transform: translateX(320%); }
}`;
    document.head.appendChild(style);
}

export class TerminalElement extends WanixElement {
    #resizeObserver;
    #reader;
    #writer;
    #dataDisposable;
    #progressAddon;
    #progressDisposable;
    #progressBar;
    #progressFill;
    #previousProgressState;
    #progressDoneTimer;

    constructor() {
        super();
        this.rid = null; // not used yet, see path

        this._term = null;
        this._fitAddon = null;
        this.#resizeObserver = null;
        this.#reader = null;
        this.#writer = null;
        this.#dataDisposable = null;
        this.#progressAddon = null;
        this.#progressDisposable = null;
        this.#progressBar = null;
        this.#progressFill = null;
    }

    connectedCallback() {
        super.connectedCallback();

        // this should be optional and cause
        // allocation if no path attribute
        this.path = this.getAttribute('path');

        this.raw = this.hasAttribute('raw');

        this._term = new Terminal({
            allowProposedApi: true,
            termName: "ghostty",
            fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
            // A bare LF (no CR) moves the cursor down without returning to
            // column 0, so streams written straight to the pty master with
            // plain \n would stack every line at the previous line's end.
            // convertEol makes every LF a new line at column 0.
            convertEol: true,
            // theme: {
            //     background: "rgba(0, 0, 0, 0)",
            //     foreground: "white",
            // },
            ...this._getOptionsFromAttributes()
        });

        this._term.loadAddon(new ClipboardAddon());
        this._term.loadAddon(new ImageAddon());
        this._term.loadAddon(new CursorTrailAddon());
        this._term.loadAddon(new Unicode11Addon());
        this._term.unicode.activeVersion = "11";
        this._term.loadAddon(new WebLinksAddon());
        this._fitAddon = new FitAddon();
        this._term.loadAddon(this._fitAddon);
        this.#progressAddon = new ProgressAddon();
        this._term.loadAddon(this.#progressAddon);
        this.#createProgressBar();
        this.#progressDisposable = this.#progressAddon.onChange((progress) => {
            this.#updateProgressBar(progress);
        });
        this._term.open(this);

        // Mobile tap-to-refocus: xterm focuses from a mousedown on its screen
        // element, but touch browsers (notably inside plugin iframes) may not
        // synthesize that mousedown after the terminal has lost focus, so a
        // tap never reopens the keyboard. Track the touch and focus directly
        // on a tap; scrolls are ignored.
        let touchStart = null;
        this.addEventListener("touchstart", (event) => {
            const touch = event.changedTouches[0];
            if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
        }, { passive: true });
        this.addEventListener("touchend", (event) => {
            if (!touchStart) return;
            const touch = event.changedTouches[0];
            const moved = touch
                ? Math.abs(touch.clientX - touchStart.x) + Math.abs(touch.clientY - touchStart.y)
                : 0;
            touchStart = null;
            if (moved < 12) this.focus();
        }, { passive: true });

        this.#resizeObserver = new ResizeObserver(() => {
            this._fitAddon.fit();
            this._storeDimensions();
        });
        this.#resizeObserver.observe(this);
        // this._resizeObserver.observe(this.parentElement);

        this.style.flex = "1";
        this.style.display = "flex";
        this.style.flexDirection = "column";
        this.style.height = "100%";
        this._fitAddon.fit();
        this._storeDimensions();
    }
    

    disconnectedCallback() {
        super.disconnectedCallback();

        this.disconnect();
        if (this.#resizeObserver) {
            this.#resizeObserver.disconnect();
            this.#resizeObserver = null;
        }
        this.#progressDisposable?.dispose();
        this.#progressAddon?.dispose();
        this.#progressDisposable = null;
        this.#progressAddon = null;
        this.#progressBar?.remove();
        this.#progressBar = null;
        this.#updateProgressBar({ state: 0, value: 0 });
        this.#progressFill = null;
        if (this.#progressDoneTimer !== undefined) {
            clearTimeout(this.#progressDoneTimer);
            this.#progressDoneTimer = undefined;
        }
        this.#previousProgressState = undefined;
        if (this._term) {
            this._term.dispose();
            this._term = null;
        }
        this._fitAddon = null;
    }

    #createProgressBar() {
        this.#progressBar = document.createElement("div");
        this.#progressBar.className = "wanix-term-progress";
        this.#progressBar.hidden = true;
        this.#progressBar.setAttribute("role", "progressbar");
        this.#progressBar.setAttribute("aria-label", "Terminal progress");
        this.#progressFill = document.createElement("div");
        this.#progressFill.className = "wanix-term-progress-fill";
        this.#progressBar.appendChild(this.#progressFill);
        this.appendChild(this.#progressBar);
    }

    #updateProgressBar(progress) {
        if (!this.#progressBar || !this.#progressFill) return;
        const state = progress?.state ?? 0;
        const value = Math.max(0, Math.min(100, Number(progress?.value) || 0));
        this.#progressBar.hidden = state === 0;
        this.#progressBar.dataset.state = String(state);
        this.#progressFill.style.width = `${value}%`;
        if (state === 3) this.#progressBar.removeAttribute("aria-valuenow");
        else this.#progressBar.setAttribute("aria-valuenow", String(value));
        // Edge-detect "agent finished its turn": OSC 9;4 state 0 with a
        // prior non-zero state. Skip the initial all-zeros tick (no
        // prior signal) so we don't fire on first render. The
        // `wanix-term-progress-done` event lets the shell play a chime / update
        // task badges without re-parsing the raw output stream.
        if (state !== 0) {
            if (this.#progressDoneTimer !== undefined) {
                clearTimeout(this.#progressDoneTimer);
                this.#progressDoneTimer = undefined;
            }
        } else if (
            this.#previousProgressState &&
            this.#previousProgressState !== 0 &&
            this.#progressDoneTimer === undefined
        ) {
            this.#progressDoneTimer = setTimeout(() => {
                this.#progressDoneTimer = undefined;
                this.dispatchEvent(new CustomEvent("wanix-term-progress-done", {
                    bubbles: true,
                    composed: true,
                    detail: { value },
                }));
            }, 400);
        }
        this.#previousProgressState = state;
    }

    #normalizeTerminalResponse(data) {
        return data.replace("\u001bP>|xterm.js(", "\u001bP>|ghostty(");
    }

    async _awake() {
        await this._resolvePath();
        await this.connect();
        this._publishWinSize();
        this._term.onResize(() => this._publishWinSize());
        this.focus();
    }

    async _resolvePath() {
        if (this.path) return;

        // Parent task/vm with a terminal device.
        const parent = this.parentElement;
        if (parent?.tagName === "WANIX-TASK" || parent?.tagName === "WANIX-VM") {
            await parent._nsReady;
            if (parent.term) {
                this.path = parent.term;
                return;
            }
        }

        // Child task/vm declarations under this term (standalone term host).
        const children = [
            ...this.querySelectorAll(":scope > wanix-task"),
            ...this.querySelectorAll(":scope > wanix-vm"),
        ];
        if (children.length) {
            await Promise.all(children.map((c) => c._nsReady));
            const withTerm = children.find((c) => c.term);
            if (withTerm) {
                this.path = withTerm.term;
                return;
            }
        }

        // for= host: pick a task/vm with a term inside the referenced host.
        const host = this._kernelHost;
        if (host && host !== this) {
            const peers = [
                ...host.querySelectorAll(":scope > wanix-task"),
                ...host.querySelectorAll(":scope > wanix-vm"),
            ];
            await Promise.all(peers.map((c) => c._nsReady));
            const withTerm = peers.find((c) => c.term);
            if (withTerm) {
                this.path = withTerm.term;
            }
        }
    }

    async connect() {
        if (!this._term) return;

        if (!this.path || !this._kernel) return;
        const dataPath = this.path + "/data";

        this.disconnect();

        try {
            await this._kernel.root.waitFor(dataPath, 30000);

            // todo: use this for kvm updates
            this._kernel._updateTerminals?.(this);

            const readable = await this._kernel.root.openReadable(dataPath);
            this.#reader = readable.getReader();
            this._readLoop();

            const writable = await this._kernel.root.openWritable(dataPath);
            this.#writer = writable.getWriter();

            const encoder = new TextEncoder();
            let buffer = '';
            this.#dataDisposable = this._term.onData((data) => {
                if (this.raw) {
                    this.#writer.write(encoder.encode(this.#normalizeTerminalResponse(data)));
                    return;
                }
                // may add line discipline as mode to terminals but for now we
                // do as plan 9 and handle it here in "userspace"
                if (data === '\r') {
                    this._term.write('\r\n');           // echo newline
                    if (this.#writer) {
                        this.#writer.write(encoder.encode(this.#normalizeTerminalResponse(buffer+"\n")));
                    }
                    buffer = '';
                } else if (data === '\x7f') {   // backspace
                    if (buffer.length > 0) {
                      buffer = buffer.slice(0, -1);
                      this._term.write('\b \b');
                    }
                } else {
                    buffer += data;
                    this._term.write(data);             // echo
                }
            });
        } catch (err) {
            console.error("wanix-term: failed to connect terminal:", err);
        }
    }

    async _readLoop() {
        if (!this.#reader || !this._term) return;

        try {
            while (true) {
                const { done, value } = await this.#reader.read();
                if (done) break;
                if (value && this._term) {
                    this._term.write(value);
                }
            }
        } catch (err) {
            console.error("wanix-terminal: read error:", err);
        }
    }

    disconnect() {
        if (this.#dataDisposable) {
            this.#dataDisposable.dispose();
            this.#dataDisposable = null;
        }
        if (this.#reader) {
            this.#reader.cancel().catch(() => {});
            this.#reader = null;
        }
        if (this.#writer) {
            this.#writer.close().catch(() => {});
            this.#writer = null;
        }
    }

    _getOptionsFromAttributes() {
        const options = {};
        
        if (this.hasAttribute("font-size")) {
            options.fontSize = parseInt(this.getAttribute("font-size"), 10);
        }
        if (this.hasAttribute("font-family")) {
            options.fontFamily = this.getAttribute("font-family");
        }
        if (this.hasAttribute("cursor-blink")) {
            options.cursorBlink = this.getAttribute("cursor-blink") !== "false";
        }
        if (this.hasAttribute("cursor-style")) {
            options.cursorStyle = this.getAttribute("cursor-style");
        }
        if (this.hasAttribute("scrollback")) {
            options.scrollback = parseInt(this.getAttribute("scrollback"), 10);
        }
        if (this.hasAttribute("no-scrollbar")) {
            options.scrollbar = { showScrollbar: false };
        }

        return options;
    }

    fit() {
        if (this._fitAddon) {
            this._fitAddon.fit();
            this._storeDimensions();
        }
    }

    _storeDimensions() {
        if (!this._term) return;
        this.dataset.cols = this._term.cols;
        this.dataset.rows = this._term.rows;
        this.dataset.xpixel = this.offsetWidth;
        this.dataset.ypixel = this.offsetHeight;
    }

    async _publishWinSize() {
        if (!this.path || !this._kernel || !this._term) return;
        try {
            const stream = await this._kernel.root.openWritable(`${this.path}/winch`);
            const writer = stream.getWriter();
            await writer.write(new TextEncoder().encode(
                `${this._term.cols} ${this._term.rows} ${this.offsetWidth} ${this.offsetHeight}\n`,
            ));
            await writer.close();
        } catch (err) {
            console.error("wanix-term: winch write failed:", err);
        }
    }

    write(data) {
        if (this._term) {
            this._term.write(data);
        }
    }

    reset() {
        if (this._term) {
            this._term.reset();
        }
    }

    focus() {
        if (this._term) {
            this._term.focus();
        }
    }

    clear() {
        if (this._term) {
            this._term.clear();
        }
    }
}

if (typeof window !== "undefined") {
    customElements.define("wanix-term", TerminalElement);
}
