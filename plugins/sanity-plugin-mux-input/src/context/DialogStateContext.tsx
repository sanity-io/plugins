import React, {createContext, useContext, useMemo} from 'react'

import {type DialogState, type SetDialogState} from '../hooks/useDialogState'

type DialogStateContextProps = {
  dialogState: DialogState
  setDialogState: SetDialogState
}

const DialogStateContext = createContext<DialogStateContextProps>({
  dialogState: false,
  setDialogState: () => {
    return null
  },
})

interface DialogStateProviderProps extends DialogStateContextProps {
  children: React.ReactNode
}

export const DialogStateProvider = ({
  dialogState,
  setDialogState,
  children,
}: DialogStateProviderProps) => {
  const value = useMemo(() => ({dialogState, setDialogState}), [dialogState, setDialogState])
  return <DialogStateContext.Provider value={value}>{children}</DialogStateContext.Provider>
}

export const useDialogStateContext = () => {
  const context = useContext(DialogStateContext)
  return context
}
