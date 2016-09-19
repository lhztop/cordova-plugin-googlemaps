var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    common = require('./Common'),
    BaseClass = require('./BaseClass'),
    LatLng = require('./LatLng'),
    LatLngBounds = require('./LatLngBounds'),
    MapTypeId = require('./MapTypeId'),
    event = require('./event');

var Marker = require('./Marker');
var Circle = require('./Circle');
var Polyline = require('./Polyline');
var Polygon = require('./Polygon');
var TileOverlay = require('./TileOverlay');
var GroundOverlay = require('./GroundOverlay');
var KmlOverlay = require('./KmlOverlay');
var CameraPosition = require('./CameraPosition');


/**
 * Google Maps model.
 */
var Map = function(id) {
    var self = this;
    BaseClass.apply(self);

    self.MARKERS = {};
    self.KML_LAYERS = {};
    self.OVERLAYS = {};

    Object.defineProperty(self, "type", {
        value: "Map",
        writable: false
    });

    Object.defineProperty(self, "id", {
        value: id,
        writable: false
    });

};

utils.extend(Map, BaseClass);

Map.prototype.getId = function() {
    return this.id;
};

/**
 * @desc Recalculate the position of HTML elements
 */
Map.prototype.refreshLayout = function(event) {
    cordova.exec(null, null, this.id, 'resizeMap', []);
};

Map.prototype.getMap = function(mapId, div, options) {
    var self = this,
        args = [mapId];

    if (!common.isDom(div)) {
        options = div;
        options = options || {};
        if (options.camera) {
          if (options.camera.latLng) {
              options.camera.target = options.camera.latLng;
              delete options.camera.latLng;
          }
          if (options.camera.target) {
            this.set('camera_target', options.camera.target);
          }
          if (options.camera.bearing) {
            this.set('camera_bearing', options.camera.bearing);
          }
          if (options.camera.zoom) {
            this.set('camera_zoom', options.camera.zoom);
          }
          if (options.camera.tilt) {
            this.set('camera_tilt', options.camera.tilt);
          }
        }
        args.push(params);
    } else {

        var currentDiv = self.get("div");
        options = options || {};
        if (options.camera) {
          if (options.camera.latLng) {
              options.camera.target = options.camera.latLng;
              delete options.camera.latLng;
          }
          if (options.camera.target) {
            this.set('camera_target', options.camera.target);
          }
          if (options.camera.bearing) {
            this.set('camera_bearing', options.camera.bearing);
          }
          if (options.camera.zoom) {
            this.set('camera_zoom', options.camera.zoom);
          }
          if (options.camera.tilt) {
            this.set('camera_tilt', options.camera.tilt);
          }
        }
        args.push(options);

        self.set("div", div);
        var elements = [];
        var elemId, clickable, size;


        // Gets the map div size.
        // The plugin needs to consider the viewport zoom ratio
        // for the case window.innerHTML > body.offsetWidth.
        elemId = div.getAttribute("__pluginDomId");
        if (!elemId) {
            elemId = "pgm" + Math.floor(Math.random() * Date.now());
            div.setAttribute("__pluginDomId", elemId);
        }
        args.push(elemId);

        while (div.parentNode) {
            div.style.backgroundColor = 'rgba(0,0,0,0)';

            // prevent multiple readding the class
            if (div.classList && !div.classList.contains('_gmaps_cdv_')) {
                div.classList.add('_gmaps_cdv_');
            } else if (div.className && div.className.indexOf('_gmaps_cdv_') != -1) {
                div.className = div.className + ' _gmaps_cdv_';
            }

            div = div.parentNode;
        }
    }
    cordova.exec(function() {
      setTimeout(function() {
          self.refreshLayout();
          self.trigger(event.MAP_READY, self);
      }, 100);
    }, self.errorHandler, 'CordovaGoogleMaps', 'getMap', args);
};

