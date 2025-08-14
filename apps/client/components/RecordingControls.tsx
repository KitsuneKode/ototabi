// 'use client'

// import { useRecording } from '@/hooks/useRecording'
// import { Button } from '@ototabi/ui/components/button'

// export function RecordingControls() {
//   const { recordingState, startRecording, stopRecording, pauseRecording, resumeRecording, sessions } = useRecording()

//   return (
//     <div className="flex flex-col items-center gap-4">
//       <div className="flex gap-4">
//         {recordingState === 'idle' || recordingState === 'stopped' ? (
//           <Button onClick={startRecording}>Start Recording</Button>
//         ) : (
//           <Button onClick={stopRecording}>Stop Recording</Button>
//         )}
//         {recordingState === 'recording' && (
//           <Button onClick={pauseRecording}>Pause Recording</Button>
//         )}
//         {recordingState === 'paused' && (
//           <Button onClick={resumeRecording}>Resume Recording</Button>
//         )}
//       </div>
//       {sessions.length > 0 && (
//         <div className="mt-4">
//           <h3 className="text-lg font-bold">Recorded Sessions</h3>
//           <ul>
//             {sessions.map((session) => (
//               <li key={session.id}>
//                 <h4 className="font-bold">Session {session.id}</h4>
//                 <ul>
//                   {Array.from(session.chunks.entries()).map(([id, blob]) => (
//                     <li key={id}>
//                       <a href={URL.createObjectURL(blob)} download={`chunk-${id}.webm`}>
//                         Chunk {id}
//                       </a>
//                     </li>
//                   ))}
//                 </ul>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   )
// }
