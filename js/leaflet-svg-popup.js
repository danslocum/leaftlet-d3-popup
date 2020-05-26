/*
 leaflet.responsive.popup 0.6.4
 (c) 2019 https://github.com/yafred
*/

L.SVGPopup = L.Popup.extend({

    options: {
        api: "none",
        json: "none",
        csv: "none",
        x: "none",
        y: "none",
        group: "none",
        color: "none"
        // https://leafletjs.com/reference-1.6.0.html#popup
    },

    _initLayout: function () {
        var prefix = 'leaflet-popup',
            container = this._container = DomUtil.create('div',
                prefix + ' ' + (this.options.className || '') +
                ' leaflet-zoom-animated');

        var wrapper = this._wrapper = DomUtil.create('div', prefix + '-content-wrapper', container);
        this._contentNode = DomUtil.create('div', prefix + '-content', wrapper);

        DomEvent.disableClickPropagation(wrapper);
        DomEvent.disableScrollPropagation(this._contentNode);
        DomEvent.on(wrapper, 'contextmenu', DomEvent.stopPropagation);

        this._tipContainer = DomUtil.create('div', prefix + '-tip-container', container);
        this._tip = DomUtil.create('div', prefix + '-tip', this._tipContainer);

        if (this.options.closeButton) {
            var closeButton = this._closeButton = DomUtil.create('a', prefix + '-close-button', container);
            closeButton.href = '#close';
            closeButton.innerHTML = '&#215;';

            DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
        }
    },

});

L.svgPopup = function (options, source) {
    return new L.SVGPopup(options, source);
};

if( typeof exports === 'object' && typeof module !== 'undefined') {
    exports.svgPopup = L.svgPopup;
    exports.SVGPopup = L.SVGPopup;
}

// @section Popup methods
L.Layer.include({
    // create new @method bindSVGPopup
    bindSVGPopup: function (content, options) {
        if (content instanceof L.SVGPopup) {
            L.setOptions(content, options);
            this._popup = content;
            content._source = this;
        } else {
            if (!this._popup || options) {
                this._popup = new L.SVGPopup(options, this);
            }
            this._popup.setContent(content);
        }

        if (!this._popupHandlersAdded) {
            this.on({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });
            this._popupHandlersAdded = true;
        }

        return this;
    },

    // @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
    // Binds a popup to the layer with the passed `content` and sets up the
    // neccessary event listeners. If a `Function` is passed it will receive
    // the layer as the first argument and should return a `String` or `HTMLElement`.
    bindPopup: function (content, options) {

        if (content instanceof L.Popup) {
            L.setOptions(content, options);
            this._popup = content;
            content._source = this;
        } else {
            if (!this._popup || options) {
                this._popup = new L.Popup(options, this);
            }
            this._popup.setContent(content);
        }

        if (!this._popupHandlersAdded) {
            this.on({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });
            this._popupHandlersAdded = true;
        }

        return this;
    },

    // @method unbindPopup(): this
    // Removes the popup previously bound with `bindPopup`.
    unbindPopup: function () {
        if (this._popup) {
            this.off({
                click: this._openPopup,
                remove: this.closePopup,
                move: this._movePopup
            });
            this._popupHandlersAdded = false;
            this._popup = null;
        }
        return this;
    },

    // @method openPopup(latlng?: LatLng): this
    // Opens the bound popup at the specificed `latlng` or at the default popup anchor if no `latlng` is passed.
    openPopup: function (layer, latlng) {
        if (!(layer instanceof L.Layer)) {
            latlng = layer;
            layer = this;
        }

        if (layer instanceof L.FeatureGroup) {
            for (var id in this._layers) {
                layer = this._layers[id];
                break;
            }
        }

        if (!latlng) {
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
        }

        if (this._popup && this._map) {
            // set popup source to this layer
            this._popup._source = layer;

            // update the popup (content, layout, ect...)
            this._popup.update();

            // open the popup on the map
            this._map.openPopup(this._popup, latlng);
        }

        return this;
    },

    // @method closePopup(): this
    // Closes the popup bound to this layer if it is open.
    closePopup: function () {
        if (this._popup) {
            this._popup._close();
        }
        return this;
    },

    // @method togglePopup(): this
    // Opens or closes the popup bound to this layer depending on its current state.
    togglePopup: function (target) {
        if (this._popup) {
            if (this._popup._map) {
                this.closePopup();
            } else {
                this.openPopup(target);
            }
        }
        return this;
    },

    // @method isPopupOpen(): boolean
    // Returns `true` if the popup bound to this layer is currently open.
    isPopupOpen: function () {
        return this._popup.isOpen();
    },

    // @method setPopupContent(content: String|HTMLElement|Popup): this
    // Sets the content of the popup bound to this layer.
    setPopupContent: function (content) {
        if (this._popup) {
            this._popup.setContent(content);
        }
        return this;
    },

    // @method getPopup(): Popup
    // Returns the popup bound to this layer.
    getPopup: function () {
        return this._popup;
    },

    _openPopup: function (e) {
        var layer = e.layer || e.target;

        if (!this._popup) {
            return;
        }

        if (!this._map) {
            return;
        }

        // prevent map click
        L.DomEvent.stop(e);

        // if this inherits from Path its a vector and we can just
        // open the popup at the new location
        if (layer instanceof L.Path) {
            this.openPopup(e.layer || e.target, e.latlng);
            return;
        }

        // otherwise treat it like a marker and figure out
        // if we should toggle it open/closed
        if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
            this.closePopup();
        } else {
            this.openPopup(layer, e.latlng);
        }
    },

    _movePopup: function (e) {
        this._popup.setLatLng(e.latlng);
    }
});
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
/*
var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

d3.json("{{ page.data }}").then(function(collection) {
    collection.objects.forEach(function(d) { d.LatLng = new L.LatLng( d.circle.coordinates[0], d.circle.coordinates[1] ); })

    var feature = g.selectAll("circle")
        .data(collection.objects)
        .enter().append("circle")
        .style("stroke", "black")
        .style("opacity", .6)
        .style("fill", "red")
        .attr("r", 20);

    map.on("viewreset", update);
    update();

    function update() {
        feature.attr("transform", function(d) {
            return "translate("+ map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
        });
    }
});
*/