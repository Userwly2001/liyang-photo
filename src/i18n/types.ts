export interface Dictionary {
  header: {
    home: string
    gallery: string
    blog: string
    guestbook: string
    about: string
    menuAriaLabel: string
    langSwitchAriaLabel: string
    brand: string
  }
  footer: {
    tagline: string
    navHeading: string
    allGallery: string
    portrait: string
    landscape: string
    food: string
    blogNotes: string
    contactHeading: string
    email: string
    instagram: string
    wechat: string
    copyright: string
    visits: string
  }
  home: {
    hero: {
      topLeft: string
      topRight: string
      archiveLabel: string
      line1: string
      line2: string
      subtitle: string
      enter: string
      enterAriaLabel: string
      brandLine: string
    }
    portal: {
      brandLabel: string
      titleFallback: string
      bioFallback: string
      galleryLabel: string
      galleryEnglish: string
      blogLabel: string
      blogEnglish: string
      aboutNav: string
      guestbookNav: string
      adminNav: string
      coverTitle: string
    }
    featured: {
      label: string
      title: string
      browse: string
      portrait: { name: string; desc: string }
      landscape: { name: string; desc: string }
      food: { name: string; desc: string }
    }
  }
  gallery: {
    collectionLabel: string
    navAll: string
    navPortrait: string
    navLandscape: string
    navFood: string
    navAriaLabel: string
    emptyDefault: string
    emptyPortrait: string
    emptyLandscape: string
    emptyFood: string
    noPhotos: string
    noPhotosHint: string
  }
  blog: {
    pageLabel: string
    pageTitle: string
    pageSubtitle: string
    backToBlog: string
    readMore: string
    noPosts: string
    noPostsHint: string
    notFound: string
    allLabel: string
    allDesc: string
    categories: Record<string, { label: string; desc: string }>
    metaTitle: string
    metaDesc: string
  }
  guestbook: {
    nicknamePlaceholder: string
    contentPlaceholder: string
    uploadHint: string
    uploadLimit: string
    contentRequired: string
    submitFailed: string
    submitted: string
    submitting: string
    submit: string
    anonymous: string
    empty: string
    maxImagesError: string
  }
  about: {
    pageLabel: string
    nameFallback: string
    titleFallback: string
    bioFallback: string
    contactHeading: string
    email: string
    city: string
    instagram: string
    wechat: string
  }
  lightbox: {
    close: string
    previous: string
    next: string
    comments: string
    download: string
    commentHeader: string
    noComments: string
    nicknamePlaceholder: string
    commentPlaceholder: string
    send: string
    submitFailed: string
    anonymous: string
  }
  common: {
    view: string
  }
}
