import type { ILocalVideoTrack } from "agora-rtc-sdk-ng"

export interface AgoraCustomVideoFactory {
  createCustomVideoTrack: (config: {
    mediaStreamTrack: MediaStreamTrack
    width?: number
    height?: number
    frameRate?: number
  }) => ILocalVideoTrack
}

export interface CreateImageVideoTrackOptions {
  frameRate?: number
  existingTrack?: ILocalVideoTrack
  documentRef?: Document
  imageFactory?: () => HTMLImageElement
}

export interface CreateImageVideoTrackResult {
  track: ILocalVideoTrack
  canvas: HTMLCanvasElement
  stream: MediaStream
  stopRendering: () => void
}

const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720
const DEFAULT_FRAME_RATE = 5

export async function createImageVideoTrack(
  agora: AgoraCustomVideoFactory,
  imageUrl: string,
  options: CreateImageVideoTrackOptions = {},
): Promise<CreateImageVideoTrackResult> {
  const {
    frameRate = DEFAULT_FRAME_RATE,
    existingTrack,
    documentRef = document,
    imageFactory,
  } = options

  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new Error("A valid document reference is required to create image tracks.")
  }

  return new Promise((resolve, reject) => {
    const image = imageFactory ? imageFactory() : documentRef.createElement("img")

    const handleLoad = () => {
      const width = (image as HTMLImageElement).naturalWidth || image.width || DEFAULT_WIDTH
      const height = (image as HTMLImageElement).naturalHeight || image.height || DEFAULT_HEIGHT
      const canvas = documentRef.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d")
      if (!context) {
        reject(new Error("Canvas 2D context is not available."))
        return
      }

      const drawFrame = () => {
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
      }

      drawFrame()

      const view = documentRef.defaultView ?? window
      const effectiveFrameRate = frameRate > 0 ? frameRate : DEFAULT_FRAME_RATE
      const interval = Math.max(1000 / effectiveFrameRate, 16)
      let intervalId: ReturnType<typeof view.setInterval> | null = null

      const startRendering = () => {
        if (intervalId !== null) {
          return
        }
        intervalId = view.setInterval(drawFrame, interval)
      }

      const stopRendering = () => {
        if (intervalId !== null) {
          view.clearInterval(intervalId)
          intervalId = null
        }
      }

      startRendering()

      const stream = canvas.captureStream(effectiveFrameRate)
      const [mediaStreamTrack] = stream.getVideoTracks()
      if (!mediaStreamTrack) {
        stopRendering()
        reject(new Error("Failed to capture MediaStreamTrack from canvas."))
        return
      }

      const track = agora.createCustomVideoTrack({
        mediaStreamTrack,
        frameRate,
        width,
        height,
      })

      if (existingTrack) {
        try {
          existingTrack.stop()
          existingTrack.close()
        } catch (err) {
          console.warn("Failed to stop existing image track", err)
        }
      }

      resolve({
        track,
        canvas,
        stream,
        stopRendering,
      })
    }

    const handleError = () => {
      reject(new Error("Failed to load image for custom video track."))
    }

    image.onload = handleLoad
    image.onerror = handleError

    try {
      image.crossOrigin = "anonymous"
    } catch (err) {
      console.warn("Unable to set crossOrigin on image element", err)
    }

    image.src = imageUrl
  })
}
