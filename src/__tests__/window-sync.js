/* global test, expect, beforeEach */
import { resetContext, kea } from 'kea'

import { windowValuesPlugin } from '../index'

let mockWindow

beforeEach(() => {
  mockWindow = {
    innerWidth: 1024,
    _listeners: [],
    updateListeners() {
      mockWindow._listeners.forEach((l) => l())
    },
    addEventListener(_, l) {
      mockWindow._listeners.push(l)
    },
    removeEventListener(l) {
      mockWindow._listeners = mockWindow._listeners.filter((ll) => ll !== l)
    },
    document: {
      addEventListener(_, l) {
        mockWindow.addEventListener(_, l)
      },
      removeEventListener(_, l) {
        mockWindow.removeEventListener(_, l)
      },
    },
  }

  resetContext({
    plugins: [windowValuesPlugin({ window: mockWindow })],
  })
})

test('gets the default and updates it', async () => {
  const logic = kea({
    windowValues: () => ({
      innerWidth: (window) => window.innerWidth,
    }),
  })
  logic.mount()
  expect(logic.values.innerWidth).toEqual(1024)

  mockWindow.innerWidth = 800
  expect(logic.values.innerWidth).toEqual(1024)
  mockWindow.updateListeners()
  expect(logic.values.innerWidth).toEqual(800)
})
