function JSONstatD3BarChart(options) {
    // Default options.
    options.margin = options.margin || { top: 30, right: 70, bottom: 20, left: 30 };
    options.colors = options.colors || ["#ca0020","#f4a582","#d5d5d5","#92c5de","#0571b0"]
    if(options.xSpacing === undefined) options.xSpacing = 10;
    if(options.animate === undefined) options.animate = true;

    var _ds = options.data.Dataset(0);
    var _tgt = options.target;
    var chartHeight = options.height - options.margin.top - options.margin.bottom;

    function draw() {
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

        var x0 = d3.scaleBand()
            .range([0, options.width - options.margin.left - options.margin.right])
            .round(.1);

        var y = d3.scaleLinear()
            .range([chartHeight, 0]);

        var xAxis = d3.axisBottom()
            .scale(x0)
            .tickSize(5);

        var yAxis = d3.axisLeft()
            .scale(y);

        var color = d3.scaleOrdinal()
            .range(options.colors);

        x0.domain(xNames);
        
        var x1 = d3.scaleBand()
            .domain(yNames)
            .range([options.xSpacing, x0.bandwidth()-options.xSpacing]);

        y.domain([0, d3.max(_ds.value)]);

        var svg = d3.select(options.target).append("svg")
        .attr("width", options.width + options.margin.left + options.margin.right)
        .attr("height", chartHeight + options.margin.top + options.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + chartHeight + ")")
        .call(xAxis);

        svg.append("g")
        .attr("class", "y axis")
        .style('opacity','1')
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style('font-weight','bold')
        .text("Value");

        var slice = svg.selectAll(".slice")
        .data(_ds.Dimension(options.x).id)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", d => "translate(" + x0(d) + ",0)");

        slice.selectAll("rect")
        .data(function(x) {
            return _ds.Dimension(options.y).id.map(function (y) {
                return { x: x, y: y, value: dsValue(x, y) };
            });
            })
            .enter().append("rect")
            .attr("width", x1.bandwidth())
            .attr("x", d => x1(d.y))
            .style("fill", d => color(d.y))
            .attr("y", d => options.animate? y(0) : y(d.value))
            .attr("height", d => options.animate? 0 : chartHeight - y(d.value));

        if(options.animate) {
            slice.selectAll("rect")
                .transition()
                .delay(500)
                .duration(1000)
                .attr("y", d => y(d.value))
                .attr("height", d => chartHeight - y(d.value));
        }

        slice.exit().remove();
        
        // Legend
        var legend = svg.selectAll(".legend")
            .data(yNames)
                .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d,i) { return "translate(0," + (i * 20) + ")"; });

        legend.append("rect")
            .attr("x", options.width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", d => color(d));

        legend.append("text")
            .attr("x", options.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(d => d);
    }

    function refresh() {
        
    }

    draw();

    return {
        refresh: refresh,
        options: options
    };
}