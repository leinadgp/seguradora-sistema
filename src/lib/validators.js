export const somenteDigitos = v => (v || '').replace(/\D/g, '')

export function validarCPF(cpf) {
  const c = somenteDigitos(cpf)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i)
  let r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i)
  r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

export function validarCNPJ(cnpj) {
  const c = somenteDigitos(cnpj)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const calc = (len) => {
    let soma = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      soma += parseInt(c[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13])
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function validarTelefone(tel) {
  const t = somenteDigitos(tel)
  return t.length === 10 || t.length === 11
}

export function validarCEP(cep) {
  return /^\d{5}-?\d{3}$/.test(cep)
}

export function validarCPFouCNPJ(valor) {
  const d = somenteDigitos(valor)
  if (d.length === 11) return validarCPF(valor)
  if (d.length === 14) return validarCNPJ(valor)
  return false
}
