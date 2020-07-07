function create_stacked_bar_plot(data, div, options) {
    var features_active_list = []
    var features_active = g_component.selectAll(".feature_component.active");
    $.each(features_active._groups[0], function(i, val) {
        features_active_list.push(val.__data__.properties.NAME);
    });

    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var formatDateIntoYear = d3.timeFormat("%m/%d");

    data.forEach(function(d) {
        d['y'] = +d['y']
        d['x'] = parseTime(d.x)
        return d
    })

    data.sort(function(a,b) {
       if (a.x >= b.x) {return 1; }
       else { return -1; }
    });

    var nest = d3.nest()
        .key(function(d) { return d.x; })
        .entries(data);

    var keys = d3.nest()
        .key(function(d) { return d.group; })
        .entries(data)
        .map(function(d) { return d.key; })
        .sort(function(a, b) {
            if (features_active_list.includes(a) & features_active_list.includes(b)) { return 0;
            } else if (features_active_list.includes(a)) { return -1;
            } else if (features_active_list.includes(b)) { return 1;
            } else { return 0; }
        })

    nest.forEach(function(d) {
        vals = d.values;
        vals.forEach(function(v) { d[v.group] = v.y; });
        keys.forEach(function(v) { if (d[v] == undefined) { d[v] = 0; }});
        return d
    });

    var dataset = d3.stack().keys(keys)(nest);

    var x_vals = d3.nest()
        .key(function(d) { return d.x; })
        .entries(data);

    var totals = d3.nest()
        .key(function(d) { return d.x; })
        .rollup(function(v) { return {
            total: d3.sum(v, function (d) { return d.y; }),
            avg: d3.mean(v, function (d) { return d.y; })
        }
        })
        .entries(data);

    var xScale_stacked_bar = d3.scaleBand()
        .domain(x_vals.map(function(d){ return formatDateIntoYear(d.values[0].x); }))
        .range([0, width]);

    var yScale_stacked_bar = d3.scaleLinear()
        .domain([0, d3.max(totals, function(d) { return d.value.total; })])
        .nice()
        .range([height, 0]);

    var svg_stacked_bar = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

    var g_stacked_bar = svg_stacked_bar.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x_stacked_bar = g_stacked_bar.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale_stacked_bar)
                .tickValues(xScale_stacked_bar.domain().filter(function(d, i) {
                    return !(i % 10);
                }))
            // .tickFormat(function(d) { return d.split("-")[0] })
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    var y_stacked_bar = g_stacked_bar.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale_stacked_bar));

    var groups_stacked_bar = g_stacked_bar.selectAll("g.layer")
        .data(dataset, function(d) { return d; })
        .enter().append('g')
            .attr('class', 'layer')
            .style("fill", function(d,i) { return (features_active_list.includes(d.key)) ? "lightgreen":"lightgrey"; });

    var rect_stacked_bar = groups_stacked_bar.selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
            .attr("x", function(d, i) { return xScale_stacked_bar(formatDateIntoYear(d.data.values[0].x)); })
            .attr("y", function(d) { return yScale_stacked_bar(d[1]); })
            .attr("width", xScale_stacked_bar.bandwidth())
            .attr("height", function(d) { return yScale_stacked_bar(d[0]) - yScale_stacked_bar(d[1]); })
            .on("mouseover", function() {
                // tooltip.style("display", null);
            })
            .on("mouseout", function() {
                // tooltip.style("display", "none");
            })
            .on("mousemove", function(d) {
                // var xPosition = d3.mouse(this)[0] - 15;
                // var yPosition = d3.mouse(this)[1] - 25;
                // tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                // tooltip.select("text").text(d.y);
            });
}

