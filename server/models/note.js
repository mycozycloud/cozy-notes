// Generated by CoffeeScript 1.6.2
var Auto, Note, americano, async;

async = require('async');

americano = require('americano-cozy');

Auto = function(x) {
  return x;
};

module.exports = Note = americano.getModel('Note', {
  title: {
    type: String,
    index: true
  },
  content: {
    type: String,
    "default": ''
  },
  creationDate: {
    type: Date,
    "default": Date
  },
  lastModificationDate: {
    type: Date,
    "default": Date
  },
  lastModificationValueOf: {
    type: Number,
    "default": function() {
      return (new Date()).getTime();
    }
  },
  parent_id: String,
  path: Auto,
  tags: Auto,
  humanPath: [String],
  _attachments: Object,
  version: String
});

Note.all = function(callback) {
  return Note.request("all", callback);
};

Note.destroyAll = function(callback) {
  return Note.requestDestroy("all", callback);
};

Note.patchAllPathes = function(callback) {
  return Note.all(function(err, notes) {
    if (err) {
      return callback(err);
    }
    console.log("BEGIN PATCH");
    console.log("there is " + notes.length + " notes");
    return async.eachSeries(notes, function(note, cb) {
      var updates;

      console.log("patching note " + note.id + " ?");
      if (note.version === '2') {
        return cb(null);
      }
      console.log("YES, need patch");
      updates = {
        tags: note.tags,
        path: note.path,
        version: '2'
      };
      console.log("UPDATES = ", updates);
      return note.updateAttributes(updates, function(err, updated) {
        var id, parent_id, path;

        console.log("ERR = ", err);
        parent_id = updated.parent_id, id = updated.id, path = updated.path;
        console.log("UPDATED = ", {
          parent_id: parent_id,
          id: id,
          path: path
        });
        return cb(err);
      });
    }, callback);
  });
};

Note.tree = function(callback) {
  return Note.rawRequest("tree", {}, function(err, notes) {
    var byId, format, key, note, tree, _i, _len, _ref;

    if (err) {
      return callback(err);
    }
    byId = {};
    tree = {
      children: [],
      data: 'All',
      attr: {
        id: 'tree-node-all'
      }
    };
    for (_i = 0, _len = notes.length; _i < _len; _i++) {
      note = notes[_i];
      format = {
        parent: note.key,
        children: [],
        data: note.value,
        attr: {
          id: note.id
        }
      };
      byId[note.id] = format;
      if (note.key === 'tree-node-all') {
        tree.children.push(format);
      }
    }
    for (key in byId) {
      format = byId[key];
      if ((_ref = byId[format.parent]) != null) {
        _ref.children.push(format);
      }
      delete format.parent;
    }
    return callback(null, tree);
  });
};

Note.prototype.moveOrRename = function(newTitle, newParent, callback) {
  var parent_id, title,
    _this = this;

  parent_id = newParent || this.parent_id;
  title = newTitle || this.title;
  if (parent_id === 'tree-node-all') {
    return this.updatePath([title], callback);
  } else {
    return Note.find(parent_id, function(err, parent) {
      var path;

      path = parent.path.slice(0);
      path.push(title);
      return _this.updatePath(path, callback);
    });
  }
};

Note.prototype.updatePath = function(newPath, callback) {
  var oldPath, query, spliceArgs;

  oldPath = this.path.slice(0);
  spliceArgs = newPath.slice(0);
  spliceArgs.unshift(oldPath.length);
  spliceArgs.unshift(0);
  query = {
    startkey: oldPath,
    endkey: oldPath.concat([{}])
  };
  return Note.request("path", query, function(err, notes) {
    if (err || !notes) {
      return callback(err);
    }
    return async.each(notes, function(note, cb) {
      var path;

      path = note.path;
      path.splice.apply(path, spliceArgs);
      return note.updateAttributes({
        path: path
      }, cb);
    }, function(err) {
      return callback(err, newPath);
    });
  });
};

/*
 VERSION TO BE USED WHEN THE DS PR#34 is in production
Note::destroyWithChildren = (callback) ->

    oldPath = @path.slice(0)
    query =
        startkey: oldPath # [a, b, oldtitle]
        endkey:   oldPath.concat [{}] # [a, b, oldtitle,{}]

    Note.requestDestroy "path", query, callback
*/


Note.prototype.destroyWithChildren = function(callback) {
  var oldPath, query;

  oldPath = this.path.slice(0);
  query = {
    startkey: oldPath,
    endkey: oldPath.concat([{}])
  };
  return Note.request("path", query, function(err, notes) {
    var destroyOne;

    destroyOne = function(note, cb) {
      return note.destroy(cb);
    };
    return async.each(notes, destroyOne, function(err) {
      return callback(err);
    });
  });
};
