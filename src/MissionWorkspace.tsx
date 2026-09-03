import { AnimatePresence, Reorder, motion } from "motion/react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"

import { COPY } from "./copy"
import type {
  ConstraintScreen,
  MissionWorkspaceScreen,
  TimelineStopScreen,
  ViewAction,
} from "./view-model"

type MissionWorkspaceProps = {
  actionsOpen: boolean
  addTarget: "item" | "requirement" | null
  closeAdd: () => void
  dispatch: (action: ViewAction) => void
  openAdd: (target: "item" | "requirement") => void
  toggleActions: () => void
  workspace: MissionWorkspaceScreen
}

const InlineEditor = ({
  ariaLabel,
  autoFocus = false,
  disabled = false,
  onCommit,
  value,
}: {
  ariaLabel: string
  autoFocus?: boolean
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
  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    event.currentTarget.blur()
  }

  return (
    <textarea
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className="inline-editor"
      disabled={disabled}
      maxLength={80}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKey}
      rows={1}
      value={draft}
    />
  )
}

const InlineTitleEditor = ({
  disabled,
  onCommit,
  value,
}: {
  disabled: boolean
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

  return (
    <textarea
      aria-label={`${COPY.editItemTitle}: ${value}`}
      autoFocus={!disabled}
      className="inline-editor inline-title-editor"
      disabled={disabled}
      maxLength={80}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return
        event.preventDefault()
        event.currentTarget.blur()
      }}
      rows={1}
      value={draft}
    />
  )
}

const ChevronIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d="m6.5 8 3.5 3.5L13.5 8" />
  </svg>
)

type ActionIconName = "action" | "delete" | "done" | "lock" | "restore" | "skip" | "unlock"

const ActionIcon = ({ name }: { name: ActionIconName }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    {name === "action" ? (
      <><circle cx="4" cy="10" r="1" /><circle cx="10" cy="10" r="1" /><circle cx="16" cy="10" r="1" /></>
    ) : name === "delete" ? (
      <><path d="M6 6h8l-.6 10H6.6L6 6Z" /><path d="M8 6V4h4v2M4.5 6h11" /></>
    ) : name === "done" ? (
      <path d="m4.5 10 3.3 3.3 7.7-7.6" />
    ) : name === "restore" ? (
      <><path d="M5.2 7.3A6 6 0 1 1 4 11" /><path d="M5.2 3.8v3.5H1.7" /></>
    ) : name === "skip" ? (
      <><path d="m5 5 7 5-7 5V5Z" /><path d="M14.5 5v10" /></>
    ) : (
      <><rect height="8" rx="1.4" width="10" x="5" y="8" /><path d={name === "lock" ? "M7 8V6a3 3 0 0 1 6 0v2" : "M13 8V6a3 3 0 0 0-5.7-1.3"} /></>
    )}
  </svg>
)