Map.prototype.setOptions = function(options) {
    options = options || {};

    if (options.camera) {
      if (options.camera.latLng) {
          options.camera.target = options.camera.latLng;
          delete options.camera.latLng;
      }
      if (options.camera.target) {
        this.set('camera_target', options.camera.target);
      }
      if (options.camera.bearing) {
        this.set('camera_bearing', options.camera.bearing);
      }
      if (options.camera.zoom) {
        this.set('camera_zoom', options.camera.zoom);
      }
      if (options.camera.tilt) {
        this.set('camera_tilt', options.camera.tilt);
      }
    }
    cordova.exec(null, this.errorHandler, this.id, 'setOptions', [common.deleteFromObject(options, 'function')]);
    return this;
};

Map.prototype.setCameraTarget = function(latLng) {
    this.set('camera_target', latLng);
    cordova.exec(null, this.errorHandler, this.id, 'setCameraTarget', [latLng.lat, latLng.lng]);
    return this;
};

Map.prototype.setCameraZoom = function(zoom) {
    this.set('camera_zoom', zoom);
    cordova.exec(null, this.errorHandler, this.id, 'setCameraZoom', [zoom]);
    return this;
};
Map.prototype.panBy = function(x, y) {
    x = parseInt(x, 10);
    y = parseInt(y, 10);
    cordova.exec(null, this.errorHandler, this.id, 'panBy', [x, y]);
    return this;
};

/**
 * Clears all markup that has been added to the map,
 * including markers, polylines and ground overlays.
 */
Map.prototype.clear = function(callback) {
    var self = this;

    var clearObj = function(obj) {
        var ids = Object.keys(obj);
        var id;
        for (var i = 0; i < ids.length; i++) {
            id = ids[i];
            obj[id].off();
            delete obj[id];
        }
        obj = {};
    };

    clearObj(self.OVERLAYS);
    clearObj(self.MARKERS);
    clearObj(self.KML_LAYERS);

    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, self.errorHandler, this.id, 'clear', []);
};

/**
 * @desc Change the map type
 * @param {String} mapTypeId   Specifies the one of the follow strings:
 *                               MAP_TYPE_HYBRID
 *                               MAP_TYPE_SATELLITE
 *                               MAP_TYPE_TERRAIN
 *                               MAP_TYPE_NORMAL
 *                               MAP_TYPE_NONE
 */
Map.prototype.setMapTypeId = function(mapTypeId) {
    if (mapTypeId !== MapTypeId[mapTypeId.replace("MAP_TYPE_", '')]) {
        return this.errorHandler("Invalid MapTypeId was specified.");
    }
    this.set('mapTypeId', mapTypeId);
    cordova.exec(null, this.errorHandler, this.id, 'setMapTypeId', [mapTypeId]);
    return this;
};

/**
 * @desc Change the map view angle
 * @param {Number} tilt  The angle
 */
Map.prototype.setCameraTilt = function(tilt) {
    this.set('camera_tilt', tilt);
    cordova.exec(null, this.errorHandler, this.id, 'setCameraTilt', [tilt]);
    return this;
};

/**
 * @desc Change the map view bearing
 * @param {Number} bearing  The bearing
 */
Map.prototype.setCameraBearing = function(bearing) {
    this.set('camera_bearing', bearing);
    cordova.exec(null, this.errorHandler, this.id, 'setCameraBearing', [bearing]);
    return this;
};

/**
 * @desc   Move the map camera with animation
 * @params {CameraPosition} cameraPosition New camera position
 * @params {Function} [callback] This callback is involved when the animation is completed.
 */
Map.prototype.animateCamera = function(cameraPosition, callback) {
    var self = this;
    if (cameraPosition.target && cameraPosition.target.type === "LatLngBounds") {
        cameraPosition.target = [cameraPosition.target.southwest, cameraPosition.target.northeast];
    }

    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, self.errorHandler, self.id, 'animateCamera', [common.deleteFromObject(cameraPosition, 'function')]);

};
/**
 * @desc   Move the map camera without animation
 * @params {CameraPosition} cameraPosition New camera position
 * @params {Function} [callback] This callback is involved when the animation is completed.
 */
