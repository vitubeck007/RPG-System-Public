/* Sessões HTTP e credenciais do jogador, sem dependências externas. */
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const PARAMETROS_SENHA = Object.freeze({ N: 32768, r: 8, p: 3 });

async function derivarSenha(senha, salt) {
  return scrypt(senha, salt, 64, { ...PARAMETROS_SENHA, maxmem: 64 * 1024 * 1024 });
}

async function criarCredencial(senha) {
  const salt = crypto.randomBytes(32);
  const hash = await derivarSenha(senha, salt);
  return { schemaVersion: 1, algoritmo: 'scrypt', parametros: { ...PARAMETROS_SENHA },
    salt: salt.toString('hex'), hash: hash.toString('hex') };
}

async function verificarCredencial(senha, credencial) {
  const negada = { valida: false, migrar: false };
  if (typeof senha !== 'string' || !credencial || typeof credencial !== 'object') return negada;
  if (Object.hasOwn(credencial, 'hash') || Object.hasOwn(credencial, 'algoritmo')) {
    // Arquivo adulterado/corrompido nunca escolhe um custo arbitrário nem cai no modo legado.
    if (credencial.schemaVersion !== 1 || credencial.algoritmo !== 'scrypt' ||
      !Object.entries(PARAMETROS_SENHA).every(([k, v]) => credencial.parametros?.[k] === v) ||
      !/^[a-f0-9]{64}$/i.test(credencial.salt || '') || !/^[a-f0-9]{128}$/i.test(credencial.hash || '')) return negada;
    const esperado = Buffer.from(credencial.hash, 'hex');
    const calculado = await derivarSenha(senha, Buffer.from(credencial.salt, 'hex'));
    const valida = crypto.timingSafeEqual(calculado, esperado);
    return { valida, migrar: valida && Object.hasOwn(credencial, 'senha') };
  }
  if (typeof credencial.senha !== 'string') return negada;
  const resumir = texto => crypto.createHash('sha256').update(texto).digest();
  const valida = crypto.timingSafeEqual(resumir(senha), resumir(credencial.senha));
  return { valida, migrar: valida };
}

// Valor de um cookie no cabeçalho `Cookie: a=1; b=2` (sem depender de pacote externo).
function lerCookie(cabecalho, nome) {
  for (const parte of String(cabecalho || "").split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nome) {
      try {
        return decodeURIComponent(parte.slice(i + 1).trim());
      } catch {
        return "";
      }
    }
  }
  return "";
}

module.exports = { lerCookie, criarCredencial, verificarCredencial };
