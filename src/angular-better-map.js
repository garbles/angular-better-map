(function(window, angular, undefined) {'use strict';

angular.module('betterMap', [])

.service('bm.Maps', ['$window', '$document', '$q', 'bm.MapsExtension',
function ($window, $document, $q, MapsExtension) {
  var deferred = $q.defer(),
    document = $document[0],
    cbName = 'bmMapsReadyCallback',
    script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=' + cbName;

  $window[cbName] = function () {
    delete $window[cbName];
    angular.extend($window.google.maps, MapsExtension);
    deferred.resolve($window.google.maps);
  };

  document.body.appendChild(script);

  return deferred.promise;
}])

.service('bm.MapsExtension', ['$parse',
function ($parse) {
  return {
    instances: [],
    addEventListeners: function (obj, el, events, prefix) {
      var that = this;
      angular.forEach(events, function (event) {
        that.event.addListener(obj, event, function (e) {
          el.triggerHandler(prefix + event, e);
        });
      });
    },
    parseEvents: function (eventsObj, el, map) {
      var that = this;
      angular.forEach(eventsObj, function (event, name) {
        el.bind(name, function (e) {
          arguments[1].map = map;
          event.apply(that, arguments);
        });
      });
    }
  };
}])

.value('bm.MapEventsPrefix', 'map_')
.value('bm.MarkerEventsPrefix', 'marker_')

.constant('bm.MapEvents', [
  'bounds_changed', 'center_changed', 'click', 'dblclick', 'drag',
  'dragend', 'dragstart', 'heading_changed', 'idle', 'maptypeid_changed',
  'mousemove', 'mouseout ', 'mouseover', 'projection_changed', 'resize',
  'rightclick', 'tilesloaded', 'tilt_changed', 'zoom_changed'
])

.constant('bm.MarkerEvents', [
  'animation_changed', 'click', 'clickable_changed', 'cursor_changed',
  'dblclick', 'drag', 'dragend', 'draggable_changed', 'dragstart',
  'flat_changed', 'icon_changed', 'mousedown', 'mouseout', 'mouseover',
  'mouseup', 'position_changed', 'rightclick', 'shadow_changed',
  'shape_changed', 'title_changed', 'visible_changed', 'zindex_changed'
])

.directive('betterMap', ['$q', '$timeout', 'bm.Maps', 'bm.MapEvents', 'bm.MapEventsPrefix',
function ($q, $timeout, Maps, Events, EventsPrefix) {
  return {
    restrict: 'EA',
    controller: ['$scope', '$element', function (scope, el) {
      var that = this,
        mapLoaded = $q.defer();

      that.wait = [];
      that.mapLoaded = mapLoaded.promise;

      Maps.then(function (maps) {
        $q.all(that.wait).then(function () {
          var opts = that.options || {},
            map = new maps.Map(el[0], opts);

          maps.instances.push(map);
          mapLoaded.resolve(map);

          maps.addEventListeners(map, el, Events, EventsPrefix);
        });
      });
    }]
  };
}])

.directive('bmEvents', ['$q', '$parse', 'bm.Maps',
function ($q, $parse, Maps) {
  return {
    restrict: 'A',
    require: 'betterMap',
    link: function (scope, el, attrs, bmCtrl) {
      var model = $parse(attrs.bmEvents),
        events = model(scope);

      events = $q.when(events);
      bmCtrl.wait.push(events);

      $q.all([Maps, events, bmCtrl.mapLoaded]).then(function (args) {
        var maps = args[0],
          evts = args[1],
          map = args[2];

        if (model.assign) {
          model.assign(scope, evts);
        }
        maps.parseEvents(evts, el, map);
      });
    }
  }
}])

.directive('bmOptions', ['$q', '$parse',
function ($q, $parse) {
  return {
    restrict: 'A',
    require: 'betterMap',
    link: function (scope, el, attrs, bmCtrl) {
      var model = $parse(attrs.bmOptions),
        options = model(scope);

      options = $q.when(options);
      bmCtrl.wait.push(options);

      options.then(function (opts) {
        if (model.assign) {
          model.assign(scope, opts);
        }
        bmCtrl.options = opts;
      });
    }
  }
}])

.directive('bmMarkers', ['$q', '$parse', 'bm.Maps', 'bm.MarkerEvents', 'bm.MarkerEventsPrefix',
function ($q, $parse, Maps, Events, EventsPrefix) {
  return {
    restrict: 'A',
    require: 'betterMap',
    link: function (scope, el, attrs, bmCtrl) {
      var model = $parse(attrs.bmMarkers),
        markers = model(scope);

      markers = $q.when(markers);
      bmCtrl.wait.push(markers);

      $q.all([markers, Maps, bmCtrl.mapLoaded]).then(function (args) {
        var mrkrs = args[0],
          maps = args[1];

        if (model.assign) {
          model.assign(scope, mrkrs);
        }

        scope.$watch(attrs.bmMarkers, function (newObj) {
          if (!newObj) {
            return
          } else if (!angular.isArray(newObj)) {
            newObj = [newObj];
          }

          angular.forEach(newObj, function (obj) {
            maps.addEventListeners(newObj, el, Events, EventsPrefix);
          });
        });

      });
    }
  }
}])

})(window, window.angular);
