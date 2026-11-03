/* Roda TODOS os testes (testes/*.test.js) em qualquer sistema com uma versão compatível do Node (o npm no Windows não expande
   "*.test.js", e o Node mais novo não aceita pasta no lugar de arquivos). Uso: npm test */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const arquivos = fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js")).sort().map((f) => path.join(__dirname, f));
// Cada arquivo pode abrir servidores e páginas: não disputar CPU, memória e portas entre arquivos.
const args = ["--test", "--test-concurrency=1"];
// A versão mínima declarada já suporta este argumento (ele não é uma opção de NODE_OPTIONS).
args.push("--test-timeout=60000");
const r = spawnSync(process.execPath, [...args, ...arquivos], { stdio: "inherit" });
process.exit(r.status ?? 1);
