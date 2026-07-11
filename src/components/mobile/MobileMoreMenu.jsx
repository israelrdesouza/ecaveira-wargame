import { Bell, ClipboardList, LogOut, UserRound, UsersRound, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import AppVersion from '../AppVersion'

function MobileMoreMenu({
  isOpen,
  onClose,
  onNavigate,
  isAdmin,
  onOpenProfile,
  onOpenNotifications,
  onSignOut,
}) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  function runAndClose(action) {
    onClose()

    if (action) {
      requestAnimationFrame(action)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mais opções"
        className="relative w-full max-w-lg rounded-t-xl border-t border-border bg-surface-strong pb-[max(env(safe-area-inset-bottom),16px)] shadow-[var(--shadow-panel-elevated)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ink-muted">
            Mais opções
          </p>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink-muted transition hover:border-command-hover/40 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-1 px-3 py-3">
          <MenuItem
            icon={ClipboardList}
            label="Relatórios"
            onClick={() => runAndClose(() => onNavigate('reports'))}
          />
          <MenuItem
            icon={UserRound}
            label="Meu perfil"
            onClick={() => runAndClose(onOpenProfile)}
          />
          {isAdmin && (
            <MenuItem
              icon={Bell}
              label="Notificações"
              onClick={() => runAndClose(onOpenNotifications)}
            />
          )}
          {isAdmin && (
            <MenuItem
              icon={UsersRound}
              label="Administração"
              onClick={() => runAndClose(() => onNavigate('admin'))}
            />
          )}
        </div>

        <div className="border-t border-border px-3 py-3">
          <button
            type="button"
            onClick={() => runAndClose(onSignOut)}
            className="flex h-11 w-full items-center gap-3 rounded-md border border-command/20 bg-surface px-3 text-sm font-black text-ink-secondary transition hover:border-command-hover/45 hover:bg-command-soft hover:text-white"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        <div className="px-4 pb-3 pt-1 text-center">
          <AppVersion showDate />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-md border border-transparent px-3 text-sm font-bold text-ink-secondary transition hover:border-border hover:bg-white/[0.045] hover:text-ink"
    >
      <Icon size={18} strokeWidth={2.2} />
      {label}
    </button>
  )
}

export default MobileMoreMenu
