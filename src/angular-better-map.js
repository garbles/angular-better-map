(function(window, angular, undefined) {'use strict';

angular.module('betterMap', [])

.service('bm.Maps', ['$window', '$document', '$q', 'bm.MapsExtension', 'bm.MapsApi',
function ($window, $document, $q, MapsExtension, MapsApi) {
  var deferred = $q.defer(),
    document = $document[0],
    cbName = 'bmMapsReadyCallback',
    script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=' + cbName;

  $window[cbName] = function () {
    delete $window[cbName];
    angular.extend(MapsApi, $window.google.maps);
    angular.extend(MapsApi, MapsExtension);
    deferred.resolve(MapsApi);
  };

  document.body.appendChild(script);

  return deferred.promise;
}])

.value('bm.MapsApi', {})
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

.service('bm.MapsExtension', ['$parse', 'bm.InstanceExtension',
function ($parse, InstanceExtension) {
  return {
    _instances: [],
    newInstance: function (element, opts) {
      opts = (opts || {});
      var map = new this.Map(element[0], opts);
      angular.extend(map, InstanceExtension);
      map.element = element;
      this._instances.push(map);
      return map;
    },
    addEventListeners: function (obj, el, events, prefix) {
      var that = this;
      angular.forEach(events, function (event) {
        that.event.addListener(obj, event, function (e) {
          el.triggerHandler(prefix + event, e);
        });
      });
    },
    parseEvents: function (eventsObj, el, map) {
      angular.forEach(eventsObj, function (event, name) {
        el.bind(name, function (e) {
          event.apply(map, arguments);
        });
      });
    }
  };
}])

.service('bm.InstanceExtension', ['$parse', 'bm.MapsApi', 'bm.MarkerEvents', 'bm.MarkerEventsPrefix',
function ($parse, MapsApi, Events, EventsPrefix) {
  return {
    _markers: [],
    element: null,
    addMarker: function (opts) {
      opts = (opts || {});
      opts.map = this;
      opts.position = (opts.position || this.center);

      var marker = new MapsApi.Marker(opts);
      MapsApi.addEventListeners(marker, this.element, Events, EventsPrefix);
      this._markers.push(marker);
      return marker;
    }
  };
}])

.directive('betterMap', ['$q', '$timeout', 'bm.Maps', 'bm.MapEvents', 'bm.MapEventsPrefix',
function ($q, $timeout, Maps, Events, EventsPrefix) {
  return {
    restrict: 'EA',
    controller: ['$scope', '$element', function (scope, el) {
      var that = this,
        mapLoaded = $q.defer();

      that.wait = [];
      that.mapLoaded = mapLoaded.promise;

      Maps.then(function (api) {
        $q.all(that.wait).then(function () {
          var opts = that.options || {},
            map = api.newInstance(el, opts);

          mapLoaded.resolve(map);
          api.addEventListeners(map, el, Events, EventsPrefix);
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
        var api = args[0],
          evts = args[1],
          map = args[2];

        if (model.assign) {
          model.assign(scope, evts);
        }
        api.parseEvents(evts, el, map);
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

.directive('bmOnload', ['$q', 'bm.Maps',
function ($q, Maps) {
  return {
    restrict: 'A',
    require: 'betterMap',
    link: function (scope, el, attrs, bmCtrl) {
      var onload = scope.$eval(attrs.bmOnload);

      onload = $q.when(onload);
      bmCtrl.wait.push(onload);

      $q.all([onload, Maps, bmCtrl.mapLoaded]).then(function (args) {
        var ol = args[0],
          api = args[1],
          map = args[2];

        ol.call(map);
      });
    }
  }
}]);

})(window, window.angular);
