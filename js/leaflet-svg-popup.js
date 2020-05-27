L.SVGPopup = L.Popup.extend({

    options: {
        api: "none",
        json: "none",
        csv: "none",
        x_column: "none",
        y_column: "none",
        group_column: "none",
        color_column: "none",
        filter_column: "none",
        filter_value: "none",
        width: 200,
        height: 200,
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
    return "<h3 style='text-align: center;'>" + layer.feature.properties.NAME + "</h3>" + layer._popup.options.html
}

function get_data(layer, callback) {
    var options = layer.options
    if (options.csv != undefined) {
        var parseTime = d3.timeParse("%Y-%m-%d");

        d3.csv(options.csv, function (d) {
            if (options.filter_column != undefined && options.filter_value != undefined) {
                if (d[options.filter_column] == options.filter_value) {
                    if (options.group_column != undefined) {
                        var group_val = d[options.group_column]
                    } else {
                        var group_val = "none"
                    }
                    if (options.color_column != undefined) {
                        var color_val = d[options.color_column]
                    } else {
                        var color_val = "black"
                    }
                    return {
                        x: parseTime(d.date),
                        y: +d.cases,
                        group: group_val,
                        color: color_val,
                    }
                }
            }
        })
            .then(function (data) {
                create_plot(data, options);
                html_return(layer);
                callback(layer);
            })
            .catch(function (error) {
                console.log("error loading csv data");
                console.log(error);
            });

        function html_return(layer) {
            var html_script = $("#placeholder").html()
            layer.options['html'] = html_script
            $("#placeholder").remove()
        }

        function create_plot(data, options) {
            // var margin = {top: 25, right: 25, bottom: 25, left: 25},
            //     width = options.width,
            //     height = options.height;
            // var svg = d3.select("body")
            //     .append("svg")
            //     .attr('id', 'placeholder')
            //     .attr('display', false)
            //     .attr("width", width + margin.left + margin.right)
            //     .attr("height", height + margin.top + margin.bottom);
            // svg.append('text').text("test")
            // return svg

            var margin = {top: 25, right: 25, bottom: 50, left: 50},
                // width = options.width - margin.left - margin.right,
                width = 300 - margin.left - margin.right,
                height = options.height - margin.top - margin.bottom;

            /*
            var xScale = d3.scaleLinear()
                .domain([0, n-1])
                .range([0, width]);
            */
            var xScale = d3.scaleTime()
                .domain(d3.extent(data, function(d) { return d.x; }))
                .range([0, width]);

            var yScale = d3.scaleLinear()
                .domain(d3.extent(data, function(d) { return d.y; }))
                .range([height, 0]);

            var line = d3.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return yScale(d.y); })
                .curve(d3.curveMonotoneX);

            var svg = d3.select("body")
                .append("div")
                .attr('id', 'placeholder')
                .append("svg")
                .attr('display', false)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var x = g.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

            var y = g.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale));

            var line = g.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", line);

            var dot = g.selectAll(".dot")
                .data(data).enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", function(d) { return xScale(d.x) })
                .attr("cy", function(d) { return yScale(d.y) })
                .style("fill", options.color)
                .attr("r", .5)
                .on("mouseover", function(a, b, c) {
                    this.attr('class', 'focus')
                });

            return svg
        }
    }
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
