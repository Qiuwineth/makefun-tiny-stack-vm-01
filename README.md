# Tiny Stack VM

[![make.fun bounty](https://make.fun/badge/tiny-stack-vm-01-run-20261122/Qiuwineth/makefun-tiny-stack-vm-01/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

A complete interpreter for make.fun's tiny stack ISA, in one `main.ts` (Node 22,
standard library only). 32-bit wrapping arithmetic with exact signed/unsigned
division and remainder, a 256-deep data stack, 64 return addresses, 256 words of
memory, input/output with the step and output limits, and every trap reported
with its own exit code (2–11) while keeping the output written before it.

Run a set:

```sh
MAKEFUN_INPUT_DIR=<set>/input MAKEFUN_OUTPUT_DIR=<out> node main.ts
```

It answers every instance `<id>` with `<out>/<id>/stdout.bin` and
`<out>/<id>/exit.txt`. Verified byte-for-byte against the kit's practice set
(40/40) and against the reference VM on thousands of generated programs.