Map.prototype.moveCamera = function(cameraPosition, callback) {
    if (cameraPosition.target &&
        cameraPosition.target.type === "LatLngBounds") {
        cameraPosition.target = [cameraPosition.target.southwest, cameraPosition.target.northeast];
    }
    var self = this;
    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, self.errorHandler, self.id, 'moveCamera', [common.deleteFromObject(cameraPosition, 'function')]);

};

Map.prototype.setMyLocationEnabled = function(enabled) {
    enabled = common.parseBoolean(enabled);
    cordova.exec(null, this.errorHandler, this.id, 'setMyLocationEnabled', [enabled]);
    return this;
};
Map.prototype.setIndoorEnabled = function(enabled) {
    enabled = common.parseBoolean(enabled);
    cordova.exec(null, this.errorHandler, this.id, 'setIndoorEnabled', [enabled]);
    return this;
};
Map.prototype.setTrafficEnabled = function(enabled) {
    enabled = common.parseBoolean(enabled);
    cordova.exec(null, this.errorHandler, this.id, 'setTrafficEnabled', [enabled]);
    return this;
};
Map.prototype.setCompassEnabled = function(enabled) {
    var self = this;
    enabled = common.parseBoolean(enabled);
    cordova.exec(null, self.errorHandler, this.id, 'setCompassEnabled', [enabled]);
    return this;
};
Map.prototype.getMyLocation = function(params, success_callback, error_callback) {
    var args = [params || {}, success_callback || null, error_callback];
    if (typeof args[0] === "function") {
        args.unshift({});
    }
    params = args[0];
    success_callback = args[1];
    error_callback = args[2];

    params.enableHighAccuracy = params.enableHighAccuracy === true;
    var self = this;
    var successHandler = function(location) {
        if (typeof success_callback === "function") {
            location.latLng = new LatLng(location.latLng.lat, location.latLng.lng);
            success_callback.call(self, location);
        }
    };
    var errorHandler = function(result) {
        if (typeof error_callback === "function") {
            error_callback.call(self, result);
        }
    };
    cordova.exec(successHandler, errorHandler, 'CordovaGoogleMaps', 'getMyLocation', [common.deleteFromObject(params, 'function')]);
};
Map.prototype.getFocusedBuilding = function(callback) {
    cordova.exec(callback, this.errorHandler, this.id, 'getFocusedBuilding', []);
};
Map.prototype.setVisible = function(isVisible) {
    var self = this;
    isVisible = common.parseBoolean(isVisible);
    cordova.exec(null, self.errorHandler, this.id, 'setVisible', [isVisible]);
    return this;
};
Map.prototype.setClickable = function(isClickable) {
    isClickable = common.parseBoolean(isClickable);
    cordova.exec(null, self.errorHandler, this.id, 'setClickable', [isClickable]);
    return this;
};


/**
 * Sets the preference for whether all gestures should be enabled or disabled.
 */
Map.prototype.setAllGesturesEnabled = function(enabled) {
    enabled = common.parseBoolean(enabled);
    cordova.exec(null, self.errorHandler, this.id, 'setAllGesturesEnabled', [enabled]);
    return this;
};

/**
 * Return the current position of the camera
 * @return {CameraPosition}
 */
Map.prototype.getCameraPosition = function(callback) {
    return this.get("camera");
};

/**
 * Remove the map completely.
 */
Map.prototype.remove = function(callback) {
    var self = this;
    var div = this.get('div');
    if (div) {
        while (div) {
            if (div.style) {
                div.style.backgroundColor = '';
            }
            if (div.classList) {
                div.classList.remove('_gmaps_cdv_');
            } else if (div.className) {
                div.className = div.className.replace(/_gmaps_cdv_/g, "");
                div.className = div.className.replace(/\s+/g, " ");
            }
            div = div.parentNode;
        }
    }
    self.trigger("remove");
    self.set('div', undefined);
    self.clear();
    self.empty();
    self.off();
    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, self.errorHandler, 'CordovaGoogleMaps', 'removeMap', [self.id]);
};


