import { Bell, Pencil } from 'lucide-react'

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function SidebarProfileCard({
  collapsed,
  operatorName,
  operatorRole,
  isAdmin,
  notificationCount,
  onOpenProfile,
  onOpenNotifications,
}) {
  const initials = getInitials(operatorName)
  const badge = notificationCount > 9 ? '9+' : notificationCount

  const avatar = (
    <button
      type="button"
      onClick={onOpenProfile}
      title={`Meu perfil — ${operatorName}`}
      aria-label={`Meu perfil — ${operatorName}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-command/30 bg-surface text-xs font-black text-ink transition hover:border-command-hover/50"
    >
      {initials}
    </button>
  )

  const bellButton = isAdmin && (
    <button
      type="button"
      onClick={onOpenNotifications}
      title="Notificações"
      aria-label={`Notificações${notificationCount > 0 ? ` — ${notificationCount} não lidas` : ''}`}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-ink-muted transition hover:border-command-hover/40 hover:text-white"
    >
      <Bell size={14} />
      {notificationCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-surface-strong bg-command px-1 text-[9px] font-black leading-none text-white"
        >
          {badge}
        </span>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2 border-y border-border py-3">
        {avatar}
        {bellButton}
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2.5">
      {avatar}
      <button
        type="button"
        onClick={onOpenProfile}
        title={operatorName}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-black text-white">{operatorName}</p>
        <p className="truncate text-[11px] font-bold text-ink-muted">{operatorRole}</p>
      </button>
      <button
        type="button"
        onClick={onOpenProfile}
        title="Editar perfil"
        aria-label="Editar perfil"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-ink-muted transition hover:border-command-hover/40 hover:text-white"
      >
        <Pencil size={13} />
      </button>
      {bellButton}
    </div>
  )
}

export default SidebarProfileCard