function create_line_plot(data, div, options) {
    var features_active_list = []
    var features_active = g_component.selectAll(".feature_component.active");
    $.each(features_active._groups[0], function(i, val) {
        features_active_list.push(val.__data__.properties.NAME);
    });

    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var formatDateIntoYear = d3.timeFormat("%m/%d");

    data.forEach(function(d) {
        d['y'] = +d['y']
        d['x'] = parseTime(d.x)
        return d
    })
    var data = data.filter(function(d) {
        return (features_active_list.includes(d.group)) ? true: false;
    })

    var nest = d3.nest()
        .key(function(d) { return d.group; })
        .entries(data);

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

    var svg = div.append("svg")
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

    var lines = g.selectAll('.lines')
        .data(nest);

    lines.enter()
        .append("path")
            .attr("class", "lines")
            .attr("d", function(d) { return line(d.values); });

    var dot = g.selectAll(".dot")
        .data(data.filter(function(d) {
            return (d.color && d.color != "False") ? true:false;
        }))
        .enter()
        .append("circle")
            .attr("class", "dot")
            .attr("cx", function(d) { return xScale(d.x) })
            .attr("cy", function(d) { return yScale(d.y) })
            .style("fill", function(d) { return scatter_colors[d.color]; })
            .attr("r", 2.5)
            .on("mouseover", function(a, b, c) {
                // this.attr('class', 'focus');
            });
}

