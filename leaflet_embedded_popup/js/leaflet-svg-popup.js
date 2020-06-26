L.SVGPopup = L.Popup.extend({

    options: {
        width: 200,
        height: 200,
        maxWidth: 500,
    },

    _initLayout: function () {
        var prefix = 'leaflet-popup',
            container = this._container = L.DomUtil.create('div',
                prefix + ' ' + (this.options.className || '') +
                ' leaflet-zoom-animated');

        var wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
        var content_wrapper = this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
        // this._graphContainer = L.DomUtil.create('div', 'myViz', content_wrapper)


        L.DomEvent.disableClickPropagation(wrapper);
        L.DomEvent.disableScrollPropagation(this._contentNode);
        L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

        this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
        this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);

        if (this.options.closeButton) {
            var closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
            closeButton.href = '#close';
            closeButton.innerHTML = '&#215;';

            L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
        }
    },

    update_data: function (callback) {
        get_data(this, callback);
    }

});


L.svgPopup = function (options, source) {
    return new L.SVGPopup(options, source);
};


if( typeof exports === 'object' && typeof module !== 'undefined') {
    exports.svgPopup = L.svgPopup;
    exports.SVGPopup = L.SVGPopup;
}


function setPopup(layer){
    return "<h3 style='text-align: center;'>" + layer.feature.properties.NAME + "</h3>"
          + layer._popup.options.html
}

function get_data(layer, callback) {
    var options = layer.options;
    var features = layer._source.feature.properties;
    layer.options['html'] = "";

    var save_callback = function(layer) { return; }
    var page_opened = false;
    var remove_placeholder = false;

    var div = d3.select("body").append("div").attr('id', 'placeholder');
    $('#placeholder').hide();

    var visuals = Object.keys(options);
    var visuals_only = [];
    $(visuals).each(function(i, vis) {
        if (typeof options[vis] == "object") {
            visuals_only.push(vis);
        }
    });
    if (visuals_only.length > 1) {
        $(visuals_only).each(function (i, vis) {
            var visual_options = options[vis];

            div.append('button')
                .attr('class', 'tablink')
                .style("backgroundColor", function (d, i) { return (i == 0) ? "grey":""; })
                .attr('id', vis + 'button')
                .attr('onclick', "openPage('" + vis + "')")
                .style('width', (1 / visuals_only.length) * 100 + "%")
                .text(visual_options.name);

            if (page_opened == false) {
                openPage(vis);
                page_opened = true
            }
        });
    }
    $(visuals_only).each(function(i, vis) {
        var visual_options = options[vis];
        visual_options.id = vis;

        if ((visuals_only.length - 1) == i) {
            save_callback = callback;
            remove_placeholder = true;
        }

        if (visual_options.csv != undefined) {
            get_csv(visual_options, features, save_callback, remove_placeholder);
        } else if (visual_options.json != undefined) {
            get_json(visual_options, features, save_callback, remove_placeholder);
        } else if (visual_options.api != undefined) {
            var test;
        } else {
            html_return(save_callback, remove_placeholder);
        }
    });

    function get_csv(options, features, callback, remove_placeholder) {
        d3.csv(options.csv, function (d) {
            d = html_get_data(d, options);
            if (d != false) { return d; }
        }).then(function (data) {
            html_create(data, features, options);
            html_return(callback, remove_placeholder);
        }).catch(function (error) {
            console.log("error loading csv data");
            console.log(error);
        });
    }
    function get_json(options, features, callback, remove_placeholder) {
        d3.json(options.json, function (d) {
            d = html_get_data(d, options);
            if (d != false) { return d; }
        }).then(function (data) {
            html_create(data, features, options);
            html_return(callback, remove_placeholder);
        }).catch(function (error) {
            console.log("error loading json data");
            console.log(error);
        });

    }
    function html_get_data(d, options) {
        if ((d[options.filter_column] == options.filter_value) || (options.filter_column == undefined && options.filter_value == undefined)) {
            if (options.group_column != undefined) { d['group'] = d[options.group_column];
            } else { d['group'] = "none"; }

            if (options.color_column != undefined) { d['color'] = d[options.color_column];
            } else { d['color'] = "none"; }

            if (options.x_column != undefined) { d['x'] = d[options.x_column];
            } else { d['x'] = "none"; }

            if (options.y_column != undefined) { d['y'] = d[options.y_column];
            } else { d['y'] = "none"; }

            return d
        }
        return false
    }
    function html_create(data, features, options) {
        if (typeof options.type == "function") {
            options.type(data, div, features, options);
        } else {
            switch(options.type) {
                case "circle_packing":
                    create_plot(data, div, features, options);
                    break;
                case "force_directed":
                    create_plot(data, div, features, options);
                    break;
                case "scatter":
                    create_plot(data, div, features, options);
                    break;
                case "stacked_bar":
                    create_stacked_bar_plot(data, div, features, options);
                    break;
                case "line":
                    create_line_plot(data, div, features, options);
                    break;
                default:
                    create_plot();
            }
        }
    }
    function html_return(callback, remove_placeholder) {
        $('#placeholder').show();
        layer.options['html'] = $("#placeholder").html();
        if (remove_placeholder == true) {
            $('#placeholder').remove();
        } else {
            $('#placeholder').hide();
        }
        callback(layer);
    }
}