Map.prototype.toDataURL = function(params, callback) {
    var args = [params || {}, callback];
    if (typeof args[0] === "function") {
        args.unshift({});
    }

    params = args[0];
    callback = args[1];

    params.uncompress = params.uncompress === true;
    var self = this;
    cordova.exec(function(image) {
        if (typeof callback === "function") {
            callback.call(self, image);
        }
    }, self.errorHandler, self.id, 'toDataURL', [common.deleteFromObject(params, 'function')]);
};

/**
 * Show the map into the specified div.
 */
Map.prototype.getDiv = function() {
    return this.get("div");
};

/**
 * Show the map into the specified div.
 */
Map.prototype.setDiv = function(div) {
    var self = this,
        args = [];

    if (!common.isDom(div)) {
        self.set("div", null);
    } else {
        var currentDiv = self.get("div");

        // Webkit redraw mandatory
        // http://stackoverflow.com/a/3485654/697856
        div.style.display='none';
        div.offsetHeight;
        div.style.display='';

        self.set("div", div);
        elemId = div.getAttribute("__pluginDomId");
        if (!elemId) {
            elemId = "pgm" + Math.floor(Math.random() * Date.now());
            div.setAttribute("__pluginDomId", elemId);
        }
        args.push(elemId);
        while (div.parentNode) {
            div.style.backgroundColor = 'rgba(0,0,0,0)';

            // prevent multiple readding the class
            if (div.classList && !div.classList.contains('_gmaps_cdv_')) {
                div.classList.add('_gmaps_cdv_');
            } else if (div.className && div.className.indexOf('_gmaps_cdv_') != -1) {
                div.className = div.className + ' _gmaps_cdv_';
            }

            div = div.parentNode;
        }
    }
    cordova.exec(null, self.errorHandler, self.id, 'setDiv', args);
    return self;
};

/**
 * Return the visible region of the map.
 * Thanks @fschmidt
 */
Map.prototype.getVisibleRegion = function(callback) {
    var self = this;

    cordova.exec(function(result) {
        if (typeof callback === "function") {
            var latLngBounds = new LatLngBounds(result.latLngArray);
            latLngBounds.northeast = new LatLng(result.northeast.lat, result.northeast.lng);
            latLngBounds.southwest = new LatLng(result.southwest.lat, result.southwest.lng);
            callback.call(self, latLngBounds);
        }
    }, self.errorHandler, self.id, 'getVisibleRegion', []);
};

/**
 * Maps an Earth coordinate to a point coordinate in the map's view.
 */
Map.prototype.fromLatLngToPoint = function(latLng, callback) {
    var self = this;
    if ("lat" in latLng && "lng" in latLng) {
        cordova.exec(function(result) {
            if (typeof callback === "function") {
                callback.call(self, result);
            }
        }, self.errorHandler, self.id, 'fromLatLngToPoint', [latLng.lat, latLng.lng]);
    } else {
        if (typeof callback === "function") {
            callback.call(self, [undefined, undefined]);
        }
    }

};
/**
 * Maps a point coordinate in the map's view to an Earth coordinate.
 */
Map.prototype.fromPointToLatLng = function(pixel, callback) {
    var self = this;
    if (pixel.length == 2 && utils.isArray(pixel)) {
        cordova.exec(function(result) {
            if (typeof callback === "function") {
                var latLng = new LatLng(result[0] || 0, result[1] || 0);
                callback.call(self, latLng);
            }
        }, self.errorHandler, self.id, 'fromPointToLatLng', [pixel[0], pixel[1]]);
    } else {
        if (typeof callback === "function") {
            callback.call(self, undefined);
        }
    }

};

