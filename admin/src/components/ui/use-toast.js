import * as React from "react"
import { v4 as uuidv4 } from 'uuid';

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
}

function genId() {
  return uuidv4();
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      throw new Error()
  }
}

const listeners = []

let memoryState = { toasts: [] }

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function dismissToast(toastId) {
  dispatch({ type: actionTypes.DISMISS_TOAST, toastId })
}

function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: React.useCallback(
      function toast({ ...props }) {
        const id = genId()

        const update = (props) =>
          dispatch({
            type: actionTypes.UPDATE_TOAST,
            toast: { ...props, id },
          })

        const dismiss = () => {
          dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
          
          setTimeout(() => {
            dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id })
          }, TOAST_REMOVE_DELAY)
        }

        dispatch({
          type: actionTypes.ADD_TOAST,
          toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
              if (!open) dismiss()
            },
          },
        })

        return {
          id: id,
          dismiss,
          update,
        }
      },
      []
    ),
    dismiss: dismissToast,
  }
}

export { useToast, dismissToast }