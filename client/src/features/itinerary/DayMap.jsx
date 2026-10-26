import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Numbered stops for the selected day, small dots for everything else.
// Built as divIcons so there are no marker image files to break in the build.
const numbered = (n) =>
  L.divIcon({
    className: '',
    html: `<span class="grid size-7 place-items-center rounded-full border-2 border-white bg-[#0f2e24] text-[13px] font-bold text-[#f5c518] shadow">${n}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
const dot = (filled) =>
  L.divIcon({
    className: '',
    html: `<span class="block size-3 rounded-full border-2 border-[#0f2e24] ${filled ? 'bg-[#55605a]' : 'bg-white'}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })

function FitTo({ points }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 13)
    else if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 })
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function DayMap({ destination, plan, active }) {
  const bySlug = useMemo(() => new Map(destination.attractions.map((a) => [a.slug, a])), [destination])
  const located = (slug) => {
    const a = bySlug.get(slug)
    return a && !a.coordsApprox && a.coords ? a : null
  }

  const today = plan[active].map(located).filter(Boolean)
  const otherDays = plan.flatMap((d, i) => (i === active ? [] : d)).map(located).filter(Boolean)
  const planned = new Set(plan.flat())
  const unplanned = destination.attractions.filter((a) => !planned.has(a.slug) && !a.coordsApprox && a.coords)
  const unlocated = plan[active].filter((s) => !located(s)).length

  const pos = (a) => [a.coords.lat, a.coords.lng]
  const focus = today.length ? today.map(pos) : [...otherDays, ...unplanned].map(pos)
  const center = destination.coords ? [destination.coords.lat, destination.coords.lng] : focus[0]

  if (!center) return null

  return (
    <figure>
      <div className="isolate h-64 overflow-hidden rounded-surface border border-line lg:h-72">
        <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="size-full" attributionControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {today.length > 1 && (
            <Polyline positions={today.map(pos)} pathOptions={{ color: '#1e4d3c', weight: 3, dashArray: '6 6' }} />
          )}
          {[...otherDays.map((a) => [a, true]), ...unplanned.map((a) => [a, false])].map(([a, filled]) => (
            <Marker key={a.slug} position={pos(a)} icon={dot(filled)}>
              <Tooltip>{a.name}{filled ? ' (another day)' : ' (not planned)'}</Tooltip>
            </Marker>
          ))}
          {today.map((a) => (
            <Marker key={a.slug} position={pos(a)} icon={numbered(plan[active].indexOf(a.slug) + 1)} zIndexOffset={1000}>
              <Tooltip>{a.name}</Tooltip>
            </Marker>
          ))}
          <FitTo points={focus} />
        </MapContainer>
      </div>
      <figcaption className="mt-1.5 text-xs text-slate">
        Numbers follow day {active + 1}’s order. Dashed lines are straight lines, not roads.
        {unlocated > 0 && ` ${unlocated} stop${unlocated > 1 ? 's have' : ' has'} no exact location, so ${unlocated > 1 ? 'they’re' : 'it’s'} not pinned.`}
      </figcaption>
    </figure>
  )
}
