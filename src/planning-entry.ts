import { MISSION_STORAGE_KEY, type StoragePort } from "./store"

const NEW_PLAN_QUERY_KEY = "new"

type ConsumeNewPlanEntryParams = {
  source: string | URL
  storage: StoragePort
}

export const newPlanEntryUrl = (baseUrl: string) => {
  const url = new URL("/needs", baseUrl)
  url.searchParams.set(NEW_PLAN_QUERY_KEY, "1")
  return url.toString()
}

export const consumeNewPlanEntry = ({
  source,
  storage,
}: ConsumeNewPlanEntryParams): string | null => {
  const url = new URL(source)
  if (url.searchParams.get(NEW_PLAN_QUERY_KEY) !== "1") return null

  storage.removeItem(MISSION_STORAGE_KEY)
  url.searchParams.delete(NEW_PLAN_QUERY_KEY)
  return `${url.pathname}${url.search}${url.hash}`
}
