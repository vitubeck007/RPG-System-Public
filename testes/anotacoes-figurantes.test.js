const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

test('anotações: títulos delimitam tópicos, linhas vazias mantêm parágrafos e HTML é texto', () => {
  const dom = new JSDOM('');
  try {
    const documento = dom.window.document;
    const criar = (tag, classe, texto) => {
      const el = documento.createElement(tag); el.className = classe || ''; el.textContent = texto || ''; return el;
    };
    const fonte = fs.readFileSync('mestre/JS/figurantes-cartoes.js', 'utf8');
    const contexto = {criar};
    vm.runInNewContext(fonte.slice(fonte.indexOf('function renderizarAnotacoesFig'), fonte.indexOf('function notasCartaoFig')), contexto);
    const texto = '## Feita do quê?\r\nMedo Líquido.\r\n\r\nSubstância negra.\r\n\r\n## Como pode ser ferida?\r\nCamada rígida.\r\n\r\nO líquido escapa.';
    const corpo = contexto.renderizarAnotacoesFig(texto);
    assert.equal(corpo.querySelectorAll('section').length, 2);
    assert.equal(corpo.querySelectorAll('h4').length, 2);
    assert.equal(corpo.querySelectorAll('p').length, 4);
    assert.equal(corpo.querySelector('h4').textContent, 'Feita do quê?');
    const antigo = contexto.renderizarAnotacoesFig('Primeiro parágrafo.\n\nSegundo parágrafo?');
    assert.equal(antigo.querySelectorAll('h4').length, 0);
    assert.equal(antigo.querySelectorAll('section').length, 1);
    assert.equal(antigo.querySelectorAll('p').length, 2);
    const html = contexto.renderizarAnotacoesFig('## <img src=x onerror=alert(1)>\n<script>alert(1)</script>');
    assert.equal(html.querySelectorAll('img, script').length, 0);
    assert.ok(html.textContent.includes('<script>'));
  } finally {dom.window.close();}
});
