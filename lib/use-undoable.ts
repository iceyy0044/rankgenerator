"use client"

import { useCallback, useReducer } from "react"

interface UndoableState<T> {
  past: T[]
  present: T
  future: T[]
}

type UndoableAction<T> =
  | { type: "set"; value: T }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; value: T }

function undoableReducer<T>(state: UndoableState<T>, action: UndoableAction<T>): UndoableState<T> {
  switch (action.type) {
    case "set": {
      if (action.value === state.present) return state
      return { past: [...state.past, state.present], present: action.value, future: [] }
    }
    case "undo": {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] }
    }
    case "redo": {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return { past: [...state.past, state.present], present: next, future: state.future.slice(1) }
    }
    case "load": {
      return { past: [], present: action.value, future: [] }
    }
  }
}

/**
 * Tracks a value with linear undo/redo history. `set` pushes a new undoable
 * entry (used for normal edits and "Reset to default"); `load` replaces the
 * value and clears history (used when a saved config is loaded wholesale).
 */
export function useUndoable<T>(initial: T) {
  const [state, dispatch] = useReducer(undoableReducer<T>, { past: [], present: initial, future: [] })

  const set = useCallback((value: T) => dispatch({ type: "set", value }), [])
  const undo = useCallback(() => dispatch({ type: "undo" }), [])
  const redo = useCallback(() => dispatch({ type: "redo" }), [])
  const load = useCallback((value: T) => dispatch({ type: "load", value }), [])

  return {
    value: state.present,
    set,
    undo,
    redo,
    load,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
