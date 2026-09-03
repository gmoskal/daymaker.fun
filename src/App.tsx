import { useEffect, useState, type FocusEvent, type KeyboardEvent } from "react"

import { COPY } from "./copy"
import { MissionWorkspace } from "./MissionWorkspace"
import type { MissionStore } from "./store"
import { useMissionViewModel } from "./useMissionViewModel"
import type { MissionScreen, ViewAction } from "./view-model"
import type { WebMcpRegistration } from "./webmcp"

type AppProps = {
  registration: Promise<WebMcpRegistration>
  store: MissionStore
}

type MissionViewProps = {
  dispatch: (action: ViewAction) => void
  screen: MissionScreen
}

const TitleEditor = ({
  dispatch,
  title,
}: {
  dispatch: (action: ViewAction) => void
  title: string
}) => {
  const commit = (event: FocusEvent<HTMLSpanElement>) => {
    const next = event.currentTarget.textContent?.trim() ?? ""
    if (next === "" || next === title) {
      event.currentTarget.textContent = title
      return
    }
    dispatch({ title: next, type: "SetTitle" })
  }
  const handleKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    event.currentTarget.blur()
  }

  return (
    <h1>
      <span
        aria-label={COPY.boardTitle}
        contentEditable
        key={title}
        onBlur={commit}
        onKeyDown={handleKey}
        role="textbox"
        suppressContentEditableWarning
      >
        {title}
      </span>
    </h1>
  )
}

const MenuIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M5 7h14M5 12h14M5 17h14" />
  </svg>
)

const PlusIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const MissionView = ({ dispatch, screen }: MissionViewProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusTarget, setFocusTarget] = useState<"item" | "requirement" | null>(
    null,
  )

  useEffect(() => {
    if (focusTarget === null) return
    const target = document.querySelector<HTMLInputElement>(
      focusTarget === "requirement" ? "#add-requirement" : "#add-item",
    )
    if (target === null) return
    target.focus()
    setFocusTarget(null)
  }, [focusTarget, screen.workspace.type])

  const add = () => {
    setMenuOpen(false)
    if (screen.workspace.type === "context") {
      setFocusTarget("requirement")
      return
    }
    if (screen.workspace.type !== "plan")
      dispatch({ panel: "plan", type: "SelectPanel" })
    setFocusTarget("item")
  }

  return (
    <main className="app-shell" id="mission">
      <header className="board-title">
        <TitleEditor dispatch={dispatch} title={screen.missionTitle} />
      </header>

      <section
        aria-label={`${screen.date.weekday}, ${screen.date.day} ${screen.date.month} ${screen.date.year}`}
        className="date-block"
      >
        <strong>{screen.date.day}</strong>
        <span>
          <b>{screen.date.weekday}</b>
          {screen.date.month} {screen.date.year}
        </span>
      </section>

      <MissionWorkspace
        dispatch={dispatch}
        key={`${screen.revision}-${screen.workspace.type}`}
        workspace={screen.workspace}
      />

      {menuOpen ? (
        <nav aria-label={COPY.missionViews} className="floating-menu" role="tablist">
          {screen.navigation.map((item) => (
            <button
              aria-selected={item.active}
              className={item.active ? "is-active" : ""}
              key={item.id}
              onClick={() => {
                dispatch({ panel: item.id, type: "SelectPanel" })
                setMenuOpen(false)
              }}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
          <span className={`connection connection--${screen.webMcp.tone}`}>
            <i aria-hidden="true" />
            {screen.webMcp.label}
          </span>
          <span className="menu-revision">{screen.revision}</span>
          <button
            onClick={() => {
              dispatch({ type: "NewPlan" })
              setMenuOpen(false)
            }}
            type="button"
          >
            {COPY.newPlan}
          </button>
          <button
            onClick={() => {
              dispatch({ type: "LoadDemo" })
              setMenuOpen(false)
            }}
            type="button"
          >
            {COPY.loadDemo}
          </button>
        </nav>
      ) : null}

      <div className="floating-actions">
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? COPY.closeMenu : COPY.openMenu}
          className="menu-action"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <MenuIcon />
        </button>
        <button
          aria-label={
            screen.workspace.type === "context" ? COPY.addRequirement : COPY.addItem
          }
          className="add-action"
          onClick={add}
          type="button"
        >
          <PlusIcon />
        </button>
      </div>
    </main>
  )
}

export const App = ({ registration, store }: AppProps) => {
  const viewModel = useMissionViewModel({ registration, store })
  return <MissionView {...viewModel} />
}
