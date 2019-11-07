function JSONstatD3BarChart(options) {
    // Default options.
    options.margin = options.margin || { top: 30, right: 70, bottom: 20, left: 30 };
    options.colors = options.colors || ["#ca0020","#f4a582","#d5d5d5","#92c5de","#0571b0"]
    if(options.xSpacing === undefined) options.xSpacing = 10;
    if(options.animate === undefined) options.animate = true;

    var _tgt = options.target;
    var x0 = d3.scaleBand();
    var x1 = d3.scaleBand();
    var y = d3.scaleLinear();
    var xAxis = d3.axisBottom();
    var yAxis = d3.axisLeft();
    var svg = d3.select(options.target).append("svg");
    var svg_g = svg.append("g");
    var svg_g_xaxis = svg_g.append("g")
        .attr("class", "x axis");
    var svg_g_yaxis = svg_g.append("g")
        .attr("class", "y axis");

    function redraw() {
        var _ds = options.data.Dataset(0);
        var chartHeight = options.height - options.margin.top - options.margin.bottom;
        var xNames = _ds.Dimension(options.x).id;
        var yNames = _ds.Dimension(options.y).id;
        
        // Retrieve a value from the data for a given x and y dimension value.
        function dsValue(x, y) {
            var filter = {};
            filter[options.x] = x;
            filter[options.y] = y;

            var value = _ds.Data(filter).value;

            console.log({ filter: filter, value: value });
            return value;
        }

        svg_g.attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

        x0.range([0, options.width - options.margin.left - options.margin.right])
            .round(.1);

        y.range([chartHeight, 0]);

        xAxis.scale(x0)
            .tickSize(5);

        yAxis.scale(y);

        var color = d3.scaleOrdinal()
            .range(options.colors);

        x0.domain(xNames);
        
        x1.domain(yNames)
            .range([options.xSpacing, x0.bandwidth()-options.xSpacing]);

        y.domain([0, d3.max(_ds.value)]);

        svg.attr("width", options.width + options.margin.left + options.margin.right)
            .attr("height", chartHeight + options.margin.top + options.margin.bottom);

        svg_g_xaxis.attr("transform", "translate(0," + chartHeight + ")")

        var t = d3.transition().duration(500);
        svg_g_xaxis.call(xAxis);
        svg_g_yaxis.call(yAxis);

        svg_g.selectAll(".slice")
            .data(_ds.Dimension(options.x).id)
            .enter().append("g")
                .attr("class", "slice");
        
        svg_g.selectAll('.slice')
            .attr("transform", d => "translate(" + x0(d) + ",0)");

        var rects = svg_g.selectAll(".slice").selectAll('rect')
            .data(function(x) {
                return _ds.Dimension(options.y).id.map(function (y) {
                    return { x: x, y: y, value: dsValue(x, y) };
                });
            })
            .enter().append("rect")
                .attr("y", d => options.animate? y(0) : y(d.value))
                .attr("height", d => options.animate? 0 : chartHeight - y(d.value));

        var rects = svg_g.selectAll('.slice rect');

        rects.attr("width", x1.bandwidth())
            .attr("x", d => x1(d.y))
            .style("fill", d => color(d.y));

        if(options.animate) {
            rects.transition(t)
                .attr("y", d => y(d.value))
                .attr("height", d => chartHeight - y(d.value));
        }
        else {
            rects.attr("y", d => y(d.value))
                .attr("height", d => chartHeight - y(d.value));
        }

        rects.exit().remove();
        
        // Legend
        var legend_enter = svg_g.selectAll(".legend")
            .data(yNames)
                .enter()
                .append("g")
                    .attr("class", "legend");

        svg_g.selectAll('.legend').append("rect")
            .attr('class', 'legend-key')
            .attr("width", 18)
            .attr("height", 18)

        svg_g.selectAll('.legend').append("text")
            .attr('class', 'legend-text')
            .attr("dy", ".35em")
            .attr("y", 9)
            .style("text-anchor", "end");

        svg_g.selectAll('.legend-key')
            .attr("x", options.width - 18)
            .style("fill", d => color(d));

        svg_g.selectAll('.legend-text')
            .attr("x", options.width - 24)
            .text(d => d);
        
        svg_g.selectAll('.legend')
            .attr("transform", function(d,i) { return "translate(0," + (i * 20) + ")"; });
    }

    redraw();

    return {
        refresh: redraw,
        options: options
    };
}