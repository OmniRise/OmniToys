import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { QrCode, Download, Copy, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

// ─────────────────────────────────────────────────────────────
// Option tables
// ─────────────────────────────────────────────────────────────

type QRType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms'
type FillMode = 'solid' | 'linear' | 'radial'

type ShapeOption = { label: string; value: string }

const BODY_SHAPES: ShapeOption[] = [
  { label: 'Square', value: 'square' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Dots', value: 'dots' },
  { label: 'Classy', value: 'classy' },
  { label: 'Classy Rd', value: 'classy-rounded' },
  { label: 'Extra Rd', value: 'extra-rounded' },
]

const EYE_FRAME_SHAPES: ShapeOption[] = [
  { label: 'Square', value: 'square' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Extra Rd', value: 'extra-rounded' },
  { label: 'Dot', value: 'dot' },
  { label: 'Classy', value: 'classy' },
  { label: 'Classy Rd', value: 'classy-rounded' },
]

const EYE_BALL_SHAPES: ShapeOption[] = [
  { label: 'Square', value: 'square' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Dots', value: 'dots' },
  { label: 'Dot', value: 'dot' },
  { label: 'Classy', value: 'classy' },
  { label: 'Extra Rd', value: 'extra-rounded' },
]

const RESOLUTIONS = [128, 256, 512, 1024, 2048, 4096]

const QR_TYPES: { id: QRType; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
]

const ECC_LEVELS: { label: string; hint: string; value: 'L' | 'M' | 'Q' | 'H' }[] = [
  { label: 'L', hint: 'Smallest — 7% recoverable', value: 'L' },
  { label: 'M', hint: 'Balanced — 15% recoverable', value: 'M' },
  { label: 'Q', hint: 'Dense — 25% recoverable', value: 'Q' },
  { label: 'H', hint: 'Best with logos — 30% recoverable', value: 'H' },
]

type Fill = { mode: FillMode; color: string; color2: string; rotation: number }

type QROptions = {
  width: number
  height: number
  type: 'svg'
  data: string
  margin: number
  image?: string
  dotsOptions: Record<string, unknown>
  cornersSquareOptions: Record<string, unknown>
  cornersDotOptions: Record<string, unknown>
  backgroundOptions: Record<string, unknown>
  imageOptions: Record<string, unknown>
  qrOptions: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────
// Gradient helpers
// ─────────────────────────────────────────────────────────────

function toGradientOrNull(fill: Fill): Record<string, unknown> | undefined {
  if (fill.mode === 'solid') return undefined
  return {
    type: fill.mode,
    rotation: fill.rotation,
    colorStops: [
      { offset: 0, color: fill.color },
      { offset: 1, color: fill.color2 },
    ],
  }
}

function gradientToCss(f: Fill): string {
  if (f.mode === 'solid') return f.color
  if (f.mode === 'linear') return `linear-gradient(${f.rotation}rad, ${f.color}, ${f.color2})`
  return `radial-gradient(circle, ${f.color}, ${f.color2})`
}

// ─────────────────────────────────────────────────────────────
// Inline sub-components
// ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-omni-text/40">{title}</h3>
      {children}
    </div>
  )
}

function ShapeGrid({
  options,
  value,
  onChange,
}: {
  options: ShapeOption[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
            value === opt.value
              ? 'bg-omni-primary text-white border-omni-primary shadow-lg shadow-omni-primary/20'
              : 'bg-omni-text/5 text-omni-text/60 border-transparent hover:bg-omni-text/10'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-9 h-9 rounded-lg border border-omni-text/10 shrink-0"
        style={{ background: gradientToCss({ mode: 'solid', color: value, color2: value, rotation: 0 }) }}
      />
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent"
        aria-label={label}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 bg-omni-bg/50 border border-omni-text/10 rounded-lg text-xs font-mono text-omni-text"
        maxLength={7}
        spellCheck={false}
      />
    </div>
  )
}

function FillPicker({
  label,
  fill,
  onChange,
}: {
  label: string
  fill: Fill
  onChange: (f: Fill) => void
}) {
  return (
    <div className="space-y-2 p-3 rounded-xl border border-omni-text/5 bg-omni-bg/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-omni-text/60">{label}</span>
        <div className="flex gap-1">
          {(['solid', 'linear', 'radial'] as FillMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...fill, mode: m })}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-colors',
                fill.mode === m
                  ? 'bg-omni-primary text-white'
                  : 'bg-omni-text/5 text-omni-text/40 hover:bg-omni-text/10'
              )}
            >
              {m === 'solid' ? 'Solid' : m === 'linear' ? 'Lin' : 'Rad'}
            </button>
          ))}
        </div>
      </div>
      <ColorField label={label} value={fill.color} onChange={(c) => onChange({ ...fill, color: c })} />
      {fill.mode !== 'solid' && (
        <>
          <ColorField label={`${label} end`} value={fill.color2} onChange={(c) => onChange({ ...fill, color2: c })} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-omni-text/40 w-16 shrink-0">Rotation</span>
            <input
              type="range"
              min={0}
              max={6.28}
              step={0.1}
              value={fill.rotation}
              onChange={(e) => onChange({ ...fill, rotation: parseFloat(e.target.value) })}
              className="flex-1 accent-omni-primary"
            />
            <span className="text-[10px] font-mono text-omni-text/40">{fill.rotation.toFixed(1)}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function QrGeneratorPage() {
  // Content
  const [qrType, setQrType] = useState<QRType>('url')
  const [text, setText] = useState('https://omnitoys.vercel.app')
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [emailSubject, setEmailSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')

  // Style
  const [bodyShape, setBodyShape] = useState('extra-rounded')
  const [eyeFrameShape, setEyeFrameShape] = useState('extra-rounded')
  const [eyeBallShape, setEyeBallShape] = useState('extra-rounded')
  const [bodyFill, setBodyFill] = useState<Fill>({ mode: 'solid', color: '#000000', color2: '#df1c26', rotation: 0.8 })
  const [eyeFrameFill, setEyeFrameFill] = useState<Fill>({ mode: 'solid', color: '#000000', color2: '#df1c26', rotation: 0.8 })
  const [eyeBallFill, setEyeBallFill] = useState<Fill>({ mode: 'solid', color: '#000000', color2: '#df1c26', rotation: 0.8 })
  const [bgFill, setBgFill] = useState<Fill>({ mode: 'solid', color: '#ffffff', color2: '#f3f4f6', rotation: 0.8 })
  const [bgTransparent, setBgTransparent] = useState(false)

  // Logo
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoSize, setLogoSize] = useState(0.4)
  const [logoMargin, setLogoMargin] = useState(4)
  const [hideDotsBehindLogo, setHideDotsBehindLogo] = useState(true)

  // Output
  const [resolution, setResolution] = useState(512)
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('Q')
  const [margin, setMargin] = useState(2)

  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrInstanceRef = useRef<QRCodeStyling | null>(null)

  // ── QR content encoding ──────────────────────────────────

  const getQRContent = useCallback((): string => {
    const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
    switch (qrType) {
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${esc(wifiSSID)};P:${esc(wifiPassword)};;`
      case 'email':
        return `mailto:${text}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`
      case 'phone':
        return `tel:${text.replace(/\s+/g, '')}`
      case 'sms':
        return `SMSTO:${text.replace(/\s+/g, '')}:${messageBody}`
      case 'url':
        return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text) ? text : `https://${text}`
      default:
        return text
    }
  }, [qrType, text, wifiSSID, wifiPassword, wifiEncryption, emailSubject, messageBody])

  // ── QRCodeStyling options ────────────────────────────────

  const getOptions = useCallback((): QROptions => {
    const opts: QROptions = {
      width: 512,
      height: 512,
      type: 'svg',
      data: getQRContent(),
      margin,
      dotsOptions: {
        color: bodyFill.color,
        gradient: toGradientOrNull(bodyFill),
        type: bodyShape,
      },
      cornersSquareOptions: {
        color: eyeFrameFill.color,
        gradient: toGradientOrNull(eyeFrameFill),
        type: eyeFrameShape,
      },
      cornersDotOptions: {
        color: eyeBallFill.color,
        gradient: toGradientOrNull(eyeBallFill),
        type: eyeBallShape,
      },
      backgroundOptions: bgTransparent
        ? { color: 'rgba(0,0,0,0)' }
        : { color: bgFill.color, gradient: toGradientOrNull(bgFill) },
      imageOptions: {
        hideBackgroundDots: hideDotsBehindLogo,
        imageSize: logoSize,
        margin: logoMargin,
        crossOrigin: 'anonymous',
      },
      qrOptions: { errorCorrectionLevel: ecc },
    }
    if (logoDataUrl) opts.image = logoDataUrl
    return opts
  }, [getQRContent, margin, bodyFill, bodyShape, eyeFrameFill, eyeFrameShape, eyeBallFill, eyeBallShape, bgFill, bgTransparent, logoDataUrl, logoSize, logoMargin, hideDotsBehindLogo, ecc])

  // Live preview
  useEffect(() => {
    const container = previewRef.current
    if (!container) return
    const content = getQRContent()
    if (!content.trim()) return

    try {
      if (!qrInstanceRef.current) {
        qrInstanceRef.current = new QRCodeStyling(getOptions())
        qrInstanceRef.current.append(container)
      } else {
        qrInstanceRef.current.update(getOptions())
      }
    } catch (err) {
      console.error('[QR Generator] preview update failed:', err)
    }
  }, [getOptions, getQRContent])

  // ── Logo upload ──────────────────────────────────────────

  const onLogoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (png, jpg, svg...)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo too large. Max 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleLogoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onLogoFile(file)
    e.target.value = ''
  }

  // ── Exports ──────────────────────────────────────────────

  const exportQR = useCallback(
    async (extension: 'png' | 'svg' | 'jpeg') => {
      try {
        const content = getQRContent()
        if (!content.trim()) {
          toast.error('Enter some content first')
          return
        }
        // Fresh instance at full export resolution — preview instance stays untouched
        const exportInstance = new QRCodeStyling({
          ...getOptions(),
          width: resolution,
          height: resolution,
        })
        await exportInstance.download({ name: `omnitoys-qr-${resolution}px`, extension })
        toast.success(`${extension.toUpperCase()} downloaded at ${resolution}x${resolution}px`)
      } catch {
        toast.error(`Failed to download ${extension.toUpperCase()}`)
      }
    },
    [getQRContent, getOptions, resolution]
  )

  const copyToClipboard = useCallback(async () => {
    try {
      const content = getQRContent()
      if (!content.trim()) {
        toast.error('Enter some content first')
        return
      }
      const temp = document.createElement('div')
      const inst = new QRCodeStyling({ ...getOptions(), width: 1024, height: 1024 })
      inst.append(temp)
      const svg = temp.querySelector('svg')
      if (!svg) throw new Error('no svg rendered')
      const svgString = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('svg load failed'))
        img.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(img, 0, 0, 1024, 1024)
      URL.revokeObjectURL(url)
      const pngBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
      toast.success('PNG copied to clipboard!')
    } catch {
      toast.error('Failed to copy (browser may not support clipboard images)')
    }
  }, [getQRContent, getOptions])

  // ── Contrast warning ─────────────────────────────────────

  const contrastWarning = useMemo(() => {
    const hexToLum = (hex: string): number => {
      const c = hex.replace('#', '')
      if (c.length !== 6) return 0.5
      const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(c.slice(i, i + 2), 16) / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const fgLum = hexToLum(bodyFill.color)
    const bgLum = hexToLum(bgTransparent ? '#ffffff' : bgFill.color)
    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)
    return ratio < 3
  }, [bodyFill.color, bgFill.color, bgTransparent])

  // ── UI ───────────────────────────────────────────────────

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Fully styled QR codes — custom body & eye shapes, gradients, center logo, transparent background, up to 4096px 1:1 exports."
      icon={<QrCode className="w-8 h-8" />}
      actions={
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 bg-omni-primary/10 text-omni-primary hover:bg-omni-primary/20 rounded-lg transition-colors font-medium text-sm"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button
            onClick={() => exportQR('png')}
            className="flex items-center gap-2 px-3 py-1.5 bg-omni-text/10 text-omni-text hover:bg-omni-text/20 rounded-lg transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" /> PNG
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
        {/* Left: controls */}
        <div className="space-y-8">
          <Section title="Content">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QR_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setQrType(t.id)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
                    qrType === t.id
                      ? 'bg-omni-primary text-white border-omni-primary shadow-lg shadow-omni-primary/20'
                      : 'bg-omni-text/5 text-omni-text/60 border-transparent hover:bg-omni-text/10'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {qrType === 'wifi' ? (
              <div className="space-y-3">
                <input
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  placeholder="Network name (SSID)"
                  className="w-full p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <input
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <div className="flex gap-2">
                  {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                    <button
                      key={enc}
                      type="button"
                      onClick={() => setWifiEncryption(enc)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        wifiEncryption === enc
                          ? 'bg-omni-primary text-white'
                          : 'bg-omni-text/5 text-omni-text/60 hover:bg-omni-text/10'
                      )}
                    >
                      {enc === 'nopass' ? 'None' : enc}
                    </button>
                  ))}
                </div>
              </div>
            ) : qrType === 'email' ? (
              <div className="space-y-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Message"
                  className="w-full h-20 p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
              </div>
            ) : qrType === 'sms' ? (
              <div className="space-y-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Phone number"
                  className="w-full p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="SMS message"
                  className="w-full h-20 p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-24 p-4 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                placeholder={qrType === 'phone' ? '+212 6 12 34 56 78' : 'Enter URL or text'}
              />
            )}
            <p className="text-xs text-omni-text/40">{getQRContent().length} characters</p>
            <p className={cn('text-xs', contrastWarning ? 'text-amber-400' : 'sr-only')}>
              Low contrast between dots and background — the code may not scan reliably.
            </p>
          </Section>

          <Section title="Colors">
            <div className="space-y-2">
              <FillPicker label="Body" fill={bodyFill} onChange={setBodyFill} />
              <FillPicker label="Eye Frame" fill={eyeFrameFill} onChange={setEyeFrameFill} />
              <FillPicker label="Eye Ball" fill={eyeBallFill} onChange={setEyeBallFill} />
              <FillPicker label="Background" fill={bgFill} onChange={setBgFill} />
            </div>
            <label className="flex items-center gap-2 text-xs text-omni-text/60 cursor-pointer">
              <input
                type="checkbox"
                checked={bgTransparent}
                onChange={(e) => setBgTransparent(e.target.checked)}
                className="accent-omni-primary"
              />
              Transparent background
            </label>
          </Section>

          <Section title="Customize Design">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-omni-text/60 mb-2">Body Shape</p>
                <ShapeGrid options={BODY_SHAPES} value={bodyShape} onChange={setBodyShape} />
              </div>
              <div>
                <p className="text-xs font-medium text-omni-text/60 mb-2">Eye Frame Shape</p>
                <ShapeGrid options={EYE_FRAME_SHAPES} value={eyeFrameShape} onChange={setEyeFrameShape} />
              </div>
              <div>
                <p className="text-xs font-medium text-omni-text/60 mb-2">Eye Ball Shape</p>
                <ShapeGrid options={EYE_BALL_SHAPES} value={eyeBallShape} onChange={setEyeBallShape} />
              </div>
            </div>
          </Section>

          <Section title="Logo">
            <div className="flex items-start gap-3">
              {logoDataUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={logoDataUrl}
                    alt="logo"
                    className="w-16 h-16 rounded-xl object-contain border border-omni-text/10 bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoDataUrl(null)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                    aria-label="Remove logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-16 h-16 rounded-xl border border-dashed border-omni-text/20 text-omni-text/30 hover:text-omni-primary hover:border-omni-primary/50 transition-colors shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[9px] mt-1">Upload</span>
                </button>
              )}
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoInput} className="hidden" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-omni-text/40 w-14">Size</span>
                  <input
                    type="range"
                    min={0.15}
                    max={0.5}
                    step={0.05}
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                    className="flex-1 accent-omni-primary"
                  />
                  <span className="text-[10px] font-mono text-omni-text/40 w-8">{Math.round(logoSize * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-omni-text/40 w-14">Margin</span>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={logoMargin}
                    onChange={(e) => setLogoMargin(parseInt(e.target.value))}
                    className="flex-1 accent-omni-primary"
                  />
                  <span className="text-[10px] font-mono text-omni-text/40 w-8">{logoMargin}px</span>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-omni-text/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideDotsBehindLogo}
                    onChange={(e) => setHideDotsBehindLogo(e.target.checked)}
                    className="accent-omni-primary"
                  />
                  Clear dots behind logo
                </label>
              </div>
            </div>
            <p className="text-[10px] text-omni-text/30">
              PNG, JPG, SVG up to 2MB. Use error correction Q or H for reliable scanning with a logo.
            </p>
          </Section>

          <Section title="Resolution">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-mono font-medium transition-all border',
                    resolution === r
                      ? 'bg-omni-primary text-white border-omni-primary'
                      : 'bg-omni-text/5 text-omni-text/60 border-transparent hover:bg-omni-text/10'
                  )}
                >
                  {r}px
                </button>
              ))}
            </div>
            <p className="text-[10px] text-omni-text/40">
              All exports are square (1:1). SVG is vector and scales infinitely.
            </p>
          </Section>

          <Section title="Error Correction">
            <div className="grid grid-cols-4 gap-2">
              {ECC_LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  title={l.hint}
                  onClick={() => setEcc(l.value)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-bold transition-all border',
                    ecc === l.value
                      ? 'bg-omni-primary text-white border-omni-primary'
                      : 'bg-omni-text/5 text-omni-text/60 border-transparent hover:bg-omni-text/10'
                  )}
                >
                  {l.value}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-omni-text/40">{ECC_LEVELS.find((l) => l.value === ecc)?.hint}</p>
          </Section>

          <Section title="Quiet Zone">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value))}
                className="flex-1 accent-omni-primary"
              />
              <span className="text-xs font-mono text-omni-text/60 w-8">{margin}</span>
            </div>
            <p className="text-[10px] text-omni-text/40">
              Border around the code. 4+ is safest for scanning; 0 looks cleanest on screen.
            </p>
          </Section>

          <div className="flex gap-3">
            <button
              onClick={() => exportQR('png')}
              className="flex-1 py-3 bg-omni-primary text-white rounded-xl font-semibold hover:bg-omni-primary-hover transition-colors"
            >
              Download PNG
            </button>
            <button
              onClick={() => exportQR('svg')}
              className="flex-1 py-3 bg-omni-text/10 text-omni-text rounded-xl font-semibold hover:bg-omni-text/20 transition-colors"
            >
              Download SVG (vector)
            </button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-8 glass-card rounded-[32px] w-full flex justify-center">
            <div
              ref={previewRef}
              className={cn(
                'w-[320px] h-[320px] [&_svg]:w-full [&_svg]:h-full overflow-hidden rounded-xl',
                bgTransparent && '[background-image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%)] [background-size:16px_16px] [background-position:0_0,8px_8px]'
              )}
            />
          </div>
          <div className="flex gap-2 items-center text-[10px] text-omni-text/30">
            <ImageIcon className="w-3 h-3" /> Live preview — scan-test before printing
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportQR('png')}
              className="flex items-center gap-2 px-4 py-2 bg-omni-text/10 rounded-lg text-sm hover:bg-omni-text/20"
            >
              <Download className="w-4 h-4" /> PNG
            </button>
            <button
              onClick={() => exportQR('svg')}
              className="flex items-center gap-2 px-4 py-2 bg-omni-text/10 rounded-lg text-sm hover:bg-omni-text/20"
            >
              <Download className="w-4 h-4" /> SVG
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
