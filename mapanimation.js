angular.module('busTrackerApp', []).controller('BusTrackerCtrl', ['$scope', '$http', function ($scope, $http) {
  var self = this;
  // #region mapbox members
  self.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    // center: [-71.104081, 42.365554],
    center: [-71.09311, 42.35820],
    zoom: 12,
  });

  // self.marker = {};
  // self.marker = new mapboxgl.Marker().setLngLat([-71.092761, 42.357575]).addTo(self.map);
  // #endregion

  self.routes = [];
  self.vehicles = [];
  self.mapBox_api_key = "ac149cccb08b4e288b949e58d9eac162";

  self.initialize = function () {

    let routesPromise = $http({
      method: 'GET',
      url: 'https://api-v3.mbta.com/routes?api_key=' + self.mapBox_api_key
    }).then((response) => {
      self.routes = response.data.data;
      console.log("self.routes = ");
      console.log(self.routes);
    }, (errorResponse) => {
      // need to handle this error 
    });

    let vehiclesPromise = $http({
      method: 'GET',
      url: 'https://api-v3.mbta.com/vehicles?api_key=' + self.mapBox_api_key
    }).then((response) => {
      self.vehicles = response.data.data;
      console.log("self.vehicles = ");
      console.log(self.vehicles);
    }, (errorResponse) => {
      // need to handle this error 
    });

    Promise.all([routesPromise, vehiclesPromise])
      .then(
        (response) => { 
          console.log("all promises resolved! ");
        },
        (errorResponse) => { 
          console.log("error in one of the promises ");

        });

  };



  self.initialize();

}]);

