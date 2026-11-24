// A tiny stack virtual machine for make.fun's tiny-stack-vm-01 ISA (kit: generator/subject/ISA.md):
// 32-bit wrapping values, a 256-deep data stack, 64 return addresses, 256 words of memory,
// and every trap with its own exit code. One run answers a whole set: /input/<id> in,
// /output/<id> out (MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR win when set).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function run(p, inp) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), out = [];
  const n = p.length;
  let sp = 0, cp = 0, pc = 0, steps = 0, ip = 0;
  const done = (code) => ({ out, code });
  for (;;) {
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = p[pc];
    const known = op <= 7 || (op >= 16 && op <= 34 && op !== 31) || (op >= 48 && op <= 52) || (op >= 64 && op <= 65) || (op >= 80 && op <= 83);
    if (!known) return done(5);
    const imm = op === 1 ? 1 : op === 2 ? 4 : op >= 48 && op <= 51 ? 2 : 0;
    if (pc + imm >= n) return done(9);
    steps++;
    let pops = 0, push = 0;
    if (op === 3 || op === 4 || op === 23 || op === 27 || op === 49 || op === 50 || op === 64 || op === 80 || op === 81 || op === 83) pops = 1;
    else if (op === 7) pops = 3;
    else if (op === 5 || op === 6 || op === 65 || (op >= 16 && op <= 34)) pops = 2;
    if (op === 1 || op === 2 || op === 82) push = 1;
    else if (op === 4 || op === 5) push = 2;
    else if (op === 6 || op === 7) push = 3;
    else if (op === 64 || (op >= 16 && op <= 34)) push = 1;
    if (sp < pops) return done(2);
    if (sp - pops + push > 256) return done(3);
    const nx = pc + 1 + imm;
    pc = nx;
    switch (op) {
      case 0: return done(0);
      case 1: D[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2: D[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp - 1]; sp++; break;
      case 5: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 6: D[sp] = D[sp - 2]; sp++; break;
      case 7: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 23: D[sp - 1] = -D[sp - 1] | 0; break;
      case 27: D[sp - 1] = ~D[sp - 1]; break;
      case 48: case 49: case 50: {
        const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 48) { const v = D[--sp]; take = op === 49 ? v === 0 : v !== 0; }
        if (take) pc = nx + rel;
        break;
      }
      case 51:
        if (cp === 64) return done(7);
        C[cp++] = nx;
        pc = p[nx - 2] | (p[nx - 1] << 8);
        break;
      case 52:
        if (cp === 0) return done(8);
        pc = C[--cp];
        break;
      case 64: {
        const a = D[sp - 1];
        if (a < 0 || a > 255) return done(6);
        D[sp - 1] = M[a];
        break;
      }
      case 65: {
        const a = D[sp - 1], v = D[sp - 2];
        if (a < 0 || a > 255) return done(6);
        sp -= 2; M[a] = v;
        break;
      }
      case 80: {
        const s = String(D[sp - 1]);
        if (out.length + s.length > 65536) return done(11);
        sp--;
        for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
        break;
      }
      case 81:
        if (out.length + 1 > 65536) return done(11);
        out.push(D[--sp] & 255);
        break;
      case 82: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 83: return done(D[--sp] & 255);
      default: {
        const b = D[sp - 1], a = D[sp - 2];
        let r;
        if (op === 16) r = (a + b) | 0;
        else if (op === 17) r = (a - b) | 0;
        else if (op === 18) r = Math.imul(a, b);
        else if (op === 19) { if (b === 0) return done(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (op === 20) { if (b === 0) return done(4); r = b === -1 ? 0 : (a % b) | 0; }
        else if (op === 21) { if (b === 0) return done(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (op === 22) { if (b === 0) return done(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
        else if (op === 24) r = a & b;
        else if (op === 25) r = a | b;
        else if (op === 26) r = a ^ b;
        else if (op === 28) r = a << (b & 31);
        else if (op === 29) r = a >> (b & 31);
        else if (op === 30) r = (a >>> (b & 31)) | 0;
        else if (op === 32) r = a === b ? 1 : 0;
        else if (op === 33) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2; D[sp++] = r;
      }
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), Uint8Array.from(r.out));
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
