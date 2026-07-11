import AnimatedNumber from '../AnimatedNumber'
import { formatCurrencyBRL } from '../../utils/formatters'

function ExecutiveSummary({
  fechamentosRealizado,
  fechamentosMeta,
  fechamentosPercentual,
  fechamentosFaltante,
  pipelineEmJogo,
  animationKey,
  animationDelay = 0,
}) {
  const items = [
    {
      key: 'fechamentos',
      label: 'Fechamentos do mês',
      value: (
        <>
          <AnimatedNumber value={fechamentosRealizado} animationKey={animationKey} />{' '}
          <span className="text-lg text-zinc-500">/ {fechamentosMeta}</span>
        </>
      ),
    },
    {
      key: 'percentual',
      label: 'Meta do mês atingida',
      value: (
        <AnimatedNumber value={fechamentosPercentual} suffix="%" animationKey={animationKey} />
      ),
    },
    {
      key: 'saldo',
      label: 'Saldo para a meta',
      value: <AnimatedNumber value={fechamentosFaltante} animationKey={animationKey} />,
    },
    {
      key: 'pipeline',
      label: 'Pipeline ativo',
      value: (
        <AnimatedNumber
          value={pipelineEmJogo}
          format={formatCurrencyBRL}
          animationKey={animationKey}
        />
      ),
    },
  ]

  return (
    <div
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-dashboard-enter grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="min-w-0 rounded-lg border border-white/10 bg-zinc-900/70 p-3 shadow-lg shadow-black/20 backdrop-blur sm:p-4"
        >
          <p className="break-words text-xs font-black uppercase leading-4 tracking-[0.14em] text-zinc-500">
            {item.label}
          </p>
          <p className="mt-2 truncate text-xl font-black leading-none text-white sm:text-2xl">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ExecutiveSummary
