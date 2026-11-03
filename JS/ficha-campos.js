/* =========================================================================
   FICHA BÁSICA
   Campos ligados ao JSON (data-campo), progressão, retrato (avatar), moedas e riquezas.
   ========================================================================= */

/* ------------------------- ficha básica (data-campo) ------------------------- */
// Todo elemento com data-campo="arquivo.chave" (ex.: perfil.origem, biografia.notes)
// fica ligado ao JSON do personagem.
function camposDaFicha() {
  return document.querySelectorAll("[data-campo]");
}

function lerReferenciaCampo(el) {
  const [arquivo, ...resto] = el.dataset.campo.split(".");
  return [arquivo, resto.join(".")];
}

function definirFichaEditavel(editavel) {
  camposDaFicha().forEach((el) => {
    el.disabled = !editavel;
  });
  const progressao = document.getElementById("progression-val-input");
  if (progressao) progressao.disabled = !editavel;
}

function preencherCamposFicha() {
  camposDaFicha().forEach((el) => {
    const [arquivo, chave] = lerReferenciaCampo(el);
    // Se há edição local ainda não enviada, ela vale mais que o que veio do servidor.
    if (arquivoProtegido(arquivo)) return;
    if (arquivo === "atributos") {
      el.value = FICHA.atributos?.[chave] ?? STATE.atributos?.[chave] ?? 0;
      return;
    }
    el.value = FICHA[arquivo]?.[chave] ?? "";
  });
  atualizarIdentidadeVisual();
}

function alterarCampoFicha(el) {
  const [arquivo, chave] = lerReferenciaCampo(el);
  if (!personagemCarregado) return;

  if (FICHA[arquivo]) {
    FICHA[arquivo][chave] = el.value;
  }

  if (arquivo === "atributos") {
    if (!STATE.atributos) STATE.atributos = { ...ATRIBUTOS_PADRAO };
    const valor = Math.max(0, Math.min(999, Math.round(Number(el.value)) || 0));
    STATE.atributos[chave] = valor;
    if (!FICHA.atributos) FICHA.atributos = {};
    FICHA.atributos[chave] = valor;
    if (chave === "FOR") atualizarRotuloCarga();
    // O modificador do atributo entra no total das perícias ligadas a ele.
    STATE.skills
      .filter((skill) => skill.attr === chave)
      .forEach(atualizarExibicaoPericia);
  }

  if (arquivo === "perfil" && chave === "nome") {
    const nome = el.value.trim();
    if (nome) {
      STATE.name = nome;
      sessionStorage.setItem("rpg_character_name", nome);
      atualizarIdentidadeVisual();
    }
  }
  marcarAlterado(arquivo);
}

/* ------------------- progressão (Ex/Nv), avatar e moedas ------------------- */
function alterarProgressao(input) {
  if (!personagemCarregado || !FICHA.perfil) return;
  STATE.progressionValues[STATE.progressionMode] = input.value;
  FICHA.perfil.progressao = { ...STATE.progressionValues };
  marcarAlterado("perfil");
}

// url vazia = volta à imagem padrão que veio no HTML.
function aplicarAvatar(url) {
  const foto = document.getElementById("avatar-url-input"),
    retrato = document.getElementById("avatar-retrato-input");
  if (foto) {
    foto.value = url || "";
    foto.dataset.fotoOriginal = FICHA.perfil?.avatarOriginal || url || "";
  }
  if (retrato) retrato.value = FICHA.perfil?.avatarRetrato || "";

  ["char-avatar-img", "char-bio-portrait"].forEach((id) => {
    const img = document.getElementById(id);
    if (!img) return;
    if (img.dataset.padrao === undefined)
      img.dataset.padrao = img.getAttribute("src") || "";
    img.dataset.fotoCompleta = FICHA.perfil?.avatarOriginal || url || "";
    img.src =
      (id === "char-avatar-img" && url ? FICHA.perfil?.avatarRetrato : "") ||
      url ||
      img.dataset.padrao;
  });
  if (foto && retrato) {
    // O carregamento muda os valores por código; notifica os editores sem exigir clique no interruptor.
    for (const campo of [foto, retrato])
      campo.dispatchEvent(new Event("input"));
  }
}

