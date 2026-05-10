import { ChevronRight } from 'lucide-react'
import logo from '../assets/ecaveira-logo.png'

function LandingPage({ onEnter }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(220,38,38,0.24),transparent_22rem),radial-gradient(circle_at_20%_90%,rgba(63,63,70,0.20),transparent_24rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/10 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center py-14 text-center">
        <div className="group relative flex items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-red-600/20 blur-3xl motion-safe:animate-pulse sm:h-64 sm:w-64" />
          <div className="absolute h-28 w-28 rounded-full border border-red-500/15 sm:h-44 sm:w-44" />
          <img
            src={logo}
            alt="eCaveira WarGame"
            className="relative w-28 object-contain drop-shadow-[0_0_28px_rgba(248,113,113,0.55)] transition duration-500 ease-out group-hover:scale-105 sm:w-36 md:w-48 lg:w-52"
          />
        </div>

        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-red-300 sm:text-sm">
            Painel de Guerra Comercial
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            eCaveira WarGame
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-zinc-400 sm:text-lg">
            Metas, pipeline, follow-ups e estratégia comercial em tempo real. O
            Ploomes registra. O eCaveira comanda.
          </p>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_34px_rgba(220,38,38,0.32)] transition hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_0_42px_rgba(248,113,113,0.40)] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          Entrar no WarGame
          <ChevronRight size={18} strokeWidth={2.6} />
        </button>

        <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-2 text-left sm:gap-3">
          <Signal label="Metas" value="Sob comando" />
          <Signal label="Pipeline" value="Em combate" />
          <Signal label="Follow-ups" value="No radar" />
        </div>
      </section>
    </main>
  )
}

function Signal({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/45 px-3 py-3 backdrop-blur sm:px-4">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-zinc-200 sm:text-sm">
        {value}
      </p>
    </div>
  )
}

export default LandingPage
