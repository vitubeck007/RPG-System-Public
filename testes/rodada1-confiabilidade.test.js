const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { criarCampanha, normalizarItemDeLoot } = require('../servidor/campanha');
const { criarEntregas } = require('../servidor/entregas');
const mudo = { log() {}, warn() {}, error() {} };
const fonte = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

function ambiente(t) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-rodada1-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(raiz)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(raiz).startsWith('rpg-rodada1-'));
    fs.rmSync(raiz, { recursive: true, force: true });
  });
  const players = path.join(raiz, 'players');
  const personagem = path.join(players, 'ana', 'Heroi_1234');
  fs.mkdirSync(personagem, { recursive: true });
  let tempo = Date.UTC(2026, 0, 1);
  const abrir = () => criarCampanha(path.join(raiz, 'campanha'), { log: mudo, agora: () => new Date(tempo += 1000) }).iniciar();
  const entregas = criarEntregas({ pastaDoPersonagem: (p, n) => path.join(players, p, n), log: mudo });
  const recuperar = campanha => {
    const contexto = { campanha, entregas, personagemModelo: require('../servidor/personagem'), reservas: new Map(), fs, path, PLAYERS_PATH: players,
      nomePastaValido: () => true, nomeDoPersonagem: () => 'Herói', abaDoPersonagem: () => null,
      RESERVA_EXPIRA_MS: 0, SALA_BAUS: 'baus', SALA_MESTRES: 'mestres', console: mudo,
      io: { to() { return this; }, emit() {} },
      setInterval(fn) { contexto.conferir = fn; return { unref() {} }; } };
    vm.createContext(contexto);
    const inicioRecibo = fonte.indexOf('function entregaEstaNoArquivo(');
    vm.runInContext(fonte.slice(inicioRecibo, fonte.indexOf('// Fecha uma reserva', inicioRecibo)), contexto);
    const inicio = fonte.indexOf('async function finalizarReserva(');
    vm.runInContext(fonte.slice(inicio, fonte.indexOf('/* ---------------- Ajuste de vida', inicio)), contexto);
    return contexto;
  };
  return { raiz, personagem, abrir, entregas, recuperar };
}

async function reservar(c, id = 'ent_teste') {
  const bau = await c.salvarItem('baus', { nome: 'Baú', liberado: true,
    itens: [{ id: 'linha', item: { id: 'moeda', name: 'Moeda' }, quantidade: 2 }] });
  await c.reservarDoBau(bau.id, 'linha', 1, { entregaId: id, player: 'ana', nomePasta: 'Heroi_1234', nomePersonagem: 'Herói', desde: 0 });
  return bau;
}

test('restaura o backup mais antigo mesmo com a rotação cheia', async t => {
  const { abrir } = ambiente(t), c = abrir();
  for (let i = 0; i < 7; i++) {
    await c.salvarItem('npcs', { id: 'npc_teste', nome: `Versão ${i}` });
    c.backup('manual');
  }
  const escolhido = c.listarBackups().at(-1);
  await c.salvarItem('npcs', { id: 'npc_teste', nome: 'Atual' });
  await c.restaurar(escolhido);
  assert.equal(c.ver('npcs')[0].nome, 'Versão 0');
});

test('item grande demais recusa o baú inteiro e preserva disco e cache', async t => {
  const { abrir, raiz } = ambiente(t), c = abrir();
  const bau = await c.salvarItem('baus', { nome: 'Original', itens: [] });
  const arquivo = path.join(raiz, 'campanha', 'baus.json'), antes = fs.readFileSync(arquivo, 'utf8');
  const item = normalizarItemDeLoot({ name: 'Grande', desc: 'a'.repeat(2000), imagem: 'https://exemplo.invalid/' + 'a'.repeat(1900), formato: Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]) });
  assert.ok(item);
  await assert.rejects(c.salvarItem('baus', { ...bau, nome: 'Alterado', itens: [{ item, quantidade: 1 }] }), { codigo: 'item_invalido' });
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antes);
  assert.equal(c.ver('baus')[0].nome, 'Original');
});

test('reinício entre a baixa e a criação da entrega devolve exatamente uma vez', async t => {
  const a = ambiente(t), c = a.abrir(), bau = await reservar(c);
  await assert.rejects(c.removerItem('baus', bau.id), { codigo: 'bau_reservado' });
  await assert.rejects(c.salvarItem('baus', { ...bau, itens: [] }), { codigo: 'bau_reservado' });
  const reiniciado = a.abrir(), servidor = a.recuperar(reiniciado);
  assert.equal(servidor.reservas.size, 1);
  await servidor.conferir();
  await servidor.conferir();
  assert.equal(reiniciado.ver('baus')[0].itens[0].quantidade, 2);
  assert.equal(reiniciado.ver('baus')[0].reservas.length, 0);
});

test('falha na devolução conserva a reserva e permite nova tentativa sem duplicar', async t => {
  const a = ambiente(t), c = a.abrir(); await reservar(c);
  const servidor = a.recuperar(c), concluir = c.concluirReserva;
  c.concluirReserva = async () => { throw Error('disco indisponível'); };
  await servidor.finalizarReserva('ent_teste', 'expirou');
  assert.equal(servidor.reservas.size, 1);
  assert.equal(c.ver('baus')[0].reservas.length, 1);
  c.concluirReserva = concluir;
  await Promise.all([servidor.finalizarReserva('ent_teste', 'expirou'), servidor.finalizarReserva('ent_teste', 'expirou')]);
  assert.equal(c.ver('baus')[0].itens[0].quantidade, 2);
  assert.equal(c.ver('baus')[0].historico.length, 1);
});

test('reinício após cancelar a entrega recupera a devolução ainda pendente', async t => {
  const a = ambiente(t), c = a.abrir(), bau = await reservar(c);
  await a.entregas.adicionar('ana', 'Heroi_1234', { entregaId: 'ent_teste', tipo: 'itens', entrada: { catalogId: 'moeda', name: 'Moeda', quantity: 1 }, origem: { bauId: bau.id, linhaId: 'linha', quantidade: 1 } });
  await a.entregas.cancelar('ana', 'Heroi_1234', 'ent_teste', 'sem_espaco');
  const reiniciado = a.abrir(), servidor = a.recuperar(reiniciado);
  await servidor.conferir();
  assert.equal(reiniciado.ver('baus')[0].itens[0].quantidade, 2);
});

test('recibo salvo impede devolução indevida após reiniciar', async t => {
  const a = ambiente(t), c = a.abrir(); await reservar(c);
  fs.writeFileSync(path.join(a.personagem, 'inventario.json'), JSON.stringify({ recebidas: ['ent_teste'] }));
  const reiniciado = a.abrir(), servidor = a.recuperar(reiniciado);
  await servidor.conferir();
  assert.equal(reiniciado.ver('baus')[0].itens[0].quantidade, 1);
  assert.equal(reiniciado.ver('baus')[0].historico[0].resultado, 'pegou');
  assert.equal(reiniciado.ver('baus')[0].reservas.length, 0);
});
