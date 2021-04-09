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
  self.geojson = {
    type:'FeatureCollection',
    features:[]
  };
  // #endregion

  self.routes = [];
  self.activeRoutes = [];
  self.selectedRoutes = [];
  self.vehicles = [];
  self.mapBox_api_key = "ac149cccb08b4e288b949e58d9eac162";

  self.filterText = "";

  self.initialize = function () {

    let routesPromise = $http({
      method: 'GET',
      url: 'https://api-v3.mbta.com/routes?api_key=' + self.mapBox_api_key
    }).then((response) => {
      self.routes = response.data.data;

      for (let i = 0; i < self.routes.length; i++) {
        self.routes[i]['selected'] = false;
        self.routes[i]['vehicles'] = [];
      }

    }, (errorResponse) => {
      // need to handle this error 
      console.log("inside error");
    });

    let vehiclesPromise = $http({
      method: 'GET',
      url: 'https://api-v3.mbta.com/vehicles?api_key=' + self.mapBox_api_key
    }).then((response) => {
      self.vehicles = response.data.data;

    }, (errorResponse) => {
      // need to handle this error 
      console.log("inside error");
    });

    Promise.all([routesPromise, vehiclesPromise]).then(
      (responses) => {
        let i, j = 0;

        for (i = 0; i < self.routes.length; i++) {
          for (j = 0; j < self.vehicles.length; j++) {
            if (self.routes[i].id === self.vehicles[j].relationships.route.data.id) {
              self.routes[i].vehicles.push(self.vehicles[j].id);
            }
          }

        }

        for (i = 0; i < self.routes.length; i++) {
          if (self.routes[i].vehicles.length > 0) {
            self.activeRoutes.push(self.routes[i]);
          }
        }
        self.updateEventHandlers();

      },
      (errorResponses) => {
      });
  };

  self.initialize();

  self.updateSelectedRoutes = function () {
    self.selectedRoutes = [];
    for (let i = 0; i < self.routes.length; i++) {
      if (self.routes[i].selected == true) {
        self.selectedRoutes.push(
          {
            routeId: self.routes[i].id,
            vehicles: self.routes[i].vehicles
          }
        );
      }
    }
  }

  self.updateEventHandlers = function () {

    setTimeout(function () {

      $('.clickArea').off("click");

      $('.clickArea').click(function (event) {
        if (event.target.tagName.toLowerCase() !== 'input') {
          $('input:checkbox', this).trigger('click');
        }
      });

      $('.clickArea').hover(function () {
        $(this).addClass("hovered");
      }, function () {
        $(this).removeClass("hovered");
      });
      console.log("finish updateEventHandlers ");
    }, 200)

  }

}]);

$(function () {

  console.log("inside page initialize");


});



