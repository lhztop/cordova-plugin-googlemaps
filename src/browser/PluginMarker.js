
var utils = require('cordova/utils');
var event = require('cordova-plugin-googlemaps.event');
var BaseClass = require('cordova-plugin-googlemaps.BaseClass');

function PluginMarker(pluginMap) {
  var self = this;
  BaseClass.apply(self);
  Object.defineProperty(self, "pluginMap", {
    value: pluginMap,
    enumerable: false,
    writable: false
  });
}

utils.extend(PluginMarker, BaseClass);

PluginMarker.prototype._create = function(onSuccess, onError, args) {
  var self = this,
    map = self.pluginMap.get('map'),
    markerId = 'marker_' + args[2],
    pluginOptions = args[1];

  var markerOpts = {
    'position': pluginOptions.position,
    'map': map,
    'disableAutoPan': pluginOptions.disableAutoPan === true
  };
  var iconSize = null;
  if (pluginOptions.animation) {
    markerOpts.animation = google.maps.Animation[pluginOptions.animation.toUpperCase()];
  }
  if (pluginOptions.icon) {
    var icon = pluginOptions.icon;
    markerOpts.icon = {};
    if (typeof pluginOptions.icon === 'string') {
      // Specifies path or url to icon image
      markerOpts.icon = pluginOptions.icon;
    } else if (Array.isArray(markerOpts.icon)) {
      // Specifies color name or rule
      markerOpts.icon = {
        path: 'm12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z',
        fillColor: 'rgb(' + pluginOptions.icon[0] + ',' + pluginOptions.icon[1] + ',' + pluginOptions.icon[2] + ')',
        fillOpacity: pluginOptions.icon[3] / 256,
        scale: 1.5,
        strokeWeight: 0
      };
      iconSize = {
        width: 20,
        height: 42
      };
    } else if (typeof pluginOptions.icon === 'object') {
      markerOpts.icon.url = pluginOptions.icon.url;
      if (pluginOptions.icon.size) {
        markerOpts.icon.scaledSize = new google.maps.Size(icon.size.width, icon.size.height);
        iconSize = icon.size;
      }
    }

    if (icon.anchor) {
      markerOpts.icon.anchor = new google.maps.Point(icon.anchor[0], icon.anchor[1]);
    }
  } else {
    // default marker
    markerOpts.icon = {
      path: 'm12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z',
      fillColor: 'rgb(255, 0, 0)',
      fillOpacity: 1,
      scale: 1.5,
      strokeWeight: 0
    };
    iconSize = {
      width: 20,
      height: 42
    };
  }
  var marker = new google.maps.Marker(markerOpts);
  if (pluginOptions.title || pluginOptions.snippet) {
    var html = [];
    if (pluginOptions.title) {
      html.push(pluginOptions.title);
    }
    if (pluginOptions.snippet) {
      html.push('<small>' + pluginOptions.snippet + '</small>');
    }
    marker.set('content', html.join('<br>'));
    marker.addListener('click', onMarkerClick);
  }

  self.pluginMap.objects[markerId] = marker;
  self.pluginMap.objects['marker_property_' + markerId] = markerOpts;

  if (iconSize) {
    onSuccess({
      'id': markerId,
      'width': iconSize.width,
      'height': iconSize.height
    });
  } else {
    var img = new Image();
    img.onload = function() {
      console.log(markerId, img.width, img.height);
      onSuccess({
        'id': markerId,
        'width': img.width,
        'height': img.height
      });
    };
    img.onerror = function() {
      onSuccess({
        'id': markerId,
        'width': 20,
        'height': 42
      });
    };
    if (typeof markerOpts.icon === "string") {
      img.src = markerOptions.icon;
    } else {
      img.src = markerOptions.icon.url;
    }
  }
};

PluginMarker.prototype.showInfoWindow = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var marker = self.pluginMap.objects[overlayId];
  if (marker) {
    onMarkerClick.call(marker);
  }
  onSuccess();
};

module.exports = PluginMarker;

var infoWnd = null;
function onMarkerClick() {
  if (!infoWnd) {
    infoWnd = new google.maps.InfoWindow();
  }
  var marker = this;
  var content = marker.get('content');
  infoWnd.setOptions({
    content: content,
    disableAutoPan: marker.disableAutoPan
  });
  infoWnd.open(marker.getMap(), marker);
}
