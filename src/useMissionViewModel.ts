import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { COPY } from "./copy"
import type { MissionStore } from "./store"
import {
  presentMission,
  type ViewAction,
  type WebMcpState,
} from "./view-model"
import type { WebMcpRegistration } from "./webmcp"

type UseMissionViewModelParams = {
  registration: Promise<WebMcpRegistration>
  store: MissionStore
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
        case "SelectStop":
          setSelectedStopId(action.stopId)
          return
        case "SetStopStatus":
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
          })
          return
        case "CopyPrompt":
          if (navigator.clipboard === undefined) return
          void navigator.clipboard
            .writeText(COPY.demoPrompt)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
          return
        case "Reset":
          if (window.confirm(COPY.resetConfirm)) {
            store.reset()
            setSelectedStopId(null)
          }
          return
      }
    },
    [store],
  )

  return {
    dispatch,
    screen: useMemo(
      () => presentMission({ copied, mission, selectedStopId, webMcp }),
      [copied, mission, selectedStopId, webMcp],
    ),
  }
}
