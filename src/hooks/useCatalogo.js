import { useMemo } from 'react'
import useResource from './useResource'

// Lista de fallback usada enquanto o catálogo ainda não carregou da API.
// Reflete o portfolio ativo da ATTENTI — atualizar junto com catalogoSeguros.js.
const TIPOS_FALLBACK = [
  'Auto', 'Frota',
  'Patrimoniais', 'Equipamentos', 'Eventos',
  'Vida PF', 'Vida PJ',
  'Seguro Garantia', 'Seguro Licitante', 'Seguro Judicial',
  'Fiança Locatícia', 'Capitalização Aluguel',
  'Risco Engenharia', 'Responsabilidade Civil',
  'Diversos', 'Consórcio',
]

/**
 * Hook principal para o catálogo hierárquico de seguros.
 *
 * Uso básico em formulários:
 *   const { getTipos, getSubcategorias, getCoberturas, getRamo } = useCatalogo()
 *
 * No onChange do tipoSeguro:
 *   const subs = getSubcategorias(novoTipo)
 *   setForm(f => ({ ...f, tipoSeguro: novoTipo, subcategoria: subs[0]?.nome || '', ramo: getRamo(novoTipo) }))
 */
export function useCatalogo() {
  const { data: catalogo, loading, update, create, remove, refetch } = useResource('seguros_catalogo')

  // Apenas tipos ativos, ordenados por `ordem`
  const ativos = useMemo(
    () => catalogo.filter(c => c.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
    [catalogo]
  )

  // Agrupa por ramo para exibição no admin
  const porRamo = useMemo(() => {
    const mapa = {}
    ativos.forEach(c => {
      if (!mapa[c.ramo]) mapa[c.ramo] = []
      mapa[c.ramo].push(c)
    })
    return mapa
  }, [ativos])

  /**
   * Lista de strings "tipo de seguro" para popular selects.
   * @param {string[]|null} modulos - filtra por módulo; null = apenas 'seguro'
   */
  function getTipos(modulos = ['seguro']) {
    if (!catalogo.length) return TIPOS_FALLBACK
    const lista = ativos
      .filter(c => !modulos || modulos.includes(c.modulo))
      .map(c => c.tipo)
    return lista.length ? lista : TIPOS_FALLBACK
  }

  /**
   * Subcategorias ativas para um dado tipo de seguro.
   * Retorna [] quando não existe mapeamento (tipos legados).
   */
  function getSubcategorias(tipo) {
    const entry = catalogo.find(c => c.tipo === tipo)
    if (!entry) return []
    return (entry.subcategorias || [])
      .filter(s => s.ativo !== false)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  }

  /**
   * Coberturas disponíveis para tipo + subcategoria.
   */
  function getCoberturas(tipo, subcategoria) {
    const entry = catalogo.find(c => c.tipo === tipo)
    if (!entry) return []
    const sub = (entry.subcategorias || []).find(s => s.nome === subcategoria)
    return sub?.coberturas || []
  }

  /** Ramo do tipo (ex.: 'AUTOMÓVEL', 'PATRIMONIAL'). */
  function getRamo(tipo) {
    return catalogo.find(c => c.tipo === tipo)?.ramo || ''
  }

  /** Módulo do tipo ('seguro' | 'saude' | 'previdencia' | 'consorcio'). */
  function getModulo(tipo) {
    return catalogo.find(c => c.tipo === tipo)?.modulo || 'seguro'
  }

  /** Encontra o registro completo de um tipo. */
  function getEntrada(tipo) {
    return catalogo.find(c => c.tipo === tipo) || null
  }

  /**
   * Agrega coberturas de múltiplas subcategorias selecionadas, deduplicadas.
   * @param {string} tipo - tipo de seguro (ex: "Automóvel")
   * @param {string[]} subcategoriasArray - nomes das subcategorias selecionadas
   */
  function getCoberturasDaSelecao(tipo, subcategoriasArray) {
    const entry = catalogo.find(c => c.tipo === tipo)
    if (!entry || !subcategoriasArray?.length) return []
    return entry.subcategorias
      .filter(s => subcategoriasArray.includes(s.nome) && s.ativo !== false)
      .flatMap(s => s.coberturas || [])
      .filter((v, i, arr) => arr.indexOf(v) === i)
  }

  /**
   * Persiste alteração em um registro do catálogo (toggle ativo, add/remove subcategoria, etc.).
   * Usa o `update` do useResource que faz PUT /api/seguros_catalogo/:id
   */
  async function salvarEntrada(entrada) {
    return update(entrada.id, entrada)
  }

  return {
    catalogo,
    ativos,
    porRamo,
    loading,
    // Helpers para selects
    getTipos,
    getSubcategorias,
    getCoberturas,
    getCoberturasDaSelecao,
    getRamo,
    getModulo,
    getEntrada,
    // CRUD
    salvarEntrada,
    create,
    remove,
    refetch,
  }
}

export default useCatalogo
