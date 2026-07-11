import BrandMark from '../components/BrandMark'
import PageBackground from '../components/PageBackground'
import Button from '../components/ui/Button'

function LandingPage({ onEnter }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg px-5 text-ink antialiased">
      <PageBackground />

      <section className="relative mx-auto flex min-h-dvh w-full max-w-[var(--container-content)] flex-col items-center justify-center py-6 text-center sm:py-8">
        <BrandMark />

        <div className="mt-7 max-w-3xl sm:mt-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-command-hover sm:text-sm sm:tracking-[0.34em]">
            Cockpit Comercial
          </p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            eCaveira WarGame
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-ink-secondary sm:text-base md:text-lg md:leading-7">
            Metas, pipeline e follow-ups sob comando único. O Ploomes registra
            a operação. O eCaveira comanda a estratégia.
          </p>
        </div>

        <Button onClick={onEnter} className="mt-7 sm:mt-8">
          Entrar
        </Button>
      </section>
    </main>
  )
}

export default LandingPage
