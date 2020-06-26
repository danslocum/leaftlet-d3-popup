// slider global variables
var currentValue, targetValue, timeScale, slider, handle, label, timer;

var formatDate = d3.timeFormat("%b %d %Y");
var parseDate = d3.timeParse("%m/%d/%y");
var formatDateIntoYear = d3.timeFormat("%m/%d");

var moving = false;
var slider_margin = {left:100, right:100, top:10, bottom:0};
var slider_height = 100 - slider_margin.top - slider_margin.bottom;

var slider_svg = d3.select("#slider")
    .append("svg")
    .attr("width", "100%")
    .attr("height", slider_height + slider_margin.top + slider_margin.bottom);

function createSlider(dataset) {
    var startDate = d3.min(dataset, function(d) { return d.date;});
    var endDate = d3.max(dataset, function(d) { return d.date;});

    var slider_width = document.getElementById("slider").getElementsByTagName("svg")[0].width.baseVal.value - slider_margin.left - slider_margin.right;
    currentValue = slider_width;
    targetValue = slider_width;
    timeScale = d3.scaleTime().range([0, targetValue]).clamp(true);

    slider = slider_svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + slider_margin.left + "," + slider_height/2 + ")");

    timeScale.domain([startDate, endDate]);

    slider.append("line")
        .attr("class", "track")
        .attr("x1", timeScale.range()[0])
        .attr("x2", timeScale.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(
            d3.drag()
                .on("start.interrupt", function() { slider.interrupt(); })
                .on("start drag", function() {
                    currentValue = d3.event.x;
                    update_slider(timeScale.invert(currentValue));
                })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "slider-ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(timeScale.ticks(10))
        .enter().append("text")
        .attr("x", timeScale)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDateIntoYear(d); });

    handle = slider.insert("circle", ".track-overlay")
        .attr("class", "slider-handle")
        .attr('cx', currentValue)
        .attr("r", 9);

    label = slider.append("text")
        .attr("class", "slider-label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + (-25) + ")")
}

function update_slider(h){
    // update position and text of label according to slider scale
    handle.attr("cx", timeScale(h));
    label.attr("x", timeScale(h)).text(formatDate(h));
    // filter data set and redraw plot
    createPlot(5)
}

function step() {
    update_slider(timeScale.invert(currentValue));
    createPlot();
    currentValue = currentValue + (targetValue/151);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = targetValue;
        clearInterval(timer);
        d3.select("#play").text("Play");
    }
}

d3.select("#play").on("click", function() {
    var button = d3.select(this);
    if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        button.text("Play");
    } else {
        moving = true;
        if (currentValue == targetValue) { currentValue = 0; }
        timer = setInterval(step, 100);
        button.text("Pause");
    }
});