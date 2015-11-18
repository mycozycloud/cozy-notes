// Generated by CoffeeScript 1.9.3
var Task, Todolist;

Task = require('../models/task');

Todolist = require('../models/todolist');

module.exports.fetch = function(req, res, next, id) {
  return Task.find(id, function(err, task) {
    if (err) {
      return res.status(500).send({
        error: err
      });
    }
    if (!task) {
      return res.status(404).send({
        error: 'Task not found'
      });
    }
    req.task = task;
    return next();
  });
};

module.exports.list = function(req, res) {
  return Task.request('all', function(err, tasks) {
    if (err) {
      return res.status(500).send({
        error: err
      });
    }
    return res.send(tasks);
  });
};

module.exports.create = function(req, res) {
  return Todolist.getOrCreateInbox(function(err, inbox, next) {
    var data;
    data = {
      list: inbox,
      done: req.body.done,
      description: req.body.description
    };
    return Task.create(data, function(err, task) {
      if (err) {
        return res.status(500).send({
          error: err
        });
      }
      return res.send(task, 201);
    });
  });
};

module.exports.read = function(req, res) {
  return res.send(req.task);
};

module.exports.update = function(req, res) {
  var updates;
  updates = {
    done: req.body.done,
    description: req.body.description
  };
  return req.task.updateAttributes(updates, function(err, task) {
    if (err) {
      return res.status(500).send({
        error: err
      });
    }
    return res.status(200).send(task);
  });
};

module.exports["delete"] = function(req, res) {
  return req.task.destroy(function(err) {
    if (err) {
      return res.status(500).send({
        error: err
      });
    }
    return res.status(204).send({
      success: "Task destroyed"
    });
  });
};
