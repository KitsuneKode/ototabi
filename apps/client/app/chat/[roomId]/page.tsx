'use client'

import { start } from 'repl'
import config from '@/utils/config'
import '@livekit/components-styles'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@ototabi/ui/components/button'
import { RecorderManager } from '@/utils/recorder-manager'
import {
  LocalParticipant,
  Room,
  RoomOptions,
  Track,
  VideoPresets,
} from 'livekit-client'
// import { RecorderManager } from '@/utils/recorder-manager'
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomContext,
  useLocalParticipant,
  usePersistentUserChoices,
  useRoomContext,
  useTracks,
} from '@livekit/components-react'

export default function Page() {
  // TODO: get user input for room and name
  const room = 'quickstart-room'
  const { roomId } = useParams()
  const [token, setToken] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const [roomInstance] = useState(
    () =>
      new Room({
        // Optimize video quality for each participant's screen
        adaptiveStream: true,
        // Enable automatic audio/video quality optimization
        dynacast: true,
        videoCaptureDefaults: VideoPresets.h720,
        screenShareDefaults: VideoPresets.h720,
        // loggerName: 'LiveKit',
        // videoCaptureDefaults: {
        //   resolution: {
        //     height: 720,
        //     width: 1280,
        //     frameRate: 30,
        //   },

        //   frameRate: 30,
        // },
        audioCaptureDefaults: {
          sampleRate: 48_000,
          channelCount: 2,
        },

        publishDefaults: {
          videoEncoding: {
            maxBitrate: 1000000,
            maxFramerate: 30,
          },
          screenShareEncoding: {
            maxFramerate: 30,
            maxBitrate: 1000000,
          },
        },
      } as RoomOptions),
  )

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await fetch(
          `${config.getConfig('apiBaseUrl')}/api/token?room=${room}&username=${roomId}`,
        )
        const data = await resp.json()
        if (!mounted) return
        if (data.token) {
          setToken(data.token)
          await roomInstance.connect(config.getConfig('liveKitUrl'), data.token)
        }
      } catch (e) {
        console.error(e)
      }
    })()

    return () => {
      mounted = false
      roomInstance.disconnect()
      roomInstance.localParticipant.off('localTrackPublished', () => {
        console.log('closed')
      })
      roomInstance.localParticipant.off('localTrackUnpublished', () => {
        console.log('closed')
      })
    }
  }, [roomInstance, roomId])

  if (token === '') {
    return <div>Getting token...</div>
  }
  roomInstance.on('localTrackPublished', (e) => {
    console.log('published', e)
    if (e.track) {
      console.log('camera published')
      e.track.on('videoPlaybackStarted', () => {
        console.log('videoPlaybackStarted')
      })
      e.track.on('muted', () => {
        if (e.source === Track.Source.Camera) console.log('camera disabled')
        if (e.source === Track.Source.Microphone)
          console.log('microphone disabled')
        if (e.source === Track.Source.ScreenShare)
          console.log('screen share disabled')
      })
      e.track.on('unmuted', () => {
        if (e.source === Track.Source.Camera) console.log('camera enabled')
        if (e.source === Track.Source.Microphone)
          console.log('microphone enabled')
        if (e.source === Track.Source.ScreenShare)
          console.log('screen share enabled')
      })
    }
  })
  roomInstance.on('localTrackUnpublished', (e) => {
    console.log('unpublished', e)
  })

  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <ControlBar />
      </div>
    </RoomContext.Provider>
  )
}
function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  const isActive = localParticipant.isCameraEnabled
  const isMicrophoneEnabled = localParticipant.isMicrophoneEnabled
  // State management
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // // Use useRef for RecorderManager to prevent recreation

  const recorderManager = useRef<RecorderManager | null>(null)

  // // Initialize RecorderManager when component mounts
  useEffect(() => {
    recorderManager.current = new RecorderManager({ room })

    // Cleanup on unmount
    return () => {
      if (recorderManager.current) {
        recorderManager.current.cleanup()
      }
    }
  }, [room])

  // const stopAndUpload = async () => {
  //   if (!recorderManager.current) return

  //   try {
  //     setIsUploading(true)
  //     setUploadProgress(0)

  //     // Stop recording first
  //     await recorderManager.current.stopRecording()
  //     setIsRecording(false)

  //     // Get the most recent session
  //     const sessions = recorderManager.current.getRecordingSessions()
  //     if (sessions.length === 0) {
  //       throw new Error('No recording session found')
  //     }

  //     const latestSession = sessions[sessions.length - 1]

  //     if (!latestSession) {
  //       throw new Error('No recording session found')
  //     }

  //     // Upload to S3 with progress tracking
  //     const s3Url = await recorderManager.current.uploadToS3(
  //       latestSession.id,
  //       (progress) => setUploadProgress(progress),
  //     )

  //     console.log('Successfully uploaded to S3:', s3Url)
  //     // Here you can save the s3Url to your database or state
  //   } catch (error) {
  //     console.error('Upload failed:', error)
  //   } finally {
  //     setIsUploading(false)
  //   }
  // }

  const stopRecording = async () => {
    if (!recorderManager.current) return

    try {
      await recorderManager.current.stopRecording()
      // const sessions = recorderManager.current.getRecordingSessions()
      // console.log('Recording stopped. Sessions:', sessions)
      setIsRecording(false)
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  const startRecording = () => {
    if (!recorderManager.current) return

    try {
      recorderManager.current.startRecording()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  // // Clean up local tracks
  // const localTracks = tracks.filter((track) => track.participant.isLocal)

  // localParticipant.on('localTrackUnpublished', (e) => {
  //   console.log('track unpublished', e.trackInfo)
  // })

  return (
    <>
      <div className="mb-4 flex gap-2">
        <Button onClick={startRecording}>Start Recording</Button>
        <Button onClick={stopRecording}>Stop Recording</Button>
        {isActive && 'Is Active'}
        {/* <Button
          onClick={startRecording}
          disabled={isRecording || isUploading}
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </Button>
        <Button
          onClick={stopAndUpload}
          disabled={!isRecording || isUploading}
          variant="outline"
        >
          {isUploading ? 'Uploading...' : 'Stop & Upload'}
        </Button>
        <Button
          onClick={stopRecording}
          disabled={!isRecording || isUploading}
          variant="outline"
        >
          Stop Without Saving
        </Button> */}
      </div>

      {isUploading && (
        <div className="mb-4 h-2.5 w-full rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
          <p className="mt-1 text-sm text-gray-600">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
      <GridLayout
        tracks={tracks}
        style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}
      >
        <ParticipantTile />
      </GridLayout>
    </>
  )
}
// function MyVideoConference() {
//   // `useTracks` returns all camera and screen share tracks. If a user
//   // joins without a published camera track, a placeholder track is returned.
//   const tracks = useTracks(
//     [
//       { source: Track.Source.Camera, withPlaceholder: false },
//       { source: Track.Source.ScreenShare, withPlaceholder: false },
//     ],
//     { onlySubscribed: false },
//   )
//   const room = useRoomContext()
//   const recorderManager = new RecorderManager({ room })
//   const { localParticipant } = useLocalParticipant()
//   let med: MediaStream | null = null

//   localParticipant.videoTrackPublications.forEach((track) => {
//     console.log(track.source)
//     console.log(track.track?.mediaStreamTrack.getSettings())
//   })
//   localParticipant.trackPublications.forEach((trackRef) => {
//     console.log(trackRef.source, trackRef.isMuted)
//     if (
//       !trackRef.track?.mediaStreamTrack ||
//       trackRef.source !== Track.Source.ScreenShare
//     )
//       return
//     console.log(trackRef.track?.mediaStreamTrack.getSettings())

//     med = new MediaStream([trackRef.track?.mediaStreamTrack])
//     // console.log(med)
//   })
//   const chunks: Blob[] = []
//   const stopAndUpload = async () => {
//     try {
//       setIsUploading(true)
//       setUploadProgress(0)

//       // Stop recording first
//       await recorderManager.stopRecording()

//       // Get the most recent session
//       const sessions = recorderManager.getRecordingSessions()
//       if (sessions.length === 0) {
//         throw new Error('No recording session found')
//       }

//       const latestSession = sessions[sessions.length - 1]

//       // Upload to S3 with progress tracking
//       const s3Url = await recorderManager.uploadToS3(
//         latestSession.id,
//         (progress) => setUploadProgress(progress)
//       )

//       console.log('Successfully uploaded to S3:', s3Url)
//       // Here you can save the s3Url to your database or state

//     } catch (error) {
//       console.error('Upload failed:', error)
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   const stopRecording = async () => {
//     try {
//       await recorderManager.stopRecording()
//       const sessions = recorderManager.getRecordingSessions()
//       console.log('Recording stopped. Sessions:', sessions)
//     } catch (error) {
//       console.error('Error stopping recording:', error)
//     }
//   }

//   const startRecording = () => {
//     recorderManager.startRecording()
//     setIsRecording(true)
//   }

//   const localTracks = tracks.filter((track) => track.participant.isLocal)

//   localTracks.map((track) => {
//     console.log('Tracks', track.publication)
//   })

//   return (
//     <>
//       <div className="flex gap-2 mb-4">
//         <Button
//           onClick={startRecording}
//           disabled={isRecording || isUploading}
//           variant={isRecording ? 'destructive' : 'default'}
//         >
//           {isRecording ? 'Recording...' : 'Start Recording'}
//         </Button>
//         <Button
//           onClick={stopAndUpload}
//           disabled={!isRecording || isUploading}
//           variant="outline"
//         >
//           {isUploading ? 'Uploading...' : 'Stop & Upload'}
//         </Button>
//         <Button
//           onClick={stopRecording}
//           disabled={!isRecording || isUploading}
//           variant="outline"
//         >
//           Stop Without Saving
//         </Button>
//       </div>

//       {isUploading && (
//         <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
//           <div
//             className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
//             style={{ width: `${uploadProgress}%` }}
//           />
//           <p className="text-sm text-gray-600 mt-1">
//             Uploading... {uploadProgress}%
//           </p>
//         </div>
//       )}
//       <GridLayout
//         tracks={tracks}
//         style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}
//       >
//         {/* The GridLayout accepts zero or one child. The child is used
//       as a template to render all passed in tracks. */}

//         <ParticipantTile />
//       </GridLayout>
//     </>
//   )
// }
