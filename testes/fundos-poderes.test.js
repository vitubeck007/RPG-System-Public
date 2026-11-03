const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {criarCampanha, entradaParaFicha, normalizarInimigo} = require('../servidor/campanha');
const {NORMALIZADORES} = require('../servidor/personagem');
const {normalizarEstiloFundo, imagemFundoPoder} = require('../JS/regras');
const {abrirPaginaMestre} = require('./ajuda/ambiente');

test('fundos: oito estilos, prévia resiliente e aparência preservada do catálogo até a ficha', async () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-fundos-'));
  let pg;
  try {
    for (let n = 1; n <= 8; n++) assert.equal(imagemFundoPoder(n), `/CSS/imagens/fundos-poderes/estilo-${n}.png`);
    for (const n of [-1, 9, 1.5, '1', '../segredo', null]) assert.equal(normalizarEstiloFundo(n), 0);
    const catalogo = path.join(pasta, 'catalogo');
    const log = {log(){}, warn(){}, error(){}};
    let campanha = criarCampanha(path.join(pasta, 'campanha'), {pastaCatalogo: catalogo, log}).iniciar();
    const poder = await campanha.salvarItem('magias', {nome: 'Fagulha de teste', dice: '1d6', imagem: '/imagens-itens/fagulha.png', estiloFundo: 8});
    campanha = criarCampanha(path.join(pasta, 'campanha'), {pastaCatalogo: catalogo, log}).iniciar();
    assert.equal(campanha.ler('magias')[0].estiloFundo, 8);
    const ficha = NORMALIZADORES.magias({items: [entradaParaFicha(poder)]});
    assert.equal(ficha.items[0].estiloFundo, 8);
    assert.equal(ficha.items[0].imagem, poder.imagem);
    const figurante = normalizarInimigo({nome:'Teste', magias:[poder]});
    assert.equal(figurante.magias[0].estiloFundo, 8);
    assert.equal(figurante.magias[0].imagem, poder.imagem);
    const antigo = normalizarInimigo({nome:'Antigo', magias:[{nome:'Sem arte'}]});
    assert.equal(antigo.magias[0].estiloFundo, undefined);

    pg = await abrirPaginaMestre({dir: process.cwd(), url:'http://localhost'}, 'habilidades-magias');
    await pg.run('abrirEditor(null)');
    const campo = id => pg.document.getElementById(id);
    const select = campo('hm-estilo-fundo');
    assert.equal(select.options.length, 9);
    assert.ok(select.closest('fieldset').textContent.includes('Aparência'));
    assert.equal(campo('hm-imagem-secao').nextElementSibling.id, 'hm-fundo-secao');
    select.value = '8'; select.dispatchEvent(new pg.window.Event('change', {bubbles:true}));
    const imagemAntiga = campo('hm-fundo-previa').querySelector('.rpg-poder-arte-fundo');
    select.value = '2'; select.dispatchEvent(new pg.window.Event('change', {bubbles:true}));
    const fundo = campo('hm-fundo-previa').querySelector('.rpg-poder-arte-fundo');
    imagemAntiga.dispatchEvent(new pg.window.Event('error'));
    assert.match(campo('hm-fundo-previa').textContent, /Carregando estilo 2/);
    fundo.dispatchEvent(new pg.window.Event('error'));
    assert.equal(fundo.hidden, true);
    assert.match(campo('hm-fundo-previa').textContent, /estilo-2.png/);
    campo('hm-imagem').value = '/imagens-itens/fagulha.png';
    campo('hm-imagem').dispatchEvent(new pg.window.Event('input', {bubbles:true}));
    assert.ok(campo('hm-fundo-previa').querySelector('.rpg-poder-arte-imagem'));
    assert.equal(pg.run('lerEditor().estiloFundo'), 2);
    await pg.run('fecharEditor(true)');
    await pg.run(`abrirEditor(${JSON.stringify(poder)})`);
    assert.equal(select.value, '8');
    assert.equal(campo('hm-imagem').value, poder.imagem);
    assert.equal(pg.run('FundosPoderes.criarArte({})'), null);
    assert.deepEqual(pg.erros, []);
  } finally {
    pg?.fechar();
    const prefixo = path.resolve(os.tmpdir()) + path.sep;
    assert.ok(path.resolve(pasta).startsWith(prefixo));
    fs.rmSync(pasta, {recursive:true, force:true});
  }
});
