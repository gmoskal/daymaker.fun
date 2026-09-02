import L from "leaflet"
import { useEffect, useRef } from "react"

import type { RouteStopScreen } from "./view-model"

type MissionMapProps = {
  onSelect: (stopId: string) => void
  route: RouteStopScreen[]
}

const DEFAULT_CENTER: L.LatLngExpression = [43.3573, 16.9507]

export const MissionMap = ({ onSelect, route }: MissionMapProps) => {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const routeLayer = useRef<L.LayerGroup | null>(null)
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect

  useEffect(() => {
    if (container.current === null) return

    const instance = L.map(container.current, {
      attributionControl: true,
      scrollWheelZoom: false,
      zoomControl: false,
    }).setView(DEFAULT_CENTER, 12)
    L.control.zoom({ position: "bottomright" }).addTo(instance)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(instance)
    map.current = instance

    return () => {
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (instance === null) return

    routeLayer.current?.remove()
    const group = L.layerGroup().addTo(instance)
    routeLayer.current = group
    const coordinates = route.map((stop) => stop.coordinates)

    if (coordinates.length > 1) {
      L.polyline(coordinates, {
        color: "#f1663a",
        dashArray: "7 9",
        opacity: 0.95,
        weight: 3,
      }).addTo(group)
    }

    route.forEach((stop) => {
      const marker = L.marker(stop.coordinates, {
        icon: L.divIcon({
          className: "route-pin-wrap",
          html: `<span class="route-pin${stop.selected ? " is-selected" : ""}">${stop.index}</span>`,
          iconAnchor: [18, 18],
          iconSize: [36, 36],
        }),
        keyboard: true,
        title: stop.title,
      }).addTo(group)
      marker.on("click", () => selectRef.current(stop.id))
    })

    if (coordinates.length === 1 && coordinates[0] !== undefined) {
      instance.setView(coordinates[0], 13, { animate: false })
    } else if (coordinates.length > 1) {
      instance.fitBounds(L.latLngBounds(coordinates), {
        animate: false,
        padding: [32, 32],
      })
    }
  }, [route])

  return (
    <div className="mission-map-wrap">
      <div
        aria-label="Interactive mission route map"
        className="mission-map"
        ref={container}
        role="region"
      />
      <div className="map-route-list" aria-label="Route stops">
        {route.map((stop) => (
          <button
            aria-pressed={stop.selected}
            className={stop.selected ? "is-selected" : ""}
            key={stop.id}
            onClick={() => onSelect(stop.id)}
            type="button"
          >
            <span>{stop.index}</span>{stop.title}
          </button>
        ))}
      </div>
    </div>
  )
}
