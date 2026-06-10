'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from '@/i18n/useLanguage'
import type { PhotoGroupType } from '@/types'

export default function GroupGrid({ groups }: { groups: PhotoGroupType[] }) {
  const { t } = useLanguage()

  if (!groups.length) {
    return <div className="py-28 text-center text-sm text-foreground/30">{t.gallery.noGroups}</div>
  }

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group, index) => (
        <motion.article
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: Math.min(index * 0.07, 0.35) }}
        >
          <Link href={`/gallery/group/${group.id}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.025]">
              {group.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.coverImage}
                  alt={group.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.22em] text-foreground/15">
                  {t.gallery.awaitingPhotos}
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-accent/75">{group.category}</p>
                  <h2 className="text-xl font-medium text-white">{group.title}</h2>
                </div>
                <span className="shrink-0 border-l border-accent/35 pl-3 text-[10px] uppercase tracking-[0.2em] text-white/55">
                  {group.photoCount} {t.gallery.frames}
                </span>
              </div>
            </div>
            <div className="flex items-start justify-between gap-5 border-b border-white/10 py-4 transition-colors group-hover:border-accent/45">
              <p className="line-clamp-2 text-xs leading-6 text-foreground/38">
                {group.description || [group.location, group.shotAt?.slice(0, 10)].filter(Boolean).join(' · ') || t.gallery.openGroup}
              </p>
              <span className="shrink-0 text-accent/65 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </motion.article>
      ))}
    </div>
  )
}
