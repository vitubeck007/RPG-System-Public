const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const inflate = promisify(require('node:zlib').inflate);
const HASH_PNG = /^[a-f0-9]{64}\.png$/i;
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
async function validarPng(dados, { foto = false } = {}) {
  if (!Buffer.isBuffer(dados) || dados.length > (foto ? 8 : 2) * 1024 * 1024 || !dados.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return false;
  let largura = 0, altura = 0;
  let pos = 8, canais = 0, fim = false, idatFechado = false, paleta = false; const partes = [];
  while (pos + 12 <= dados.length) {
    const tamanho = dados.readUInt32BE(pos), tipo = dados.toString('ascii', pos + 4, pos + 8), inicio = pos + 8, final = inicio + tamanho;
    if (final + 4 > dados.length || crc32(dados.subarray(pos + 4, final)) !== dados.readUInt32BE(final)) return false;
    if (pos === 8) {
      if (tipo !== 'IHDR' || tamanho !== 13) return false;
      largura = dados.readUInt32BE(inicio); altura = dados.readUInt32BE(inicio + 4);
      if ((foto ? (largura < 1 || altura < 1 || largura > 1024 || altura > 1024) : (largura !== 256 || altura !== 256)) || dados[inicio + 8] !== 8 || ![2,6].includes(dados[inicio + 9]) || dados[inicio + 10] || dados[inicio + 11] || dados[inicio + 12]) return false;
      canais = dados[inicio + 9] === 6 ? 4 : 3;
    } else if (tipo === 'IHDR') return false;
    if (!/^[A-Za-z]{4}$/.test(tipo)) return false;
    if (tipo === 'PLTE') { if (paleta || partes.length || !tamanho || tamanho > 768 || tamanho % 3) return false; paleta = true; }
    if (tipo === 'IDAT') { if (idatFechado) return false; partes.push(dados.subarray(inicio, final)); }
    else if (partes.length) idatFechado = true;
    if (tipo === 'IEND') { if (tamanho || !partes.length) return false; fim = true; pos = final + 4; break; }
    if (!['IHDR','IDAT','IEND','PLTE'].includes(tipo) && tipo[0] === tipo[0]?.toUpperCase()) return false;
    pos = final + 4;
  }
  if (!fim || pos !== dados.length) return false;
  try {
    const linha = 1 + largura * canais, pixels = await inflate(Buffer.concat(partes), { maxOutputLength: linha * altura });
    return pixels.length === linha * altura && Array.from({length:altura}, (_, i) => pixels[i * linha]).every(f => f <= 4);
  } catch { return false; }
}
async function limparImagens(raiz, { aplicar = false, agora = Date.now(), prazoMs = 7 * 86400000 } = {}) {
  const pasta = path.resolve(raiz, 'imagens', 'itens'), referencias = new Set();
  async function lerDados(dir) {
    let entradas;
    try { entradas = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    for (const entrada of entradas) {
      if (entrada.isSymbolicLink()) throw Error('Limpeza suspensa: existe link na pasta de dados.');
      const arquivo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) await lerDados(arquivo);
      else if (entrada.name.endsWith('.json')) {
        const texto = JSON.stringify(JSON.parse((await fs.promises.readFile(arquivo, 'utf8')).replace(/^\uFEFF/, '')));
        for (const nome of texto.match(/[a-f0-9]{64}\.png/gi) || []) referencias.add(nome.toLowerCase());
      }
    }
  }
  // Backups e entregas estão dentro destas árvores e também preservam suas imagens.
  for (const nome of ['players','campanha','catalogo','Figurante']) await lerDados(path.join(raiz, nome));
  let entradas;
  try { entradas = await fs.promises.readdir(pasta, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  if ((await fs.promises.lstat(pasta)).isSymbolicLink() || path.resolve(await fs.promises.realpath(pasta)).toLowerCase() !== pasta.toLowerCase()) throw Error('Pasta de imagens inválida.');
  const candidatos = [];
  for (const entrada of entradas) {
    if (!entrada.isFile() || !HASH_PNG.test(entrada.name) || referencias.has(entrada.name.toLowerCase())) continue;
    const arquivo = path.resolve(pasta, entrada.name);
    if (path.dirname(arquivo) !== pasta) throw Error('Caminho de imagem inválido.');
    const stat = await fs.promises.lstat(arquivo);
    if (!stat.isFile() || agora - stat.mtimeMs < prazoMs) continue;
    candidatos.push(entrada.name);
    if (aplicar) await fs.promises.unlink(arquivo);
  }
  return candidatos;
}
module.exports = { validarPng, limparImagens, crc32 };
if (require.main === module) limparImagens(path.resolve(__dirname, ".."), { aplicar: process.argv.includes('--aplicar') }).then(lista => console.log(`${lista.length} imagem(ns) ${process.argv.includes('--aplicar') ? 'removida(s)' : 'sem uso (simulação)'}.`)).catch(e => { console.error(e.message); process.exitCode = 1; });
