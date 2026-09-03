import { useState, type FocusEvent, type KeyboardEvent } from "react"

import { COPY, DEMO_OPTIONS } from "./copy"
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

const MissionView = ({ dispatch, screen }: MissionViewProps) => {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [addTarget, setAddTarget] = useState<"item" | "requirement" | null>(
    null,
  )
  const [demoMenuOpen, setDemoMenuOpen] = useState(false)

  return (
    <main className="app-shell" id="mission">
      <nav aria-label={COPY.missionViews} className="side-tabs" role="tablist">
        {screen.navigation.map((item) => (
          <a
            aria-disabled={item.disabled}
            aria-selected={item.active}
            className={item.active ? "is-active" : ""}
            href={item.path}
            key={item.id}
            onClick={(event) => {
              event.preventDefault()
              if (item.disabled) return
              setAddTarget(null)
              dispatch({ panel: item.id, type: "SelectPanel" })
            }}
            role="tab"
            tabIndex={item.disabled ? -1 : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <header className="board-title">
        {screen.missionTitle === "" ? null : (
          <TitleEditor dispatch={dispatch} title={screen.missionTitle} />
        )}
      </header>

      <div className="primary-control">
        {demoMenuOpen && screen.primaryAction.type === "LoadDemo" ? (
          <div aria-label={COPY.samplePlans} className="demo-menu" role="menu">
            {DEMO_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setAddTarget(null)
                  setDemoMenuOpen(false)
                  dispatch({ demoId: option.id, type: "LoadDemo" })
                }}
                role="menuitem"
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        ) : null}
        <button
          aria-expanded={
            screen.primaryAction.type === "LoadDemo" ? demoMenuOpen : undefined
          }
          className="primary-action"
          onClick={() => {
            setAddTarget(null)
            if (screen.primaryAction.type === "LoadDemo") {
              setDemoMenuOpen((open) => !open)
              return
            }
            setDemoMenuOpen(false)
            dispatch(screen.primaryAction)
          }}
          type="button"
        >
          {screen.primaryAction.label}
        </button>
      </div>

      {screen.workspace.type === "plan" ? (
        <section
          aria-label={`${screen.date.weekday}, ${screen.date.day} ${screen.date.month} ${screen.date.year}`}
          className="date-block"
        >
          <strong>{screen.date.day}</strong>
          <span className="date-details">
            <b>{screen.date.weekday}</b>
            <span>{screen.date.month} {screen.date.year}</span>
            {screen.situation.currentLocation === null ? null : (
              <span className="date-context">{screen.situation.currentLocation}</span>
            )}
          </span>
        </section>
      ) : null}

      <MissionWorkspace
        actionsOpen={actionsOpen}
        addTarget={addTarget}
        closeAdd={() => setAddTarget(null)}
        dispatch={dispatch}
        key={screen.workspace.type}
        openAdd={(target) =>
          setAddTarget((current) => (current === target ? null : target))
        }
        toggleActions={() => setActionsOpen((open) => !open)}
        workspace={screen.workspace}
      />

      <small className="release-marker">{screen.updateMarker}</small>
    </main>
  )
}

export const App = ({ registration, store }: AppProps) => {
  const viewModel = useMissionViewModel({ registration, store })
  return <MissionView {...viewModel} />
}