const StopActions = ({
  dispatch,
  stop,
}: {
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => {
  const settled = stop.status === "completed" || stop.status === "skipped"

  return (
    <div className="stop-actions">
      {stop.locked ? null : settled ? (
        <button
          aria-label={stop.actionLabel}
          className="control action-control"
          onClick={() =>
            dispatch({ status: "planned", stopId: stop.id, type: "SetStopStatus" })
          }
          type="button"
        >
          <ActionIcon name="restore" />
          <span className="visually-hidden">{COPY.undo}</span>
        </button>
      ) : (
        <>
          <button
            aria-label={`${stop.actionLabel} done`}
            className="control action-control"
            onClick={() =>
              dispatch({ status: "completed", stopId: stop.id, type: "SetStopStatus" })
            }
            type="button"
          >
            <ActionIcon name="done" />
            <span className="visually-hidden">{COPY.done}</span>
          </button>
          <button
            aria-label={`Skip ${stop.title}`}
            className="control action-control"
            onClick={() =>
              dispatch({ status: "skipped", stopId: stop.id, type: "SetStopStatus" })
            }
            type="button"
          >
            <ActionIcon name="skip" />
            <span className="visually-hidden">{COPY.skip}</span>
          </button>
        </>
      )}
      <button
        aria-label={stop.lockLabel}
        className="control action-control"
        onClick={() =>
          dispatch({
            locked: !stop.locked,
            stopId: stop.id,
            type: "SetStopLock",
          })
        }
        type="button"
      >
        <ActionIcon name={stop.locked ? "unlock" : "lock"} />
        <span className="visually-hidden">{stop.locked ? COPY.unlock : COPY.lock}</span>
      </button>
      <button
        aria-label={COPY.deleteItem}
        className="control action-control"
        onClick={() => dispatch({ stopId: stop.id, type: "DeleteStop" })}
        type="button"
      >
        <ActionIcon name="delete" />
        <span className="visually-hidden">{COPY.deleteItem}</span>
      </button>
    </div>
  )
}

const StopItem = ({
  actionsOpen,
  commit,
  dispatch,
  stop,
  toggleActions,
}: {
  actionsOpen: boolean
  commit: () => void
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
  toggleActions: () => void
}) => {
  return (
    <Reorder.Item
      as="li"
      className={`stop-row stop-row--${stop.status}${stop.selected ? " is-selected" : ""}`}
      data-draggable={stop.draggable}
      data-testid={`stop-${stop.id}`}
      dragListener={stop.draggable}
      layout="position"
      onDragEnd={commit}
      transition={{ damping: 38, stiffness: 520, type: "spring" }}
      value={stop.id}
    >
      <article>
        <div className="stop-summary">
          <div className="stop-open">
            <time>{stop.time}</time>
            <span className="stop-title">
              {stop.selected ? (
                <InlineTitleEditor
                  disabled={stop.locked}
                  onCommit={(title) =>
                    dispatch({ stopId: stop.id, title, type: "RenameStop" })
                  }
                  value={stop.title}
                />
              ) : (
                <button
                  className="stop-title-button"
                  onClick={() =>
                    dispatch({ stopId: stop.id, type: "ToggleStopActions" })
                  }
                  type="button"
                >
                  {stop.title}
                </button>
              )}
            </span>
            <span className={`status status--${stop.status}`}>{stop.statusLabel}</span>
          </div>
          <button
            aria-expanded={stop.selected}
            aria-label={`${COPY.actionsFor} ${stop.title}`}
            className={`accordion-control${stop.selected ? " is-open" : ""}`}
            onClick={() =>
              dispatch({ stopId: stop.id, type: "ToggleStopActions" })
            }
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <ChevronIcon />
          </button>
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
            {stop.mapLinks === undefined ? null : (
              <div className="item-map-links">
                <a
                  aria-label={`${COPY.openInGoogleMaps}: ${stop.title}`}
                  href={stop.mapLinks.google}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Google Maps
                </a>
                <a
                  aria-label={`${COPY.openInAppleMaps}: ${stop.title}`}
                  href={stop.mapLinks.apple}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Apple Maps
                </a>
              </div>
            )}
            <div className="detail-actions">
              <button
                aria-expanded={actionsOpen}
                aria-label={actionsOpen ? COPY.hideItemActions : COPY.showItemActions}
                className="action-menu-trigger"
                onClick={toggleActions}
                type="button"
              >
                <ActionIcon name="action" />
              </button>
              <AnimatePresence initial={false}>
                {actionsOpen ? (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="action-tray"
                    exit={{ opacity: 0, x: -8 }}
                    initial={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <StopActions dispatch={dispatch} stop={stop} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </article>
    </Reorder.Item>
  )
}

const PlanPanel = ({
  actionsOpen,
  adding,
  closeAdd,
  dispatch,
  openAdd,
  toggleActions,
  workspace,
}: {
  actionsOpen: boolean
  adding: boolean
  closeAdd: () => void
  dispatch: (action: ViewAction) => void
  openAdd: () => void
  toggleActions: () => void
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
  const openStopId = workspace.stops.find((stop) => stop.selected)?.id ?? "closed"

  return (
    <section aria-labelledby="schedule-title" className="panel panel--plan" id="panel-plan" role="tabpanel">
      <h2 className="visually-hidden" id="schedule-title">{workspace.heading}</h2>
      {orderedStops.length === 0 ? (
        <div className="empty-plan">
          <p>{workspace.emptyHint}</p>
          <button
            className="control copy-action"
            disabled={!workspace.canCopy}
            onClick={() =>
              dispatch({ prompt: workspace.prompt, type: "CopyPrompt" })
            }
            type="button"
          >
            {workspace.copyLabel}
          </button>
        </div>
      ) : (
        <Reorder.Group
          as="ol"
          axis="y"
          className="stop-list"
          key={openStopId}
          onReorder={reorder}
          values={order}
        >
          {orderedStops.map((stop) => (
            <StopItem
              actionsOpen={actionsOpen}
              commit={commit}
              dispatch={dispatch}
              key={stop.id}
              stop={stop}
              toggleActions={toggleActions}
            />
          ))}
        </Reorder.Group>
      )}
      <button
        aria-expanded={adding}
        aria-label={COPY.addItem}
        className="add-trigger"
        onClick={openAdd}
        type="button"
      >
        <span aria-hidden="true">+</span>
      </button>
      {adding ? (
        <InlineAdd
          ariaLabel={COPY.addItem}
          id="add-item"
          onAdd={(title) => dispatch({ title, type: "AddItem" })}
          onClose={closeAdd}
          placeholder={COPY.addItemHint}
        />
      ) : null}
      {workspace.mapUrl === null ? null : (
        <a
          className="schedule-map-link"
          href={workspace.mapUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {COPY.openPlanInGoogleMaps}
        </a>
      )}
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
      <button
        aria-label={
          constraint.fixed
            ? `Make ${constraint.label} flexible`
            : `Mark ${constraint.label} as fixed`
        }
        aria-pressed={constraint.fixed}
        className="need-fixed-control"
        onClick={() =>
          dispatch({
            constraintId: constraint.id,
            fixed: !constraint.fixed,
            type: "SetConstraintFixed",
          })
        }
        type="button"
      >
        {constraint.fixed ? COPY.fixed : COPY.flexible}
      </button>
      <button
        aria-label={`${COPY.removeNeed} ${constraint.label}`}
        className="need-remove-control"
        onClick={() =>
          dispatch({ constraintId: constraint.id, type: "RemoveConstraint" })
        }
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </Reorder.Item>
  )
}

const InlineAdd = ({
  ariaLabel,
  id,
  onAdd,
  onClose,
  placeholder,
}: {
  ariaLabel: string
  id: string
  onAdd: (value: string) => void
  onClose: () => void
  placeholder: string
}) => {
  const [draft, setDraft] = useState("")
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (value === "") return
    onAdd(value)
    setDraft("")
    onClose()
  }

  return (
    <form className="inline-add" onSubmit={submit}>
      <input
        aria-label={ariaLabel}
        autoFocus
        id={id}
        maxLength={80}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            onClose()
            return
          }
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

type BriefEditorProps = {
  copyLabel: string
  dispatch: (action: ViewAction) => void
  prompt: string
  value: string
}

type BriefScroll = {
  offset: number
  size: number
  visible: boolean
}

const BriefEditor = ({
  copyLabel,
  dispatch,
  prompt,
  value,
}: BriefEditorProps) => {
  const field = useRef<HTMLTextAreaElement>(null)
  const [brief, setBrief] = useState(value)
  const [scroll, setScroll] = useState<BriefScroll>({
    offset: 0,
    size: 0,
    visible: false,
  })
  useEffect(() => setBrief(value), [value])

  const readScroll = useCallback(() => {
    const textarea = field.current
    if (textarea === null) return
    const range = textarea.scrollHeight - textarea.clientHeight
    if (range <= 1) {
      setScroll({ offset: 0, size: textarea.clientHeight, visible: false })
      return
    }
    const size = Math.max(
      24,
      (textarea.clientHeight * textarea.clientHeight) / textarea.scrollHeight,
    )
    setScroll({
      offset: (textarea.scrollTop / range) * (textarea.clientHeight - size),
      size,
      visible: true,
    })
  }, [])

  useLayoutEffect(() => {
    readScroll()
    window.addEventListener("resize", readScroll)
    return () => window.removeEventListener("resize", readScroll)
  }, [brief, readScroll])

  const commit = () => {
    const next = brief.trim()
    if (next === value) return
    dispatch({ brief: next, type: "SetBrief" })
  }

  return (
    <div className="brief-stage">
      <label className="needs-brief">
        <span>{COPY.planningBrief}</span>
        <span className="needs-brief-field">
          <textarea
            aria-label={COPY.planningBrief}
            aria-required="true"
            maxLength={600}
            onBlur={commit}
            onChange={(event) => setBrief(event.target.value)}
            onScroll={readScroll}
            placeholder={COPY.planningBriefPlaceholder}
            ref={field}
            required
            rows={4}
            value={brief}
          />
          {scroll.visible ? (
            <span aria-hidden="true" className="needs-scrollbar">
              <span
                style={{
                  height: `${scroll.size}px`,
                  transform: `translateY(${scroll.offset}px)`,
                }}
              />
            </span>
          ) : null}
        </span>
      </label>
      <aside className="agent-prompt">
        <h3>{COPY.handoffTitle}</h3>
        <button
          className="control copy-action"
          disabled={brief.trim() === ""}
          onClick={() =>
            dispatch({ brief, prompt, type: "CopyPrompt" })
          }
          type="button"
        >
          {copyLabel}
        </button>
        <p>{COPY.agentHint}</p>
      </aside>
    </div>
  )
}

const ContextPanel = ({
  adding,
  closeAdd,
  dispatch,
  openAdd,
  workspace,
}: {
  adding: boolean
  closeAdd: () => void
  dispatch: (action: ViewAction) => void
  openAdd: () => void
  workspace: Extract<MissionWorkspaceScreen, { type: "context" }>
}) => {
  const [order, setOrder] = useState(
    workspace.constraints.map((constraint) => constraint.id),
  )
  useEffect(
    () => setOrder(workspace.constraints.map((constraint) => constraint.id)),
    [workspace.constraints],
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
      {workspace.stage === "brief" ? (
        <BriefEditor
          copyLabel={workspace.copyLabel}
          dispatch={dispatch}
          prompt={workspace.prompt}
          value={workspace.brief}
        />
      ) : (
        <>
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
          <button
            aria-expanded={adding}
            aria-label={COPY.addRequirement}
            className="add-trigger"
            onClick={openAdd}
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
          {adding ? (
            <InlineAdd
              ariaLabel={COPY.newRequirement}
              id="add-requirement"
              onAdd={(label) => dispatch({ label, type: "AddConstraint" })}
              onClose={closeAdd}
              placeholder={COPY.addRequirementHint}
            />
          ) : null}
          <aside className="agent-prompt agent-prompt--changes">
            <button
              className="control copy-action"
              disabled={!workspace.canCopy}
              onClick={() =>
                dispatch({ prompt: workspace.prompt, type: "CopyPrompt" })
              }
              type="button"
            >
              {workspace.copyLabel}
            </button>
            <p>{COPY.changesHint}</p>
          </aside>
        </>
      )}
    </section>
  )
}

export const MissionWorkspace = ({
  actionsOpen,
  addTarget,
  closeAdd,
  dispatch,
  openAdd,
  toggleActions,
  workspace,
}: MissionWorkspaceProps) => {
  switch (workspace.type) {
    case "plan":
      return (
        <PlanPanel
          actionsOpen={actionsOpen}
          adding={addTarget === "item"}
          closeAdd={closeAdd}
          dispatch={dispatch}
          openAdd={() => openAdd("item")}
          toggleActions={toggleActions}
          workspace={workspace}
        />
      )
    case "context":
      return (
        <ContextPanel
          adding={addTarget === "requirement"}
          closeAdd={closeAdd}
          dispatch={dispatch}
          openAdd={() => openAdd("requirement")}
          workspace={workspace}
        />
      )
  }
}
