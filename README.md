# Angular Better Map

__WORK IN PROGRESS__

Better Map is a sort-of-rewrite of the popular UI.Map wrapper for Google Maps.
UI.Map requires that you manually bootstrap your application
which I've found a pain to work with; especially when your applcation does
not necessarily revolve around the map feature. That is to say, an SPA must
wait for the Google Maps API to download before it can be bootstrapped (even if the
user has no itention of using a page with maps). Better Map loads the Google Maps API
only when it's needed with no additional setup.

In addition to this, Better Map makes heavy use of the `$q` promise/deferred
library for AngularJS. Passing events, options, or markers arguments can be
done as promises or regular objects.

## Example Use

Requiring Better Map in your application:

```javascript
  angular.module('app', ['betterMap'])
```

Including the directive in your HTML:

```html
  <div id='map' better-map bm-events='events' bm-options='options' bm-markers='markers'></div>
```

Assign variables to `$scope`

```javascript
.controller('SomeCtrl', ['$scope', 'bm.Maps', function ($scope, Maps) {
  $scope.markers = [];

  // Maps is the service that downloads the API. It returns a promise which, when resolved, returns the API.
  $scope.options = Maps.then(function (maps) {
    return { zoom: 15, center: new maps.LatLng(35.784, -78.670) };
  });

  $scope.events = Maps.then(function (maps) {
    // map events are prefixed with `map_` while marker events are prefixed with `marker_`
    return { map_click: $scope.click };
  });

  $scope.click = function (e, params) {
    // events are run in the context of `maps` and so `this` returns `maps`
    $scope.markers.push(new this.Marker({
      // params is modified to return the map object
      map: params.map,
      position: params.latLng
    }));
  };

}]);
```

After the map is initialized, the options, events, and markers promises will be assigned to their return values, _i.e._

```javascript
// after initialization
$scope.options; // => { zoom: 15, center: [object Object] }
$scope.events; // => { map_click: function (...) }
$scope.markers; // => []
```

Alternatively, you can inject the return of Maps into your controller through the `resolve` key
of your routing:

```javascript
// ...
  url: '/some-route',
  controller: 'SomeCtrl',
  resolve: {
    maps: function (Maps) {
      return Maps;
    }
  }
// ...
```

In this case, your controller could look like this (without any changes to your HTML):

```javascript
.controller('SomeCtrl', ['$scope', 'maps', function ($scope, maps) {

  $scope.click = function (e, params) {
    $scope.markers.push(new maps.Marker({
      map: params.map,
      position: params.latLng
    }));
  };

  $scope.markers = [];
  $scope.options = { zoom: 15, center: new maps.LatLng(35.784, -78.670) };
  $scope.events = { map_click: $scope.click };

}]);
```

## TODO:

- [ ] Specs (badpokerface)
- [ ] Add support for other map overlays, such as shapes
- [ ] Figure out a way to gracefully initialize markers (a bm-onload option?)
