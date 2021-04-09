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
    type: 'FeatureCollection',
    features: []
  };
  // #endregion

  self.routes = [];
  self.activeRoutes = [];
  self.activeFilteredRoutes = [];

  self.selectedRoutes = [];
  self.vehicles = [];
  self.updateIntervalMs = 3000;
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
              self.routes[i].vehicles.push(
                {
                  vehicleId: self.vehicles[j].id,
                  lngLatArray: []
                }
              );
            }
          }
        }

        for (i = 0; i < self.routes.length; i++) {
          if (self.routes[i].vehicles.length > 0) {
            self.activeRoutes.push(self.routes[i]);
          }
        }

        self.updateActiveFilteredRoutes(); 
        self.updateEventHandlers();
        $scope.$apply();
      },
      (errorResponses) => {
      });
  };

  self.initialize();

  self.updateActiveFilteredRoutes = function()
  {
    
  }

  self.getSelectedVehiclesPosition = function () {
    // console.log('inside self.getSelectedVehiclesPosition');
    // console.log('self.selectedRoutes = ');
    // console.log(self.selectedRoutes); 

    let i, j = 0;
    let positionPromiseArray = [];
    for (i = 0; i < self.selectedRoutes.length; i++) {
      for (j = 0; j < self.selectedRoutes[i].vehicles.length; j++) {
        const my_url = `https://api-v3.mbta.com/vehicles/${self.selectedRoutes[i].vehicles[j].vehicleId}?api_key=${self.mapBox_api_key}`; 
        console.log(`my_url = ${my_url}`);
        let positionPromise = $http({
          method: 'GET',
          url: my_url
        }).then(
          (response) => {
            const myLngLatArray = [response.data.data.attributes.longitude, response.data.data.attributes.latitude]
            self.selectedRoutes[i].vehicles[j].lngLatArray = myLngLatArray;
            console.log(`routeId = ${self.selectedRoutes[i].id} , vehicleId = ${self.selectedRoutes[i].vehicles[j].vehicleId} , myLngLatArray = ${JSON.stringify(myLngLatArray)}`);
          },
          (errorResponse) => {

          });

          positionPromiseArray.push(positionPromise); 
      }
    }

    Promise.all(positionPromiseArray).then(
      (responses)=>{
        // update vehicle positions on map 
      },
      (errorResponses)=>{

      });
  }

  setInterval(self.getSelectedVehiclesPosition,self.updateIntervalMs);

  self.updateSelectedRoutes = function () {
    self.selectedRoutes = [];
    console.log('inside updateSelectedRoutes, self.activeRoutes.length = '+self.activeRoutes.length); 
    let selectedCounter = 0; 
    let i = 0
    for (i = 0; i < self.activeRoutes.length; i++) {
      if (self.activeRoutes[i].selected == true) {
        selectedCounter++; 
        self.selectedRoutes.push(self.activeRoutes[i]);
      }
    }
    console.log('finished self.updateSelectedRoutes, self.activeRoutes = ');
    console.log(self.activeRoutes) ; 
    console.log(`selectedCounter = ${selectedCounter}`); 
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



