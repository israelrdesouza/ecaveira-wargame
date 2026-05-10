import { CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react'

function PasswordField({
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  placeholder,
  toggleLabel,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
        <LockKeyhole size={16} className="shrink-0 text-zinc-500" />
        <input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-red-300"
          aria-label={toggleLabel}
        >
          {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  )
}

function PasswordStrength({ criteria, strength }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
          Força da senha
        </p>
        <p className={`text-xs font-black uppercase ${strength.text}`}>
          {strength.label}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full transition-all ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className={`flex items-center gap-2 text-xs font-semibold ${
              criterion.valid ? 'text-emerald-300' : 'text-zinc-600'
            }`}
          >
            <CheckCircle2
              size={14}
              className={criterion.valid ? 'text-emerald-400' : 'text-zinc-700'}
            />
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function validatePassword(password, confirmPassword) {
  const failedCriterion = getPasswordCriteria(password, confirmPassword).find(
    (criterion) => !criterion.valid,
  )

  return failedCriterion?.error ?? ''
}

function getPasswordCriteria(password, confirmPassword) {
  return [
    {
      id: 'length',
      label: 'Mínimo de 8 caracteres',
      valid: password.length >= 8,
      error: 'A nova senha deve ter no mínimo 8 caracteres.',
    },
    {
      id: 'uppercase',
      label: 'Uma letra maiúscula',
      valid: /[A-ZÀ-Ý]/.test(password),
      error: 'A nova senha deve conter pelo menos uma letra maiúscula.',
    },
    {
      id: 'lowercase',
      label: 'Uma letra minúscula',
      valid: /[a-zà-ÿ]/.test(password),
      error: 'A nova senha deve conter pelo menos uma letra minúscula.',
    },
    {
      id: 'number',
      label: 'Um número',
      valid: /\d/.test(password),
      error: 'A nova senha deve conter pelo menos um número.',
    },
    {
      id: 'special',
      label: 'Um caractere especial',
      valid: /[^A-Za-zÀ-ÿ0-9]/.test(password),
      error: 'A nova senha deve conter pelo menos um caractere especial.',
    },
    {
      id: 'match',
      label: 'As senhas conferem',
      valid: Boolean(password) && password === confirmPassword,
      error: 'A nova senha e a confirmação precisam ser iguais.',
    },
  ]
}

function getPasswordStrength(password) {
  const mainScore = [
    password.length >= 8,
    /[A-ZÀ-Ý]/.test(password),
    /[a-zà-ÿ]/.test(password),
    /\d/.test(password),
    /[^A-Za-zÀ-ÿ0-9]/.test(password),
  ].filter(Boolean).length

  if (mainScore === 5 && password.length >= 12) {
    return {
      label: 'Excelente',
      width: '100%',
      color: 'bg-emerald-400',
      text: 'text-emerald-300',
    }
  }

  if (mainScore === 5) {
    return {
      label: 'Forte',
      width: '75%',
      color: 'bg-emerald-500',
      text: 'text-emerald-300',
    }
  }

  if (mainScore >= 3) {
    return {
      label: 'Média',
      width: '50%',
      color: 'bg-amber-500',
      text: 'text-amber-300',
    }
  }

  return {
    label: 'Fraca',
    width: '25%',
    color: 'bg-red-600',
    text: 'text-red-300',
  }
}

export {
  PasswordField,
  PasswordStrength,
  getPasswordCriteria,
  getPasswordStrength,
  validatePassword,
}
