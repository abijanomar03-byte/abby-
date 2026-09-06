tsx
'use client'

import { useRef, useState } from 'react'

export default function LiveCamera({ label, onCapture }: { label: string; onCapture: (dataUrl: string) => void }) {
  const photoInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('Tap the button to open your phone camera.')
  const [busy, setBusy] = useState(false)

  const openPhoneCamera = () => {
    if (!photoInput.current || busy) return
    photoInput.current.value = ''
    photoInput.current.click()
  }

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    setStatus('Processing your fresh camera photo…')

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please capture a photo of the room.')
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read the captured photo.'))
        reader.readAsDataURL(file)
      })

      onCapture(dataUrl)
      setStatus('✓ Photo captured. Moving to the next room…')
    } catch (err: any) {
      setStatus(err?.message || 'Could not use that photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="cameraWrap" style={{ minHeight: 180, display: 'grid', placeItems: 'center', padding: 24, background: '#0f1720' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>📱</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Use your phone camera</div>
          <div style={{ opacity: .78, fontSize: 12, marginTop: 5 }}>{label} · fresh capture only</div>
        </div>
      </div>

      <div className="status">{status}</div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 10 }}
        disabled={busy}
        onClick={openPhoneCamera}
      >
        {busy ? 'Processing…' : `📷 Open phone camera`}
      </button>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoSelected}
        style={{ display: 'none' }}
      />

      <div className="note" style={{ marginTop: 8 }}>
        Hama does not offer a normal gallery picker here. On a phone, this opens the device camera for a fresh capture.
      </div>
    </div>
  )
}

