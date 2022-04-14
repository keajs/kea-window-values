/*
  // Sync `window.whatever` with `values.anything`
  // Sync on window onscroll & onresize events.

  import { windowValuesPlugin } from 'kea-window-values
  resetContext({
    plugins: [windowValuesPlugin({ window: window })]
  }),

  kea({
    windowValues: {
      isSmallScreen: window => window.innerWidth < 640,
      isRetina: window => window.devicePixelRatio > 2,
      scrollWidth: window => window.innerWidth - window.body.clientWidth
    }
  })
*/
import {
  kea,
  setPluginContext,
  getPluginContext,
  KeaPlugin,
  LogicBuilder,
  Logic,
  reducers,
  afterMount,
  beforeUnmount,
  BuiltLogic,
} from 'kea'

export type WindowValuesInput = Record<string, Record<string, any>>

export type WindowValuesPluginContext = {
  windowObject?: Window
  mounted: Record<string, (() => void) | undefined>
  eventListener: () => void
}

export const windowValuesLogic = kea({
  path: () => ['kea', 'windowValues', 'logic'],
  actions: () => ({
    syncWindowValues: (windowValues: Record<string, Record<string, any>>) => ({ windowValues }),
  }),
})

export const windowValuesPlugin = ({ window: windowObject = window }): KeaPlugin => ({
  name: 'windowValues',

  events: {
    afterPlugin() {
      setPluginContext('windowValues', {
        windowObject: windowObject,
        eventListener: undefined,
        mounted: {},
      })
    },

    afterReduxStore() {
      windowValuesLogic.mount()
    },

    beforeCloseContext() {
      const { eventListener } = getWindowValuesPluginContext()
      if (eventListener) {
        windowObject.document.removeEventListener('scroll', eventListener, true)
        windowObject.removeEventListener('resize', eventListener)
      }
    },

    legacyBuildAfterDefaults: (logic, input) => {
      'windowValues' in input && input.windowValues && windowValues(input.windowValues)(logic)
    },
  },
})

export function windowValues<L extends Logic = Logic>(
  input: WindowValuesInput | ((logic: BuiltLogic<L>) => WindowValuesInput),
): LogicBuilder<L> {
  return (logic) => {
    const { windowObject } = getWindowValuesPluginContext()
    const windowValuesInput = typeof input === 'function' ? input(logic) : input
    logic.cache.windowValuesInput = { ...(logic.cache.windowValuesInput || {}), ...windowValuesInput }

    reducers((logic) => {
      const reducers: Record<string, [any, Record<string, (state: any, payload: any) => any>]> = {}

      Object.entries(windowValuesInput).forEach(([key, inputParams]) => {
        const calcFunction = Array.isArray(inputParams) ? inputParams[1] : inputParams
        const defaultValue = Array.isArray(inputParams) ? inputParams[0] : () => calcFunction(windowObject)
        reducers[key] = [
          defaultValue,
          {
            [windowValuesLogic.actionTypes.syncWindowValues]: (state, { windowValues }) => {
              const value = windowValues?.[logic.pathString]?.[key]
              return typeof value === 'undefined' ? state : value
            },
          },
        ]
      })

      return reducers
    })(logic)

    afterMount((logic) => {
      const { windowObject } = getWindowValuesPluginContext()
      if (!logic.cache.windowValuesInput || typeof windowObject === 'undefined') {
        return
      }

      const pluginContext = getWindowValuesPluginContext() as WindowValuesPluginContext

      pluginContext.mounted[logic.pathString] = (hasOld = false) => {
        const updates: Record<string, any> = {}

        Object.entries(logic.cache.windowValuesInput).forEach(([key, inputParams]) => {
          const calcFunction = Array.isArray(inputParams) ? inputParams[1] : inputParams
          const oldValue = hasOld ? logic.values[key] : null
          const newValue = calcFunction(windowObject)
          if (!hasOld || oldValue !== newValue) {
            updates[key] = newValue
          }
        })

        return Object.keys(updates).length > 0 ? updates : null
      }

      if (!pluginContext.eventListener) {
        pluginContext.eventListener = function () {
          const response: Record<string, any> = {}
          Object.entries(pluginContext.mounted).forEach(([pathString, windowFunction]) => {
            const value = windowFunction?.()
            if (value) {
              response[pathString] = value
            }
          })
          if (Object.keys(response).length > 0) {
            windowValuesLogic.actions.syncWindowValues(response)
          }
        }

        windowObject.document.addEventListener('scroll', pluginContext.eventListener, true)
        windowObject.addEventListener('resize', pluginContext.eventListener)
      }
    })(logic)

    beforeUnmount((logic) => {
      const { windowObject } = getWindowValuesPluginContext()
      if (!logic.cache.windowValuesInput || typeof windowObject === 'undefined') {
        return
      }

      const { mounted, eventListener } = getWindowValuesPluginContext()

      delete mounted[logic.pathString]

      if (eventListener && Object.keys(mounted).length === 0) {
        windowObject.document.removeEventListener('scroll', eventListener, true)
        windowObject.removeEventListener('resize', eventListener)
      }
    })(logic)
  }
}

function getWindowValuesPluginContext(): WindowValuesPluginContext {
  return getPluginContext('windowValues')
}
