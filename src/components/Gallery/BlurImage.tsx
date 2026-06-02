'use client'

import Image from 'next/image'

interface BlurImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  onClick?: () => void
  blurDataURL?: string
}

export default function BlurImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onClick,
  blurDataURL,
}: BlurImageProps) {
  // Use a regular img for uploaded content (avoids Next.js Image optimization issues)
  if (src.startsWith('/uploads/')) {
    return (
      <div
        className={`relative overflow-hidden bg-surface ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-surface ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
