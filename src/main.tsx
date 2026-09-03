import "./app.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { PERSONAL_MISSION_ID } from "./domain/mission"
import { createBlankMission } from "./domain/seed"
import { consumeNewPlanEntry } from "./planning-entry"
import { readSessionUrl } from "./session-link"
import { createMissionStore, type StoragePort } from "./store"
import { registerMissionTools } from "./webmcp"

const root = document.querySelector<HTMLDivElement>("#root")

if (root === null) throw new Error("Sidequest root element is missing")

const memoryStorage: StoragePort = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

const start = async () => {
  const id = () => crypto.randomUUID().slice(0, 8)
  const personalMissionId = () => `${PERSONAL_MISSION_ID}-${id()}`
  const pageUrl = new URL(window.location.href)
  const shared = await readSessionUrl(pageUrl)
  const newPlanPath =
    shared.type === "none"
      ? consumeNewPlanEntry({ source: pageUrl, storage: memoryStorage })
      : null
  if (shared.type === "none" && newPlanPath !== null)
    window.history.replaceState(null, "", newPlanPath)

  const store = createMissionStore({
    id,
    mission:
      shared.type === "loaded"
        ? shared.mission
        : createBlankMission(
            new Date(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            personalMissionId(),
          ),
    storage: memoryStorage,
  })
  const registration = registerMissionTools(store)

  createRoot(root).render(
    <StrictMode>
      <App registration={registration} store={store} />
    </StrictMode>,
  )

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      void registration.then((result) => result.dispose())
    })
  }
}

void start()
