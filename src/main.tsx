import "./app.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { createMissionStore, loadMission } from "./store"
import { registerMissionTools } from "./webmcp"

const store = createMissionStore({
  id: () => crypto.randomUUID().slice(0, 8),
  mission: loadMission(localStorage),
  storage: localStorage,
})

const registration = registerMissionTools(store)
const root = document.querySelector<HTMLDivElement>("#root")

if (root === null) throw new Error("Sidequest root element is missing")

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
