var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    common = require('./Common'),
    LatLng = require('./LatLng'),
    BaseClass = require('./BaseClass');

/*****************************************************************************
 * Marker Class
 *****************************************************************************/
var Marker = function(map, id, markerOptions) {
    BaseClass.apply(this);

    var self = this;

    Object.defineProperty(self, "map", {
        value: map,
        writable: false
    });
    Object.defineProperty(self, "hashCode", {
        value: markerOptions.hashCode,
        writable: false
    });
    Object.defineProperty(self, "id", {
        value: id,
        writable: false
    });
    Object.defineProperty(self, "type", {
        value: "Marker",
        writable: false
    });

    if (markerOptions && markerOptions.position) {
      this.set('position', markerOptions.position);
    }

    this.on('info_open', function() {
      map.set('active_marker_id', id);
    });
    this.on('info_close', function() {
      map.set('active_marker_id', undefined);
    });


        self.on("position_changed", function(oldValue, position) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setPosition', [self.getId(), position.lat, position.lng]);
        });
        self.on("rotation_changed", function(oldValue, rotation) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setRotation', [self.getId(), rotation]);
        });
        self.on("snippet_changed", function(oldValue, snippet) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setSnippet', [self.getId(), snippet]);
        });
        self.on("visible_changed", function(oldValue, visible) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setVisible', [self.getId(), visible]);
        });
        self.on("title_changed", function(oldValue, title) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setTitle', [self.getId(), title]);
        });
        self.on("icon_changed", function(oldValue, url) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setIcon', [self.getId(), url]);
        });
        self.on("flat_changed", function(oldValue, flat) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setFlat', [self.getId(), flat]);
        });
        self.on("draggable_changed", function(oldValue, draggable) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setDraggable', [self.getId(), draggable]);
        });
        self.on("anchor_changed", function(oldValue, anchor) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setInfoWindowAnchor', [self.getId(), anchor[0], anchor[1]]);
        });
        self.on("zIndex_changed", function(oldValue, zIndex) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setZIndex', [self.getId(), zIndex]);
        });
        self.on("opacity_changed", function(oldValue, opacity) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setOpacity', [self.getId(), opacity]);
        });
        self.on("disableAutoPan_changed", function(oldValue, opacity) {
            cordova.exec(null, self.errorHandler, self.getPluginName(), 'setDisableAutoPan', [self.getId(), disableAutoPan]);
        });


    var ignores = ["hashCode", "id", "hashCode", "type"];
    for (var key in markerOptions) {
        if (ignores.indexOf(key) === -1) {
            self.set(key, markerOptions[key]);
        }
    }
};

utils.extend(Marker, BaseClass);

Marker.prototype.getPluginName = function() {
    return this.map.getId() + "-marker";
};

Marker.prototype.remove = function(callback) {
    var self = this;
    self.trigger(self.id + "_remove");
    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, self.errorHandler, self.getPluginName(), 'remove', [this.getId()]);
};

Marker.prototype.getPosition = function() {
    var position = this.get('position');
    if (!(position instanceof LatLng)) {
      return new LatLng(position.lat, position.lng);
    }
    return position;
};
Marker.prototype.getId = function() {
    return this.id;
};
Marker.prototype.getMap = function() {
    return this.map;
};
Marker.prototype.getHashCode = function() {
    return this.hashCode;
};

Marker.prototype.setAnimation = function(animation, callback) {
    var self = this;

    animation = animation || null;
    if (!animation) {
        return;
    }
    this.set("animation", animation);

    cordova.exec(function() {
        if (typeof callback === "function") {
            callback.call(self);
        }
    }, this.errorHandler, self.getPluginName(), 'setAnimation', [this.getId(), common.deleteFromObject(animation,'function')]);
    return this;
};

Marker.prototype.setDisableAutoPan = function(disableAutoPan) {
    disableAutoPan = common.parseBoolean(disableAutoPan);
    this.set('disableAutoPan', disableAutoPan);
    return this;
};
Marker.prototype.setOpacity = function(opacity) {
    if (!opacity && opacity !== 0) {
        console.log('opacity value must be int or double');
        return false;
    }
    this.set('opacity', opacity);
    return this;
};
Marker.prototype.setZIndex = function(zIndex) {
    if (typeof zIndex === 'undefined') {
        return false;
    }
    this.set('zIndex', zIndex);
    return this;
};
Marker.prototype.getOpacity = function() {
    return this.get('opacity');
};
Marker.prototype.setIconAnchor = function(anchorX, anchorY) {
    this.set('anchor', [anchorX, anchorY]);
    return this;
};
Marker.prototype.setInfoWindowAnchor = function(anchorX, anchorY) {
    this.set('anchor', [anchorX, anchorY]);
    return this;
};
Marker.prototype.setDraggable = function(draggable) {
    draggable = common.parseBoolean(draggable);
    this.set('draggable', draggable);
    return this;
};
Marker.prototype.isDraggable = function() {
    return this.get('draggable');
};
Marker.prototype.setFlat = function(flat) {
    flat = common.parseBoolean(flat);
    this.set('flat', flat);
    return this;
};
Marker.prototype.setIcon = function(url) {
    if (url && common.isHTMLColorString(url)) {
        url = common.HTMLColor2RGBA(url);
    }
    this.set('icon', url);
    return this;
};
Marker.prototype.setTitle = function(title) {
    if (!title) {
        console.log('missing value for title');
        return this;
    }
    title = "" + title; // Convert to strings mandatory
    this.set('title', title);
    return this;
};
Marker.prototype.setVisible = function(visible) {
    visible = common.parseBoolean(visible);
    this.set('visible', visible);
    return this;
};
Marker.prototype.getTitle = function() {
    return this.get('title');
};
Marker.prototype.setSnippet = function(snippet) {
    this.set('snippet', snippet);
    return this;
};
Marker.prototype.getSnippet = function() {
    return this.get('snippet');
};
Marker.prototype.setRotation = function(rotation) {
    if (!rotation) {
        console.log('missing value for rotation');
        return false;
    }
    this.set('rotation', rotation);
    return this;
};
Marker.prototype.getRotation = function() {
    return this.get('rotation');
};
Marker.prototype.showInfoWindow = function() {
    cordova.exec(null, this.errorHandler, this.getPluginName(), 'showInfoWindow', [this.getId()]);
    return this;
};
Marker.prototype.hideInfoWindow = function() {
    cordova.exec(null, this.errorHandler, this.getPluginName(), 'hideInfoWindow', [this.getId()]);
    return this;
};
Marker.prototype.isInfoWindowShown = function() {
    var map = this.getMap();
    return map && map.get('active_marker_id') === this.id;
};
Marker.prototype.isVisible = function() {
    return this.get("visible") === true;
};

Marker.prototype.setPosition = function(position) {
    if (!position) {
        console.log('missing value for position');
        return false;
    }
    this.set('position', position);
    return this;
};

module.exports = Marker;
