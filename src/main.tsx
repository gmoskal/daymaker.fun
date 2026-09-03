import "./app.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { readSessionUrl, withoutSessionFragment } from "./session-link"
import {
  createMissionStore,
  importSharedMission,
  loadMission,
} from "./store"
import { registerMissionTools } from "./webmcp"

const root = document.querySelector<HTMLDivElement>("#root")

if (root === null) throw new Error("Sidequest root element is missing")

const start = async () => {
  const pageUrl = new URL(window.location.href)
  const shared = await readSessionUrl({ url: pageUrl })
  if (shared.type === "loaded")
    importSharedMission({ storage: localStorage, value: shared.mission })
  if (shared.type !== "none")
    window.history.replaceState(null, "", withoutSessionFragment(pageUrl))

  const store = createMissionStore({
    id: () => crypto.randomUUID().slice(0, 8),
    mission: loadMission(localStorage),
    storage: localStorage,
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
