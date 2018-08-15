
var utils = require('cordova/utils'),
  event = require('cordova-plugin-googlemaps.event'),
  BaseClass = require('cordova-plugin-googlemaps.BaseClass'),
  LatLng = require('cordova-plugin-googlemaps.LatLng');

function PluginStreetViewPanorama(panoramaId, options, panoramaDivId) {
  var self = this;
  BaseClass.apply(this);
  var panoramaDiv = document.querySelector("[__pluginMapId='" + panoramaId + "']");
  var container = document.createElement("div");
  container.style.userSelect="none";
  container.style["-webkit-user-select"]="none";
  container.style["-moz-user-select"]="none";
  container.style["-ms-user-select"]="none";
  panoramaDiv.style.position = "relative";
  container.style.position = "absolute";
  container.style.top = 0;
  container.style.bottom = 0;
  container.style.right = 0;
  container.style.left = 0;
  panoramaDiv.insertBefore(container, panoramaDiv.firstElementChild);

  self.set("isGoogleReady", false);
  self.set("container", container);
  self.PLUGINS = {};

  Object.defineProperty(self, "id", {
    value: panoramaId,
    writable: false
  });

  self.one("googleready", function() {
    self.set("isGoogleReady", true);

    var service = new google.maps.StreetViewService();
    new Promise(function(resolve, reject) {
      if (options.camera) {
        var request = {};
        if (typeof options.camera.target === "string") {
          request.pano = options.camera.target;
        } else {
          request.location = options.camera.target;
          request.radius = options.camera.radius | 50;
          request.source = options.camera.source === "OUTDOOR" ?
            google.maps.StreetViewSource.OUTDOOR : google.maps.StreetViewSource.DEFAULT;
        }
        service.getPanorama(request, function(data, status) {
          if (status === google.maps.StreetViewStatus.OK) {
            resolve(data.location.pano);
          } else {
            reject();
          }
        });
      } else {
        resolve();
      }
    })
    .then(function(panoId) {

      var stOptions = {
        'addressControl': options.controls.streetNames,
        'showRoadLabels': options.controls.streetNames,
        'linksControl': options.controls.navigation,
        'panControl': options.gestures.panning,
        'zoomControl': options.gestures.zoom,
        'scrollwheel': options.gestures.zoom,
        'pano': panoId
      };
      if (options.camera) {
        if ('zoom' in options.camera) {
          stOptions.zoom = options.camera.zoom;
        }
        var pov;
        if ('tilt' in options.camera) {
          pov = {};
          pov.pitch = options.camera.tilt;
        }
        if ('bearing' in options.camera) {
          pov = pov | {};
          pov.heading = options.camera.bearing;
        }
        stOptions.pov = pov;
      }

      google.maps.event.addDomListener(container, 'click', function(evt) {
        var pov = panorama.getPov();
        var clickInfo = {
          'orientation': {
            'bearing': pov.heading,
            'tilt': pov.pitch
          },
          'point': [evt.clientX, evt.clientY]
        };
        if (self.id in plugin.google.maps) {
          plugin.google.maps[self.id]({
            'evtName': event.PANORAMA_CLICK,
            'callback': '_onPanoramaEvent',
            'args': [clickInfo]
          });
        }
      });
      var panorama = new google.maps.StreetViewPanorama(container, stOptions);
      self.set('panorama', panorama);

      self.trigger(event.PANORAMA_READY);

      panorama.addListener("pano_changed", self._onPanoChangedEvent.bind(self, panorama));
      panorama.addListener("pov_changed", self._onCameraEvent.bind(self, panorama));
      panorama.addListener("zoom_changed", self._onCameraEvent.bind(self, panorama));

    });



  });
}

utils.extend(PluginStreetViewPanorama, BaseClass);

PluginStreetViewPanorama.prototype._onCameraEvent = function(panorama) {
  var self = this;
  var pov = panorama.getPov();
  var camera = {
    'bearing': pov.heading,
    'tilt': pov.pitch,
    'zoom': panorama.getZoom()
  };
  if (self.id in plugin.google.maps) {
    plugin.google.maps[self.id]({
      'evtName': event.PANORAMA_CAMERA_CHANGE,
      'callback': '_onPanoramaCameraChange',
      'args': [camera]
    });
  }
};
PluginStreetViewPanorama.prototype._onPanoChangedEvent = function(panorama) {
  var self = this;
  var location = panorama.getLocation();

  var locationInfo = {
    'panoId': location.pano,
    'latLng': {
      'lat': location.latLng.lat(),
      'lng': location.latLng.lng()
    }
  };

  var links = panorama.getLinks();
  locationInfo.links = links.map(function(link) {
    return {
      'panoId': link.pano,
      'bearing': link.heading
    };
  });
  if (self.id in plugin.google.maps) {
    plugin.google.maps[self.id]({
      'evtName': event.PANORAMA_LOCATION_CHANGE,
      'callback': '_onPanoramaLocationChange',
      'args': [locationInfo]
    });
  }
};

module.exports = PluginStreetViewPanorama;
