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
  self.selectedRoutes = []; 
  // self.vehicles = [];
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
      }
      self.updateEventHandlers(); 
    }, (errorResponse) => {
      // need to handle this error 
      console.log("inside error");
    });


    
  };

  self.initialize();

  self.updateSelectedRoutes = function()
  {
    self.selectedRoutes = []; 
    for(let i=0; i<self.routes.length;i++ )
    {
      if(self.routes[i].selected == true)
      {
        self.selectedRoutes.push(self.routes[i].id); 
      }
    }
  }



  self.updateEventHandlers = function () {
    console.log("inside updateEventHandlers "); 
    setTimeout(function(){
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
    },75)
    
  }

}]);

$(function () {

  console.log("inside page initialize");


});



