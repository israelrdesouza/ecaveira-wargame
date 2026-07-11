import logo from '../../assets/ecaveira-logo.png'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  newLead: 'Novo Lead',
  goals: 'Metas',
  reports: 'Relatórios',
  admin: 'Administração',
}

function getPageTitle(pageId) {
  return PAGE_TITLES[pageId] ?? ''
}

function MobileAppHeader({ currentPage }) {
  const title = getPageTitle(currentPage)

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface-strong/95 px-4 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)] backdrop-blur-xl lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-command/20 bg-black/25">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="h-[18px] w-[18px] object-contain"
          />
        </span>
        <span className="flex min-w-0 items-baseline gap-1 truncate">
          <span className="text-[12px] font-black tracking-tight text-white">eCaveira</span>
          <span className="text-[12px] font-black tracking-tight text-command-hover">WarGame</span>
        </span>
      </div>

      {title && (
        <p className="min-w-0 flex-1 truncate text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          {title}
        </p>
      )}
    </header>
  )
}

export default MobileAppHeader