function create_area_plot(data, div, options) {
    var features_active_list = []
    var features_active = g_component.selectAll(".feature_component.active");
    $.each(features_active._groups[0], function(i, val) {
        features_active_list.push(val.__data__.properties.NAME);
    });

    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var formatDateIntoYear = d3.timeFormat("%m/%d");
    var formatDate = d3.timeFormat("%Y-%m-%d");
    var bisectDate = d3.bisector(d => d.x).left;
    var formatValue = d3.format(",.0f");

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    data.forEach(function(d) {
        d['y'] = +d['y']
        d['x'] = parseTime(d.x)
        return d
    })
    var data = data.filter(function(d) {
        return (features_active_list.includes(d.group)) ? true: false;
    })
    var y_vals = []
    data.forEach(function(d) {
        if (options.outlier_column != undefined) {
            y_vals.push(+d[options.outlier_column]);
            y_vals.push(+d.y + 2*d[options.std_column]);
            y_vals.push(+d.y - 2*d[options.std_column]);
        }
        y_vals.push(+d.y);
    });

    var xScale = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, width]);

    var nest_data = d3.nest()
        .key(function(d) { return d.group; })
        .entries(data);

    var yScale = d3.scaleLinear()
        .domain(d3.extent(y_vals, function(d) { return d; }))
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); })
        .curve(d3.curveMonotoneX);

    var svg = div.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line").attr("class", "lineHover")
        .style("stroke", "#999")
        .attr("stroke-width", 1)
        .style("shape-rendering", "crispEdges")
        .style("opacity", 0.5)
        .attr("y1", -height)
        .attr("y2",0);

    focus.append("text").attr("class", "lineHoverDate")
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .style("text-shadow", "white 0px 0px 10px");

    var labels = focus.selectAll(".lineHoverText")
        .data(nest_data)

    labels.enter().append("text")
        .attr("class", "lineHoverText")
        .style("fill", "blue") // d => z(d))
        .attr("text-anchor", "start")
        .attr("font-size",12)
        .style("text-shadow", "white 0px 0px 10px")
        .attr("dy", (_, i) => 1 + i * 2 + "em")
        .merge(labels);

    var circles = focus.selectAll(".hoverCircle")
        .data(nest_data)

    circles.enter().append("circle")
        .attr("class", "hoverCircle")
        .style("fill", "blue") // d => z(d))
        .attr("r", 2.5)
        .merge(circles);

    var overlay = g.append("rect")
        .attr("class", "overlay")
        .attr("x", 0)
        .attr("width", width)
        .attr("height", height)

    g.selectAll(".overlay")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", function(d) { return mousemove(this, nest_data); });

    function mousemove(val, nest_data) {

        var x0 = xScale.invert(d3.mouse(val)[0]),
            i = bisectDate(nest_data[0].values, x0, 1),
            d0 = nest_data[0].values[i - 1],
            d1 = nest_data[0].values[i],
            j = x0 - d0.x > d1.x - x0 ? 0 : -1;
            date_val = nest_data[0].values[i+j];

        focus.select(".lineHover")
            .attr("transform", "translate(" + xScale(date_val.x) + "," + height + ")");

        focus.select(".lineHoverDate")
            .attr("transform",
                "translate(" + xScale(date_val.x) + "," + (height + margin.bottom) + ")")
            .text(formatDate(date_val.x));

        focus.selectAll(".hoverCircle")
            .attr("cy", function(e) {return yScale(getY(e)); })
            .attr("cx", xScale(date_val.x));

        focus.selectAll(".lineHoverText")
            .attr("transform",
                "translate(" + (xScale(date_val.x)) + "," + height / 2.5 + ")")
            .text(e => e.key + ": " + formatValue(getY(e)));

        xScale(d.x) > (width - width / 4)
            ? focus.selectAll("text.lineHoverText")
                .attr("text-anchor", "end")
                .attr("dx", -10)
            : focus.selectAll("text.lineHoverText")
                .attr("text-anchor", "start")
                .attr("dx", 10)

        function getY(e) {
            i = bisectDate(e.values, x0, 1)
            d = e.values[i+j]
            return d.y
        }
    }

    g.append("linearGradient")
        .attr("id", "temperature-gradient")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", "100%")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#ffffff"},
            {offset: "50%", color: std_color},
            {offset: "100%", color: "#ffffff"}
        ])
        .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

    var slice = function(d,i,vals) {
        var date = i ? vals[i-1].__data__.x : d.x,
            temp = i ? vals[i-1].__data__.y : d.y,
            stdv = i ? vals[i-1].__data__[options.std_column] : d[options.std_column],
            x0 = xScale(date)
            x1 = xScale(d.x),
            y0min = yScale(temp - 2*stdv),
            y0max = yScale(temp + 2*stdv),
            y1min = yScale(d.y - 2*d[options.std_column]),
            y1max = yScale(d.y + 2*d[options.std_column]);
        return "M" + x0 + "," + y0min +
            "L" + x0 + "," + y0max +
            "L" + x1 + "," + y1max +
            "L" + x1 + "," + y1min +
            "L" + x0 + "," + y0min;
    }

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

    var slices = g.selectAll(".slice.dataset")
        .data(nest_data).enter()
        .append('g')
        .attr("class", "slice dataset");
    slices.selectAll('path')
        .data(function(d) { return d.values; }).enter()
        .append("path")
        .attr('class', 'slice_path')
            .attr("fill", "url(#temperature-gradient)")
            .attr("fill-opacity", "0.4")
            .attr("stroke", "none")
            .attr("d", slice);

    var lines = g.selectAll('.lines')
        .data(nest_data);
    lines.enter().append("path")
        .attr("class", "lines")
        .attr("d", function(d) { return line(d.values); });

    var dot = g.selectAll(".dot")
        .data(data.filter(function(d) {
            return (d.color && d.color != "False") ? true:false;
        }))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return xScale(d.x) })
        .attr("cy", function(d) { return yScale(d[options.outlier_column]) })
        .style("fill", function(d) { return scatter_colors[d.color]; })
        .attr("r", 2.5)
        .on("mouseover", function(a, b, c) {
            // this.attr('class', 'focus');
        });
}

