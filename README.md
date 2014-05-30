# Angular Better Map

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
  <div id='map' better-map bm-events='events' bm-options='options' bm-onload='doSomething'></div>
```

Assign variables to `$scope`

```javascript
angular.module('app', ['betterMap'])
.controller('gabe', ['$scope', 'bm.Maps', function ($scope, Maps) {

  $scope.options = Maps.then(function (api) {
    // the betterMap directive will accept a promise as input for
    // bm-events, bm-options, and bm-onload
    return { zoom: 15, center: new api.LatLng(35.784, -78.670) }
  });

  // all map events are prefixed with `map_`, while all marker
  // events are prefixed with `marker_`
  $scope.events = {
    map_click: mapClick,
    marker_click: markerClick
  };

  function mapClick (e, params) {
    // in the context of any event firing, `this` is the map where the event happened
    this.addMarker({
      position: params.latLng
    });
  }

  function markerClick (e, params) {
    alert('hi');
  }

  $scope.addCenterMarker = function () {
    // #addMarker without options will create a marker in the center of your map
    this.addMarker();
  };

}]);
```

After the map is initialized, the options, events, markers, and onload promises will be assigned to their return values, _i.e._

```javascript
// after initialization
$scope.options; // => { zoom: 15, center: [object Object] }
```

Alternatively, you can inject the return of Maps into your controller through the `resolve` key
of your routing:

```javascript
// ...
  url: '/some-route',
  controller: 'SomeCtrl',
  resolve: {
    maps: ['bm.Maps', function (Maps) {
      return Maps;
    }]
  }
// ...
```

In this case, your controller could look like this (without any changes to your HTML):

```javascript
.controller('SomeCtrl', ['$scope', 'maps', function ($scope, maps) {
  // ...

  $scope.options = { zoom: 15, center: new maps.LatLng(35.784, -78.670) };

  // ...

}]);
```

## TODO:

- [ ] Add support for other map overlays, such as shapes
