// Generated by CoffeeScript 1.9.3
var Task, americano;

americano = require('americano-cozy');

module.exports = Task = americano.getModel('Task', {
  done: {
    type: Boolean,
    "default": false
  },
  creationDate: {
    type: Date,
    "default": Date.now
  },
  completionDate: {
    type: Date
  },
  description: {
    type: String
  },
  list: {
    type: String
  }
});
