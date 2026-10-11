import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'

export default function ArtificialCatalogLoading() {
  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
          <div className="max-w-3xl mb-12">
            <div className="h-10 w-4/5 max-w-xl rounded-lg bg-divider/80 animate-pulse mb-4" />
            <div className="h-4 w-full max-w-lg rounded bg-divider/60 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {['a', 'b', 'c'].map(key => (
              <div
                key={key}
                className="rounded-3xl overflow-hidden bg-white border border-divider"
              >
                <div className="aspect-[3/4] bg-[#f3eee8] animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-2/3 rounded bg-divider/70 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-divider/50 animate-pulse" />
                  <div className="h-10 w-full rounded-full bg-divider/40 animate-pulse mt-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
