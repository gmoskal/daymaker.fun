import { COPY } from "./copy"
import { MissionMap } from "./MissionMap"
import type { MissionStore } from "./store"
import { useMissionViewModel } from "./useMissionViewModel"
import type {
  MissionScreen,
  TimelineStopScreen,
  ViewAction,
} from "./view-model"
import type { WebMcpRegistration } from "./webmcp"

type AppProps = {
  registration: Promise<WebMcpRegistration>
  store: MissionStore
}

type MissionViewProps = {
  dispatch: (action: ViewAction) => void
  screen: MissionScreen
}

const LockIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d="M6.5 8V6.5a3.5 3.5 0 1 1 7 0V8m-8 0h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
  </svg>
)

const CompassMark = () => (
  <svg aria-hidden="true" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="17" />
    <path d="m25.5 14.5-3.2 7.8-7.8 3.2 3.2-7.8 7.8-3.2Z" />
  </svg>
)

const StopActions = ({
  dispatch,
  stop,
}: {
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => {
  if (stop.locked)
    return <span className="locked-label"><LockIcon /> Locked</span>

  if (stop.status === "completed" || stop.status === "skipped") {
    return (
      <button
        aria-label={stop.actionLabel}
        className="button button--quiet"
        onClick={() =>
          dispatch({ status: "planned", stopId: stop.id, type: "SetStopStatus" })
        }
        type="button"
      >
        {COPY.undo}
      </button>
    )
  }

  return (
    <div className="stop-actions">
      <button
        aria-label={`${stop.actionLabel} done`}
        className="button button--primary"
        onClick={() =>
          dispatch({ status: "completed", stopId: stop.id, type: "SetStopStatus" })
        }
        type="button"
      >
        {COPY.done}
      </button>
      <button
        aria-label={`${stop.actionLabel} skipped`}
        className="button button--quiet"
        onClick={() =>
          dispatch({ status: "skipped", stopId: stop.id, type: "SetStopStatus" })
        }
        type="button"
      >
        {COPY.skip}
      </button>
    </div>
  )
}

const TimelineStop = ({
  dispatch,
  stop,
}: {
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => (
  <article
    className={`stop-card stop-card--${stop.status}${stop.selected ? " is-selected" : ""}`}
    data-testid={`stop-${stop.id}`}
  >
    <button
      aria-label={`Show ${stop.title} on map`}
      className="stop-card__select"
      onClick={() => dispatch({ stopId: stop.id, type: "SelectStop" })}
      type="button"
    >
      <span className="stop-card__time">{stop.time}</span>
      <span className="stop-card__marker" aria-hidden="true">
        {stop.routeIndex ?? "·"}
      </span>
      <span className="stop-card__heading">
        <strong>{stop.title}</strong>
        <span>{stop.location}</span>
      </span>
      <span className={`status status--${stop.status}`}>{stop.statusLabel}</span>
    </button>
    <div className="stop-card__body">
      <div className="stop-meta">
        <span>{stop.kind}</span>
        <span>{stop.duration}</span>
        {stop.travel === null ? null : <span>{stop.travel}</span>}
      </div>
      <p>{stop.rationale}</p>
      {stop.note === undefined ? null : <p className="stop-note">{stop.note}</p>}
      {stop.source === undefined ? null : (
        <a
          className="source-link"
          href={stop.source.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Source · {stop.source.title} <span aria-hidden="true">↗</span>
        </a>
      )}
      <StopActions dispatch={dispatch} stop={stop} />
    </div>
  </article>
)

const MissionView = ({ dispatch, screen }: MissionViewProps) => (
  <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#mission" aria-label="Sidequest home">
        <CompassMark />
        <span>{COPY.appName}</span>
      </a>
      <div className={`connection connection--${screen.webMcp.tone}`}>
        <span aria-hidden="true" />
        {screen.webMcp.label}
      </div>
      <button
        className="button button--quiet reset-button"
        onClick={() => dispatch({ type: "Reset" })}
        type="button"
      >
        {COPY.reset}
      </button>
    </header>

    <section className="mission-hero" id="mission">
      <div>
        <p className="eyebrow">{COPY.missionEyebrow}</p>
        <h1>{screen.missionTitle}</h1>
        <p className="tagline">{COPY.tagline}</p>
      </div>
      <dl className="mission-stamp">
        <div>
          <dt>Mission date</dt>
          <dd>{screen.date}</dd>
        </div>
        <div>
          <dt>Board version</dt>
          <dd>{screen.revision}</dd>
        </div>
        <div className="mission-stamp__commitment">
          <dt>Protected commitment</dt>
          <dd><LockIcon /> {screen.commitment}</dd>
        </div>
      </dl>
    </section>

    <div className="workspace">
      <aside className="context-panel" aria-labelledby="context-title">
        <div className="section-heading">
          <p className="section-index">01</p>
          <h2 id="context-title">{COPY.contextTitle}</h2>
        </div>
        <dl className="context-data">
          <div>
            <dt>{COPY.currentTime}</dt>
            <dd className="context-data__time">{screen.context.currentTime}</dd>
          </div>
          <div>
            <dt>{COPY.currentLocation}</dt>
            <dd>{screen.context.currentLocation}</dd>
          </div>
          <div>
            <dt>{COPY.energy}</dt>
            <dd><span className="energy-dot" />{screen.context.energy}</dd>
          </div>
        </dl>
        <h3>{COPY.constraintsTitle}</h3>
        <ul className="constraint-list">
          {screen.context.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>

        <div className="agent-card">
          <p className="eyebrow">{COPY.agentEyebrow}</p>
          <h3>{COPY.agentTitle}</h3>
          <p>{COPY.demoPrompt}</p>
          <button
            className="button button--light"
            onClick={() => dispatch({ type: "CopyPrompt" })}
            type="button"
          >
            {screen.copyLabel}
          </button>
        </div>
      </aside>

      <section className="timeline-panel" aria-labelledby="timeline-title">
        <div className="section-heading section-heading--rule">
          <p className="section-index">02</p>
          <h2 id="timeline-title">{COPY.timelineTitle}</h2>
          <span>{screen.timeline.length} stops</span>
        </div>
        <div className="timeline">
          {screen.timeline.map((stop) => (
            <TimelineStop dispatch={dispatch} key={stop.id} stop={stop} />
          ))}
        </div>
      </section>

      <aside className="map-log-panel">
        <section className="map-panel" aria-labelledby="map-title">
          <div className="section-heading section-heading--compact">
            <p className="section-index">03</p>
            <h2 id="map-title">{COPY.mapTitle}</h2>
          </div>
          <MissionMap
            onSelect={(stopId) => dispatch({ stopId, type: "SelectStop" })}
            route={screen.route}
          />
          <p className="map-caption">{COPY.mapCaption}</p>
        </section>

        <section className="activity-panel" aria-labelledby="activity-title">
          <div className="section-heading section-heading--compact">
            <p className="section-index">04</p>
            <h2 id="activity-title">{COPY.activityTitle}</h2>
          </div>
          {screen.events.length === 0 ? (
            <p className="empty-log">{COPY.activityEmpty}</p>
          ) : (
            <ol className="event-list">
              {screen.events.map((event) => (
                <li key={event.id}>
                  <div><strong>{event.actor}</strong><time>{event.at}</time></div>
                  <p>{event.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </aside>
    </div>

    <footer>
      <span>Sidequest / DayOps prototype</span>
      <span>One board. Human judgment + agent execution.</span>
    </footer>
  </main>
)

export const App = ({ registration, store }: AppProps) => {
  const viewModel = useMissionViewModel({ registration, store })
  return <MissionView {...viewModel} />
}
