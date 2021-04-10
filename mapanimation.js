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

  self.markerArray = []; 

  self.marker = {};
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
        self.routes[i]['markerColor'] = self.getRandomColor(); 
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
                  lngLatArray: [],
                  previous_lngLatArray:[]
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
        // self.updateEventHandlers();
        $scope.$apply();
      },
      (errorResponses) => {
      });
  };

  self.initialize();

  self.update_activeFilteredRoutes = function () {
    self.activeFilteredRoutes = [];
    let i = 0;
    const regex = new RegExp(self.filterText, 'gi');
    for (i = 0; i < self.activeRoutes.length; i++) {
      if (regex.test(self.activeRoutes[i].attributes.long_name)) {
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
                  self.selectedRoutes[x].vehicles[y].previous_lngLatArray = self.selectedRoutes[x].vehicles[y].lngLatArray; 
                  self.selectedRoutes[x].vehicles[y].lngLatArray = myLngLatArray;

                }
              }
            }
          },
          (errorResponse) => {

          });

        positionPromiseArray.push(positionPromise);
      }
    }

    Promise.all(positionPromiseArray).then(
      (responses) => {
        // update vehicle positions on map 
        // first remove current markers 
        // re-initialize marker array 
        // add new markers 
        let i,j = 0; 
        for(i = 0; i<self.markerArray.length;i++){
          self.markerArray[i].remove(); 
        }
        self.markerArray = [];
        for(i=0; i<self.selectedRoutes.length;i++) {
          for(j=0; j<self.selectedRoutes[i].vehicles.length;j++){
            let myLngLatArray = self.selectedRoutes[i].vehicles[j].lngLatArray; 
            let myPreviousLngLatArray = self.selectedRoutes[i].vehicles[j].previous_lngLatArray; 

            let myMarkerColor = self.selectedRoutes[i].markerColor; 
            // let markerElement = $(`<div style="color:${self.selectedRoutes[i].markerColor};"><div>`);
            // let markerElement = $('<div style="color:red;"><div>');

            // let markerElement = $('<div style="color:red;"><div>');
            // $('body').append(markerElement); 

            // let el = document.createElement('div');
            // // el.innerHTML ='<i class="fas fa-shuttle-van"></i>'; 
            // el.innerHTML ='<span>innterHtml</span>'; 

            // el.innerText = 'myMarker';
            // el.className = 'marker';
            // el.style.color = 'red';
            // el.style = {color:myMarkerColor +' !important'};
            // <i class="fas fa-shuttle-van"></i> 

            let el = document.createElement('i');
            // el.className = 'fas fa-shuttle-van '+self.get_iconRotationClass(myLngLatArray,myPreviousLngLatArray);  
            el.className = 'fas fa-shuttle-van';
            // el.className = 'fas fa-shuttle-van fa-flip-horizontal';

            // fa-flip-horizontal  

            el.style.color=myMarkerColor;

            let rotationDegrees = self.get_iconRotation(myLngLatArray,myPreviousLngLatArray); 
            // let rotationDegrees = 0; 



            // let newMarker = new mapboxgl.Marker(el).setLngLat(myLngLatArray).addTo(self.map); 
            let newMarker = new mapboxgl.Marker({element:el,rotation:rotationDegrees}).setLngLat(myLngLatArray).addTo(self.map); 

            // let newMarker = new mapboxgl.Marker(markerElement).setLngLat(myLngLatArray).addTo(self.map); 


            newMarker.addTo(self.map); 
            self.markerArray.push(newMarker); 
          }
        }

      },
      (errorResponses) => {

      });
  }

  setInterval(self.getSelectedVehiclesPosition, self.updateIntervalMs);

  self.get_iconRotation = function(lngLatArray,previous_lngLatArray){
    if(JSON.stringify(previous_lngLatArray) == '[]'){
      return '0'; 
    }
    else{
      let deltaLng = lngLatArray[0] - previous_lngLatArray[0]; 
      let deltaLat = lngLatArray[1] - previous_lngLatArray[1];
      let hypotenuse = Math.sqrt(Math.pow(deltaLng,2) + Math.pow(deltaLat,2)); 

      let rotationAngle = Math.acos(deltaLng/hypotenuse);
      let pi = Math.PI;
      let rotationDegrees = rotationAngle*360/(2*pi); 
      return rotationDegrees; 
      
    }

    // return 'fa-flip-horizontal';
     
    // let deltaLng = lngLatArray[0] - previous_lngLatArray[0]; 
    // let deltaLat = lngLatArray[1] - previous_lngLatArray[1];
    // let hypotenuse = Math.sqrt(Math.pow(deltaLng,2) + Math.pow(deltaLat,2)); 

    // let rotationAngle = Math.acos(deltaLng/hypotenuse);
    // let pi = Math.PI;  
    // if((rotationAngle>=0 && rotationAngle<=pi/4) || rotationAngle > 7/4 * pi)
    // {
    //   return ''; 
    // }
    // else if (rotationAngle > pi/4 && rotationAngle<= pi*3/4)
    // {
    //   return 'fa-rotate-270'; 
    // }
    // else if(rotationAngle> 3/4*pi && rotationAngle <= 5/4*pi)
    // {
    //   return 'fa-flip-horizontal';
    // }
    // else if(rotationAngle > 5/4*pi && rotationAngle <= 7/4*pi)
    // {
    //   return 'fa-rotate-90';
    // }
  }

  // self.get_iconRotationClass = function(lngLatArray,previous_lngLatArray){
  //   // if(JSON.stringify(previous_lngLatArray) == '[]')
  //   // {
  //   //   return ''; 
  //   // }

  //   return 'fa-flip-horizontal';
     
  //   // let deltaLng = lngLatArray[0] - previous_lngLatArray[0]; 
  //   // let deltaLat = lngLatArray[1] - previous_lngLatArray[1];
  //   // let hypotenuse = Math.sqrt(Math.pow(deltaLng,2) + Math.pow(deltaLat,2)); 

  //   // let rotationAngle = Math.acos(deltaLng/hypotenuse);
  //   // let pi = Math.PI;  
  //   // if((rotationAngle>=0 && rotationAngle<=pi/4) || rotationAngle > 7/4 * pi)
  //   // {
  //   //   return ''; 
  //   // }
  //   // else if (rotationAngle > pi/4 && rotationAngle<= pi*3/4)
  //   // {
  //   //   return 'fa-rotate-270'; 
  //   // }
  //   // else if(rotationAngle> 3/4*pi && rotationAngle <= 5/4*pi)
  //   // {
  //   //   return 'fa-flip-horizontal';
  //   // }
  //   // else if(rotationAngle > 5/4*pi && rotationAngle <= 7/4*pi)
  //   // {
  //   //   return 'fa-rotate-90';
  //   // }
  // }

  self.updateSelectedRoutes = function () {
    self.selectedRoutes = [];
    let selectedCounter = 0;
    let i = 0
    for (i = 0; i < self.activeFilteredRoutes.length; i++) {
      if (self.activeFilteredRoutes[i].selected == true) {
        selectedCounter++;
        self.selectedRoutes.push(self.activeFilteredRoutes[i]);
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
    }, 200)

  }

  self.getRandomColor = function () {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

}]);

$(function () {



});



