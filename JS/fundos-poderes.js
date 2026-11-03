/* Arte de poderes compartilhada pelo catálogo, figurantes e ficha do jogador. */
window.FundosPoderes = (() => {
  function criarArte(poder, { previa = false, avisar = () => {} } = {}) {
    const fundo = imagemFundoPoder(poder.estiloFundo);
    const imagem = urlDeImagem(poder.imagem);
    if (!previa && !fundo && !imagem) return null;
    const area = document.createElement('div');
    area.className = 'rpg-poder-arte';
    area.setAttribute('role', 'img');
    area.setAttribute('aria-label', `Arte de ${poder.nome || poder.name || 'poder'}${fundo ? `, estilo ${poder.estiloFundo}` : ''}`);
    if (!fundo && !imagem) {
      const vazio = document.createElement('span'); vazio.className = 'rpg-poder-arte-vazia';
      vazio.textContent = 'Prévia da imagem e do fundo'; area.append(vazio);
    }
    const adicionar = (url, classe, falha, carregou) => {
      const img = document.createElement('img'); img.className = classe;
      img.alt = ''; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { img.hidden = true; if (previa) avisar(falha); });
      if (carregou) img.addEventListener('load', carregou);
      img.src = url; area.append(img);
    };
    if (fundo) adicionar(fundo, 'rpg-poder-arte-fundo', `Fundo não encontrado. Coloque estilo-${poder.estiloFundo}.png em CSS/imagens/fundos-poderes.`, () => {
      if (previa) avisar(`Estilo ${poder.estiloFundo} carregado.`);
    });
    if (imagem) adicionar(imagem, 'rpg-poder-arte-imagem', 'Não foi possível carregar a imagem do poder.');
    return area;
  }

  function atualizarEditor(select) {
    if (!select) return;
    const previa = document.getElementById(select.dataset.previaPoder);
    const campoImagem = document.getElementById(select.dataset.imagemPoder);
    const aviso = document.createElement('p'); aviso.className = 'rpg-fundo-poder-aviso'; aviso.setAttribute('role', 'status');
    const estilo = normalizarEstiloFundo(Number(select.value));
    aviso.textContent = estilo ? `Carregando estilo ${estilo}…` : 'Sem fundo. A imagem mantém a transparência.';
    const arte = criarArte({estiloFundo: estilo, imagem: campoImagem?.value}, {
      previa: true,
      // Ignora respostas de uma prévia substituída por outra seleção.
      avisar: texto => { if (previa.contains(arte)) aviso.textContent = texto; },
    });
    previa.replaceChildren(arte, aviso);
  }

  function montarEditor(select) {
    select.replaceChildren(new Option('Sem fundo', '0'));
    for (let i = 1; i <= 8; i++) select.add(new Option(`Estilo ${i}`, String(i)));
    select.addEventListener('change', () => atualizarEditor(select));
    document.getElementById(select.dataset.imagemPoder)?.addEventListener('input', () => atualizarEditor(select));
    atualizarEditor(select);
  }
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('select[data-fundo-poder]').forEach(montarEditor));
  return {criarArte, atualizarEditor};
})();
