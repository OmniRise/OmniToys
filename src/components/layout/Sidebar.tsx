import { NavLink, Link } from 'react-router-dom'
import {
  Home, Layout, Settings,
  Github, X, Terminal, FlaskConical, Clock
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import logo from '@/assets/icons/OmniToys(WebIcon).png'
import { usePreferences } from '@/store/preferences'
import { ALL_TOOLS } from '@/constants/tools'
import { AppSwitcher } from '@/components/navigation/AppSwitcher'

const primaryNav = [
  { to: '/', icon: <Home className="w-5 h-5" />, label: 'Lab Home' },
  { to: '/tools', icon: <Layout className="w-5 h-5" />, label: 'All Tools' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { favorites, recentTools } = usePreferences()

  const pinnedTools = useMemo(() =>
    ALL_TOOLS.filter(t => favorites.includes(t.id)).slice(0, 5),
    [favorites])

  const recent = useMemo(() =>
    ALL_TOOLS.filter(t => recentTools.includes(t.id)).slice(0, 5),
    [recentTools])

  return (
    <>
      {/* Mobile Toggle */}
      {/* Mobile Terminal Toggle */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-8 right-8 z-50 p-4 bg-omni-primary text-white rounded-2xl shadow-[0_0_30px_rgba(223,28,38,0.4)] flex items-center justify-center border border-white/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Terminal className="w-6 h-6" />}
      </motion.button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-omni-bg/40 backdrop-blur-3xl border-r border-white/5 transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Synthetic Noise & Mesh Gradient Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay noise-overlay-static" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-omni-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Brand Logo - Enhanced */}
          <Link to="/" className="flex flex-col gap-5 mb-12 group" onClick={() => setIsOpen(false)}>
            <div className="relative">
              <div className="w-16 h-16 flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 bg-omni-text/5 rounded-3xl border border-white/5 group-hover:border-omni-primary/30 relative z-10 overflow-hidden shadow-2xl shadow-black/50">
                 <img src={logo} alt="OmniToys Logo" className="w-full h-full object-contain p-2" />

                 <div className="absolute inset-0 bg-gradient-to-br from-omni-primary/10 to-transparent group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-omni-primary/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-omni-text font-mono tracking-tighter leading-none group-hover:text-white transition-all duration-500">
                OMNI<span className="text-omni-primary neon-text">TOYS</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative">
                  <span className="block w-2 h-2 bg-green-500 rounded-full" />
                  <span className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
                <p className="text-[10px] text-omni-primary font-black uppercase tracking-[0.2em] opacity-80">Link: Authorized</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-10 pr-2">
            {/* Primary Navigation */}
            <nav className="space-y-1.5">
              <p className="text-[10px] text-omni-text/10 font-black uppercase tracking-widest ml-4 mb-4 font-mono">/ ROOT_CA</p>
              {primaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-black transition-all duration-500 group relative overflow-hidden
                    ${isActive
                      ? 'bg-omni-primary/10 text-white border border-omni-primary/30 shadow-[0_0_25px_rgba(223,28,38,0.15)]'
                      : 'text-omni-text/30 hover:text-omni-text hover:bg-white/5 hover:translate-x-1 border border-transparent'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-omni-primary rounded-full neon-glow" />
                      )}
                      <div className={`transition-all duration-500 ${isActive ? 'text-omni-primary scale-110 drop-shadow-[0_0_8px_rgba(223,28,38,0.6)]' : 'group-hover:scale-110 group-hover:text-omni-primary/60'}`}>
                        {item.icon}
                      </div>
                      <span className="tracking-tight">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Pinned Gear - Enhanced Display */}
            {pinnedTools.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-4 mb-4">
                   <FlaskConical className="w-3.5 h-3.5 text-omni-primary/40" />
                   <p className="text-[10px] text-omni-text/10 font-black uppercase tracking-widest font-mono">/ PINNED_MODULES</p>
                </div>
                <div className="space-y-1">
                  {pinnedTools.map(tool => (
                    <Link
                      key={tool.id}
                      to={tool.to}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 rounded-xl text-[11px] font-black text-omni-text/30 hover:text-omni-primary hover:bg-omni-primary/10 transition-all group border border-transparent hover:border-omni-primary/10"
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-omni-text/20 group-hover:text-omni-primary transition-all group-hover:scale-110">
                         {tool.icon}
                      </div>
                      <span className="truncate tracking-tight">{tool.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tools - Styled as Terminal Logs */}
            {recent.length > 0 && (
              <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-4 mb-4">
                    <Clock className="w-3.5 h-3.5 text-omni-text/10" />
                    <p className="text-[10px] text-omni-text/10 font-black uppercase tracking-widest font-mono">/ RECENT_ACCESS</p>
                 </div>
                 <div className="space-y-1">
                   {recent.map(tool => (
                     <Link
                       key={tool.id}
                       to={tool.to}
                       onClick={() => setIsOpen(false)}
                       className="flex items-center gap-3 px-5 py-3 rounded-xl text-[11px] font-black text-omni-text/30 hover:text-omni-primary hover:bg-omni-primary/10 transition-all group border border-transparent hover:border-omni-primary/10"
                     >
                       <div className="w-5 h-5 flex items-center justify-center text-omni-text/20 group-hover:text-omni-primary transition-all group-hover:scale-110">
                          {tool.icon}
                       </div>
                       <span className="truncate tracking-tight">{tool.title}</span>
                     </Link>
                   ))}
                 </div>
              </div>
            )}

            {/* System Controls */}
            <nav className="space-y-1.5">
              <p className="text-[10px] text-omni-text/10 font-black uppercase tracking-widest ml-4 mb-4 font-mono">/ SYS_CORE</p>

              {/* App Switcher */}
              <AppSwitcher variant="sidebar" />

              <NavLink
                to="/settings"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-black transition-all duration-500 group relative overflow-hidden
                  ${isActive
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-omni-text/30 hover:text-white hover:bg-white/5 hover:translate-x-1 border border-transparent'}
                `}
              >
                <div className="w-5 h-5 flex items-center justify-center transition-all duration-500 group-hover:rotate-180">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="tracking-tight">System Config</span>
              </NavLink>
            </nav>
          </div>

          {/* Lab Stats Section - High Tech Re-design */}
          <div className="pt-8 border-t border-white/5 space-y-5">
            <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-omni-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-omni-text/30 font-mono">Synthesis</span>
                   <span className="text-omni-primary neon-text font-mono">70/70 UNIT</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
                   <div className="h-full bg-omni-primary neon-glow-primary w-[95%] transition-all duration-1000 ease-in-out" />
                 </div>
                 <div className="flex items-center gap-2.5 text-[9px] text-omni-text/40 font-black uppercase tracking-[0.1em] font-mono">
                   <div className="flex items-center gap-1.5">
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-omni-primary rounded-full" />
                       <span>v0.5.0</span>
                     </div>
                     <span className="w-px h-2 bg-white/10" />
                     <span className="text-omni-text/20 font-bold">NODE_01</span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Contribution - Refined integration */}
            <a
              href="https://github.com/Manak-hash/OmniToys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black text-omni-text/20 hover:text-omni-primary hover:bg-omni-primary/5 transition-all group border border-transparent hover:border-omni-primary/10"
            >
              <Github className="w-4 h-4 transition-transform group-hover:scale-125 group-hover:rotate-12" />
              <span className="uppercase tracking-widest font-mono">Link_Source</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay - Premium Blur */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 lg:hidden transition-opacity duration-1000"
        />
      )}
    </>
  )
}
