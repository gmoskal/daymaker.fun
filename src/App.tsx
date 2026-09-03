import { useState } from "react"

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

const MissionView = ({ dispatch, screen }: MissionViewProps) => {
  const [addingRequirement, setAddingRequirement] = useState(false)
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
              setAddingRequirement(false)
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
          <h1>{screen.missionTitle}</h1>
        )}
      </header>

      <div className="primary-control">
        {demoMenuOpen && screen.primaryAction.type === "LoadDemo" ? (
          <div aria-label={COPY.samplePlans} className="demo-menu" role="menu">
            {DEMO_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setAddingRequirement(false)
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
            setAddingRequirement(false)
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
        <>
          <div className="plan-meta">
            <span>{screen.planIteration}</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => dispatch({ type: "CopySessionLink" })}
              type="button"
            >
              {screen.planLinkLabel}
            </button>
          </div>
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
        </>
      ) : null}

      <MissionWorkspace
        addingRequirement={addingRequirement}
        closeAdd={() => setAddingRequirement(false)}
        dispatch={dispatch}
        key={screen.workspace.type}
        toggleAddingRequirement={() =>
          setAddingRequirement((adding) => !adding)
        }
        workspace={screen.workspace}
      />

      <footer className="app-footer">
        <small className="release-marker">{screen.updateMarker}</small>
      </footer>
    </main>
  )
}

export const App = ({ registration, store }: AppProps) => {
  const viewModel = useMissionViewModel({ registration, store })
  return <MissionView {...viewModel} />
}