function renderizarResumoMoedas() {
  const valor = (id) => document.getElementById(id)?.value || 0;
  const resumo = document.getElementById("riches-summary");
  if (resumo) {
    resumo.innerText = `${valor("coin-gold")} PO • ${valor("coin-silver")} PP • ${valor("coin-copper")} PC`;
  }
}

function preencherMoedas(riquezas) {
  Object.entries(MOEDAS).forEach(([chave, id]) => {
    const el = document.getElementById(id);
    if (el) el.value = Number(riquezas?.[chave]) || 0;
  });
  renderizarResumoMoedas();
}

/* ------------------------------ inicialização ------------------------------ */
function iniciarFichaBasica() {
  if (iniciarFichaBasica.iniciado) return;
  iniciarFichaBasica.iniciado = true;

  // Só libera a edição depois que o personagem foi carregado do servidor.
  definirFichaEditavel(personagemCarregado);

  camposDaFicha().forEach((el) => {
    el.addEventListener("input", () => alterarCampoFicha(el));
    el.addEventListener("blur", () => {
      const [arquivo, chave] = lerReferenciaCampo(el);
      if (arquivo === "perfil" && chave === "nome" && !el.value.trim()) {
        el.value = STATE.name; // o nome não pode ficar vazio
        if (FICHA.perfil) FICHA.perfil.nome = STATE.name;
      }
      enviarSalvamento(arquivo);
    });
  });

  const progressao = document.getElementById("progression-val-input");
  progressao?.addEventListener("input", () => alterarProgressao(progressao));
  progressao?.addEventListener("blur", () => enviarSalvamento("perfil"));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") enviarSalvamentosPendentes();
  });
  window.addEventListener("pagehide", enviarSalvamentosPendentes);
}

// Envios sem resposta quando a conexão cai podem ter se perdido: voltam a "sujos".

/* =========================================================================
       ALTERAÇÃO 1: ALTERNADOR NÍVEL VS EXPERIÊNCIA COM STOPPROPAGATION
       ========================================================================= */
/* FUNÇÃO ALTERNAR MODO PROGRESSO BLOQUEADA
function alternarModoProgresso(e) {
  if (e) e.stopPropagation();
  if (!GLOBAL_CONFIG.UsarEx) return;

  const btn = document.getElementById("progression-type-btn");
  const input = document.getElementById("progression-val-input");
  STATE.progressionValues[STATE.progressionMode] = input.value;

  if (STATE.progressionMode === "ex") {
    STATE.progressionMode = "nv";
    btn.innerText = "Nv";
    input.value = "4";
    toast("Modo alterado para Nível de Personagem (Nv)", "info");
  } else {
    STATE.progressionMode = "ex";
    btn.innerText = "Ex";
    input.value = "5%";
    toast("Modo alterado para Exposição / Experiência (Ex %)", "info");
  }
  STATE.progressionValues[STATE.progressionMode] = input.value;
  registrarNoTerminal("Modo de progressão alterado", {
    modo: STATE.progressionMode,
    valor: input.value,
  });
} */

function toggleRiquezas() {
  const body = document.getElementById("riches-body");
  const icon = document.getElementById("riches-icon");
  const isOpen = !body.classList.contains("hidden");

  if (isOpen) {
    body.classList.add("hidden");
    icon.classList.remove("rotate-180");
  } else {
    body.classList.remove("hidden");
    icon.classList.add("rotate-180");
  }
  document
    .querySelector("#riches-section > button")
    ?.setAttribute("aria-expanded", String(!isOpen));
}

// Ao digitar nas moedas: corrige o valor, redesenha o resumo, registra e salva.
function aoAlterarMoedas() {
  Object.values(MOEDAS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = Math.max(0, Math.round(Number(el.value)) || 0);
  });
  renderizarResumoMoedas();
  registrarNoTerminal("Riquezas alteradas", {
    ouro: document.getElementById("coin-gold")?.value || 0,
    prata: document.getElementById("coin-silver")?.value || 0,
    cobre: document.getElementById("coin-copper")?.value || 0,
    sangue: document.getElementById("coin-blood")?.value || 0,
  });
  salvarRiquezas();
}

