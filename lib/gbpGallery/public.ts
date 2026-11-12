// Plain gallery photo passed from the server to the browser.
// This file must stay free of credentials, Firebase, and Google API code.

export interface PublicGalleryPhoto {
  id: string
  src: string
  alt: string
  createdAt: string
}
