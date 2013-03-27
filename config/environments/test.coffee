module.exports = (compound) ->
    app = compound.app
    app.configure 'test', ->
        errorHandler = require('express').errorHandler
            dumpExceptions: true
            showStack: true
        app.use errorHandler
        app.settings.quiet = true
        app.enable 'view cache'
        app.enable 'model cache'
        app.enable 'eval cache'
