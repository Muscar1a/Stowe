import { useRef, useState } from 'react'
import { RenameSession } from '../../wailsjs/go/main/App'
import { sessionTitle } from './useSessions'
import type { Session } from './useSessions'

/** Inline-rename state shared by session title UIs (sidebar card, detail bar). */
export function useSessionRename(session: Session | null) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startRename() {
    if (!session) return
    setDraftName(sessionTitle(session, ''))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitRename() {
    setEditing(false)
    const name = draftName.trim()
    if (session && name && name !== sessionTitle(session, '')) {
      RenameSession(session.id, name)
    }
  }

  function cancelRename() {
    setEditing(false)
  }

  return { editing, draftName, setDraftName, inputRef, startRename, commitRename, cancelRename }
}
