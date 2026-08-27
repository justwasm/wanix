import { WanixElement, parseNsAttribute } from "./base.js";

export class TaskElement extends WanixElement {
    constructor() {
        super();
        this.rid = null;
    }

    get path() {
        if (!this.rid) {
            throw new Error("Task not allocated");
        }
        return [this._taskpath, this.rid].join("/");
    }

    connectedCallback() {
        super.connectedCallback();

        this.style.display = "contents";

        this.alias = this.getAttribute("alias") || this.getAttribute("id") || null;
        this.type = this.getAttribute("type") || "auto";
        this.role = this.getAttribute("role");
        this.cmd = this.getAttribute("cmd");
        this.env = spaceToNewline(this.getAttribute("env"));
        this.stdout = this.getAttribute("stdout");
        this.stderr = this.getAttribute("stderr");
        this.stdin = this.getAttribute("stdin");
        this.ns = parseNsAttribute(this);
        this._term = this.hasAttribute("term");
        this._autostart = this.hasAttribute("start");
        if (this.hasAttribute("wd")) {
            this.wd = this.getAttribute("wd");
        }
    }

    async _awake() {
        await this.allocate();
        if (this._autostart) {
            await this.start();
        }
    }

    async allocate(bindElements = null) {
        if (this.rid) {
            throw new Error("Task already allocated");
        }
        this.rid = (await this._kernel.root.readText([this._taskpath, "new", this.type].join("/"))).trim();
        this.taskRoot = this._kernel.openHandle(this.rid);

        await this._kernel.root.writeFile([this.path, "cmd"].join("/"), this.cmd);
        if (this.env) {
            await this._kernel.root.writeFile([this.path, "env"].join("/"), this.env);
        }
        if (this.wd) {
            await this._kernel.root.writeFile([this.path, "dir"].join("/"), this.wd);
        }
        if (this.alias) {
            await this._kernel.root.writeFile([this.path, "alias"].join("/"), this.alias);
        }

        // otherwise it'll point to task 1 being cloned from root
        await this.taskRoot.bind(this.path, `${this._taskpath}/self`);

        if (this._term) {
            const dimensions = this._terminalDimensions();
            const allocation = dimensions ? ["new", ...dimensions].join("/") : "new";
            const termID = (await this._kernel.root.readText([this._termpath, allocation].join("/"))).trim();
            this.term = [this._termpath, termID].join("/");
            await this._kernel.root.bind(this.term, [this.path, "term"].join("/"));
            if (this.id) {
                await this._kernel.root.bind(this.term, [this._taskpath, this.id, "term"].join("/"));
            }

            await this.taskRoot.bind(this.term, `${this._taskpath}/self/term`);

            const program = [this.term, "program"].join("/");
            await this.taskRoot.bind(program, [this.path, "fd/0"].join("/"));
            await this.taskRoot.bind(program, [this.path, "fd/1"].join("/"));
            await this.taskRoot.bind(program, [this.path, "fd/2"].join("/"));
        } else {
            // Headless tasks get the console by default; explicit stdout /
            // stderr attributes redirect those fds to files (e.g. a log
            // path provisioned by the caller) so output survives the task.
            // The target file is ensured right here, inside allocate, so no
            // output can be produced before the bind is in place.
            await this.taskRoot.bind("#web/console", [this.path, "fd/0"].join("/"));
            for (const [fd, target] of [["1", this.stdout], ["2", this.stderr]]) {
                if (target && target !== "#web/console") {
                    try {
                        await this._ensureFile(target);
                        await this.taskRoot.bind(target, [this.path, "fd/" + fd].join("/"));
                        continue;
                    } catch (err) {
                        console.error("task: cannot bind " + target + " to fd/" + fd + ", falling back to console", err);
                    }
                }
                await this.taskRoot.bind("#web/console", [this.path, "fd/" + fd].join("/"));
            }
        }

        if (!bindElements) {
            bindElements = this._childBinds();
        }
        // Model A: binds configure this task's namespace.
        await this._kernel._setupNamespace(this.rid, this.ns, bindElements);
    }

    async start() {
        await this._kernel.root.writeFile([this._taskpath, this.rid, "ctl"].join("/"), "start");
    }

    // Make sure a bind target file exists (created empty if missing),
    // creating parent directories as needed. Used for stdout/stderr
    // redirection so a missing log file cannot fail the fd bind.
    async _ensureFile(path) {
        const slash = path.lastIndexOf("/");
        if (slash > 0) {
            await this.taskRoot.makeDirAll(path.slice(0, slash));
        }
        try {
            await this.taskRoot.stat(path);
        } catch {
            await this.taskRoot.writeFile(path, "");
        }
    }

    _terminalDimensions() {
        const expectedPath = this.alias ? `${this._taskpath}/${this.alias}/term` : null;
        const candidates = [
            this.querySelector(":scope > wanix-term"),
            this.parentElement?.tagName === "WANIX-TERM" ? this.parentElement : null,
            ...this._kernelHost.querySelectorAll("wanix-term"),
        ];
        const term = candidates.find((candidate) =>
            candidate?.dataset?.cols && (!expectedPath || candidate.path === expectedPath),
        ) || candidates.find((candidate) => candidate?.dataset?.cols);
        if (!term) return null;

        const { cols, rows, xpixel = "0", ypixel = "0" } = term.dataset;
        return cols && rows ? [cols, rows, xpixel, ypixel] : null;
    }

    disconnectedCallback() {
        if (this.rid && this._kernel) {
            this._kernel.root.writeFile([this.path, "ctl"].join("/"), "terminate").catch(() => {});
        }
        super.disconnectedCallback();
    }
}

if (typeof window !== "undefined") {
    customElements.define("wanix-task", TaskElement);
}

function spaceToNewline(input) {
    if (!input) return null;
    const tokens = [];
    let current = "";
    let inQuotes = false;

    for (const char of input) {
        if (char === "'") {
            inQuotes = !inQuotes;
        } else if (char === " " && !inQuotes) {
            if (current) {
                tokens.push(current);
                current = "";
            }
        } else {
            current += char;
        }
    }
    if (current) tokens.push(current);

    return tokens.join("\n");
}
