import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

export default function useResource(entity) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    api.getAll(entity)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [entity])

  useEffect(() => { refetch() }, [refetch])

  const create = useCallback(async (item) => {
    const created = await api.post(entity, item)
    setData(prev => [created, ...prev])
    return created
  }, [entity])

  const update = useCallback(async (id, item) => {
    const updated = await api.put(entity, id, item)
    setData(prev => prev.map(i => i.id === id ? updated : i))
    return updated
  }, [entity])

  const remove = useCallback(async (id) => {
    await api.del(entity, id)
    setData(prev => prev.filter(i => i.id !== id))
  }, [entity])

  return { data, loading, setData, create, update, remove, refetch }
}