function create_standard_dev_plot(data, div, options) {
    var features_active_list = []
    var features_active = g_component.selectAll(".feature_component.active");
    $.each(features_active._groups[0], function(i, val) {
        features_active_list.push(val.__data__.properties.NAME);
    });

    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var formatDateIntoYear = d3.timeFormat("%m/%d");
    var formatDate = d3.timeFormat("%Y-%m-%d");
    var bisectDate = d3.bisector(d => d.x).left;
    var formatValue = d3.format(".3n");

    var z = d3.scaleOrdinal(d3.schemeCategory10);


    var data = data.filter(function(d) {
        return (features_active_list.includes(d.group)) ? true: false;
    })
    var y_vals = [3, -3]
    data.forEach(function(d) {
        d['y'] = +(d.y - d[options.mean_column]) / d[options.std_column];
        d['x'] = parseTime(d.x);
        y_vals.push(+d.y);
        return d
    });

    var xScale = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, width]);

    var nest_data = d3.nest()
        .key(function(d) { return d.group; })
        .entries(data);

    var yScale = d3.scaleLinear()
        .domain(d3.extent(y_vals, function(d) { return d; }))
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) { return xScale(d.x); })
        .y(function(d) { return yScale(d.y); })
        .curve(d3.curveMonotoneX);

    var svg = div.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line").attr("class", "lineHover")
        .style("stroke", "#999")
        .attr("stroke-width", 1)
        .style("shape-rendering", "crispEdges")
        .style("opacity", 0.5)
        .attr("y1", -height)
        .attr("y2",0);

    focus.append("text").attr("class", "lineHoverDate")
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .style("text-shadow", "white 0px 0px 10px");

    var labels = focus.selectAll(".lineHoverText")
        .data(nest_data)

    labels.enter().append("text")
        .attr("class", "lineHoverText")
        .style("fill", "blue") // d => z(d))
        .attr("text-anchor", "start")
        .attr("font-size",12)
        .style("text-shadow", "white 0px 0px 10px")
        .attr("dy", (_, i) => 1 + i * 2 + "em")
        .merge(labels);

    var circles = focus.selectAll(".hoverCircle")
        .data(nest_data)

    circles.enter().append("circle")
        .attr("class", "hoverCircle")
        .style("fill", "blue") // d => z(d))
        .attr("r", 2.5)
        .merge(circles);

    var overlay = g.append("rect")
        .attr("class", "overlay")
        .attr("x", 0)
        .attr("width", width)
        .attr("height", height)

    g.selectAll(".overlay")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", function(d) { return mousemove(this, nest_data); });

    function mousemove(val, nest_data) {

        var x0 = xScale.invert(d3.mouse(val)[0]),
            i = bisectDate(nest_data[0].values, x0, 1),
            d0 = nest_data[0].values[i - 1],
            d1 = nest_data[0].values[i],
            j = x0 - d0.x > d1.x - x0 ? 0 : -1;
            date_val = nest_data[0].values[i+j];

        focus.select(".lineHover")
            .attr("transform", "translate(" + xScale(date_val.x) + "," + height + ")");

        focus.select(".lineHoverDate")
            .attr("transform",
                "translate(" + xScale(date_val.x) + "," + (height + margin.bottom) + ")")
            .text(formatDate(date_val.x));

        focus.selectAll(".hoverCircle")
            .attr("cy", function(e) {return yScale(getY(e)); })
            .attr("cx", xScale(date_val.x));

        focus.selectAll(".lineHoverText")
            .attr("transform",
                "translate(" + (xScale(date_val.x)) + "," + height / 2.5 + ")")
            .text(e => e.key + ": " + formatValue(getY(e)));

        xScale(d.x) > (width - width / 4)
            ? focus.selectAll("text.lineHoverText")
                .attr("text-anchor", "end")
                .attr("dx", -10)
            : focus.selectAll("text.lineHoverText")
                .attr("text-anchor", "start")
                .attr("dx", 10)

        function getY(e) {
            i = bisectDate(e.values, x0, 1)
            d = e.values[i+j]
            return d.y
        }
    }

    g.append("linearGradient")
        .attr("id", "temperature-gradient2")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", "100%")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#ffffff"},
            {offset: "50%", color: std_color},
            {offset: "100%", color: "#ffffff"}
        ])
        .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

    var slice = function(d,i,vals) {
        var date = i ? vals[i-1].__data__.x : d.x,
            temp = i ? vals[i-1].__data__.y : d.y,
            stdv = i ? vals[i-1].__data__[options.std_column] : d[options.std_column],
            x0 = xScale(date)
            x1 = xScale(d.x),
            y0min = yScale(-2),
            y0max = yScale(2),
            y1min = yScale(-2),
            y1max = yScale(2);
        return "M" + x0 + "," + y0min +
            "L" + x0 + "," + y0max +
            "L" + x1 + "," + y1max +
            "L" + x1 + "," + y1min +
            "L" + x0 + "," + y0min;
    }

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

    var x_start = d3.map(data, function(d) { return d.x; })
    var slices = g.append('g')
        .attr("class", "slice dataset");
    slices.selectAll('path')
        .data(x_start.values()).enter()
        .append("path")
        .attr('class', 'slice_path')
            .attr("fill", "url(#temperature-gradient2)")
            .attr("fill-opacity", "0.4")
            .attr("stroke", "none")
            .attr("d", slice);

    var lines = g.selectAll('.lines')
        .data(nest_data);
    lines.enter().append("path")
        .attr("class", "lines")
        .attr("d", function(d) { return line(d.values); });

    var dot = g.selectAll(".dot")
        .data(data.filter(function(d) {
            return (d.color && d.color != "False") ? true:false;
        }))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return xScale(d.x) })
        .attr("cy", function(d) { return yScale(d.y) })
        .style("fill", function(d) { return scatter_colors[d.color]; })
        .attr("r", 2.5)
        .on("mouseover", function(a, b, c) {
            // this.attr('class', 'focus');
        });
}

