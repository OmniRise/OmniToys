import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeStyling from 'qr-code-styling'
import bwipjs from 'bwip-js'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Switch } from '@/components/ui/Switch'
import {
  QrCode, Download, Copy, Upload, X, Image as ImageIcon,
  ChevronRight, Type, Palette, Shapes, ImagePlus, FileDown,
  Barcode as BarcodeIcon,
} from 'lucide-react'
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

// ─────────────────────────────────────────────────────────────
// Barcode mode (bwip-js)
// ─────────────────────────────────────────────────────────────

type Mode = 'qr' | 'barcode'

type BcFormat = {
  id: string
  label: string
  group: 'Matrix' | 'Linear'
  hint: string
  placeholder: string
  validate?: (v: string) => string | null
}

const BC_FORMATS: BcFormat[] = [
  { id: 'datamatrix', label: 'DataMatrix', group: 'Matrix', hint: '2D · small parts, logistics', placeholder: 'Any text' },
  { id: 'azteccode', label: 'Aztec', group: 'Matrix', hint: '2D · tickets, boarding passes', placeholder: 'Any text' },
  { id: 'pdf417', label: 'PDF417', group: 'Matrix', hint: '2D stacked · IDs, documents', placeholder: 'Any text' },
  { id: 'code128', label: 'Code 128', group: 'Linear', hint: 'General purpose · any ASCII', placeholder: 'Any text' },
  { id: 'code39', label: 'Code 39', group: 'Linear', hint: 'A-Z 0-9 and - . $ / + % space', placeholder: 'ABC-1234', validate: (v) => /^[A-Z0-9\-.$/+%\s]*$/i.test(v) ? null : 'Letters, digits and - . $ / + % only' },
  { id: 'ean13', label: 'EAN-13', group: 'Linear', hint: 'Retail · check digit auto', placeholder: '590123412345', validate: (v) => /^\d{12,13}$/.test(v) ? null : '12 digits (13th computed)' },
  { id: 'ean8', label: 'EAN-8', group: 'Linear', hint: 'Small retail · check digit auto', placeholder: '9638507', validate: (v) => /^\d{7,8}$/.test(v) ? null : '7 digits (8th computed)' },
  { id: 'upca', label: 'UPC-A', group: 'Linear', hint: 'North America · check digit auto', placeholder: '03600029145', validate: (v) => /^\d{11,12}$/.test(v) ? null : '11 digits (12th computed)' },
  { id: 'upce', label: 'UPC-E', group: 'Linear', hint: 'Compressed UPC', placeholder: '01234565', validate: (v) => /^\d{6,8}$/.test(v) ? null : '6 to 8 digits' },
  { id: 'itf14', label: 'ITF-14', group: 'Linear', hint: 'Shipping containers · check digit auto', placeholder: '1234567890123', validate: (v) => /^\d{13,14}$/.test(v) ? null : '13 digits (14th computed)' },
  { id: 'i2of5', label: 'Interleaved 2of5', group: 'Linear', hint: 'Warehouse · pairs of digits', placeholder: '12345670', validate: (v) => /^\d+$/.test(v) && v.length % 2 === 0 ? null : 'Even number of digits' },
  { id: 'codabar', label: 'Codabar', group: 'Linear', hint: 'Digits wrapped in A-D start/stop', placeholder: 'A1234567890B', validate: (v) => /^[A-Da-d][0-9\-$:./+]*[A-Da-d]$/.test(v) ? null : 'Digits wrapped in A-D start/stop' },
]

/** bwip-js expects bare hex without '#' */
const bareHex = (c: string) => c.replace('#', '')

function hexLuminance(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length !== 6) return 0.5
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const la = hexLuminance(a)
  const lb = hexLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

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
// Apple-style primitives
// ─────────────────────────────────────────────────────────────

