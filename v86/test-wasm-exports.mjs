import { readFile } from "node:fs/promises";

const [wasmPath] = process.argv.slice(2);
if (!wasmPath) throw new Error("usage: node test-wasm-exports.mjs V86.wasm");

const required = [
  "memory",
  "reset_cpu",
  "getiopl",
  "get_eflags",
  "handle_irqs",
  "main_loop",
  "set_jit_config",
  "read8",
  "read16",
  "read32s",
  "write8",
  "write16",
  "write32",
  "in_mapped_range",
  "device_raise_irq",
  "device_lower_irq",
  "apic_timer",
  "get_apic_addr",
  "get_ioapic_addr",
];

const wasm = await readFile(wasmPath);
const exports = new Set(
  WebAssembly.Module.exports(new WebAssembly.Module(wasm)).map(({ name }) => name),
);
const missing = required.filter((name) => !exports.has(name));
if (missing.length) {
  throw new Error(`v86.wasm is missing required exports: ${missing.join(", ")}`);
}

console.log(`v86 Wasm ABI: PASS (${required.length} required exports)`);
