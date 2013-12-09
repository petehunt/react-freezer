/** @jsx React.DOM */

var React = require('react');

var debounce = require('debounce');

var LOCAL_STORAGE_DEBOUNCE = 200;

var LocalStorageFreezer = {
  write: debounce(
    function(key, value) {
      window.localStorage.setItem('react_freezer_' + key, JSON.stringify(value));
    },
    LOCAL_STORAGE_DEBOUNCE
  ),

  read: function(key) {
    return JSON.parse(window.localStorage.getItem('react_freezer_' + key));
  }
};

function getKeyForComponent(component) {
  var displayName = component.constructor.displayName || 'ReactCompositeComponent';
  var depth = component._mountDepth;
  var nodeID = component._rootNodeID;

  return displayName + ',' + depth + ',' + nodeID;
}

var ReactFreezerMixin = {
  componentDidUpdate: function() {
    this.freezer.write(getKeyForComponent(this), this.state);
  }
};

function createFreezableClass(spec) {
  if (!spec.getInitialState) {
    throw new Error(
      spec.displayName + ': Creating a freezable class on a component without state doesn\'t make sense.'
    );
  }

  if (!spec.freezer) {
    throw new Error(
      spec.displayName + ': Cannot create a freezable class without a freezer!'
    );
  }

  var originalGetInitialState = spec.getInitialState;

  spec.mixins = spec.mixins || [];
  spec.mixins.push(ReactFreezerMixin);

  spec.getInitialState = function() {
    var state = spec.freezer.read(getKeyForComponent(this));
    if (!state) {
      return originalGetInitialState.call(this);
    }
  };

  return React.createClass(spec);
}

var ReactFreezer = {
  Mixin: ReactFreezerMixin,
  Freezers: {
    LocalStorage: LocalStorageFreezer
  },
  createFreezableClass: createFreezableClass
};

module.exports = ReactFreezer;