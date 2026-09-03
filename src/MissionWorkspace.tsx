import { Reorder } from "motion/react"
import { useState, type FormEvent, type KeyboardEvent } from "react"

import { COPY } from "./copy"
import { MissionMap } from "./MissionMap"
import type {
  ConstraintScreen,
  MissionWorkspaceScreen,
  TimelineStopScreen,
  ViewAction,
} from "./view-model"

type MissionWorkspaceProps = {
  dispatch: (action: ViewAction) => void
  workspace: MissionWorkspaceScreen
}

const InlineEditor = ({
  ariaLabel,
  disabled = false,
  onCommit,
  value,
}: {
  ariaLabel: string
  disabled?: boolean
  onCommit: (value: string) => void
  value: string
}) => {
  const [draft, setDraft] = useState(value)
  const commit = () => {
    const next = draft.trim()
    if (next === "" || next === value) {
      setDraft(value)
      return
    }
    onCommit(next)
  }
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    event.currentTarget.blur()
  }

  return (
    <input
      aria-label={ariaLabel}
      className="inline-editor"
      disabled={disabled}
      maxLength={80}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKey}
      value={draft}
    />
  )
}

const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d={locked ? "M6.5 8V6.3a3.5 3.5 0 0 1 7 0V8" : "M13.5 8V6.3a3.5 3.5 0 0 0-6.7-1.4"} />
    <rect height="9" rx="1.5" width="12" x="4" y="8" />
  </svg>
)

