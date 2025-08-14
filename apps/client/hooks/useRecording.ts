// 'use client'

// import { useRoomContext } from '@livekit/components-react'
// import { DataPacket_Kind, RoomEvent } from 'livekit-client'
// import { useCallback, useEffect, useRef, useState } from 'react'
// import { RecorderManager, RecordingSession } from '@/utils/recorder-manager'

// type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

// export function useRecording() {
//   const room = useRoomContext()
//   const recorderManager = useRef<RecorderManager | null>(null)
//   const [recordingState, setRecordingState] = useState<RecordingState>('idle')
//   const [sessions, setSessions] = useState<RecordingSession[]>([])

//   const handleDataReceived = useCallback(
//     (payload: Uint8Array, kind: DataPacket_Kind) => {
//       if (kind !== DataPacket_Kind.RELIABLE) return

//       const message = new TextDecoder().decode(payload)
//       if (message === 'start-recording') {
//         recorderManager.current?.startRecording()
//         setRecordingState('recording')
//       } else if (message === 'stop-recording') {
//         recorderManager.current?.stopRecording()
//         setRecordingState('stopped')
//         setSessions(recorderManager.current?.getRecordingSessions() || [])
//       } else if (message === 'pause-recording') {
//         recorderManager.current?.pauseRecording()
//         setRecordingState('paused')
//       } else if (message === 'resume-recording') {
//         recorderManager.current?.resumeRecording()
//         setRecordingState('recording')
//       }
//     },
//     [],
//   )

//   useEffect(() => {
//     if (!room) return

//     recorderManager.current = new RecorderManager({ room })
//     room.on(RoomEvent.DataReceived, handleDataReceived)

//     return () => {
//       room.off(RoomEvent.DataReceived, handleDataReceived)
//       recorderManager.current?.cleanup()
//     }
//   }, [room, handleDataReceived])

//   const sendControlMessage = (message: string) => {
//     if (!room) return
//     const payload = new TextEncoder().encode(message)
//     room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE)
//   }

//   const startRecording = () => {
//     sendControlMessage('start-recording')
//     handleDataReceived(
//       new TextEncoder().encode('start-recording'),
//       DataPacket_Kind.RELIABLE,
//     )
//   }

//   const stopRecording = () => {
//     sendControlMessage('stop-recording')
//     handleDataReceived(
//       new TextEncoder().encode('stop-recording'),
//       DataPacket_Kind.RELIABLE,
//     )
//   }

//   const pauseRecording = () => {
//     sendControlMessage('pause-recording')
//     handleDataReceived(
//       new TextEncoder().encode('pause-recording'),
//       DataPacket_Kind.RELIABLE,
//     )
//   }

//   const resumeRecording = () => {
//     sendControlMessage('resume-recording')
//     handleDataReceived(
//       new TextEncoder().encode('resume-recording'),
//       DataPacket_Kind.RELIABLE,
//     )
//   }

//   return {
//     recordingState,
//     startRecording,
//     stopRecording,
//     pauseRecording,
//     resumeRecording,
//     sessions,
//   }
// }
