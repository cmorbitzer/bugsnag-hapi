const clone = require('@bugsnag/core/lib/clone-client')
const { extractRequestInfo } = require('./utils')

module.exports = {
  pkg: require('../package.json'),
  register: (server, options, next) => {
    const bugsnagClient = options.client
    server.ext({
      type: 'onRequest',
      method: async (request, h) => {
        if (bugsnagClient) {
          request.app.bugsnag = bugsnagClient._config.autoTrackSessions
            ? bugsnagClient.startSession()
            : clone(bugsnagClient)
        }
        return h.continue
      }
    })

    server.events.on({ name: 'request', channels: 'error' }, (request, event, tags) => {
      const { bugsnag } = request.app
      if (bugsnag) {
        bugsnag.notify(event.error, (event) => {
          event.request = { ...event.request, ...extractRequestInfo(request.raw.req) }
        })
      }
    })

    if (next) {
      next()
    }
  }
}
