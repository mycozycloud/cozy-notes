// Generated by CoffeeScript 1.9.3
var Todolist, Tree, americano;

americano = require('americano-cozy');

Tree = require('./tree');

module.exports = Todolist = americano.getModel('TodoList', {
  title: String,
  path: String
});

Todolist.getOrCreateInbox = function(callback) {
  return Todolist.all(function(err, lists) {
    var i, inbox, len, list;
    if (err) {
      return callback(err);
    }
    for (i = 0, len = lists.length; i < len; i++) {
      list = lists[i];
      if (list.title === 'Inbox') {
        return callback(null, list.id);
      }
    }
    inbox = {
      parent_id: 'tree-node-all',
      title: 'Inbox',
      path: '["Inbox"]'
    };
    return Todolist.create(inbox, function(err, list) {
      var callback2, listNode;
      if (err) {
        return callback(err);
      }
      if (!list) {
        return callback('cant create');
      }
      listNode = {
        _id: list.id,
        children: [],
        data: "Inbox",
        attr: {
          id: list.id
        }
      };
      callback2 = function(err, tree) {
        return callback(err, list.id);
      };
      return Tree.all({
        key: "TodoList"
      }, function(err, trees) {
        var struct, tree;
        if (err) {
          return callback(err);
        }
        if (trees.length === 0) {
          tree = {
            type: "TodoList",
            struct: {
              _id: "tree-node-all",
              children: [listNode],
              data: "All",
              attr: {
                id: "tree-node-all"
              }
            }
          };
          tree.struct = JSON.stringify(tree.struct);
          return Tree.create(tree, callback2);
        } else {
          tree = trees[0];
          struct = JSON.parse(tree.struct);
          struct.children.push(listNode);
          struct = JSON.stringify(struct);
          return tree.updateAttributes({
            struct: struct
          }, callback2);
        }
      });
    });
  });
};