Map.prototype.setPadding = function(p1, p2, p3, p4) {
    if (arguments.length === 0 || arguments.length > 4) {
        return this;
    }
    var padding = {};
    padding.top = parseInt(p1, 10);
    switch (arguments.length) {
        case 4:
            // top right bottom left
            padding.right = parseInt(p2, 10);
            padding.bottom = parseInt(p3, 10);
            padding.left = parseInt(p4, 10);
            break;

        case 3:
            // top right&left bottom
            padding.right = parseInt(p2, 10);
            padding.left = padding.right;
            padding.bottom = parseInt(p3, 10);
            break;

        case 2:
            // top & bottom right&left
            padding.bottom = parseInt(p1, 10);
            padding.right = parseInt(p2, 10);
            padding.left = padding.right;
            break;

        case 1:
            // top & bottom right & left
            padding.bottom = padding.top;
            padding.right = padding.top;
            padding.left = padding.top;
            break;
    }
    cordova.exec(function(result) {
        if (typeof callback === "function") {
            var latLng = new LatLng(result[0] || 0, result[1] || 0);
            callback.call(self, result);
        }
    }, self.errorHandler, this.id, 'setPadding', [padding]);
    return this;
};


//-------------
// KML Layer
//-------------
Map.prototype.addKmlOverlay = function(kmlOverlayOptions, callback) {
    var self = this;
    kmlOverlayOptions = kmlOverlayOptions || {};
    kmlOverlayOptions.url = kmlOverlayOptions.url || null;
    kmlOverlayOptions.preserveViewport = kmlOverlayOptions.preserveViewport === true;
    kmlOverlayOptions.animation = kmlOverlayOptions.animation === undefined ? true : kmlOverlayOptions.animation;

    var kmlId = "kml" + (Math.random() * 9999999);
    kmlOverlayOptions.kmlId = kmlId;

    var kmlOverlay = new KmlOverlay(self, kmlId, kmlOverlayOptions);
    self.OVERLAYS[kmlId] = kmlOverlay;
    self.KML_LAYERS[kmlId] = kmlOverlay;

    cordova.exec(function(kmlId) {
        kmlOverlay.one(result.id + "_remove", function() {
            kmlOverlay.off();
            delete self.KML_LAYERS[kmlId];
            delete self.OVERLAYS[kmlId];
            kmlOverlay = undefined;
        });
        if (typeof callback === "function") {
            callback.call(self, kmlOverlay, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['KmlOverlay', common.deleteFromObject(kmlOverlayOptions, 'function')]);

};

//-------------
// Ground overlay
//-------------
Map.prototype.addGroundOverlay = function(groundOverlayOptions, callback) {
    var self = this;
    groundOverlayOptions = groundOverlayOptions || {};
    groundOverlayOptions.url = groundOverlayOptions.url || null;
    groundOverlayOptions.visible = groundOverlayOptions.visible === undefined ? true : groundOverlayOptions.visible;
    groundOverlayOptions.zIndex = groundOverlayOptions.zIndex || 1;
    groundOverlayOptions.bounds = groundOverlayOptions.bounds || [];

    cordova.exec(function(result) {
        var groundOverlay = new GroundOverlay(self, result.id, groundOverlayOptions);
        self.OVERLAYS[result.id] = groundOverlay;
        groundOverlay.one(result.id + "_remove", function() {
            groundOverlay.off();
            delete self.OVERLAYS[result.id];
            groundOverlay = undefined;
        });
        if (typeof groundOverlayOptions.onClick === "function") {
            groundOverlay.on(event.OVERLAY_CLICK, groundOverlayOptions.onClick);
        }
        if (typeof callback === "function") {
            callback.call(self, groundOverlay, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['GroundOverlay', common.deleteFromObject(groundOverlayOptions, 'function')]);

};

//-------------
// Tile overlay
//-------------
Map.prototype.addTileOverlay = function(tilelayerOptions, callback) {
    var self = this;
    tilelayerOptions = tilelayerOptions || {};
    tilelayerOptions.tileUrlFormat = tilelayerOptions.tileUrlFormat || null;
    if (typeof tilelayerOptions.tileUrlFormat !== "string") {
        throw new Error("tilelayerOptions.tileUrlFormat should set a string.");
    }
    tilelayerOptions.visible = tilelayerOptions.visible === undefined ? true : tilelayerOptions.visible;
    tilelayerOptions.zIndex = tilelayerOptions.zIndex || 0;
    tilelayerOptions.tileSize = tilelayerOptions.tileSize || 256;
    tilelayerOptions.opacity = tilelayerOptions.opacity || 1;

    cordova.exec(function(result) {
        var tileOverlay = new TileOverlay(self, result.id, tilelayerOptions);
        self.OVERLAYS[result.id] = tileOverlay;
        tileOverlay.one(result.id + "_remove", function() {
            tileOverlay.off();
            delete self.OVERLAYS[result.id];
            tileOverlay = undefined;
        });
        if (typeof callback === "function") {
            callback.call(self, tileOverlay, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['TileOverlay', common.deleteFromObject(tilelayerOptions, 'function')]);
};

//-------------
// Polygon
//-------------
Map.prototype.addPolygon = function(polygonOptions, callback) {
    var self = this;
    polygonOptions.points = polygonOptions.points || [];
    polygonOptions.holes = polygonOptions.holes || [];
    if (polygonOptions.holes.length > 0 && !Array.isArray(polygonOptions.holes[0])) {
        polygonOptions.holes = [polygonOptions.holes];
    }
    polygonOptions.holes = polygonOptions.holes.map(function(hole) {
        if (!Array.isArray(hole)) {
            return [];
        }
        return hole.map(function(latLng) {
            return {
                lat: latLng.lat,
                lng: latLng.lng
            };
        });
    });
    polygonOptions.strokeColor = common.HTMLColor2RGBA(polygonOptions.strokeColor || "#FF000080", 0.75);
    if (polygonOptions.fillColor) {
        polygonOptions.fillColor = common.HTMLColor2RGBA(polygonOptions.fillColor, 0.75);
    }
    polygonOptions.strokeWidth = polygonOptions.strokeWidth || 10;
    polygonOptions.visible = polygonOptions.visible === undefined ? true : polygonOptions.visible === true;
    polygonOptions.zIndex = polygonOptions.zIndex || 2;
    polygonOptions.geodesic = polygonOptions.geodesic === true;

    cordova.exec(function(result) {
        var polygon = new Polygon(self, result.id, polygonOptions);
        self.OVERLAYS[result.id] = polygon;
        polygon.one(result.id + "_remove", function() {
            polygon.off();
            delete self.OVERLAYS[result.id];
            polygon = undefined;
        });
        if (typeof polygonOptions.onClick === "function") {
            polygon.on(event.OVERLAY_CLICK, polygonOptions.onClick);
        }
        if (typeof callback === "function") {
            callback.call(self, polygon, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ["Polygon", common.deleteFromObject(polygonOptions, 'function')]);
};

//-------------
// Polyline
//-------------
Map.prototype.addPolyline = function(polylineOptions, callback) {
    var self = this;
    polylineOptions.points = polylineOptions.points || [];
    polylineOptions.color = common.HTMLColor2RGBA(polylineOptions.color || "#FF000080", 0.75);
    polylineOptions.width = polylineOptions.width || 10;
    polylineOptions.visible = polylineOptions.visible === undefined ? true : polylineOptions.visible;
    polylineOptions.zIndex = polylineOptions.zIndex || 4;
    polylineOptions.geodesic = polylineOptions.geodesic === true;

    cordova.exec(function(result) {
        var polyline = new Polyline(self, result.id, polylineOptions);
        self.OVERLAYS[result.id] = polyline;
        polyline.one(result.id + "_remove", function() {
            polyline.off();
            delete self.OVERLAYS[result.id];
            polyline = undefined;
        });
        if (typeof callback === "function") {
            callback.call(self, polyline, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['Polyline', common.deleteFromObject(polylineOptions, 'function')]);
};

//-------------
// Circle
//-------------
Map.prototype.addCircle = function(circleOptions, callback) {
    var self = this;
    circleOptions.center = circleOptions.center || {};
    circleOptions.center.lat = circleOptions.center.lat || 0.0;
    circleOptions.center.lng = circleOptions.center.lng || 0.0;
    circleOptions.strokeColor = common.HTMLColor2RGBA(circleOptions.strokeColor || "#FF0000", 0.75);
    circleOptions.fillColor = common.HTMLColor2RGBA(circleOptions.fillColor || "#000000", 0.75);
    circleOptions.strokeWidth = circleOptions.strokeWidth || 10;
    circleOptions.visible = circleOptions.visible === undefined ? true : circleOptions.visible;
    circleOptions.zIndex = circleOptions.zIndex || 3;
    circleOptions.radius = circleOptions.radius || 1;

    cordova.exec(function(result) {
        var circle = new Circle(self, result.id, circleOptions);
        self.OVERLAYS[result.id] = circle;

        circle.one(result.id + "_remove", function() {
            circle.off();
            delete self.OVERLAYS[result.id];
            circle = undefined;
        });
        if (typeof circleOptions.onClick === "function") {
            circle.on(event.OVERLAY_CLICK, circleOptions.onClick);
        }
        if (typeof callback === "function") {
            callback.call(self, circle, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['Circle', common.deleteFromObject(circleOptions, 'function')]);
};

//-------------
// Marker
//-------------
Map.prototype.addMarker = function(markerOptions, callback) {
    var self = this;
    markerOptions.animation = markerOptions.animation || undefined;
    markerOptions.position = markerOptions.position || {};
    markerOptions.position.lat = markerOptions.position.lat || 0.0;
    markerOptions.position.lng = markerOptions.position.lng || 0.0;
    markerOptions.anchor = markerOptions.anchor || [0.5, 0.5];
    markerOptions.draggable = markerOptions.draggable === true;
    markerOptions.icon = markerOptions.icon || undefined;
    markerOptions.snippet = markerOptions.snippet || undefined;
    markerOptions.title = markerOptions.title !== undefined ? String(markerOptions.title) : undefined;
    markerOptions.visible = markerOptions.visible === undefined ? true : markerOptions.visible;
    markerOptions.flat = markerOptions.flat === true;
    markerOptions.rotation = markerOptions.rotation || 0;
    markerOptions.opacity = parseFloat("" + markerOptions.opacity, 10) || 1;
    markerOptions.disableAutoPan = markerOptions.disableAutoPan === undefined ? false : markerOptions.disableAutoPan;
    if ("styles" in markerOptions) {
        markerOptions.styles = typeof markerOptions.styles === "object" ? markerOptions.styles : {};

        if ("color" in markerOptions.styles) {
            markerOptions.styles.color = common.HTMLColor2RGBA(markerOptions.styles.color || "#000000");
        }
    }
    if (markerOptions.icon && common.isHTMLColorString(markerOptions.icon)) {
        markerOptions.icon = common.HTMLColor2RGBA(markerOptions.icon);
    }

    var markerClick = markerOptions.markerClick;
    var infoClick = markerOptions.infoClick;

    cordova.exec(function(result) {
        markerOptions.hashCode = result.hashCode;
        var marker = new Marker(self, result.id, markerOptions);

        self.MARKERS[result.id] = marker;
        self.OVERLAYS[result.id] = marker;

        marker.one(result.id + "_remove", function() {
            marker.off();
            delete self.MARKERS[result.id];
            delete self.OVERLAYS[result.id];
            marker = undefined;
        });

        if (typeof markerClick === "function") {
            marker.on(event.MARKER_CLICK, markerClick);
        }
        if (typeof infoClick === "function") {
            marker.on(event.INFO_CLICK, infoClick);
        }
        if (typeof callback === "function") {
            callback.call(self, marker, self);
        }
    }, self.errorHandler, self.id, 'loadPlugin', ['Marker', common.deleteFromObject(markerOptions, 'function')]);
};

/*****************************************************************************
 * Callbacks from the native side
 *****************************************************************************/
Map.prototype._onMapEvent = function(eventName) {
    var args = [eventName];
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    this.trigger.apply(this, args);
};

Map.prototype._onMarkerEvent = function(eventName, markerId, position) {
    var self = this;
    var marker = self.MARKERS[markerId] || null;
    if (marker) {
        marker.set('position', position);
        marker.trigger(eventName, position);
    }
};


Map.prototype._onOverlayEvent = function(eventName, hashCode) {
    var self = this;
    var overlay = self.OVERLAYS[hashCode] || null;
    if (overlay) {
        var args = [eventName];
        for (var i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        overlay.trigger.apply(overlay, args);
    }
};

Map.prototype._onKmlEvent = function(eventName, objectType, kmlLayerId, result, options) {
    var self = this;
    var kmlLayer = self.KML_LAYERS[kmlLayerId] || null;
    if (!kmlLayer) {
        return;
    }
    var args = [eventName];
    if (eventName === "add") {
        var overlay = null;

        switch ((objectType + "").toLowerCase()) {
            case "marker":
                overlay = new Marker(self, result.id, options);
                self.MARKERS[result.id] = overlay;
                args.push({
                    "type": "Marker",
                    "object": overlay
                });
                overlay.on(event.MARKER_CLICK, function() {
                    kmlLayer.trigger(event.OVERLAY_CLICK, overlay, overlay.getPosition());
                });
                break;

            case "polygon":
                overlay = new Polygon(self, result.id, options);
                args.push({
                    "type": "Polygon",
                    "object": overlay
                });

                overlay.on(event.OVERLAY_CLICK, function(latLng) {
                    kmlLayer.trigger(event.OVERLAY_CLICK, overlay, latLng);
                });
                break;

            case "polyline":
                overlay = new Polyline(self, result.id, options);
                args.push({
                    "type": "Polyline",
                    "object": overlay
                });
                overlay.on(event.OVERLAY_CLICK, function(latLng) {
                    kmlLayer.trigger(event.OVERLAY_CLICK, overlay, latLng);
                });
                break;
        }
        if (overlay) {
            self.OVERLAYS[result.id] = overlay;
            overlay.hashCode = result.hashCode;
            kmlLayer._overlays.push(overlay);
            kmlLayer.on("_REMOVE", function() {
                var idx = kmlLayer._overlays.indexOf(overlay);
                if (idx > -1) {
                    kmlLayer._overlays.splice(idx, 1);
                }
                overlay.remove();
                overlay.off();
            });
        }
    } else {
        for (var i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
    }
    //kmlLayer.trigger.apply(kmlLayer, args);
};


Map.prototype.getCameraTarget = function() {
    return this.get("camera_target");
};

Map.prototype.getCameraZoom = function() {
    return this.get("camera_zoom");
};
Map.prototype.getCameraTilt = function() {
    return this.get("camera_tilt");
};
Map.prototype.getCameraBearing = function() {
    return this.get("camera_bearing");
};
Map.prototype._onCameraEvent = function(eventName, params) {
    //var cameraPosition = new CameraPosition(params);
    var cameraPosition = params;
    this.set('camera', cameraPosition);
    this.set('camera_target', cameraPosition.target);
    this.set('camera_zoom', cameraPosition.zoom);
    this.set('camera_bearing', cameraPosition.bearing);
    this.set('camera_tilt', cameraPosition.viewAngle || cameraPosition.tilt);
    this.trigger(eventName, cameraPosition, this);
};
module.exports = Map;