function create_overview(data, div, options) {
    var features_active_list = []
    var features_active = g_component.selectAll(".feature_component.active");
    $.each(features_active._groups[0], function(i, val) {
        features_active_list.push(val.__data__.properties.NAME);
    });
    data.sort(function(a,b) {
        return (a.date > b.date) ? 1:-1;
    });
    var last_date = data[data.length-1].date;
    var filtered_data = data.filter(function(d) {
        return (d.date == last_date) ? true: false;
    });

    var rollup = {
        "counties": features_active_list.length,
        "total_counties": data.length,
        "position_total": d3.sum(filtered_data, function(d) { return +d[options['position']]; }),
        "position_score": d3.sum(filtered_data, function(d) { return (features_active_list.includes(d[options['group_column']])) ? +d[options['position']]:0; }),
        "velocity_total": d3.sum(filtered_data, function(d) { return +d[options['velocity']]; }),
        "velocity_score": d3.sum(filtered_data, function(d) { return (features_active_list.includes(d[options['group_column']])) ? +d[options['velocity']]:0; }),
        "acceleration_score": 0,
        "sig_events_count": d3.sum(data, function(d) { return (features_active_list.includes(d[options['group_column']]) && d[options['sig_events']] == "True") ? 1:0; }),
    }

    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var overview_sections = [
        {
            key: 'position',
            values: ['score', 'percent']
        },
        {
            key: 'velocity',
            values: ['score', 'percent']
        },
        {
            key: 'acceleration',
            values: ['score'],
        },
        {
            key: 'sig_events',
            values: ['count']
        },
    ];
    var div_container = div.append('div')
        .attr('id', 'overview_container')
        .attr('class', 'container')
        .attr("width", width + margin.left + margin.right)
        .style("height", height + margin.top + margin.bottom)
        .style('overflow', 'auto')
        .html(function() {
            html_text = "<h2 style='text-align: left'>Selected Counties</h2><h4><ol style='text-align: left'>";
            features_active_list.forEach(function(val) {
                html_text += '<li>' + val + '</li>';
            })
            html_text += '</ol></h4>';
            return html_text;
        });


    d3.select('#overview_container.container').selectAll('section')
        .data(overview_sections).enter()
        .append('section')
            .attr('class', 'row')
            .style('height', '50px')
            .attr('id', function(d) {
                return d.key;
            })
            .text(function(d) { return d.key + ': '; })
            .selectAll('p')
            .data(function(d) {
                return d.values;
            }).enter()
            .append('p')
                .attr('class', function(d) { return d; })
                .text(function(d) {
                    var parentID = this.parentElement.id;
                    if (d == "percent") {
                        return d + ': ' + rollup[parentID+'_score'] / rollup[parentID+'_total'] + '\t'
                    } else {
                        return d + ': ' + rollup[parentID+'_'+d] + '\t'
                    }
                })

        // .data(overview_sections).enter()
        // .append('svg')
        //     .attr('class', function(d,i) { return (i % 2 == 0) ? 'row bg-primary':'row bg-secondary'})
        //     .attr('height', '50px');

    // svg.append('div').html('Total, ' +
    //     '% of state total (has this state been hit harder than others)');
    // svg.append('div').html('Veocity (going up, going down, neutral), ' +
    //     '% of state velocity (how much does this contrinute to the states new cases)');
    // svg.append('div').html('Acceleration (going up, going down, neutral), ' +
    //     '% of state velocity (how much does this contrinute to the states new cases)');
    // svg.append('div').html('Significant Events, ' +
    //     '(ositive significant events, negative significant events)');
}

