const { test } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarServidor } = require('./ajuda/ambiente');

test('imagem enquadrada é salva e disponibilizada pelo servidor', async () => {
  const servidor = await iniciarServidor();
  try {
    const { deflateSync } = require('node:zlib');
    const { crc32 } = require('../servidor/imagens');
    const bloco = (tipo, dados) => { const b = Buffer.alloc(dados.length + 12); b.writeUInt32BE(dados.length); b.write(tipo,4); dados.copy(b,8); b.writeUInt32BE(crc32(b.subarray(4,-4)), b.length-4); return b; };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(256); ihdr.writeUInt32BE(256,4); ihdr[8]=8; ihdr[9]=6;
    const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),bloco('IHDR',ihdr),bloco('IDAT',deflateSync(Buffer.alloc(256*1025))),bloco('IEND',Buffer.alloc(0))]);
    const enviar = dados => fetch(`${servidor.url}/mestre/imagens-itens`, {
      method: 'POST', headers: { 'Content-Type': 'image/png' }, body: dados,
    });
    assert.equal((await enviar(Buffer.from('inválido'))).status, 400);
    const resposta = await enviar(png);
    assert.equal(resposta.status, 200);
    const { imagem } = await resposta.json();
    assert.match(imagem, /^\/imagens-itens\/[a-f0-9]{64}\.png$/);
    const recuperada = await fetch(servidor.url + imagem);
    assert.equal(recuperada.status, 200);
    assert.deepEqual(Buffer.from(await recuperada.arrayBuffer()), png);
  } finally {
    await servidor.parar();
  }
});
