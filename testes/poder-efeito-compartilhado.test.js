const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalizarEntradaCatalogo, normalizarInimigo, entradaParaFicha} = require('../servidor/campanha');
const {efeitoDoPoder} = require('../JS/regras');
const {abrirPaginaMestre} = require('./ajuda/ambiente');

test('efeito é compartilhado por catálogo e figurantes sem duplicar legado e pode ser apagado', async () => {
  const normalizar = normalizarEntradaCatalogo('mag');
  const efeito = 'Causa queimadura.\n\nDura dois turnos.';
  const poder = normalizar({nome:'Chama', efeito, desc:'Uma chama azul.', descLonga:'Nota privada'});
  const figurante = normalizarInimigo({nome:'Teste', magias:[poder]});
  assert.equal(figurante.magias[0].efeito, efeito);
  assert.equal(normalizar(figurante.magias[0]).efeito, efeito);
  assert.equal(entradaParaFicha(poder).efeito, efeito);
  assert.equal(efeitoDoPoder({efeitos:['Queima','Atordoa']}), 'Queima\nAtordoa');
  assert.equal(efeitoDoPoder({efeito:'', efeitos:['Legado'], descLonga:'Privado'}), '');
  assert.equal(efeitoDoPoder({descLonga:'Privado'}), '');

  const pg = await abrirPaginaMestre({dir:process.cwd(), url:'http://localhost'}, 'habilidades-magias');
  try {
    await pg.run(`abrirEditor(${JSON.stringify(poder)})`);
    const campo = pg.document.getElementById('hm-efeitos');
    assert.equal(campo.value, efeito);
    assert.equal(campo.closest('fieldset'), pg.document.getElementById('hm-desc').closest('fieldset'));
    assert.equal(pg.run('lerEditor().efeito'), efeito);
    assert.equal(pg.run('criarCartao(lerEditor()).querySelectorAll(".master-power-effect").length'), 1);
    campo.value = '';
    const apagado = normalizar(pg.run('lerEditor()'));
    assert.equal(apagado.efeito, '');
    assert.equal(normalizarInimigo({nome:'Teste', magias:[apagado]}).magias[0].efeito, '');
    assert.deepEqual(pg.erros, []);
  } finally {pg.fechar();}
});
