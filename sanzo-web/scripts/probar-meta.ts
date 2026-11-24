// Prueba de la normalización y el hasheo para Meta: npx tsx scripts/probar-meta.ts
import assert from "node:assert/strict";
import { normalizarCP, normalizarEmail, normalizarLugar, normalizarTelefonoAR, separarNombre, sha256 } from "../lib/meta/normalizar";

const tel: [string, string | undefined][] = [
  ["11 5555-4444", "5491155554444"],
  ["0351 15 555-4444", "5493515554444"],
  ["+54 9 11 5555 4444", "5491155554444"],
  ["54 11 5555 4444", "5491155554444"],
  ["011 15 5555 4444", "5491155554444"],
  ["2944 15 12-3456", "5492944123456"],
  ["0221 15 456 7890", "5492214567890"],
  ["5555-4444", undefined],
];
for (const [entrada, esperado] of tel) assert.equal(normalizarTelefonoAR(entrada), esperado, entrada);

assert.equal(normalizarEmail("  Juan.Perez@Gmail.COM "), "juan.perez@gmail.com");
assert.deepEqual(separarNombre("José María Muñoz"), { fn: "jose", ln: "munoz" });
assert.deepEqual(separarNombre("Renzo"), { fn: "renzo", ln: undefined });
assert.equal(normalizarLugar("Ciudad Autónoma de Buenos Aires"), "ciudadautonomadebuenosaires");
assert.equal(normalizarLugar("San Carlos de Bariloche"), "sancarlosdebariloche");
assert.equal(normalizarCP("C1414ABC"), "1414");
assert.equal(normalizarCP("8400"), "8400");
// SHA-256 de referencia (printf ar | sha256sum)
assert.equal(sha256("ar"), "ab5b62081b1d305e78d0daadb2cd23470b3faeb65af7370627798b7219ea2061");
console.log("OK: teléfonos, mail, nombre, lugar, CP y SHA-256 dan lo esperado");
