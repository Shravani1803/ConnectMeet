import React, { useState, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { AiFillPushpin, AiOutlinePushpin } from 'react-icons/ai'
import Typography from '@mui/material/Typography'
import { MediaStreamContext, ProviderProps } from 'context/MediaStream'
import {
  MediaScreenStreamContext,
  ProviderScreenProps,
} from 'context/ScreenStream'

import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsMicFill,
  BsFillMicMuteFill,
} from 'react-icons/bs'

interface AudioVideoBarProps {
  pinVideoObj: MediaStream | null
  onStartAudioVideo?: () => void
  pinVideo: (id: string) => void
  unPinVideo: () => void
}

const AudioVideoBar: React.FC<AudioVideoBarProps> = (props) => {
  const { pinVideoObj, onStartAudioVideo, pinVideo, unPinVideo } = props
  const { userStream, remoteStreams } = React.useContext(
    MediaStreamContext
  ) as ProviderProps

  const { userScreenStream } = React.useContext(
    MediaScreenStreamContext
  ) as ProviderScreenProps

  // State to track Mic and Camera status
  const [isMicOn, setIsMicOn] = useState<boolean>(true)
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true)

  // Sync initial track states whenever userStream starts
  useEffect(() => {
    if (userStream) {
      const audioTracks = userStream.getAudioTracks()
      const videoTracks = userStream.getVideoTracks()
      if (audioTracks.length > 0) setIsMicOn(audioTracks[0].enabled)
      if (videoTracks.length > 0) setIsVideoOn(videoTracks[0].enabled)
    }
  }, [userStream])

  // Toggle Microphone On/Off
  const handleToggleMic = () => {
    if (!userStream) return
    const audioTracks = userStream.getAudioTracks()
    if (audioTracks.length > 0) {
      const nextState = !isMicOn
      audioTracks.forEach((track) => {
        track.enabled = nextState
      })
      setIsMicOn(nextState)
    }
  }

  // Toggle Camera On/Off
  const handleToggleVideo = () => {
    if (!userStream) return
    const videoTracks = userStream.getVideoTracks()
    if (videoTracks.length > 0) {
      const nextState = !isVideoOn
      videoTracks.forEach((track) => {
        track.enabled = nextState
      })
      setIsVideoOn(nextState)
    }
  }

  return (
    <div className="h-full w-full rounded-md bg-transparent">
      <div className="video-player-container w-full rounded-md">
        {userStream ? (
          <>
            {pinVideoObj?.id !== userStream.id && (
              <div className="group relative overflow-hidden rounded-md bg-slate-800">
                {React.createElement(ReactPlayer as any, {
                  width: '100%',
                  height: '100%',
                  url: userStream,
                  muted: true,
                  playing: true,
                  controls: false,
                  className: `opacity-100 group-hover:opacity-50 ${
                    !isVideoOn ? 'invisible' : ''
                  }`,
                })}

                {/* Show placeholder overlay when camera is toggled off */}
                {!isVideoOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-white">
                    <BsCameraVideoOffFill size={28} />
                    <span className="mt-1 text-xs">Camera Off</span>
                  </div>
                )}

                {pinVideoObj && pinVideoObj.id == userStream.id ? (
                  <button
                    className="absolute top-[50%] left-0 right-0 z-10 hidden group-hover:block"
                    onClick={unPinVideo}
                  >
                    <AiFillPushpin
                      className="m-auto"
                      size={30}
                      title="UnPin video"
                    />
                  </button>
                ) : (
                  <button
                    className="absolute top-[50%] left-0 right-0 z-10 hidden group-hover:block"
                    onClick={() => pinVideo(userStream.id)}
                  >
                    <AiOutlinePushpin
                      className="m-auto"
                      size={30}
                      title="Pin video"
                    />
                  </button>
                )}
              </div>
            )}

            {/* Mic & Camera Control Bar */}
            <div className="mt-2 flex items-center justify-center gap-4 rounded-md bg-slate-700 py-2 shadow">
              <button
                onClick={handleToggleMic}
                className={`flex items-center justify-center rounded-full p-2.5 text-white transition ${
                  isMicOn
                    ? 'bg-sky-600 hover:bg-sky-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? (
                  <BsMicFill size={18} />
                ) : (
                  <BsFillMicMuteFill size={18} />
                )}
              </button>

              <button
                onClick={handleToggleVideo}
                className={`flex items-center justify-center rounded-full p-2.5 text-white transition ${
                  isVideoOn
                    ? 'bg-sky-600 hover:bg-sky-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoOn ? (
                  <BsCameraVideoFill size={18} />
                ) : (
                  <BsCameraVideoOffFill size={18} />
                )}
              </button>
            </div>
          </>
        ) : (
          <div
            onClick={onStartAudioVideo}
            className="flex h-48 w-full cursor-pointer items-center justify-center rounded-md bg-slate-500 transition hover:bg-slate-600"
          >
            <div className="text-center text-lg">
              <BsCameraVideoOffFill className="mx-auto" />
              <div className="my-5" />
              <div>
                <Typography variant="body1">
                  Your video is turned off.
                </Typography>
                <Typography variant="caption">Click to turn on</Typography>
              </div>
            </div>
          </div>
        )}
      </div>

      {userScreenStream && pinVideoObj?.id !== userScreenStream.id && (
        <>
          <div className="my-5" />
          <div className="video-player-container w-full rounded-md">
            <div className="group relative">
              {React.createElement(ReactPlayer as any, {
                key: userScreenStream.id,
                width: '100%',
                height: '100%',
                url: userScreenStream,
                playing: true,
                controls: false,
                pip: true,
                className: 'opacity-100 group-hover:opacity-50',
              })}
              {pinVideoObj && pinVideoObj.id == userScreenStream.id ? (
                <button
                  className="absolute top-[50%] left-0 right-0 hidden group-hover:block"
                  onClick={unPinVideo}
                >
                  <AiFillPushpin
                    className="m-auto"
                    size={30}
                    title="UnPin video"
                  />
                </button>
              ) : (
                <button
                  className="absolute top-[50%] left-0 right-0 hidden group-hover:block"
                  onClick={() => pinVideo(userScreenStream.id)}
                >
                  <AiOutlinePushpin
                    className="m-auto"
                    size={30}
                    title="Pin video"
                  />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="my-5" />
                <div className="video-player-container w-full rounded-md">
        {remoteStreams
          .filter((stream) => stream.id !== pinVideoObj?.id)
          .map((stream) => (
            <React.Fragment key={stream.id}>
              <div className="my-5" />
              <div className="group relative overflow-hidden rounded-md bg-slate-800">
                <video
                  autoPlay
                  playsInline
                  className="h-full w-full rounded-md"
                  ref={(videoEl) => {
                    if (videoEl && videoEl.srcObject !== stream) {
                      videoEl.srcObject = stream
                    }
                  }}
                />
                {pinVideoObj && pinVideoObj.id == stream.id ? (
                  <button
                    className="absolute top-[50%] left-0 right-0 hidden group-hover:block"
                    onClick={unPinVideo}
                  >
                    <AiFillPushpin
                      className="m-auto"
                      size={30}
                      title="UnPin video"
                    />
                  </button>
                ) : (
                  <button
                    className="absolute top-[50%] left-0 right-0 hidden group-hover:block"
                    onClick={() => pinVideo(stream.id)}
                  >
                    <AiOutlinePushpin
                      className="m-auto"
                      size={30}
                      title="Pin video"
                    />
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
      </div>

    </div>
  )
}

export default AudioVideoBar
