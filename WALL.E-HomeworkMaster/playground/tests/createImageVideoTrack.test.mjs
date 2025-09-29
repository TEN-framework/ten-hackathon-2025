import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = path.resolve('.test-dist/manager/rtc/imageTrack.js')
const { createImageVideoTrack } = await import(pathToFileURL(modulePath).href)

class StubMediaStreamTrack {
  constructor() {
    this.stopped = false
  }

  stop() {
    this.stopped = true
  }
}

class StubCanvas {
  constructor() {
    this.width = 0
    this.height = 0
    this.context = {
      clearRect: () => {},
      drawImage: () => {},
    }
    this.streamTrack = new StubMediaStreamTrack()
  }

  getContext(type) {
    if (type === '2d') {
      return this.context
    }
    return null
  }

  captureStream(frameRate) {
    this.captureFrameRate = frameRate
    return {
      getVideoTracks: () => [this.streamTrack],
    }
  }
}

class StubImage {
  constructor(width = 640, height = 480, shouldFail = false) {
    this.width = width
    this.height = height
    this.shouldFail = shouldFail
    this.onload = null
    this.onerror = null
    this.crossOrigin = ''
  }

  get naturalWidth() {
    return this.width
  }

  get naturalHeight() {
    return this.height
  }

  set src(value) {
    this._src = value
    queueMicrotask(() => {
      if (this.shouldFail) {
        this.onerror?.(new Error('fail'))
      } else {
        this.onload?.()
      }
    })
  }
}

class StubLocalVideoTrack {
  constructor() {
    this.stopCalled = 0
    this.closeCalled = 0
  }

  stop() {
    this.stopCalled += 1
  }

  close() {
    this.closeCalled += 1
  }
}

const createDocumentStub = (canvasRef) => ({
  createElement: (tag) => {
    if (tag === 'canvas') {
      return canvasRef()
    }
    if (tag === 'img') {
      return new StubImage()
    }
    throw new Error(`Unsupported tag: ${tag}`)
  },
})

const createAgoraStub = (collector) => ({
  createCustomVideoTrack: (config) => {
    collector.push(config)
    return { id: 'custom-track' }
  },
})

test('createImageVideoTrack builds a custom track from image data', async () => {
  const canvasInstances = []
  const docStub = createDocumentStub(() => {
    const canvas = new StubCanvas()
    canvasInstances.push(canvas)
    return canvas
  })
  const agoraCalls = []
  const agoraStub = createAgoraStub(agoraCalls)
  const existingTrack = new StubLocalVideoTrack()
  const image = new StubImage(800, 600, false)

  const result = await createImageVideoTrack(agoraStub, 'data:image/png;base64,xxx', {
    frameRate: 12,
    existingTrack,
    documentRef: docStub,
    imageFactory: () => image,
  })

  assert.equal(result.track.id, 'custom-track')
  assert.equal(canvasInstances[0].width, 800)
  assert.equal(canvasInstances[0].height, 600)
  assert.equal(canvasInstances[0].captureFrameRate, 12)
  assert.equal(agoraCalls.length, 1)
  assert.equal(agoraCalls[0].width, 800)
  assert.equal(agoraCalls[0].height, 600)
  assert.equal(agoraCalls[0].frameRate, 12)
  assert.ok(agoraCalls[0].mediaStreamTrack instanceof StubMediaStreamTrack)
  assert.equal(existingTrack.stopCalled, 1)
  assert.equal(existingTrack.closeCalled, 1)
})

test('createImageVideoTrack rejects when image fails to load', async () => {
  const canvasInstances = []
  const docStub = createDocumentStub(() => {
    const canvas = new StubCanvas()
    canvasInstances.push(canvas)
    return canvas
  })
  const agoraStub = createAgoraStub([])
  const failingImage = new StubImage(640, 480, true)

  await assert.rejects(() =>
    createImageVideoTrack(agoraStub, 'data:image/png;base64,zzz', {
      documentRef: docStub,
      imageFactory: () => failingImage,
    }),
  )
})
