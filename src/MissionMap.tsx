import { COPY } from "./copy"
import type { RouteStopScreen } from "./view-model"

type MissionMapProps = {
  onSelect: (stopId: string) => void
  route: RouteStopScreen[]
}

const googleMapsUrl = (stop: RouteStopScreen) => {
  const url = new URL("https://www.google.com/maps/search/")
  url.searchParams.set("api", "1")
  url.searchParams.set(
    "query",
    `${stop.coordinates[0]},${stop.coordinates[1]}`,
  )
  return url.toString()
}

const appleMapsUrl = (stop: RouteStopScreen) => {
  const url = new URL("https://maps.apple.com/")
  url.searchParams.set("ll", `${stop.coordinates[0]},${stop.coordinates[1]}`)
  url.searchParams.set("q", stop.title)
  return url.toString()
}

const googleEmbedUrl = (stop: RouteStopScreen, apiKey: string) => {
  const url = new URL("https://www.google.com/maps/embed/v1/place")
  url.searchParams.set("key", apiKey)
  url.searchParams.set("q", `${stop.coordinates[0]},${stop.coordinates[1]}`)
  return url.toString()
}

const googlePreviewUrl = (stop: RouteStopScreen) => {
  const url = new URL("https://maps.google.com/maps")
  url.searchParams.set("q", `${stop.coordinates[0]},${stop.coordinates[1]}`)
  url.searchParams.set("z", "15")
  url.searchParams.set("output", "embed")
  return url.toString()
}

export const MissionMap = ({ onSelect, route }: MissionMapProps) => {
  const selected = route.find((stop) => stop.selected) ?? route[0]
  if (selected === undefined) return <p className="empty-log">{COPY.noMapItems}</p>

  const googleUrl = googleMapsUrl(selected)
  const embedKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY

  return (
    <div className="map-launcher">
      <div className="google-map-preview">
        <iframe
          allowFullScreen
          aria-label={`${COPY.googleMapsPreview}: ${selected.title}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={
            typeof embedKey === "string" && embedKey !== ""
              ? googleEmbedUrl(selected, embedKey)
              : googlePreviewUrl(selected)
          }
          tabIndex={-1}
          title={`${COPY.googleMapsPreview}: ${selected.title}`}
        />
        <a
          aria-label={`${COPY.openInGoogleMaps}: ${selected.title}`}
          className="map-preview-link"
          href={googleUrl}
          rel="noopener noreferrer"
          target="_blank"
        />
      </div>

      <div className="map-provider-actions">
        <a href={googleUrl} rel="noopener noreferrer" target="_blank">
          {COPY.openInGoogleMaps}
        </a>
        <a
          href={appleMapsUrl(selected)}
          rel="noopener noreferrer"
          target="_blank"
        >
          {COPY.openInAppleMaps}
        </a>
      </div>

      <div aria-label={COPY.routeItems} className="map-route-list">
        {route.map((stop) => (
          <button
            aria-pressed={stop.selected}
            className={stop.selected ? "is-selected" : ""}
            key={stop.id}
            onClick={() => onSelect(stop.id)}
            type="button"
          >
            <span>{stop.index}</span>
            {stop.title}
          </button>
        ))}
      </div>
    </div>
  )
}
