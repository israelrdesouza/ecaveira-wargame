import logo from '../assets/ecaveira-logo.png'

function BrandMark({ size = 'lg' }) {
  const sizes = {
    md: { halo: 'h-28 w-28 sm:h-36 sm:w-36', ring: 'h-20 w-20 sm:h-28 sm:w-28', logo: 'w-20 sm:w-24' },
    lg: {
      halo: 'h-32 w-32 sm:h-44 sm:w-44',
      ring: 'h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36',
      logo: 'w-24 max-w-[38vw] sm:w-32 md:w-36 lg:w-40',
    },
  }
  const dimensions = sizes[size] ?? sizes.lg

  return (
    <div className="group relative flex items-center justify-center">
      <div
        aria-hidden="true"
        className={`absolute rounded-full bg-command/15 blur-3xl motion-safe:animate-pulse ${dimensions.halo}`}
      />
      <div
        aria-hidden="true"
        className={`absolute rounded-full border border-command/15 ${dimensions.ring}`}
      />
      <img
        src={logo}
        alt="eCaveira WarGame"
        className={`relative object-contain drop-shadow-[0_0_20px_rgb(220_38_38_/_0.35)] transition duration-[var(--duration-base)] ease-out group-hover:scale-105 ${dimensions.logo}`}
      />
    </div>
  )
}

export default BrandMark
