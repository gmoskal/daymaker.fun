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
  addingRequirement: boolean
  closeAdd: () => void
  dispatch: (action: ViewAction) => void
  toggleAddingRequirement: () => void
  workspace: MissionWorkspaceScreen
}

const InlineEditor = ({
  ariaLabel,
  onCommit,
  value,
}: {
  ariaLabel: string
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
      className="inline-editor"
      maxLength={80}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKey}
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

const StopItem = ({ dispatch, stop }: {
  dispatch: (action: ViewAction) => void
  stop: TimelineStopScreen
}) => (
    <li className="stop-row" data-testid={`stop-${stop.id}`}>
      <article>
        <button
          aria-expanded={stop.expanded}
          aria-label={stop.title}
          className="stop-summary"
          onClick={() => dispatch({ stopId: stop.id, type: "ToggleStop" })}
          type="button"
        >
          <time>{stop.time}</time>
          <span className="stop-copy">
            <span className="stop-title">{stop.title}</span>
            <span className="stop-location">{stop.location}</span>
          </span>
          <span
            aria-hidden="true"
            className={`accordion-control${stop.expanded ? " is-open" : ""}`}
          >
            <ChevronIcon />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {stop.expanded ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="stop-detail-motion"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              key="details"
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
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
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </article>
    </li>
)

const PlanPanel = ({ dispatch, workspace }: {
  dispatch: (action: ViewAction) => void
  workspace: Extract<MissionWorkspaceScreen, { type: "plan" }>
}) => (
    <section aria-labelledby="schedule-title" className="panel panel--plan" id="panel-plan" role="tabpanel">
      <h2 className="visually-hidden" id="schedule-title">{workspace.heading}</h2>
      {workspace.stops.length === 0 ? (
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
        <ol className="stop-list">
          {workspace.stops.map((stop) => (
            <StopItem
              dispatch={dispatch}
              key={stop.id}
              stop={stop}
            />
          ))}
        </ol>
      )}
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
            ? COPY.allowNeedToAdapt.replace("{need}", constraint.label)
            : COPY.makeNeedNonNegotiable.replace("{need}", constraint.label)
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
        {constraint.fixed ? COPY.mustKeep : COPY.canAdapt}
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
          <div className="need-add-row">
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
          </div>
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
  addingRequirement,
  closeAdd,
  dispatch,
  toggleAddingRequirement,
  workspace,
}: MissionWorkspaceProps) => {
  switch (workspace.type) {
    case "plan":
      return <PlanPanel dispatch={dispatch} workspace={workspace} />
    case "context":
      return (
        <ContextPanel
          adding={addingRequirement}
          closeAdd={closeAdd}
          dispatch={dispatch}
          openAdd={toggleAddingRequirement}
          workspace={workspace}
        />
      )
  }
}
