export type MapPoint = {
  coordinates: [number, number]
  title: string
}

const coordinates = (point: MapPoint) => point.coordinates.join(",")

export const googleMapsUrl = (point: MapPoint) => {
  const url = new URL("https://www.google.com/maps/search/")
  url.searchParams.set("api", "1")
  url.searchParams.set("query", coordinates(point))
  return url.toString()
}

export const appleMapsUrl = (point: MapPoint) => {
  const url = new URL("https://maps.apple.com/")
  url.searchParams.set("ll", coordinates(point))
  url.searchParams.set("q", point.title)
  return url.toString()
}

export const googleScheduleUrl = (
  origin: MapPoint,
  schedule: MapPoint[],
) => {
  const destination = schedule.at(-1)
  if (destination === undefined) return null

  const url = new URL("https://www.google.com/maps/dir/")
  url.searchParams.set("api", "1")
  url.searchParams.set("origin", coordinates(origin))
  url.searchParams.set("destination", coordinates(destination))
  const waypoints = schedule.slice(0, -1).map(coordinates)
  if (waypoints.length > 0) url.searchParams.set("waypoints", waypoints.join("|"))
  return url.toString()
}
