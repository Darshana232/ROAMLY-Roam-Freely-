// The kilometre stone: Roamly's signature element. A yellow cap with the
// place name over a white stone with the approximate road distance.
const SIZES = {
  sm: { w: 'w-[88px]', name: 'text-[11px] leading-tight', km: 'text-[26px]', unit: 'text-[11px]' },
  md: { w: 'w-[120px]', name: 'text-[13px] leading-tight', km: 'text-[38px]', unit: 'text-xs' },
  lg: { w: 'w-[156px]', name: 'text-[15px] leading-tight', km: 'text-[52px]', unit: 'text-sm' },
}

export default function Milestone({ name, km, size = 'md', className = '' }) {
  const s = SIZES[size]
  return (
    <div
      className={`${s.w} shrink-0 overflow-hidden rounded-t-full border-2 border-ghat-900 bg-white text-center ${className}`}
      role="img"
      aria-label={`${name}, about ${km} kilometres by road from Bengaluru`}
    >
      <div className="flex aspect-[2/1] items-end justify-center bg-milestone px-3 pb-1.5">
        <span className={`line-clamp-2 font-bold text-asphalt ${s.name}`} style={{ fontVariationSettings: `'wdth' ${name.length > 12 ? 66 : 88}` }}>
          {name}
        </span>
      </div>
      <div className="border-t-2 border-ghat-900 px-2 pb-2 pt-1">
        <span className={`num font-condensed font-extrabold leading-none text-ghat-900 ${s.km}`}>{km}</span>
        <span className={`ml-0.5 font-semibold text-slate ${s.unit}`}>km</span>
      </div>
    </div>
  )
}
