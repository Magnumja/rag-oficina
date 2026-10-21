/**
 * Custódia da chave de IA do aluno (BYOK): fica só no navegador, nunca é enviada
 * pro nosso banco/log — só viaja por header a cada chamada à LLM. "ollama" não
 * precisa de chave (servidor local da turma).
 */

export type ProvedorIA = 'anthropic' | 'openai' | 'ollama'

const PREFIXO = 'educagente:chave-'

export function obterChave(provedor: ProvedorIA): string | null {
  if (provedor === 'ollama') return null
  try {
    return localStorage.getItem(PREFIXO + provedor)
  } catch {
    return null
  }
}

export function salvarChave(provedor: Exclude<ProvedorIA, 'ollama'>, chave: string) {
  try {
    localStorage.setItem(PREFIXO + provedor, chave)
  } catch {
    /* sem storage disponível */
  }
}

export function esquecerChave(provedor: Exclude<ProvedorIA, 'ollama'>) {
  try {
    localStorage.removeItem(PREFIXO + provedor)
  } catch {
    /* ignora */
  }
}

export function temChave(provedor: ProvedorIA): boolean {
  return provedor === 'ollama' || !!obterChave(provedor)
}
