import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { COPY } from "./copy"
import { BLANK_MISSION_TITLE } from "./domain/seed"
import { toMissionPrompt } from "./mission-prompt"
import type { MissionStore } from "./store"
import {
  presentMission,
  missionPanelForPath,
  missionPathFor,
  type MissionPanel,
  type ViewAction,
  type WebMcpState,
} from "./view-model"
import type { WebMcpRegistration } from "./webmcp"

type UseMissionViewModelParams = {
  registration: Promise<WebMcpRegistration>
  store: MissionStore
}

const hasPlanContent = (store: MissionStore) => {
  const mission = store.getSnapshot()
  return (
    mission.stops.length > 0 ||
    mission.context.brief !== "" ||
    mission.context.constraints.length > 0 ||
    mission.events.length > 0 ||
    mission.title !== BLANK_MISSION_TITLE
  )
}

export const useMissionViewModel = ({
  registration,
  store,
}: UseMissionViewModelParams) => {
  const mission = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const [expandedStopIds, setExpandedStopIds] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [panel, setPanel] = useState<MissionPanel>(() =>
    mission.context.stage === "brief" &&
    missionPanelForPath(window.location.pathname) === "plan"
      ? "context"
      : missionPanelForPath(window.location.pathname),
  )
  const [webMcp, setWebMcp] = useState<WebMcpState>({ type: "checking" })

  useEffect(() => setCopied(false), [mission.revision])

  useEffect(() => {
    let active = true
    void registration
      .then((result) => {
        if (!active) return
        setWebMcp({ type: result.supported ? "connected" : "unavailable" })
      })
      .catch(() => {
        if (!active) return
        setWebMcp({ type: "error" })
      })

    return () => {
      active = false
    }
  }, [registration])

  useEffect(() => {
    const syncPanel = () => {
      const requested = missionPanelForPath(window.location.pathname)
      const available =
        store.getSnapshot().context.stage === "brief" && requested === "plan"
          ? "context"
          : requested
      const canonicalPath = missionPathFor(available)
      if (window.location.pathname !== canonicalPath)
        window.history.replaceState(null, "", canonicalPath)
      setPanel(available)
    }
    syncPanel()
    window.addEventListener("popstate", syncPanel)
    return () => window.removeEventListener("popstate", syncPanel)
  }, [store])

  const navigate = useCallback((nextPanel: MissionPanel, replace = false) => {
    const path = missionPathFor(nextPanel)
    if (window.location.pathname !== path)
      window.history[replace ? "replaceState" : "pushState"](null, "", path)
    setPanel(nextPanel)
  }, [])

  const dispatch = useCallback(
    (action: ViewAction) => {
      switch (action.type) {
        case "SelectPanel":
          if (
            action.panel === "plan" &&
            store.getSnapshot().context.stage === "brief"
          )
            return
          navigate(action.panel)
          return
        case "ToggleStop":
          setExpandedStopIds((expanded) =>
            expanded.includes(action.stopId)
              ? expanded.filter((stopId) => stopId !== action.stopId)
              : [...expanded, action.stopId],
          )
          return
        case "AddConstraint":
          store.dispatch({
            type: "AddConstraint",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                label: action.label,
              },
            },
          })
          return
        case "ToggleConstraint":
          store.dispatch({
            type: "ToggleConstraint",
            value: {
              actor: "human",
              input: {
                constraintId: action.constraintId,
                expectedRevision: store.getSnapshot().revision,
              },
            },
          })
          return
        case "ReorderConstraints":
          store.dispatch({
            type: "ReorderConstraints",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                orderedConstraintIds: action.constraintIds,
              },
            },
          })
          return
        case "SetConstraintFixed":
          store.dispatch({
            type: "SetConstraintFixed",
            value: {
              actor: "human",
              input: {
                constraintId: action.constraintId,
                expectedRevision: store.getSnapshot().revision,
                fixed: action.fixed,
              },
            },
          })
          return
        case "RemoveConstraint":
          store.dispatch({
            type: "RemoveConstraint",
            value: {
              actor: "human",
              input: {
                constraintId: action.constraintId,
                expectedRevision: store.getSnapshot().revision,
              },
            },
          })
          return
        case "SetBrief":
          store.dispatch({
            type: "SetBrief",
            value: {
              actor: "human",
              input: {
                brief: action.brief,
                expectedRevision: store.getSnapshot().revision,
              },
            },
          })
          return
        case "RenameConstraint":
          store.dispatch({
            type: "RenameConstraint",
            value: {
              actor: "human",
              input: {
                constraintId: action.constraintId,
                expectedRevision: store.getSnapshot().revision,
                label: action.label,
              },
            },
          })
          return
        case "CopyPrompt":
          if (navigator.clipboard === undefined) return
          if (
            action.brief !== undefined &&
            action.brief.trim() !== store.getSnapshot().context.brief
          )
            store.dispatch({
              type: "SetBrief",
              value: {
                actor: "human",
                input: {
                  brief: action.brief,
                  expectedRevision: store.getSnapshot().revision,
                },
              },
            })
          const prompt =
            action.brief === undefined
              ? action.prompt
              : toMissionPrompt(store.getSnapshot())
          void navigator.clipboard
            .writeText(prompt)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
          return
        case "NewPlan":
          store.newPlan()
          setExpandedStopIds([])
          navigate("context", true)
          return
        case "LoadDemo":
          if (hasPlanContent(store) && !window.confirm(COPY.loadDemoConfirm)) return
          store.loadDemo(action.demoId)
          setExpandedStopIds([])
          navigate("context", true)
          return
      }
    },
    [navigate, store],
  )

  return {
    dispatch,
    screen: useMemo(
      () => presentMission({ copied, expandedStopIds, mission, panel, webMcp }),
      [copied, expandedStopIds, mission, panel, webMcp],
    ),
  }
}
