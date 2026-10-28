import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { InitialLoader } from './InitialLoader'
import { ReloadPrompt } from '../ui/ReloadPrompt'
import { PWAInstallPrompt } from '../ui/PWAInstallPrompt'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolSearchModal } from '../tools/ToolSearchModal'
import { usePreferences } from '@/store/preferences'
import { useState } from 'react'
import { Breadcrumbs } from './Breadcrumbs'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

// Generate random stream positions once at module load
const streams = Array.from({ length: 20 }).map((_, i) => ({
  key: `stream-${i}`,
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 8}s`,
  animationDuration: `${6 + Math.random() * 4}s`
}))

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export function AppLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { recentTools } = usePreferences()
  const location = useLocation()

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  useKeyboardShortcut(['k'], () => {
    setIsSearchOpen(true)
  }, { ctrl: true, meta: true })

  // Keyboard shortcut for shortcuts help (Cmd+/ / Ctrl+/)
  useKeyboardShortcut(['/'], () => {
    // Could open shortcuts help modal in future
  }, { ctrl: true, meta: true })

  return (
    <div className="min-h-screen bg-omni-bg text-omni-text font-sans selection:bg-omni-primary/30 relative">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-omni-primary focus:text-white focus:rounded-lg focus:z-50 focus:outline-none"
      >
        Skip to main content
      </a>

      <InitialLoader />
      <ReloadPrompt />
      <PWAInstallPrompt />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(37, 40, 38, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 245, 248, 0.1)',
            color: '#f5f5f8',
            borderRadius: '16px'
          }
        }}
      />
      
      {/* Premium Mesh Background */}
      <div className="mesh-bg pointer-events-none overflow-hidden fixed inset-0">
        <div className="mesh-circle w-[600px] h-[600px] bg-omni-primary top-[-15%] right-[-10%] opacity-[0.12] animate-pulse" />
        <div className="mesh-circle w-[500px] h-[500px] bg-blue-600 bottom-[-10%] left-[-10%] opacity-[0.08] animation-delay-2000" style={{ animationDelay: '2s' }} />
        <div className="mesh-circle w-[400px] h-[400px] bg-omni-accent bottom-[30%] right-[-5%] opacity-[0.05] animation-delay-4000" style={{ animationDelay: '4s' }} />
        <div className="mesh-circle w-[300px] h-[300px] bg-purple-600 top-[20%] left-[20%] opacity-[0.03] animate-bounce duration-[15s]" />
        {streams.map((stream) => (
          <div
            key={stream.key}
            className="data-stream"
            style={{
              left: stream.left,
              animationDelay: stream.animationDelay,
              animationDuration: stream.animationDuration
            }}
          />
        ))}
      </div>

      <Sidebar />
      
      {/* Main content */}
      <main
        id="main-content"
        className="pt-20 lg:pt-0 lg:ml-64 min-h-screen relative z-10 transition-all duration-500"
      >
        <div className="max-w-7xl mx-auto p-4 lg:p-10">
          {/* Breadcrumb Navigation */}
          {location.pathname !== '/' && <Breadcrumbs />}

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Subtle Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015] contrast-150 brightness-150 noise-overlay-static mix-blend-overlay" />

      {/* Global Tool Search Modal */}
      <ToolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        recentTools={recentTools}
      />
    </div>
  )
}
