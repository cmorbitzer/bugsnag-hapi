const clone = require('@bugsnag/core/lib/clone-client')
const { createReportFromError, getMetaDataFromRequest, buildRequestClient } = require('./utils')

module.exports = {
  pkg: require('../package.json'),
  register: (server, options, next) => {
    const bugsnagClient = options.client
    server.ext({
      type: 'onRequest',
      method: async (request, h) => {
        if (bugsnagClient) {
          const requestClient = bugsnagClient.config.autoTrackSessions
            ? bugsnagClient.startSession()
            : clone(bugsnagClient)
          request.app.bugsnag = buildRequestClient(request, requestClient)
        }
        return h.continue
      }
    })

    server.events.on({ name: 'request', channels: 'error' }, (request, event, tags) => {
      const { bugsnag } = request.app
      if (bugsnag) {
        bugsnag.notify(createReportFromError(event.error), getMetaDataFromRequest(request))
      }
    })

    if (next) {
      next()
    }
  }
}
