## Week 9 - Massachussetts Bay Transportation Authority (MBTA) Real Time Bus Tracker
#### MIT xPRO Professional Certificate in Coding: Full Stack Development with MERN - January 2021

This repository was created to show my work for the coding assignment in week 9. This is a web app that tracks MBTA buses on a map. This project can be viewed in a web browser at  [https://benjamingro.github.io/boston-bus-tracker/](https://benjamingro.github.io/boston-bus-tracker/).

This project has the following features. 

* Allows users to select one or more MBTA routes that currently have vehicles on the route. 

* Periodically updates map with bus positions. 

* Shows the orientation of the bus along the route.  

### Technology Stack

* Bootstrap 4

* AngularJs 1.8

* Mapbox GL JS 

* MBTA V3 API 

### Screenshots 

#### Large Screen Size

![Large Screen Size](images/LapTopImage1.png?raw=true "Large Screen Size")

#### iPhone 6/7/8 Vertical

![iPhone 6/7/8 Vertical](images/iPhoneVertical1.png?raw=true "iPhone 6/7/8 Vertical")

![iPhone 6/7/8 Vertical](images/iPhoneVertical2.png?raw=true "iPhone 6/7/8 Vertical")

#### iPhone 6/7/8 Horizontal

![iPhone 6/7/8 Horizontal](images/iPhoneHorizontal1.png?raw=true "iPhone 6/7/8 Vertical")

![iPhone 6/7/8 Horizontal](images/iPhoneHorizontal2.png?raw=true "iPhone 6/7/8 Vertical")

### Future Work 
Currently this project issues one API location request per bus to track the location for each bus that has been selected. For a large number of buses, this can lead to a lot of API requests. To minimize the number of API requests, it may be better to issue a single API request for all the bus locations at once and parse this location data to update the location of each bus that has been selected. 

### License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)





