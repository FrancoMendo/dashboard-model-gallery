import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import './ProductionDetail.css'

const API = import.meta.env.VITE_API_URL

interface Production {
  id: string
  title: string
  description: string | null
  date: number | null
  location: string | null
}

interface ImageItem {
  id: string
  url: string
  size: number
  customMetadata?: {
    originalName?: string
    order?: string
    productionId?: string
  }
}

export default function ProductionDetail() {
  const { id } = useParams<{ id: string }>()
  const [production, setProduction] = useState<Production | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orderChanged, setOrderChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [prodRes, imgRes] = await Promise.all([
        fetch(`${API}/productions/${id}`),
        fetch(`${API}/productions/${id}/images`),
      ])
      const { production: prod } = await prodRes.json<{ production: Production }>()
      const { images: imgs } = await imgRes.json<{ images: ImageItem[] }>()
      setProduction(prod)
      setImages(
        [...imgs].sort(
          (a, b) =>
            Number(a.customMetadata?.order ?? 9999) -
            Number(b.customMetadata?.order ?? 9999),
        ),
      )
    } catch {
      setError('Failed to load production')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  function moveImage(idx: number, dir: -1 | 1) {
    const swap = idx + dir
    if (swap < 0 || swap >= images.length) return
    setImages(imgs => {
      const next = [...imgs]
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
    setOrderChanged(true)
  }

  async function handleDelete(key: string) {
    try {
      const res = await fetch(`${API}/images/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setImages(imgs => imgs.filter(i => i.id !== key))
    } catch {
      setError('Failed to delete image')
    }
  }

  async function saveOrder() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/productions/${id}/images/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img, i) => ({ key: img.id, order: i + 1 })),
        }),
      })
      if (!res.ok) throw new Error()
      setOrderChanged(false)
      // Keys changed on the server — reload to get updated keys
      setLoading(true)
      await loadData()
    } catch {
      setError('Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="detail-msg">Loading…</p>
  if (!production) return <p className="detail-msg">Production not found.</p>

  return (
    <div className="prod-detail">
      <div className="prod-detail-header">
        <Link className="back-link" to="/productions">← Productions</Link>

        <div className="prod-detail-info">
          <h2 className="prod-detail-title">{production.title}</h2>
          <div className="prod-detail-meta">
            {production.location && <span>📍 {production.location}</span>}
            {production.date && (
              <span>{new Date(production.date * 1000).toLocaleDateString()}</span>
            )}
            <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="prod-detail-actions">
          <Link className="btn-secondary" to={`/upload?productionId=${id}`}>
            + Upload
          </Link>
          {orderChanged && (
            <button className="btn-primary" onClick={saveOrder} disabled={saving}>
              {saving ? 'Saving…' : 'Save order'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {images.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">⊡</span>
          <p>No images yet. Upload some to get started.</p>
        </div>
      ) : (
        <div className="images-list">
          {images.map((img, i) => (
            <div key={img.id} className="image-row">
              <span className="image-order">#{i + 1}</span>

              <img
                className="image-thumb"
                src={`${API}${img.url}`}
                alt={img.customMetadata?.originalName ?? img.id}
                loading="lazy"
              />

              <div className="image-info">
                <span className="image-name">
                  {img.customMetadata?.originalName ?? img.id}
                </span>
                <span className="image-key">{img.id}</span>
                <span className="image-size">{(img.size / 1024).toFixed(0)} KB</span>
              </div>

              <div className="image-controls">
                <button
                  className="ctrl-btn"
                  onClick={() => moveImage(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="ctrl-btn"
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="ctrl-btn ctrl-btn--danger"
                  onClick={() => handleDelete(img.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
