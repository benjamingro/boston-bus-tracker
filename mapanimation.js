angular.module('busTrackerApp', []).controller('BusTrackerCtrl', ['$scope', '$http', function ($scope, $http) {
  var self = this;
  // #region mapbox members
  self.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-71.09311, 42.35820],
    zoom: 12,
  });

  self.map.on('load', function () {
    self.sizeMap();
  });

  $(window).resize(function () {
    self.sizeMap();
  });

  self.sizeMap = function () {
    let mapMaxHeight = $(window).height() - $('#navbarTop').height() - $('#navbarBottom').height() - 100;
    if (mapMaxHeight < 600) mapMaxHeight = 600;
    $('#map').width($('#mapCol').width());
    $('#map').height(mapMaxHeight);
    self.map.resize();
  }

  self.markerArray = [];

  self.marker = {};

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
      self.errorReset();
    });

    let vehiclesPromise = $http({
      method: 'GET',
      url: 'https://api-v3.mbta.com/vehicles?api_key=' + self.mapBox_api_key
    }).then((response) => {
      self.vehicles = response.data.data;

    }, (errorResponse) => {
      self.errorReset();
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
                  lngLatArray: [],
                  previous_lngLatArray: []
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

        self.update_activeFilteredRoutes();
        $scope.$apply();
        $('#waitCard').hide();
        $('#ui').show();
      },
      (errorResponses) => {
        self.errorReset();
      });
  };

  self.initialize();

  self.update_activeFilteredRoutes = function () {
    self.activeFilteredRoutes = [];
    let i = 0;
    const regex = new RegExp(self.filterText, 'gi');
    for (i = 0; i < self.activeRoutes.length; i++) {
      if (regex.test(self.activeRoutes[i].attributes.long_name)) {
        let myRoute = self.activeRoutes[i];
        myRoute['markerColor'] =
          self.activeFilteredRoutes.push(self.activeRoutes[i]);

      }
    }
    self.updateEventHandlers();

  }

  self.getSelectedVehiclesPosition = function () {
    let i, j = 0;
    let positionPromiseArray = [];
    for (i = 0; i < self.selectedRoutes.length; i++) {
      for (j = 0; j < self.selectedRoutes[i].vehicles.length; j++) {
        const my_url = `https://api-v3.mbta.com/vehicles/${self.selectedRoutes[i].vehicles[j].vehicleId}?api_key=${self.mapBox_api_key}`;

        let positionPromise = $http({
          method: 'GET',
          url: my_url
        }).then(
          (response) => {
            const myLngLatArray = [response.data.data.attributes.longitude, response.data.data.attributes.latitude];
            const vehicleId = response.data.data.id;
            let x, y = 0;
            for (x = 0; x < self.selectedRoutes.length; x++) {
              for (y = 0; y < self.selectedRoutes[x].vehicles.length; y++) {
                if (self.selectedRoutes[x].vehicles[y].vehicleId === vehicleId) {
                  if (JSON.stringify(self.selectedRoutes[x].vehicles[y].lngLatArray) != JSON.stringify(myLngLatArray)) {
                    // there is new data 
                    self.selectedRoutes[x].vehicles[y].previous_lngLatArray = self.selectedRoutes[x].vehicles[y].lngLatArray;
                    self.selectedRoutes[x].vehicles[y].lngLatArray = myLngLatArray;
                  }
                }
              }
            }
          },
          (errorResponse) => {
            //quietly fail
          });

        positionPromiseArray.push(positionPromise);
      }
    }

    Promise.all(positionPromiseArray).then(
      (responses) => {
        self.updateVehiclePositions(); 

        $('#waitCard').hide();
        $('#ui').show();

      },
      (errorResponses) => {
        self.updateVehiclePositions();

      });
  }

  self.updateVehiclePositions = function () {
    // update vehicle positions on map 
    // first remove current markers 
    // re-initialize marker array 
    // add new markers 
    let i, j = 0;
    for (i = 0; i < self.markerArray.length; i++) {
      self.markerArray[i].remove();
    }
    self.markerArray = [];
    for (i = 0; i < self.selectedRoutes.length; i++) {
      for (j = 0; j < self.selectedRoutes[i].vehicles.length; j++) {
        let myLngLatArray = self.selectedRoutes[i].vehicles[j].lngLatArray;
        let myPreviousLngLatArray = self.selectedRoutes[i].vehicles[j].previous_lngLatArray;

        let myMarkerColor = self.selectedRoutes[i].markerColor;

        let el = document.createElement('i');
        el.className = 'fas fa-shuttle-van fa-2x';

        el.style.color = myMarkerColor;



        let rotationDegrees = self.get_iconRotation(myLngLatArray, myPreviousLngLatArray);

        let newMarker = new mapboxgl.Marker({ element: el, rotation: rotationDegrees }).setLngLat(myLngLatArray).addTo(self.map);
        newMarker.addTo(self.map);
        self.markerArray.push(newMarker);
      }
    }
  }

  setInterval(self.getSelectedVehiclesPosition, self.updateIntervalMs);


  self.get_iconRotation = function (lngLatArray, previous_lngLatArray) {
    if (JSON.stringify(previous_lngLatArray) == '[]') {
      return '0';
    }
    else {
      let deltaLng = lngLatArray[0] - previous_lngLatArray[0];
      let deltaLat = lngLatArray[1] - previous_lngLatArray[1];
      let hypotenuse = Math.sqrt(Math.pow(deltaLng, 2) + Math.pow(deltaLat, 2));
      let rotationAngle = Math.acos(deltaLng / hypotenuse);
      let pi = Math.PI;
      let rotationDegrees = rotationAngle * 360 / (2 * pi);
      return rotationDegrees;
    }
  }

  self.updateSelectedRoutes = function () {
    self.selectedRoutes = [];
    let selectedCounter = 0;
    let i = 0
    for (i = 0; i < self.activeFilteredRoutes.length; i++) {
      if (self.activeFilteredRoutes[i].selected == true) {
        selectedCounter++;
        let my_route = self.activeFilteredRoutes[i];
        my_route['markerColor'] = self.getMarkerColor(my_route.attributes.long_name);
        self.selectedRoutes.push(my_route);
      }
    }
    $('#ui').hide();
    $('#waitCard').show();
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
    }, 200)
  }

  self.getMarkerColor = function (route_long_name) {

    if (route_long_name.search(/red/gi) != -1) {
      return 'red';
    }
    else if (route_long_name.search(/orange/gi) != -1) {
      return 'orange';
    }
    else if (route_long_name.search(/green/gi) != -1) {
      return 'green';
    }
    else if (route_long_name.search(/blue/gi) != -1) {
      return 'blue';
    }
    else {
      return self.brightColorArray[Math.floor(Math.random() * self.brightColorArray.length)];
    }

  }

  self.errorOk = function () {
    $('#errorCard').hide();
    $('#ui').show();

  }

  self.errorReset = function () {
    self.selectedRoutes = [];

    for (let i = 0; i < self.activeFilteredRoutes.length; i++) {
      self.activeFilteredRoutes[i].selected = false;
    }

    $('#ui').hide();
    $('#waitCard').hide();
    $('#errorCard').show();
  }

  self.brightColorArray = ['#FF3855', '#FFAA1D', '#FFF700', '#299617', '#2243B6', '#5946B2', '#9C51B6', '#A83731', '#FF007C', '#E936A7', '#FDFF00', '#AF6E4D'];

}]);





