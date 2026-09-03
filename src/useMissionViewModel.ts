import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { COPY } from "./copy"
import { BLANK_MISSION_TITLE } from "./domain/seed"
import type { MissionStore } from "./store"
import {
  presentMission,
  toHumanStopOrder,
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
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [panel, setPanel] = useState<MissionPanel>("plan")
  const [webMcp, setWebMcp] = useState<WebMcpState>({ type: "checking" })

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

  const dispatch = useCallback(
    (action: ViewAction) => {
      switch (action.type) {
        case "SelectPanel":
          setPanel(action.panel)
          return
        case "SelectStop":
          setSelectedStopId(action.stopId)
          return
        case "ShowStopOnMap":
          setSelectedStopId(action.stopId)
          setPanel("route")
          return
        case "SetStopStatus":
          if (
            store.dispatch({
              type: "UpdateStop",
              value: {
                actor: "human",
                input: {
                  expectedRevision: store.getSnapshot().revision,
                  reason: "Updated from the Sidequest board.",
                  status: action.status,
                  stopId: action.stopId,
                },
              },
            }).type === "applied"
          )
            setSelectedStopId(null)
          return
        case "SetStopLock":
          store.dispatch({
            type: "SetStopLock",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                locked: action.locked,
                stopId: action.stopId,
              },
            },
          })
          return
        case "ReorderStops": {
          const input = toHumanStopOrder(store.getSnapshot(), action.stopIds)
          if (input === null) return
          store.dispatch({
            type: "ReorderStops",
            value: { actor: "human", input },
          })
          return
        }
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
        case "SetTitle":
          store.dispatch({
            type: "SetTitle",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                title: action.title,
              },
            },
          })
          return
        case "AddItem":
          store.dispatch({
            type: "AddItem",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                title: action.title,
              },
            },
          })
          return
        case "RenameStop":
          store.dispatch({
            type: "RenameStop",
            value: {
              actor: "human",
              input: {
                expectedRevision: store.getSnapshot().revision,
                stopId: action.stopId,
                title: action.title,
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
          void navigator.clipboard
            .writeText(action.prompt)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
          return
        case "NewPlan":
          if (hasPlanContent(store) && !window.confirm(COPY.newPlanConfirm)) return
          store.newPlan()
          setSelectedStopId(null)
          setPanel("plan")
          return
        case "LoadDemo":
          if (hasPlanContent(store) && !window.confirm(COPY.loadDemoConfirm)) return
          store.loadDemo()
          setSelectedStopId(null)
          setPanel("plan")
          return
      }
    },
    [store],
  )

  return {
    dispatch,
    screen: useMemo(
      () => presentMission({ copied, mission, panel, selectedStopId, webMcp }),
      [copied, mission, panel, selectedStopId, webMcp],
    ),
  }
}
