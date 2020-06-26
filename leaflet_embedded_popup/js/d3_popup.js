function create_stacked_bar_plot(data, div, features, options) {
    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var parseTime = d3.timeParse("%Y-%m-%d");
    var formatDateIntoYear = d3.timeFormat("%m/%d");

    data.forEach(function(d) {
        d['y'] = +d['y']
        d['x'] = parseTime(d.x)
        return d
    })

    var nest = d3.nest()
        .key(function(d) { return d.x; })
        .entries(data);

    var keys = d3.nest()
        .key(function(d) { return d.group; })
        .entries(data)
        .map(function(d) { return d.key; })
        .sort(function(a, b) {
            if (a.includes(features.NAME)) { return -1;
            } else if (b.includes(features.NAME)) { return 1;
            } else { return 0; }
        })

    nest.forEach(function(d) {
        vals = d.values;
        vals.forEach(function(v) { d[v.group] = v.y; });
        keys.forEach(function(v) { if (d[v] == undefined) { d[v] = 0; }});
        return d
    });

    var dataset = d3.stack().keys(keys)(nest);

    x_vals = d3.nest()
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

    var xScale = d3.scaleBand()
        .domain(x_vals.map(function(d){ return formatDateIntoYear(d.values[0].x); }))
        .rangeRound([0, width])
        .padding(0);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(totals, function(d) { return d.value.total; })])
        .nice()
        .range([height, 0]);

    var svg = div.append('div')
        .attr('class', 'tabcontent')
        .attr('id', options.id)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
                .tickValues(xScale.domain().filter(function(d, i) { return !(i % 10);}))
            // .tickFormat(function(d) { return d.split("-")[0] })
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    var y = g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

    var groups = g.selectAll("g.layer")
        .data(dataset, function(d) { return d; })
        .enter().append('g')
        .attr('class', 'layer')
        .style("fill", function(d,i) { return (d.key.includes(features.NAME)) ? "lightgreen":"lightgrey"; });

    var rect = groups.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .style("stroke", "lightgrey")
        .attr("x", function(d, i) { return xScale(formatDateIntoYear(d.data.values[0].x)); })
        .attr("y", function(d) { return yScale(d[1]); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
        .on("mouseover", function() {
            tooltip.style("display", null); })
        .on("mouseout", function() {
            tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(d.y);
        });
    return div
}

function create_line_plot(data, options) {
    var margin = {top: 25, right: 25, bottom: 50, left: 50},
        width = Math.min(options.maxWidth, options.width) - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    var nest = d3.nest()
        .key(function(d) { return d.x; })
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

    var svg = d3.select("body")
        .append("div")
        .attr('id', 'placeholder')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    $('#placeholder.svg').hide();

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

function create_plot() {
    return "<p>Placeholder</p>"
}