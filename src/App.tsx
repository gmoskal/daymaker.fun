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

type SessionLinkActionProps = {
  dispatch: (action: ViewAction) => void
  label: string
}

const ABOUT_STEPS = [
  COPY.aboutStepBrief,
  COPY.aboutStepHandoff,
  COPY.aboutStepPlan,
  COPY.aboutStepRevise,
] as const

const AboutPage = () => (
  <main className="about-page">
    <a className="about-back" href="/needs">
      {COPY.aboutBack}
    </a>
    <h1>{COPY.aboutTitle}</h1>
    <p>{COPY.aboutIntro}</p>
    <ol>
      {ABOUT_STEPS.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
    <p className="about-privacy">{COPY.aboutPrivacy}</p>
    <div className="about-video">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src="https://www.youtube.com/embed/XlG632xwWvs"
        title={COPY.aboutVideoTitle}
      />
    </div>
  </main>
)

const SessionLinkAction = (p: SessionLinkActionProps) => (
  <button
    className="session-link-action"
    onClick={() => p.dispatch({ type: "CopySessionLink" })}
    type="button"
  >
    {p.label}
  </button>
)

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
      </header>

      {screen.workspace.type === "context" &&
      screen.workspace.canShareSession ? (
        <div className="needs-meta">
          <SessionLinkAction
            dispatch={dispatch}
            label={screen.sessionLinkLabel}
          />
        </div>
      ) : null}

      {screen.workspace.type === "plan" ? (
        <>
          <div className="plan-meta">
            <span>{screen.planIteration}</span>
            <span aria-hidden="true">·</span>
            <SessionLinkAction
              dispatch={dispatch}
              label={screen.sessionLinkLabel}
            />
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
        <a href="/about">{COPY.about}</a>
      </footer>
    </main>
  )
}

const MissionApp = (p: AppProps) => {
  const viewModel = useMissionViewModel({
    registration: p.registration,
    store: p.store,
  })
  return <MissionView {...viewModel} />
}

export const App = (p: AppProps) =>
  window.location.pathname === "/about" ? <AboutPage /> : <MissionApp {...p} />
