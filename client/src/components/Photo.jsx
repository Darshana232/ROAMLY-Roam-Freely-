import { useState } from 'react'
import { ImageOff } from 'lucide-react'

// Wikimedia serves thumbnails only at standard widths (640 returns 400).
const WIDTHS = [330, 500, 960, 1280, 1920]

function srcSet(image) {
  if (!/\/\d+px-/.test(image.src)) return undefined
  return WIDTHS.filter((w) => w <= image.width)
    .map((w) => `${image.src.replace(/\/\d+px-/, `/${w}px-`)} ${w}w`)
    .join(', ')
}

// Real Wikimedia Commons photos, always credited. If an image is missing or
// fails to load we say so instead of showing an empty grey box.
export default function Photo({ image, alt, className = '', sizes, credit = true, priority = false }) {
  const [failed, setFailed] = useState(false)

  if (!image?.src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 rounded-photo bg-ghat-100 text-slate ${className}`}>
        <ImageOff className="size-5" aria-hidden />
        <span className="text-xs">No free photo available</span>
      </div>
    )
  }

  return (
    <figure className={`relative overflow-hidden rounded-photo bg-ghat-100 ${className}`}>
      <img
        src={image.src}
        srcSet={srcSet(image)}
        alt={alt}
        title={credit ? undefined : `Photo: ${image.author}, ${image.license}`}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
      {credit && (
        <figcaption className="absolute bottom-1.5 right-1.5 max-w-[85%] truncate rounded bg-asphalt/70 px-1.5 py-0.5 text-[11px] text-white/90">
          <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {image.author}, {image.license}
          </a>
        </figcaption>
      )}
    </figure>
  )
}
