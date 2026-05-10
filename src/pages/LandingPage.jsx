import logo from '../assets/ecaveira-logo.png'

function LandingPage({ onEnter }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(220,38,38,0.24),transparent_22rem),radial-gradient(circle_at_20%_90%,rgba(63,63,70,0.20),transparent_24rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/10 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center py-6 text-center sm:py-8">
        <div className="group relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-red-600/18 blur-3xl motion-safe:animate-pulse sm:h-56 sm:w-56" />
          <div className="absolute h-28 w-28 rounded-full border border-red-500/15 sm:h-40 sm:w-40 md:h-44 md:w-44" />
          <img
            src={logo}
            alt="eCaveira WarGame"
            className="relative w-28 max-w-[42vw] object-contain drop-shadow-[0_0_28px_rgba(248,113,113,0.52)] transition duration-500 ease-out group-hover:scale-105 sm:w-36 md:w-44 lg:w-48"
          />
        </div>

        <div className="mt-7 max-w-3xl sm:mt-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300 sm:text-sm sm:tracking-[0.34em]">
            Painel de Guerra Comercial
          </p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            eCaveira WarGame
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-zinc-400 sm:text-base md:text-lg md:leading-7">
            Metas, pipeline, follow-ups e estratégia comercial em tempo real. O
            Ploomes registra. O eCaveira comanda.
          </p>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_34px_rgba(220,38,38,0.32)] transition hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_0_42px_rgba(248,113,113,0.40)] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black sm:mt-8"
        >
          Entrar
        </button>
      </section>
    </main>
  )
}

export default LandingPage
