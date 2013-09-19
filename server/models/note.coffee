async     = require 'async'
americano = require 'americano-cozy'

module.exports = Note = americano.getModel 'Note',
    title                   : type: String , index: true
    content                 : type: String , default: ''
    creationDate            : type: Date   , default: Date
    lastModificationDate    : type: Date   , default: Date
    lastModificationValueOf : type: Number, default: -> (new Date()).getTime()
    tags                    : [String]
    parent_id               : String
    # path should be [String], but retrocompatibility with stringified pathes
    path                    : Object
    humanPath               : [String]
    _attachments            : Object
    version                 : String


Note.all = (callback) ->
    Note.request "all", callback

Note.destroyAll = (callback) ->
    Note.requestDestroy "all", callback

Note::patchPath = (callback) ->

    return callback null unless typeof @path is 'string'

    path = JSON.parse @path
    @updateAttributes path: path, callback

Note.tree = (callback) ->
    Note.rawRequest "tree", {}, (err, notes) ->

        return callback err if err

        byId = {}
        tree = children:[], data:'All', attr: id: 'tree-node-all'
        for note in notes
            format =
                parent: note.key
                children: []
                data: note.value
                attr: id: note.id

            byId[note.id] = format
            tree.children.push format if note.key is 'tree-node-all'


        for key, format of byId
            byId[format.parent]?.children.push format
            delete format.parent

        callback null, tree

Note::moveOrRename = (newTitle, newParent, callback) ->
    parent_id = newParent or @parent_id
    title = newTitle or @title

    if parent_id is 'tree-node-all'
        @updatePath [title], callback

    else
        Note.find parent_id, (err, parent) =>
            path = parent.path.slice(0)
            path.push title
            @updatePath path, callback

Note::updatePath = (newPath, callback) ->

    oldPath = @path.slice(0) # [a, b, oldtitle]


    # arguments to be passed to splice
    # replace oldPath by newPath
    # ~ path.splice 0, oldPath.length, newPath[0], newPath[1], ..., title
    spliceArgs = newPath.slice(0) # newpath = [d, e, newtitle]
    spliceArgs.unshift oldPath.length
    spliceArgs.unshift 0 # [0, 3, d, e, newtitle]

    #get note and subnotes
    query =
        startkey: oldPath # [a, b, oldtitle]
        endkey:   oldPath.concat [{}] # [a, b, oldtitle,{}]

    Note.request "path", query, (err, notes) ->

        return callback err if err or not notes

        async.each notes, (note, cb) ->
            path = note.path
            path.splice.apply path, spliceArgs
            note.updateAttributes path: path, cb
        , (err) ->
            callback err, newPath

Note::destroyWithChildren = (callback) ->

    oldPath = @path.slice(0)
    query =
        startkey: oldPath # [a, b, oldtitle]
        endkey:   oldPath.concat [{}] # [a, b, oldtitle,{}]

    Note.requestDestroy "path", query, callback