const StopActions = ({
  dispatch,
  stop,
}: {
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => {
  if (stop.status === "completed" || stop.status === "skipped") {
    return (
      <div className="stop-actions">
        <button
          aria-label={stop.actionLabel}
          className="control control--primary"
          disabled={stop.locked}
          onClick={() =>
            dispatch({ status: "planned", stopId: stop.id, type: "SetStopStatus" })
          }
          type="button"
        >
          {COPY.undo}
        </button>
        {stop.locked ? <span>{COPY.unlockToEdit}</span> : null}
      </div>
    )
  }

  return (
    <div className="stop-actions">
      <button
        aria-label={`${stop.actionLabel} done`}
        className="control control--primary"
        disabled={stop.locked}
        onClick={() =>
          dispatch({ status: "completed", stopId: stop.id, type: "SetStopStatus" })
        }
        type="button"
      >
        {COPY.done}
      </button>
      <button
        aria-label={`Skip ${stop.title}`}
        className="control"
        disabled={stop.locked}
        onClick={() =>
          dispatch({ status: "skipped", stopId: stop.id, type: "SetStopStatus" })
        }
        type="button"
      >
        {COPY.skip}
      </button>
      {stop.locked ? <span>{COPY.unlockToEdit}</span> : null}
    </div>
  )
}

const StopItem = ({
  commit,
  dispatch,
  stop,
}: {
  commit: () => void
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => {
  return (
    <Reorder.Item
      as="li"
      className={`stop-row stop-row--${stop.status}${stop.selected ? " is-selected" : ""}`}
      data-draggable={stop.draggable}
      data-testid={`stop-${stop.id}`}
      dragListener={stop.draggable}
      onDragEnd={commit}
      transition={{ damping: 38, stiffness: 520, type: "spring" }}
      value={stop.id}
    >
      <article>
        <div className="stop-summary">
          {stop.selected ? (
            <div className="stop-open">
              <time>{stop.time}</time>
              <span className="stop-title">
                <InlineEditor
                  ariaLabel={`${COPY.editItemTitle}: ${stop.title}`}
                  disabled={stop.locked}
                  onCommit={(title) =>
                    dispatch({ stopId: stop.id, title, type: "RenameStop" })
                  }
                  value={stop.title}
                />
              </span>
              <span className={`status status--${stop.status}`}>{stop.statusLabel}</span>
            </div>
          ) : (
            <button
              aria-expanded="false"
              aria-label={`${COPY.view} ${stop.title}`}
              className="stop-open"
              onClick={() => dispatch({ stopId: stop.id, type: "SelectStop" })}
              type="button"
            >
              <time>{stop.time}</time>
              <span className="stop-title">
                <strong>{stop.title}</strong>
              </span>
              <span className={`status status--${stop.status}`}>{stop.statusLabel}</span>
            </button>
          )}
          <div className="row-controls">
            <button
              aria-label={stop.lockLabel}
              className={`icon-control lock-control${stop.locked ? " is-locked" : ""}`}
              onClick={() =>
                dispatch({
                  locked: !stop.locked,
                  stopId: stop.id,
                  type: "SetStopLock",
                })
              }
              type="button"
            >
              <LockIcon locked={stop.locked} />
            </button>
          </div>
        </div>

        {stop.selected ? (
          <div className="stop-detail">
            <p>{stop.rationale}</p>
            {stop.note === undefined ? null : <p className="stop-note">{stop.note}</p>}
            {stop.source === undefined ? null : (
              <a href={stop.source.url} rel="noopener noreferrer" target="_blank">
                {stop.source.title} <span aria-hidden="true">↗</span>
              </a>
            )}
            <div className="detail-actions">
              <StopActions dispatch={dispatch} stop={stop} />
              <button
                aria-label={`Show ${stop.title} on map`}
                className="control"
                onClick={() => dispatch({ stopId: stop.id, type: "ShowStopOnMap" })}
                type="button"
              >
                {COPY.viewOnMap}
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </Reorder.Item>
  )
}

const PlanPanel = ({
  dispatch,
  workspace,
}: {
  dispatch: (action: ViewAction) => void
  workspace: Extract<MissionWorkspaceScreen, { type: "plan" }>
}) => {
  const [order, setOrder] = useState(workspace.stops.map((stop) => stop.id))
  const stopsById = new Map(workspace.stops.map((stop) => [stop.id, stop]))
  const orderedStops = order.flatMap((id) => {
    const stop = stopsById.get(id)
    return stop === undefined ? [] : [stop]
  })
  const reorder = (candidate: string[]) => {
    const movable = candidate.filter(
      (id) => stopsById.get(id)?.draggable === true,
    )
    let nextMovable = 0
    setOrder(
      workspace.stops.map((stop) => {
        if (!stop.draggable) return stop.id
        const stopId = movable[nextMovable]
        nextMovable += 1
        return stopId ?? stop.id
      }),
    )
  }
  const commit = () =>
    dispatch({
      stopIds: order.filter((id) => stopsById.get(id)?.draggable === true),
      type: "ReorderStops",
    })

  return (
    <section aria-labelledby="schedule-title" className="panel panel--plan" id="panel-plan" role="tabpanel">
      <h2 className="visually-hidden" id="schedule-title">{workspace.heading}</h2>
      <Reorder.Group
        as="ol"
        axis="y"
        className="stop-list"
        onReorder={reorder}
        values={order}
      >
        {orderedStops.map((stop) => (
          <StopItem commit={commit} dispatch={dispatch} key={stop.id} stop={stop} />
        ))}
      </Reorder.Group>
      <InlineAdd
        ariaLabel={COPY.addItem}
        id="add-item"
        onAdd={(title) => dispatch({ title, type: "AddItem" })}
        placeholder={COPY.addItemHint}
      />
    </section>
  )
}

const ConstraintItem = ({
  commit,
  constraint,
  dispatch,
}: {
  commit: () => void
  constraint: ConstraintScreen
  dispatch: (action: ViewAction) => void
}) => {
  return (
    <Reorder.Item
      as="li"
      data-draggable="true"
      data-status={constraint.status}
      onDragEnd={commit}
      transition={{ damping: 38, stiffness: 520, type: "spring" }}
      value={constraint.id}
    >
      <button
        aria-label={`${constraint.status === "active" ? "Cross out" : "Restore"} ${constraint.label}`}
        className="check-control"
        onClick={() =>
          dispatch({ constraintId: constraint.id, type: "ToggleConstraint" })
        }
        type="button"
      >
        <span aria-hidden="true">{constraint.status === "active" ? "" : "✓"}</span>
      </button>
      <InlineEditor
        ariaLabel={`${COPY.editRequirement}: ${constraint.label}`}
        onCommit={(label) =>
          dispatch({ constraintId: constraint.id, label, type: "RenameConstraint" })
        }
        value={constraint.label}
      />
    </Reorder.Item>
  )
}

const InlineAdd = ({
  ariaLabel,
  id,
  onAdd,
  placeholder,
}: {
  ariaLabel: string
  id: string
  onAdd: (value: string) => void
  placeholder: string
}) => {
  const [draft, setDraft] = useState("")
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (value === "") return
    onAdd(value)
    setDraft("")
  }

  return (
    <form className="inline-add" onSubmit={submit}>
      <span aria-hidden="true">+</span>
      <input
        aria-label={ariaLabel}
        id={id}
        maxLength={80}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          event.currentTarget.form?.requestSubmit()
        }}
        placeholder={placeholder}
        value={draft}
      />
    </form>
  )
}

const ContextPanel = ({
  dispatch,
  workspace,
}: {
  dispatch: (action: ViewAction) => void
  workspace: Extract<MissionWorkspaceScreen, { type: "context" }>
}) => {
  const [order, setOrder] = useState(
    workspace.constraints.map((constraint) => constraint.id),
  )
  const constraintsById = new Map(
    workspace.constraints.map((constraint) => [constraint.id, constraint]),
  )
  const orderedConstraints = order.flatMap((id) => {
    const constraint = constraintsById.get(id)
    return constraint === undefined ? [] : [constraint]
  })
  return (
    <section aria-labelledby="context-title" className="panel panel--context" id="panel-context" role="tabpanel">
      <div className="panel-heading">
        <h2 id="context-title">{COPY.contextTitle}</h2>
      </div>
      <dl className="context-facts">
        <div><dt>{COPY.currentTime}</dt><dd>{workspace.currentTime}</dd></div>
        <div><dt>{COPY.currentLocation}</dt><dd>{workspace.currentLocation}</dd></div>
        <div><dt>{COPY.energy}</dt><dd>{workspace.energy}</dd></div>
      </dl>

      <div className="requirements-heading">
        <h3>{COPY.constraintsTitle}</h3>
        <span>{workspace.constraints.length}</span>
      </div>
      <Reorder.Group
        as="ol"
        axis="y"
        className="constraint-list"
        onReorder={setOrder}
        values={order}
      >
        {orderedConstraints.map((constraint) => (
          <ConstraintItem
            commit={() =>
              dispatch({ constraintIds: order, type: "ReorderConstraints" })
            }
            constraint={constraint}
            dispatch={dispatch}
            key={constraint.id}
          />
        ))}
      </Reorder.Group>
      <InlineAdd
        ariaLabel={COPY.newRequirement}
        id="add-requirement"
        onAdd={(label) => dispatch({ label, type: "AddConstraint" })}
        placeholder={COPY.addRequirementHint}
      />

      <aside className="agent-prompt">
        <p>{COPY.agentHint}</p>
        <button
          className="control"
          onClick={() => dispatch({ type: "CopyPrompt" })}
          type="button"
        >
          {workspace.copyLabel}
        </button>
      </aside>
    </section>
  )
}

const RoutePanel = ({
  dispatch,
  workspace,
}: {
  dispatch: (action: ViewAction) => void
  workspace: Extract<MissionWorkspaceScreen, { type: "route" }>
}) => (
  <section aria-labelledby="route-title" className="panel panel--route" id="panel-route" role="tabpanel">
    <div className="panel-heading"><h2 id="route-title">{COPY.mapTitle}</h2></div>
    <MissionMap
      onSelect={(stopId) => dispatch({ stopId, type: "SelectStop" })}
      route={workspace.route}
    />
    <p className="map-caption">{COPY.mapCaption}</p>
  </section>
)

const HistoryPanel = ({
  workspace,
}: {
  workspace: Extract<MissionWorkspaceScreen, { type: "history" }>
}) => (
  <section
        aria-label={COPY.activityAriaLabel}
    className="panel panel--history"
    id="panel-history"
    role="tabpanel"
  >
    <div className="panel-heading"><h2>{COPY.activityTitle}</h2></div>
    {workspace.events.length === 0 ? (
      <p className="empty-log">{COPY.activityEmpty}</p>
    ) : (
      <ol className="event-list">
        {workspace.events.map((event) => (
          <li key={event.id}>
            <div><strong>{event.actor}</strong><time>{event.at}</time></div>
            <p>{event.summary}</p>
          </li>
        ))}
      </ol>
    )}
  </section>
)

export const MissionWorkspace = ({
  dispatch,
  workspace,
}: MissionWorkspaceProps) => {
  switch (workspace.type) {
    case "plan":
      return <PlanPanel dispatch={dispatch} workspace={workspace} />
    case "context":
      return <ContextPanel dispatch={dispatch} workspace={workspace} />
    case "route":
      return <RoutePanel dispatch={dispatch} workspace={workspace} />
    case "history":
      return <HistoryPanel workspace={workspace} />
  }
}
