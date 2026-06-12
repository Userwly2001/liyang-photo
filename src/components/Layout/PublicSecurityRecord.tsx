const RECORD_URL = 'https://beian.mps.gov.cn/#/query/webSearch?code=34088102000698'

export default function PublicSecurityRecord({ className = '' }: { className?: string }) {
  return (
    <a
      href={RECORD_URL}
      rel="noreferrer"
      target="_blank"
      className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground/70 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/beian.png" alt="" width={18} height={20} aria-hidden="true" />
      <span>皖公网安备34088102000698号</span>
    </a>
  )
}
