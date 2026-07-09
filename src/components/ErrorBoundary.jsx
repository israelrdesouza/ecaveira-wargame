import { Component } from 'react'
import logo from '../assets/ecaveira-logo.png'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro fatal capturado pelo ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(220,38,38,0.22),transparent_22rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
          </div>

          <section className="relative w-full max-w-md rounded-lg border border-red-500/25 bg-zinc-950/80 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl">
            <img
              src={logo}
              alt="eCaveira WarGame"
              className="mx-auto mb-4 w-16 object-contain drop-shadow-[0_0_28px_rgba(248,113,113,0.52)]"
            />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Falha ao carregar
            </p>
            <h1 className="mt-3 text-xl font-black text-white">
              Não foi possível carregar o eCaveira.
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Atualize a página ou tente novamente.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-500"
            >
              Recarregar sistema
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
