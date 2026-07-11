import { displayVersion, releaseDate } from '../config/appVersion'

function AppVersion({ showDate = false, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold tracking-wide text-zinc-500 ${className}`}>
      {showDate ? `${displayVersion} • ${releaseDate}` : displayVersion}
    </p>
  )
}

export default AppVersion
