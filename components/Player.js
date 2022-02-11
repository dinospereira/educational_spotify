import { useSession } from 'next-auth/react'
import React, { useCallback, useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { currentTrackIdState, isPlayingState } from '../atoms/songAtom'
import useSpotify from '../hooks/useSpotify'
import useSongInfo from '../hooks/useSongInfo'
import {
  RewindIcon,
  SwitchHorizontalIcon,
  FastForwardIcon,
  VolumeUpIcon,
  PlayIcon,
  PauseIcon,
  ReplyIcon,
} from '@heroicons/react/solid'
import { VolumeUpIcon as VolumeDownIcon } from '@heroicons/react/outline'
import { debounce } from 'lodash'

function Player() {
  const spotifyApi = useSpotify()
  const { data: session } = useSession()

  const [currentTrackId, setCurrentTrackId] = useRecoilState(currentTrackIdState)
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState)

  const [volume, setVolume] = useState(50)

  const songInfo = useSongInfo()

  const fetchCurrentSong = () => {
    if (!songInfo) {
      spotifyApi.getMyCurrentPlayingTrack().then((data) => {
        setCurrentTrackId(data.body?.item?.id)

        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setIsPlaying(data.body?.is_playing)
        })
      })
    }
  }

  const handlePlayPause = () => {
    spotifyApi.getMyCurrentPlaybackState().then((data) => {
      if (data.body.is_playing) {
        spotifyApi.pause()
        setIsPlaying(false)
      } else {
        spotifyApi.play()
        setIsPlaying(true)
      }
    })
  }

  const handleNext = () => {
    spotifyApi.skipToNext().then(
      function () {
        console.log('Skip to next')
      },
      function (err) {
        //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
        console.log('Something went wrong!', err)
      }
    )
  }

  const handlePrevious = () => {
    spotifyApi.skipToPrevious().then(
      function () {
        console.log('Skip to previous')
      },
      function (err) {
        //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
        console.log('Something went wrong!', err)
      }
    )
  }

  useEffect(() => {
    if (spotifyApi.getAccessToken() && !currentTrackId) {
      fetchCurrentSong()
      setVolume(50)
    }
  }, [currentTrackId, spotifyApi, session])

  useEffect(() => {
    if (volume > 0 && volume < 100) {
      debouncedAdjustedVolume(volume)
    }
  }, [volume])

  const debouncedAdjustedVolume = useCallback(
    debounce((volume) => {
      console.log(volume)
      spotifyApi.setVolume(volume).catch((err) => console.log(err))
    }, 500),
    []
  )

  return (
    <div className="grid h-24 grid-cols-3 bg-gradient-to-b from-black to-gray-900 px-2 text-xs text-white md:px-8 md:text-base">
      <div className="flex items-center space-x-4">
        <img className="hidden h-10 w-10 md:inline" src={songInfo?.album?.images?.[0]?.url} alt="Song Image" />
        <div>
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
      </div>
      <div className="flex items-center justify-evenly">
        <SwitchHorizontalIcon className="button" />
        <RewindIcon className="button" onClick={handlePrevious} />
        {isPlaying ? (
          <PauseIcon className="button h-10 w-10" onClick={handlePlayPause} />
        ) : (
          <PlayIcon className="button h-10 w-10" onClick={handlePlayPause} />
        )}
        <FastForwardIcon className="button" onClick={handleNext} />
        <ReplyIcon className="button" />
      </div>
      <div className="flex items-center justify-end space-x-3 pr-5 md:space-x-4">
        <VolumeDownIcon className="button" onClick={() => volume > 0 && setVolume(volume - 10)} />
        <input
          className="w-14 md:w-28"
          type="range"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          min={0}
          max={100}
        />
        <VolumeUpIcon className="button" onClick={() => volume < 100 && setVolume(volume + 10)} />
      </div>
    </div>
  )
}

export default Player
