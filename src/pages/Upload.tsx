import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import './Upload.css'

const API = import.meta.env.VITE_API_URL

interface Production {
  id: string
  title: string
}

interface QueuedFile {
  file: File
  preview: string
  order: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  key?: string
}

export default function Upload() {
  const [searchParams] = useSearchParams()
  const [productions, setProductions] = useState<Production[]>([])
  const [productionId, setProductionId] = useState(searchParams.get('productionId') ?? '')
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${API}/productions`)
      .then(r => r.json() as any as { productions: Production[] })
      .then(d => setProductions(d.productions))
      .catch(() => setError('Failed to load productions'))
  }, [])

  function onFilesSelected(files: FileList | null) {
    if (!files) return
    const next: QueuedFile[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        order: queue.length + i + 1,
        status: 'pending',
      }))
    setQueue(q => [...q, ...next])
  }

  function removeFile(idx: number) {
    setQueue(q => {
      URL.revokeObjectURL(q[idx].preview)
      return q.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i + 1 }))
    })
  }

  function moveFile(idx: number, dir: -1 | 1) {
    setQueue(q => {
      const next = [...q]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return q
        ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next.map((f, i) => ({ ...f, order: i + 1 }))
    })
  }

  async function handleUpload() {
    if (!productionId) { setError('Select a production first'); return }
    if (queue.length === 0) { setError('Add at least one image'); return }
    setError('')
    setUploading(true)

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === 'done') continue
      setQueue(q => q.map((f, j) => j === i ? { ...f, status: 'uploading' } : f))

      let file = queue[i].file
      if (file.size > 1_000_000) {
        file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2560, useWebWorker: true })
      }

      const fd = new FormData()
      fd.append('productionId', productionId)
      fd.append('file', file)
      fd.append('order', String(queue[i].order))

      try {
        const res = await fetch(`${API}/images/upload`, { method: 'POST', body: fd })
        if (!res.ok) throw new Error()
        const data = await res.json() as any as { key: string }
        setQueue(q => q.map((f, j) => j === i ? { ...f, status: 'done', key: data.key } : f))
      } catch {
        setQueue(q => q.map((f, j) => j === i ? { ...f, status: 'error' } : f))
      }
    }

    setUploading(false)
  }

  const allDone = queue.length > 0 && queue.every(f => f.status === 'done')

  return (
    <div className="upload-page">
      <h2 className="upload-title">Upload images</h2>

      <div className="upload-section">
        <label className="field-label">Production</label>
        <select
          className="prod-select"
          value={productionId}
          onChange={e => setProductionId(e.target.value)}
          disabled={uploading}
        >
          <option value="">— select —</option>
          {productions.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      <div
        className="drop-zone"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onFilesSelected(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <span className="drop-icon">⊡</span>
        <p>Drop images here or click to browse</p>
        <p className="drop-hint">Images over 1 MB will be automatically compressed before upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => onFilesSelected(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="queue">
          {queue.map((item, i) => (
            <div key={item.preview} className={`queue-item queue-item--${item.status}`}>
              <img className="queue-thumb" src={item.preview} alt="" />
              <div className="queue-info">
                <span className="queue-name">{item.file.name}</span>
                <span className="queue-order">#{item.order}</span>
                {item.key && <span className="queue-key">{item.key}</span>}
              </div>
              <div className="queue-status">
                {item.status === 'uploading' && '⏳'}
                {item.status === 'done' && '✓'}
                {item.status === 'error' && '✗'}
              </div>
              {item.status === 'pending' && (
                <div className="queue-controls">
                  <button onClick={() => moveFile(i, -1)} disabled={i === 0}>↑</button>
                  <button onClick={() => moveFile(i, 1)} disabled={i === queue.length - 1}>↓</button>
                  <button onClick={() => removeFile(i)}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div className="upload-actions">
        {!allDone && (
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={uploading || queue.length === 0}
          >
            {uploading ? 'Uploading…' : `Upload ${queue.length} image${queue.length !== 1 ? 's' : ''}`}
          </button>
        )}
        {allDone && (
          <button className="btn-secondary" onClick={() => setQueue([])}>
            Upload more
          </button>
        )}
      </div>
    </div>
  )
}