function create_plot(data, div, options) {
    return "<p>Placeholder</p>"
}

function get_data(div, options) {
    var page_opened = false;
    var visuals = Object.keys(options);
    var visuals_only = [];
    $(visuals).each(function(i, vis) {
        if (typeof options[vis] == "object") {
            visuals_only.push(vis);
        }
    });
    if (visuals_only.length > 0) {
        $(visuals_only).each(function (i, vis) {
            var visual_options = options[vis];

            div.append('button')
                .attr('class', 'tablink')
                .style("backgroundColor", function (d, i) { return (i == 0) ? "grey":""; })
                .attr('id', vis + 'button')
                .attr('onclick', "openPage('" + vis + "')")
                .style('width', (1 / visuals_only.length) * 100 + "%")
                .text(visual_options.name);
        });
    }
    $(visuals_only).each(function(i, vis) {
        var visual_options = options[vis];
        visual_options.id = vis;

        if (visual_options.csv != undefined) {
            get_csv(visual_options);
        } else if (visual_options.json != undefined) {
            get_json(visual_options);
        } else if (visual_options.api != undefined) {
            get_api(visual_options)
        }
    });

    function get_api(options) {
        if (options.send_request != undefined) {
            send_request = options.send_request
        } else {
            send_request = {}
        }
        fetch(options.api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(send_request)
        })
            .then(r => r.json())
            .then(function(data){
                data = data['data']['query'];
                data.forEach(function(d) {
                    var d = html_get_data(d, options);
                    if (d != false) { return d; }
                });
                html_create(data, options); })
            .catch(function(error) {
                console.log("error loading api data");
                console.error
            });
    }
    function get_csv(options) {
        d3.csv(options.csv, function (d) {
            d = html_get_data(d, options);
            if (d != false) { return d; }
        }, function (data) {
            html_create(data, options);
        });
    }
    function get_json(options) {
        d3.json(options.json, function (d) {
            d = html_get_data(d, options);
            if (d != false) { return d; }
        }, function (data) {
            html_create(data, options);
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
    function html_create(data, options) {
        var vis_div = div.append('div')
            .attr('class', 'tabcontent')
            .attr('id', options.id)
            .style('display', 'none')

        // if a custom visual function is specified
        if (typeof options.type == "function") {
            options.type(data, vis_div, options);
        } else {
            switch(options.type) {
                case "circle_packing":
                    create_plot(data, vis_div, options);
                    break;
                case "force_directed":
                    create_plot(data, vis_div, options);
                    break;
                case "scatter":
                    create_plot(data, vis_div, options);
                    break;
                case "stacked_bar":
                    create_stacked_bar_plot(data, vis_div, options);
                    break;
                case "line":
                    create_line_plot(data, vis_div, options);
                    break;
                case "area":
                    create_area_plot(data, vis_div, options);
                    break;
                case "standard_dev":
                    create_standard_dev_plot(data, vis_div, options);
                    break;
                default:
                    create_plot(data, vis_div, options);
            }

            var svg_ids = [];
            $('div.tooltip div').each(function(i, d) {
                if (svg_ids.includes(this.id)) { $(this).remove();
                } else { svg_ids.push(this.id); }
            });
        }
        if (page_opened == false) {
            openPage(options.id);
            page_opened = true;
        }
    }
}

function openPage(pageName) {
    $(".tabcontent").each(function() {
        $(this).hide();
    });

    $(".tablink").each(function() {
        $(this).css('backgroundColor', "");
    });
    $("#" + pageName + "button").css("backgroundColor", "grey");
    $("#" + pageName).show();
}