function openPage(pageName) {
    $(".tabcontent").each(function() {
        $(this).css('display', "none");
    });

    $(".tablink").each(function() {
        $(this).css('backgroundColor', "");
    });
    $("#" + pageName + "button").css("backgroundColor", "grey");
    $("#" + pageName).css("display", "block");
}

// @section Popup methods
L.Layer.include({
    // create new @method bindSVGPopup
    bindSVGPopup: function (options) {
        content = setPopup;
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
                click: this._openPopup2,
                remove: this.closePopup2,
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

            this._map.openPopup(this._popup, latlng);

        }

        return this;
    },
    openPopup2: function (layer, latlng) {
        if (!(layer instanceof L.Layer)) {
            latlng = layer;
        }

        if (layer instanceof L.FeatureGroup) {
            for (var id in layer._layers) {
                layer = layer._layers[id];
                break;
            }
        }

        if (!latlng) {
            latlng = layer.getCenter ? layer.getCenter() : layer.getLatLng();
        }

        if (layer._popup && layer._map) {
            // set popup source to this layer
            layer._popup._source = layer;

            // update the popup (content, layout, ect...)
            layer._popup.update();

            layer._map.openPopup(layer._popup, latlng);
        }
        return layer;
    },

    // @method closePopup(): this
    // Closes the popup bound to this layer if it is open.
    closePopup: function () {
        if (this._popup) {
            this._popup._close();
        }
        return this;
    },
    // @method closePopup(): this
    // Closes the popup bound to this layer if it is open.
    closePopup2: function () {
        if (this._popup) {
            this._popup._close();
        }
        // this._popup.options['html'] = "";
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

    _openPopup2: function (e) {
        var layer = e.layer || e.target;

        if (!this._popup) {
            return;
        }

        if (!this._map) {
            return;
        }

        // prevent map click
        L.DomEvent.stop(e);

        this._popup.update();
        this._popup.update_data(callback);
        function callback(this_layer) {
            // if this inherits from Path its a vector and we can just
            // open the popup at the new location
            if (layer instanceof L.Path) {
                this_layer.openPopup2(e.layer || e.target, e.latlng);
                return;
            }

            // otherwise treat it like a marker and figure out
            // if we should toggle it open/closed
            if (this_layer._map.hasLayer(this_layer._popup) && this_layer._popup._source === layer) {
                this_layer.closePopup2();
            } else {
                this_layer.openPopup2(layer, e.latlng);
            }
        }
    },

    _movePopup: function (e) {
        this._popup.setLatLng(e.latlng);
    }
});
