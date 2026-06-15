import 'server-only'

import type { Metadata } from 'next'
import type { Language } from './settings'

type PageKey = 'home' | 'gallery' | 'portrait' | 'landscape' | 'food' | 'blog' | 'about'

const copy: Record<Language, Record<PageKey, { title: string; description: string; keywords: string[] }>> = {
  zh: {
    home: {
      title: 'LEON WANG | 摄影师 · 工程师 · 写作者',
      description: 'Leon Wang 的个人网站，记录摄影、技术、旅行、生活片段与成长感受。',
      keywords: ['摄影', '工程师', '技术', '旅行', '作品集', '生活随笔', '成长', 'Leon Wang'],
    },
    gallery: {
      title: '相册 | LEONPHOTO',
      description: 'Leon Wang 的摄影作品合集。',
      keywords: ['摄影作品集', '相册', '人像摄影', '风光摄影', 'Leon Wang'],
    },
    portrait: {
      title: '人像作品 | LEONPHOTO',
      description: 'Leon Wang 的人像摄影作品集。',
      keywords: ['人像摄影', '肖像', '摄影作品集', 'Leon Wang'],
    },
    landscape: {
      title: '风光作品 | LEONPHOTO',
      description: 'Leon Wang 的风光与城市摄影作品集。',
      keywords: ['风光摄影', '城市摄影', '旅行摄影', 'Leon Wang'],
    },
    food: {
      title: '美食作品 | LEONPHOTO',
      description: 'Leon Wang 的美食摄影作品集。',
      keywords: ['美食摄影', '静物摄影', '摄影作品集', 'Leon Wang'],
    },
    blog: {
      title: '随笔 | LEONPHOTO',
      description: 'Leon Wang 记录生活片段、成长感受和摄影思考的个人随笔。',
      keywords: ['生活随笔', '摄影手记', '技术', '旅行', 'Leon Wang'],
    },
    about: {
      title: '关于 | LEONPHOTO',
      description: 'Leon Wang，生活在深圳的工程师、摄影者与写作者。',
      keywords: ['Leon Wang', '摄影师', '工程师', '写作者', '深圳'],
    },
  },
  en: {
    home: {
      title: 'LEON WANG | Photographer · Engineer · Writer',
      description: 'The personal website of Leon Wang, featuring photography, technology, travel, and notes on everyday life.',
      keywords: ['photography', 'engineer', 'technology', 'travel', 'portfolio', 'notes', 'Leon Wang'],
    },
    gallery: {
      title: 'Gallery | LEONPHOTO',
      description: 'A collection of photographs by Leon Wang.',
      keywords: ['photography portfolio', 'gallery', 'portrait photography', 'landscape photography', 'Leon Wang'],
    },
    portrait: {
      title: 'Portraits | LEONPHOTO',
      description: 'Portrait photography by Leon Wang.',
      keywords: ['portrait photography', 'portraits', 'photography portfolio', 'Leon Wang'],
    },
    landscape: {
      title: 'Landscapes | LEONPHOTO',
      description: 'Landscape, travel, and city photography by Leon Wang.',
      keywords: ['landscape photography', 'city photography', 'travel photography', 'Leon Wang'],
    },
    food: {
      title: 'Food Photography | LEONPHOTO',
      description: 'Food photography by Leon Wang.',
      keywords: ['food photography', 'still life photography', 'photography portfolio', 'Leon Wang'],
    },
    blog: {
      title: 'Notes | LEONPHOTO',
      description: 'Leon Wang writes about life, growth, photography, technology, and travel.',
      keywords: ['personal notes', 'photography notes', 'technology', 'travel', 'Leon Wang'],
    },
    about: {
      title: 'About | LEONPHOTO',
      description: 'Leon Wang is a Shenzhen-based engineer, photographer, and writer.',
      keywords: ['Leon Wang', 'photographer', 'engineer', 'writer', 'Shenzhen'],
    },
  },
}

export function localizedMetadata(lang: Language, page: PageKey, canonical: string): Metadata {
  const content = copy[lang][page]

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: { canonical },
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'website',
      url: canonical,
      siteName: 'LEON WANG',
      locale: lang === 'zh' ? 'zh_CN' : 'en_US',
    },
    twitter: {
      card: 'summary',
      title: content.title,
      description: content.description,
    },
  }
}
