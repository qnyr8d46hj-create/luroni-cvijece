/** Official Luroni Google Business Profile reviews panel — not a search URL. */
export const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Luroni/@45.1678036,14.5416655,17z/data=!4m8!3m7!1s0xa1e7c3e714306c95:0xe2907c3459f0fa4f!8m2!3d45.1678036!4d14.5416655!9m1!1b1!16s%2Fg%2F11n9spslg1'

export function GoogleReviewsBadge() {
  return (
    <a
      href={GOOGLE_REVIEWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="5,0 od 5 na temelju 28 Google recenzija. Otvara recenzije u novoj kartici."
      className="group inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-cream/80 bg-cream/95 px-3.5 py-2.5 text-forest shadow-[0_10px_24px_rgba(10,22,14,0.18)] backdrop-blur-sm transition-all hover:-translate-y-px hover:bg-white hover:shadow-[0_12px_28px_rgba(10,22,14,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
    >
      <GoogleMark />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[0.8125rem] font-semibold leading-none tracking-tight text-ink">
            Google
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-px" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <GoldStar key={index} />
              ))}
            </span>
            <span className="text-[0.8125rem] font-semibold tabular-nums leading-none text-ink">
              5,0/5
            </span>
          </span>
        </span>
        <span className="text-[0.75rem] leading-tight text-muted">
          28 Google recenzija
        </span>
      </span>
    </a>
  )
}

function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function GoldStar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#C4A35A"
        d="M12 2.4l2.47 6.28 6.78.42-5.2 4.18 1.7 6.58L12 16.7l-5.75 3.16 1.7-6.58-5.2-4.18 6.78-.42L12 2.4z"
      />
    </svg>
  )
}
