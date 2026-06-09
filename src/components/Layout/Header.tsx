'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/gallery', label: '相册' },
  { href: '/blog', label: '随笔' },
  { href: '/guestbook', label: '留言' },
  { href: '/about', label: '关于' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname === '/') return null

  const handleNavClick = () => {
    setMobileOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-background/84 backdrop-blur-xl border-b border-accent/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={handleNavClick}
          className="text-lg font-semibold hover:opacity-70 transition-opacity"
        >
          LEON<span className="text-accent/70">PHOTO</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm tracking-wide transition-colors duration-300 ${
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-foreground/46 hover:text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
          aria-label="菜单"
        >
          <span
            className={`block w-5 h-[1.5px] bg-foreground transition-all duration-300 ${
              mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-foreground transition-all duration-300 ${
              mobileOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-foreground transition-all duration-300 ${
              mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-background/96 backdrop-blur-xl border-b border-accent/10 overflow-hidden"
          >
            <ul className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={handleNavClick}
                    className={`block py-3 text-lg transition-colors ${
                      pathname === link.href
                        ? 'text-white'
                        : 'text-foreground/50 hover:text-foreground/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
