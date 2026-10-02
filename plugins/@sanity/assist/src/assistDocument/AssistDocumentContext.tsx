import {createContext, useContext} from 'react'
import {type DocumentInspector, type ObjectSchemaType, PatchEvent} from 'sanity'

import type {FieldRef} from '../assistInspector/helpers'
import type {InstructionTask, StudioAssistDocument} from '../types'

export type AssistDocumentContextValue = (
  | {assistDocument: StudioAssistDocument; loading: false}
  | {assistDocument: undefined; loading: true}
) & {
  documentIsNew: boolean
  /**
   * This is the _actual_ id of the current document (ie the document loaded in the pane); it contains draft. versions. prefix ect depending on context
   */
  assistableDocumentId: string
  /**
   * True when a real write target exists: a `drafts.*` snapshot, the selected
   * release version, or the published document for live-edit types.
   *
   * After publish, the drafts perspective can still display published values
   * (a virtual draft) while this is false because `editState.draft` is null.
   */
  documentIsAssistable: boolean
  /**
   * True while the document store still has an in-flight commit (for example
   * the mutation that materializes a draft from published values).
   */
  documentIsSyncing: boolean
  documentSchemaType: ObjectSchemaType
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void
  closeInspector: (inspectorName?: string) => void
  inspector: DocumentInspector | null
  selectedPath?: string
  documentOnChange: (event: PatchEvent) => void

  /**
   * Synthetic task is used to display AI presence at the document level for the user who started the action.
   * These are not persisted, so other users will not see them.
   * It is mostly a helper to give _some_ visual feedback to the user while a custom action is running.
   * This also means that reloading the page will remove the icon.
   *
   * Agent Actions add their own "real" tasks, so if a custom action calls an Agent action, _those_ tasks
   * are visible across sessions.
   */
  syntheticTasks?: InstructionTask[]
  addSyntheticTask: (syntheticTask: InstructionTask) => void
  removeSyntheticTask: (syntheticTask: InstructionTask) => void

  fieldRefs: FieldRef[]
  fieldRefsByTypePath: Record<string, FieldRef | undefined>
}

export const AssistDocumentContext = createContext<AssistDocumentContextValue | undefined>(
  undefined,
)

export function useAssistDocumentContext(): AssistDocumentContextValue {
  const context = useContext(AssistDocumentContext)
  if (!context) {
    throw new Error('AssistDocumentContext value is missing')
  }
  return context
}
