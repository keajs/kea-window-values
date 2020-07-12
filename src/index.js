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
import { kea, setPluginContext, getPluginContext } from 'kea'

export const windowValues = kea({
  path: () => ['kea', 'windowValues', 'index'],
  actions: () => ({
    syncWindowValues: (windowValues) => ({ windowValues }),
  }),
})

export const windowValuesPlugin = ({ window: windowObject = window }) => ({
  name: 'windowValues',

  defaults: () => ({
    windowValuesInput: false,
  }),

  events: {
    afterPlugin() {
      setPluginContext('windowValues', {
        eventListener: undefined,
        mounted: {},
      })
    },

    afterReduxStore() {
      windowValues.mount()
    },

    beforeLogic(logic, input) {
      if (input.windowValues) {
        const windowValuesInput =
          typeof input.windowValues === 'function' ? input.windowValues(logic) : input.windowValues
        logic.extend({
          reducers: ({ pathString }) => {
            let reducers = {}

            Object.entries(windowValuesInput).forEach(([key, inputParams]) => {
              const calcFunction = Array.isArray(inputParams) ? inputParams[1] : inputParams
              const defaultValue = Array.isArray(inputParams) ? inputParams[0] : () => calcFunction(windowObject)
              reducers[key] = [
                defaultValue,
                {
                  [windowValues.actions.syncWindowValues]: (state, { windowValues }) => {
                    const value = windowValues?.[pathString]?.[key]
                    return typeof value === 'undefined' ? state : value
                  },
                },
              ]
            })

            return reducers
          },
        })
        logic.windowValuesInput = { ...(logic.windowValuesInput || {}), ...windowValuesInput }
      }
    },

    afterMount(logic) {
      if (!logic.windowValuesInput || typeof windowObject === 'undefined') {
        return
      }

      const pluginContext = getPluginContext('windowValues')

      pluginContext.mounted[logic.pathString] = (hasOld = false) => {
        let updates = {}

        Object.entries(logic.windowValuesInput).forEach(([key, inputParams]) => {
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
          const response = {}
          Object.entries(pluginContext.mounted).forEach(([pathString, windowFunction]) => {
            const value = windowFunction()
            if (value) {
              response[pathString] = value
            }
          })
          if (Object.keys(response).length > 0) {
            windowValues.actions.syncWindowValues(response)
          }
        }

        windowObject.document.addEventListener('scroll', pluginContext.eventListener, true)
        windowObject.addEventListener('resize', pluginContext.eventListener)
      }
    },

    beforeUnmount(logic) {
      if (!logic.windowValuesInput || typeof windowObject === 'undefined') {
        return
      }

      const { mounted, eventListener } = getPluginContext('windowValues')

      delete mounted[logic.pathString]

      if (eventListener && Object.keys(mounted).length === 0) {
        windowObject.document.removeEventListener('scroll', eventListener, true)
        windowObject.removeEventListener('resize', eventListener)
      }
    },

    beforeCloseContext() {
      const { eventListener } = getPluginContext('windowValues')
      if (eventListener) {
        windowObject.document.removeEventListener('scroll', eventListener, true)
        window.removeEventListener('resize', eventListener)
      }
    },
  },
})