function salvarAvatar() {
  const url = document.getElementById("avatar-url-input").value.trim();
  if (url && !urlDeImagem(url)) {
    toast("Use um link de imagem começando com http:// ou https://", "error");
    return; // mantém o modal aberto para corrigir o link
  }
  const retrato = document.getElementById("avatar-retrato-input").value.trim();
  if (retrato && !urlDeImagem(retrato)) {
    toast("Informe um link válido para o retrato.", "error");
    return;
  }
  if (FICHA.perfil) {
    FICHA.perfil.avatarOriginal = url
      ? urlDeImagem(
          document.getElementById("avatar-url-input").dataset.fotoOriginal,
        ) || url
      : "";
    FICHA.perfil.avatar = url;
    FICHA.perfil.avatarRetrato = url ? retrato : "";
    aplicarAvatar(url);
    marcarAlterado("perfil", { imediato: true });
    syncPlayerToServer();
  }
}

function definirModoImagemPlayer(modo) {
  document
    .querySelectorAll("[data-avatar-modo]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.avatarModo === modo)),
    );
  document.getElementById("avatar-foto-campo").hidden = modo !== "foto";
  document.getElementById("avatar-retrato-campo").hidden = modo !== "retrato";
  document
    .querySelectorAll(".sheet-retrato-bloco [data-retrato-alvo]")
    .forEach(
      (b) =>
        (b.hidden =
          b.dataset.retratoAlvo !==
          (modo === "foto" ? "avatar-url-input" : "avatar-retrato-input")),
    );
  document
    .getElementById(
      modo === "foto" ? "avatar-url-input" : "avatar-retrato-input",
    )
    .dispatchEvent(new Event("focus"));
  atualizarPreviaAvatar();
}
function atualizarPreviaAvatar() {
  const foto = document.getElementById("avatar-url-input").value;
  const retrato = document.getElementById("avatar-retrato-input").value;
  const modo =
    document
      .querySelector('[data-avatar-modo="retrato"]')
      .getAttribute("aria-pressed") === "true";
  document.getElementById("char-bio-portrait").src =
    urlDeImagem((modo && retrato) || foto) || "/CSS/retrato-padrao.svg";
}
document.addEventListener("DOMContentLoaded", () => {
  for (const id of ["avatar-url-input", "avatar-retrato-input"]) {
    const campo = document.getElementById(id);
    campo?.addEventListener("input", atualizarPreviaAvatar);
    campo?.addEventListener("change", salvarAvatar);
  }
});

function abrirFotoPlayerPorNome() {
  document.getElementById("avatar-arquivo-nome").value = "";
  document.getElementById("avatar-arquivo-erro").textContent = "";
  RPGUI.abrirModal("avatar-arquivo-modal", "avatar-arquivo-nome");
}
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("avatar-arquivo-modal");
  modal.addEventListener("rpg:cancelar", () => RPGUI.fecharModal(modal.id));
  document
    .getElementById("avatar-arquivo-form")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (modal.dataset.busy === "true") return;
      const nome = document.getElementById("avatar-arquivo-nome").value.trim();
      const erro = document.getElementById("avatar-arquivo-erro");
      if (
        !nome ||
        /[\\/:<>"|?*\x00-\x1f]/.test(nome) ||
        !/\.(png|jpe?g|webp)$/i.test(nome)
      ) {
        erro.textContent =
          "Informe apenas o nome de um arquivo PNG, JPG ou WebP.";
        return;
      }
      modal.dataset.busy = "true";
      const controles = [...modal.querySelectorAll("button,input")];
      controles.forEach((el) => (el.disabled = true));
      let salvo = false;
      try {
        erro.textContent = "Verificando imagem…";
        const url = "/imagens/players/" + encodeURIComponent(nome);
        const resposta = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
        });
        if (!resposta.ok)
          throw Error(
            "Imagem não encontrada em imagens/players/. Confira o nome e a extensão.",
          );
        document.getElementById("avatar-url-input").value = url;
        document.getElementById("avatar-url-input").dataset.fotoOriginal = url;
        document.getElementById("avatar-retrato-input").value = "";
        definirModoImagemPlayer("foto");
        salvarAvatar();
        salvo = true;
      } catch (falha) {
        erro.textContent =
          falha.message || "Não foi possível verificar a imagem.";
      } finally {
        delete modal.dataset.busy;
        controles.forEach((el) => (el.disabled = false));
      }
      if (salvo) RPGUI.fecharModal(modal.id);
    });
});