/** iOS Settings grouped card: header with value summary + spring-animated body */
function SettingsSection({
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType
  title: string
  summary?: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-omni-text/5 bg-omni-bg/30 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-omni-text/[0.03] active:bg-omni-text/[0.05] transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-[8px] bg-omni-primary/10 text-omni-primary flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-semibold text-omni-text shrink-0">{title}</span>
        <span className="text-xs text-omni-text/40 truncate flex-1 text-right min-w-0">
          {summary}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="text-omni-text/30 shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-omni-text/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** iOS segmented control with sliding indicator */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const groupId = useId()
  return (
    <div className={cn('flex bg-omni-text/5 rounded-[10px] p-0.5 gap-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'relative flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors min-w-0',
            value === o.value ? 'text-omni-text' : 'text-omni-text/45 hover:text-omni-text/75'
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${groupId}`}
              className="absolute inset-0 bg-omni-text/10 rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative z-10 truncate block">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Label-left / control-right settings row */
function Row({
  label,
  hint,
  children,
  stacked,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  stacked?: boolean
}) {
  if (stacked) {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-omni-text/60">{label}</span>
          {hint && <span className="text-[10px] text-omni-text/30">{hint}</span>}
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs font-medium text-omni-text/60 shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0 justify-end">{children}</div>
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
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2 py-2 rounded-lg text-xs font-medium transition-all border',
            value === opt.value
              ? 'bg-omni-primary text-white border-omni-primary shadow-md shadow-omni-primary/20'
              : 'bg-omni-text/5 text-omni-text/55 border-transparent hover:bg-omni-text/10'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Compact color/gradient picker as a settings row */
function FillRow({ label, fill, onChange }: { label: string; fill: Fill; onChange: (f: Fill) => void }) {
  return (
    <div className="space-y-2 rounded-xl border border-omni-text/5 bg-omni-bg/40 p-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-omni-text/60 flex-1 shrink-0">{label}</span>
        <Segmented
          options={[
            { label: 'Solid', value: 'solid' as FillMode },
            { label: 'Lin', value: 'linear' as FillMode },
            { label: 'Rad', value: 'radial' as FillMode },
          ]}
          value={fill.mode}
          onChange={(m) => onChange({ ...fill, mode: m })}
          className="w-36"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(fill.color) ? fill.color : '#000000'}
            onChange={(e) => onChange({ ...fill, color: e.target.value })}
            className="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-omni-text/10"
            aria-label={`${label} color`}
          />
          {fill.mode !== 'solid' && (
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(fill.color2) ? fill.color2 : '#000000'}
              onChange={(e) => onChange({ ...fill, color2: e.target.value })}
              className="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-omni-text/10"
              aria-label={`${label} gradient end color`}
            />
          )}
        </div>
      </div>
      {fill.mode !== 'solid' && (
        <div className="flex items-center gap-2">
          <span
            className="w-full h-4 rounded-md border border-omni-text/10"
            style={{ background: gradientToCss(fill) }}
          />
          <input
            type="range"
            min={0}
            max={6.28}
            step={0.1}
            value={fill.rotation}
            onChange={(e) => onChange({ ...fill, rotation: parseFloat(e.target.value) })}
            className="w-24 accent-omni-primary shrink-0"
            aria-label={`${label} gradient rotation`}
          />
        </div>
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

  // Barcode mode
  const [mode, setMode] = useState<Mode>('qr')
  const [bcFormatId, setBcFormatId] = useState('code128')
  const [bcText, setBcText] = useState('OmniToys-2026')
  const [bcBarColor, setBcBarColor] = useState('#000000')
  const [bcTextColor, setBcTextColor] = useState('#000000')
  const [bcBgColor, setBcBgColor] = useState('#ffffff')
  const [bcTransparent, setBcTransparent] = useState(false)
  const [bcShowText, setBcShowText] = useState(true)
  const [bcModuleSize, setBcModuleSize] = useState(3)
  const [bcPadding, setBcPadding] = useState(8)
  const [bcError, setBcError] = useState<string | null>(null)

  // Collapsible sections (Apple Settings style)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content: true,
    colors: false,
    design: false,
    logo: false,
    export: false,
    bcContent: true,
    bcStyle: false,
    bcExport: false,
  })
  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const previewRef = useRef<HTMLDivElement>(null)
  const bcPreviewRef = useRef<HTMLDivElement>(null)
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
      // Re-append if the container was unmounted by a mode switch (SVG lives in the DOM)
      if (!qrInstanceRef.current || !container.querySelector('svg')) {
        qrInstanceRef.current = new QRCodeStyling(getOptions())
        container.innerHTML = ''
        qrInstanceRef.current.append(container)
      } else {
        qrInstanceRef.current.update(getOptions())
      }
    } catch (err) {
      console.error('[QR Generator] preview update failed:', err)
    }
  }, [getOptions, getQRContent, mode])

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

  // ── Barcode mode (bwip-js) ───────────────────────────────

  const bcFmt = useMemo(
    () => BC_FORMATS.find((f) => f.id === bcFormatId) ?? BC_FORMATS[0],
    [bcFormatId]
  )
  const bcValidationError = useMemo(
    () => (bcText.trim() ? bcFmt.validate?.(bcText) ?? null : null),
    [bcText, bcFmt]
  )

  const buildBarcodeSvg = useCallback((): string => {
    return bwipjs.toSVG({
      bcid: bcFmt.id,
      text: bcText,
      scale: bcModuleSize,
      includetext: bcShowText,
      rotate: 'N',
      barcolor: bareHex(bcBarColor),
      paddingwidth: bcPadding,
      paddingheight: bcPadding,
      ...(bcShowText ? { textcolor: bareHex(bcTextColor) } : {}),
      ...(bcTransparent ? {} : { backgroundcolor: bareHex(bcBgColor) }),
    })
  }, [bcFmt, bcText, bcModuleSize, bcShowText, bcBarColor, bcTextColor, bcTransparent, bcBgColor, bcPadding])

  // Barcode live preview
  useEffect(() => {
    if (mode !== 'barcode') return
    const el = bcPreviewRef.current
    if (!el) return
    if (!bcText.trim() || bcValidationError) {
      el.innerHTML = ''
      setBcError(!bcText.trim() ? null : bcValidationError)
      return
    }
    try {
      el.innerHTML = buildBarcodeSvg()
      const svgEl = el.querySelector('svg')
      if (svgEl) {
        svgEl.setAttribute('width', '100%')
        svgEl.removeAttribute('height')
        svgEl.style.display = 'block'
      }
      setBcError(null)
    } catch (err) {
      el.innerHTML = ''
      setBcError(err instanceof Error ? err.message.replace(/^Error:\s*/, '') : 'Barcode generation failed')
    }
  }, [mode, bcText, bcValidationError, buildBarcodeSvg])

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  /** SVG blob → loaded Image (naturalWidth/Height carry the format's aspect ratio) */
  const svgToImage = async (svg: string): Promise<HTMLImageElement> => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('svg load failed'))
      img.src = url
    })
    URL.revokeObjectURL(url)
    return img
  }

  const exportBarcode = useCallback(
    async (extension: 'png' | 'svg') => {
      try {
        if (!bcText.trim() || bcValidationError) {
          toast.error(bcValidationError ?? 'Enter some content first')
          return
        }
        const svg = buildBarcodeSvg()
        if (extension === 'svg') {
          downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `omnitoys-barcode-${bcFmt.id}.svg`)
          toast.success('SVG downloaded (vector)')
          return
        }
        const img = await svgToImage(svg)
        const w = resolution
        const h = Math.max(1, Math.round((resolution * img.naturalHeight) / img.naturalWidth))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no 2d context')
        ctx.drawImage(img, 0, 0, w, h)
        const pngBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'))
        downloadBlob(pngBlob, `omnitoys-barcode-${bcFmt.id}-${w}px.png`)
        toast.success(`PNG downloaded at ${w}x${h}px`)
      } catch {
        toast.error(`Failed to download ${extension.toUpperCase()}`)
      }
    },
    [bcText, bcValidationError, bcFmt, buildBarcodeSvg, resolution]
  )

  const copyBarcode = useCallback(async () => {
    try {
      if (!bcText.trim() || bcValidationError) {
        toast.error(bcValidationError ?? 'Enter some content first')
        return
      }
      const img = await svgToImage(buildBarcodeSvg())
      const w = 2048
      const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(img, 0, 0, w, h)
      const pngBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
      toast.success('PNG copied to clipboard!')
    } catch {
      toast.error('Failed to copy (browser may not support clipboard images)')
    }
  }, [bcText, bcValidationError, buildBarcodeSvg])

  // ── Mode-aware header actions ────────────────────────────

  const handleExport = useCallback(
    (extension: 'png' | 'svg') => {
      if (mode === 'qr') exportQR(extension)
      else exportBarcode(extension)
    },
    [mode, exportQR, exportBarcode]
  )

  const handleCopy = useCallback(() => {
    if (mode === 'qr') copyToClipboard()
    else copyBarcode()
  }, [mode, copyToClipboard, copyBarcode])

  // ── Contrast warning ─────────────────────────────────────

  const contrastWarning = useMemo(
    () => contrastRatio(bodyFill.color, bgTransparent ? '#ffffff' : bgFill.color) < 3,
    [bodyFill.color, bgFill.color, bgTransparent]
  )

  const bcContrastWarning = useMemo(
    () => contrastRatio(bcBarColor, bcTransparent ? '#ffffff' : bcBgColor) < 3,
    [bcBarColor, bcBgColor, bcTransparent]
  )

  // ── Section summaries (visible when collapsed) ───────────

  const shapeLabel = (shapes: ShapeOption[], v: string) =>
    shapes.find((s) => s.value === v)?.label ?? v

  const contentSummary = `${QR_TYPES.find((t) => t.id === qrType)?.label ?? ''} · ${
    getQRContent().length > 20 ? `${getQRContent().slice(0, 20)}…` : getQRContent() || 'Empty'
  }`

  const colorsSummary = (
    <span className="inline-flex items-center gap-1">
      {[bodyFill, eyeFrameFill, eyeBallFill, bgTransparent ? null : bgFill]
        .filter((f): f is Fill => f !== null)
        .map((f, i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full border border-white/20 inline-block"
            style={{ background: gradientToCss(f) }}
          />
        ))}
      {bgTransparent && <span className="text-[10px]">Transparent</span>}
    </span>
  )

  const designSummary = `${shapeLabel(BODY_SHAPES, bodyShape)} · ${shapeLabel(EYE_FRAME_SHAPES, eyeFrameShape)} · ${shapeLabel(EYE_BALL_SHAPES, eyeBallShape)}`

  const exportSummary = `${resolution}px · ECC ${ecc} · margin ${margin}`

  const bcContentSummary = `${bcFmt.label} · ${
    bcText.length > 16 ? `${bcText.slice(0, 16)}…` : bcText || 'Empty'
  }`
  const bcStyleSummary = bcShowText ? 'Bars + text' : 'Bars only'
  const bcExportSummary = `${resolution}px · module ${bcModuleSize} · quiet ${bcPadding}`

  // ── UI ───────────────────────────────────────────────────

  return (
    <ToolLayout
      title="QR & Barcode Generator"
      description="Styled QR codes — shapes, gradients, logos — plus scanner-safe barcodes: DataMatrix, Aztec, PDF417, Code 128, EAN, UPC and more. Up to 4096px exports."
      icon={<QrCode className="w-8 h-8" />}
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-omni-primary/10 text-omni-primary hover:bg-omni-primary/20 rounded-lg transition-colors font-medium text-sm"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button
            onClick={() => handleExport('png')}
            className="flex items-center gap-2 px-3 py-1.5 bg-omni-text/10 text-omni-text hover:bg-omni-text/20 rounded-lg transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" /> PNG
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: collapsible settings stack */}
        <div className="space-y-3">
          <Segmented
            options={[
              { label: 'QR Code', value: 'qr' as Mode },
              { label: 'Barcode', value: 'barcode' as Mode },
            ]}
            value={mode}
            onChange={(v) => setMode(v)}
            className="w-full sm:max-w-[280px]"
          />
          {mode === 'qr' && (
          <>
          <SettingsSection
            icon={Type}
            title="Content"
            summary={contentSummary}
            open={openSections.content}
            onToggle={() => toggleSection('content')}
          >
            <Segmented
              options={QR_TYPES.map((t) => ({ label: t.label, value: t.id }))}
              value={qrType}
              onChange={(v) => setQrType(v)}
            />

            {qrType === 'wifi' && (
              <div className="space-y-2">
                <input
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  placeholder="Network name (SSID)"
                  className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <input
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <Segmented
                  options={[
                    { label: 'WPA/WPA2', value: 'WPA' as const },
                    { label: 'WEP', value: 'WEP' as const },
                    { label: 'Open', value: 'nopass' as const },
                  ]}
                  value={wifiEncryption}
                  onChange={(v) => setWifiEncryption(v)}
                />
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Message"
                  className="w-full h-16 p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm resize-none"
                />
              </div>
            )}

            {qrType === 'sms' && (
              <div className="space-y-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Phone number"
                  className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
                />
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="SMS message"
                  className="w-full h-16 p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm resize-none"
                />
              </div>
            )}

            {(qrType === 'url' || qrType === 'text' || qrType === 'phone') && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-20 p-3 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm resize-none"
                placeholder={qrType === 'phone' ? '+212 6 12 34 56 78' : 'Enter URL or text'}
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-omni-text/40">{getQRContent().length} characters</span>
              {contrastWarning && (
                <span className="text-[10px] text-amber-400">
                  Low contrast — may not scan reliably
                </span>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Palette}
            title="Colors"
            summary={colorsSummary}
            open={openSections.colors}
            onToggle={() => toggleSection('colors')}
          >
            <div className="space-y-2">
              <FillRow label="Body" fill={bodyFill} onChange={setBodyFill} />
              <FillRow label="Eye Frame" fill={eyeFrameFill} onChange={setEyeFrameFill} />
              <FillRow label="Eye Ball" fill={eyeBallFill} onChange={setEyeBallFill} />
              <FillRow label="Background" fill={bgFill} onChange={setBgFill} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-omni-text/60">Transparent background</span>
              <Switch checked={bgTransparent} onChange={setBgTransparent} />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Shapes}
            title="Design"
            summary={designSummary}
            open={openSections.design}
            onToggle={() => toggleSection('design')}
          >
            <Row label="Body Shape" stacked>
              <ShapeGrid options={BODY_SHAPES} value={bodyShape} onChange={setBodyShape} />
            </Row>
            <Row label="Eye Frame Shape" stacked>
              <ShapeGrid options={EYE_FRAME_SHAPES} value={eyeFrameShape} onChange={setEyeFrameShape} />
            </Row>
            <Row label="Eye Ball Shape" stacked>
              <ShapeGrid options={EYE_BALL_SHAPES} value={eyeBallShape} onChange={setEyeBallShape} />
            </Row>
          </SettingsSection>

          <SettingsSection
            icon={ImagePlus}
            title="Logo"
            summary={logoDataUrl ? 'Added' : 'None'}
            open={openSections.logo}
            onToggle={() => toggleSection('logo')}
          >
            <div className="flex items-start gap-3">
              {logoDataUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={logoDataUrl}
                    alt="logo"
                    className="w-14 h-14 rounded-xl object-contain border border-omni-text/10 bg-white/5"
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
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-dashed border-omni-text/20 text-omni-text/30 hover:text-omni-primary hover:border-omni-primary/50 transition-colors shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">Upload</span>
                </button>
              )}
              <div className="flex-1 space-y-1.5 min-w-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoInput} className="hidden" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-omni-text/40 w-12 shrink-0">Size</span>
                  <input
                    type="range"
                    min={0.15}
                    max={0.5}
                    step={0.05}
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                    className="flex-1 accent-omni-primary"
                  />
                  <span className="text-[10px] font-mono text-omni-text/40 w-8 text-right">
                    {Math.round(logoSize * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-omni-text/40 w-12 shrink-0">Margin</span>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={logoMargin}
                    onChange={(e) => setLogoMargin(parseInt(e.target.value))}
                    className="flex-1 accent-omni-primary"
                  />
                  <span className="text-[10px] font-mono text-omni-text/40 w-8 text-right">{logoMargin}px</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-omni-text/60">Clear dots behind logo</span>
              <Switch checked={hideDotsBehindLogo} onChange={setHideDotsBehindLogo} />
            </div>
            <p className="text-[10px] text-omni-text/30">
              PNG, JPG, SVG up to 2MB. Use error correction Q or H for reliable scanning with a logo.
            </p>
          </SettingsSection>

          <SettingsSection
            icon={FileDown}
            title="Export"
            summary={exportSummary}
            open={openSections.export}
            onToggle={() => toggleSection('export')}
          >
            <Row label="Resolution" hint="1:1 square · SVG is vector" stacked>
              <div className="grid grid-cols-6 gap-1.5">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={cn(
                      'py-2 rounded-lg text-[11px] font-mono font-medium transition-all border',
                      resolution === r
                        ? 'bg-omni-primary text-white border-omni-primary shadow-md shadow-omni-primary/20'
                        : 'bg-omni-text/5 text-omni-text/55 border-transparent hover:bg-omni-text/10'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Error Correction" hint={ECC_LEVELS.find((l) => l.value === ecc)?.hint} stacked>
              <Segmented
                options={ECC_LEVELS.map((l) => ({ label: l.label, value: l.value }))}
                value={ecc}
                onChange={(v) => setEcc(v)}
              />
            </Row>
            <Row label="Quiet Zone" hint="4+ safest for print · 0 cleanest on screen" stacked>
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
                <span className="text-xs font-mono text-omni-text/60 w-4 text-right">{margin}</span>
              </div>
            </Row>
          </SettingsSection>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleExport('png')}
              className="flex-1 py-3 bg-omni-primary text-white rounded-xl font-semibold hover:bg-omni-primary-hover transition-colors active:scale-[0.98]"
            >
              Download PNG
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="flex-1 py-3 bg-omni-text/10 text-omni-text rounded-xl font-semibold hover:bg-omni-text/20 transition-colors active:scale-[0.98]"
            >
              Download SVG (vector)
            </button>
          </div>
          </>
          )}

          {mode === 'barcode' && (
          <>
          <SettingsSection
            icon={BarcodeIcon}
            title="Content"
            summary={bcContentSummary}
            open={openSections.bcContent}
            onToggle={() => toggleSection('bcContent')}
          >
            <div className="space-y-3">
              {(['Matrix', 'Linear'] as const).map((group) => (
                <div key={group} className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-omni-text/30">{group}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BC_FORMATS.filter((f) => f.group === group).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setBcFormatId(f.id)}
                        className={cn(
                          'px-2 py-2 rounded-lg text-[11px] font-medium transition-all border',
                          bcFormatId === f.id
                            ? 'bg-omni-primary text-white border-omni-primary shadow-md shadow-omni-primary/20'
                            : 'bg-omni-text/5 text-omni-text/55 border-transparent hover:bg-omni-text/10'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <input
              value={bcText}
              onChange={(e) => setBcText(e.target.value)}
              placeholder={bcFmt.placeholder}
              className="w-full p-2.5 bg-omni-bg/50 border border-omni-text/10 rounded-xl text-omni-text text-sm"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-omni-text/40">{bcFmt.hint}</span>
              {bcValidationError && (
                <span className="text-[10px] text-amber-400 text-right">{bcValidationError}</span>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Palette}
            title="Style"
            summary={bcStyleSummary}
            open={openSections.bcStyle}
            onToggle={() => toggleSection('bcStyle')}
          >
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-xs font-medium text-omni-text/60 shrink-0">Bar color</span>
              <input
                type="color"
                value={bcBarColor}
                onChange={(e) => setBcBarColor(e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-omni-text/10"
                aria-label="Bar color"
              />
            </div>
            {bcShowText && (
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-xs font-medium text-omni-text/60 shrink-0">Text color</span>
                <input
                  type="color"
                  value={bcTextColor}
                  onChange={(e) => setBcTextColor(e.target.value)}
                  className="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-omni-text/10"
                  aria-label="Text color"
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-xs font-medium text-omni-text/60 shrink-0">Background</span>
              <input
                type="color"
                value={bcBgColor}
                onChange={(e) => setBcBgColor(e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer bg-transparent border border-omni-text/10"
                aria-label="Background color"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-omni-text/60">Transparent background</span>
              <Switch checked={bcTransparent} onChange={setBcTransparent} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-omni-text/60">Human-readable text</span>
              <Switch checked={bcShowText} onChange={setBcShowText} />
            </div>
            <Row label="Module size" hint="Bar / cell thickness" stacked>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={bcModuleSize}
                  onChange={(e) => setBcModuleSize(parseInt(e.target.value))}
                  className="flex-1 accent-omni-primary"
                />
                <span className="text-xs font-mono text-omni-text/60 w-4 text-right">{bcModuleSize}</span>
              </div>
            </Row>
            <Row label="Quiet Zone" hint="2+ safest for scanning" stacked>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={16}
                  step={1}
                  value={bcPadding}
                  onChange={(e) => setBcPadding(parseInt(e.target.value))}
                  className="flex-1 accent-omni-primary"
                />
                <span className="text-xs font-mono text-omni-text/60 w-4 text-right">{bcPadding}</span>
              </div>
            </Row>
            {bcContrastWarning && (
              <p className="text-[10px] text-amber-400">Low contrast — may not scan reliably</p>
            )}
            <p className="text-[10px] text-omni-text/30">
              Shapes and logos are skipped on purpose — linear barcodes must stay scanner-safe. Colors work on every format above.
            </p>
          </SettingsSection>

          <SettingsSection
            icon={FileDown}
            title="Export"
            summary={bcExportSummary}
            open={openSections.bcExport}
            onToggle={() => toggleSection('bcExport')}
          >
            <Row label="Width" hint="Height adapts to the format's aspect ratio" stacked>
              <div className="grid grid-cols-6 gap-1.5">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={cn(
                      'py-2 rounded-lg text-[11px] font-mono font-medium transition-all border',
                      resolution === r
                        ? 'bg-omni-primary text-white border-omni-primary shadow-md shadow-omni-primary/20'
                        : 'bg-omni-text/5 text-omni-text/55 border-transparent hover:bg-omni-text/10'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Row>
          </SettingsSection>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => exportBarcode('png')}
              className="flex-1 py-3 bg-omni-primary text-white rounded-xl font-semibold hover:bg-omni-primary-hover transition-colors active:scale-[0.98]"
            >
              Download PNG
            </button>
            <button
              onClick={() => exportBarcode('svg')}
              className="flex-1 py-3 bg-omni-text/10 text-omni-text rounded-xl font-semibold hover:bg-omni-text/20 transition-colors active:scale-[0.98]"
            >
              Download SVG (vector)
            </button>
          </div>
          </>
          )}
        </div>

        {/* Right: sticky live preview */}
        <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6">
          <div className="p-8 glass-card rounded-[32px] w-full flex justify-center">
            {mode === 'qr' ? (
              <div
                key="qr-preview"
                ref={previewRef}
                className={cn(
                  'w-[320px] h-[320px] [&_svg]:w-full [&_svg]:h-full overflow-hidden rounded-xl',
                  bgTransparent &&
                    '[background-image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%)] [background-size:16px_16px] [background-position:0_0,8px_8px]'
                )}
              />
            ) : (
              <div
                key="bc-preview"
                className="w-full max-w-[320px] min-h-[320px] flex flex-col items-center justify-center gap-3"
              >
                {/* Always mounted — the render effect needs a stable container */}
                <div
                  ref={bcPreviewRef}
                  className={cn('w-full [&_svg]:w-full [&_svg]:h-auto', bcError && 'hidden')}
                />
                {bcError && (
                  <p className="text-sm text-red-400 text-center px-2 break-words">{bcError}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center text-[10px] text-omni-text/30">
            <ImageIcon className="w-3 h-3" /> Live preview — scan-test before printing
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('png')}
              className="flex items-center gap-2 px-4 py-2 bg-omni-text/10 rounded-lg text-sm hover:bg-omni-text/20 active:scale-[0.98] transition-transform"
            >
              <Download className="w-4 h-4" /> PNG
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="flex items-center gap-2 px-4 py-2 bg-omni-text/10 rounded-lg text-sm hover:bg-omni-text/20 active:scale-[0.98] transition-transform"
            >
              <Download className="w-4 h-4" /> SVG
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
