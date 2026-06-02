import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              LEON<span className="text-white/40">PHOTO</span>
            </h3>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              用镜头捕捉瞬间，用光影讲述故事。人像与风光摄影作品展示。
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-4">导航</h4>
            <ul className="space-y-2">
              {[
                { href: '/portrait', label: '人像作品' },
                { href: '/landscape', label: '风光作品' },
                { href: '/food', label: '美食作品' },
                { href: '/blog', label: '博客' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-4">联系</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>liyang.wang.max@icloud.com</li>
              <li>Instagram</li>
              <li>微信</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-white/20">
          &copy; {new Date().getFullYear()} Leon Wang. 保留所有权利。
        </div>
      </div>
    </footer>
  )
}
