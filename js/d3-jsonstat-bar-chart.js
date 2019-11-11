function d3jsbc(options) {
    // Required options check.
    if(!options.x) console.log('Error: no x dimension option specified.');
    if(!options.y) console.log('Error: no y dimension option specified.');
 
    // Default options.
    options.title = options.title || 'Untitled chart';
    options.width = options.width || 660;
    options.height = options.height || 350;
    options.margin = options.margin || { top: 40, right: 150, bottom: 100, left: 100 };
    options.colors = options.colors || ["#f59a54","#4e9b9d","#88608b","#cb9f20","#c68bc6"]
    options.legendPadding = options.legendPadding || 50;

    if(options.zSpacing === undefined) options.zSpacing = 10;
    if(options.animate === undefined) options.animate = true;
    if(options.dataset === undefined) options.dataset = 0;

    var _ds = options.data.Dataset(options.dataset);
    var x0 = d3.scaleBand();
    var x1 = d3.scaleBand();
    var y = d3.scaleLinear();
    var xAxis = d3.axisBottom();
    var yAxis = d3.axisLeft();
    var svg = d3.select('#' + options.target).append("svg");
    var svg_g = svg.append("g");
    var svg_g_title = svg_g.append('text')
        .attr('class', 'chart-title');
    var svg_g_legend_title = svg_g.append('text')
        .attr('class', 'legend-title')
        .style('text-anchor', 'end');
    var svg_g_xaxis = svg_g.append("g")
        .attr("class", "x axis");
    var svg_g_yaxis = svg_g.append("g")
        .attr("class", "y axis");

    function handleBarMouseOver(d, i) {
        svg.selectAll('.chart-bar').classed('chart-bar-inactive', true);
        svg.selectAll('.legend').classed('chart-legend-inactive', true);
        svg.select('.legend-' + i)
            .classed('chart-legend-mouseover', true)
            .classed('chart-legend-inactive', false);

        d3.select(this)
            .classed('chart-bar-mouseover', true)
            .classed('chart-bar-inactive', false);

        if(options.events && options.events.bar &&
            options.events.bar.mouseOver) options.events.bar.mouseOver(d, i, this);
    }

    function handleBarMouseOut(d, i) {
        svg.selectAll('.chart-bar').classed('chart-bar-inactive', false);
        svg.selectAll('.legend').classed('chart-legend-inactive', false);
        svg.select('.legend-' + i).classed('chart-legend-mouseover', false);
        d3.select(this).classed('chart-bar-mouseover', false);

        if(options.events && options.events.bar &&
            options.events.bar.mouseOut) options.events.bar.mouseOut(d, i, this);
    }

    function handleBarClick(d, i) {
        if(options.events && options.events.bar &&
            options.events.bar.click) options.events.bar.click(d, i, this);
    }

    function handleLegendMouseOver(d, i) {
        svg.selectAll('.legend').classed('chart-legend-inactive', true);
        d3.select(this)
            .classed('chart-legend-inactive', false)
            .classed('chart-legend-mouseover', true);
        svg.selectAll('.chart-bar').classed('chart-bar-inactive', true);
        svg.selectAll('.chart-bar-' + i)
            .classed('chart-bar-mouseover', true)
            .classed('chart-bar-inactive', false);

        if(options.events && options.events.legendItem &&
            options.events.legendItem.mouseOver) options.events.legendItem.mouseOver(d, i, this);
    }

    function handleLegendMouseOut(d, i) {
        d3.select(this).classed('chart-legend-mouseover', false);
        svg.selectAll('.legend').classed('chart-legend-inactive', false);
        svg.selectAll('.chart-bar').classed('chart-bar-inactive', false);
        svg.selectAll('.chart-bar-' + i).classed('chart-bar-mouseover', false);

        if(options.events && options.events.legendItem &&
            options.events.legendItem.mouseOut) options.events.legendItem.mouseOut(d, i, this);
    }

    function handleLegendClick(d, i) {
        if(options.events && options.events.legendItem &&
            options.events.legendItem.click) options.events.legendItem.click(d, i, this);
    }

    function handleXAxisTitleMouseOver(d) {
        if(options.events && options.events.xAxisTitle &&
            options.events.xAxisTitle.mouseOver) options.events.xAxisTitle.mouseOver(d, this);
    }
    function handleXAxisTitleMouseOut(d) {
        if(options.events && options.events.xAxisTitle &&
            options.events.xAxisTitle.mouseOut) options.events.xAxisTitle.mouseOut(d, this);
    }
    function handleXAxisTitleClick(d) {
        if(options.events && options.events.xAxisTitle &&
            options.events.xAxisTitle.click) options.events.xAxisTitle.click(d, this);
    }
    function handleYAxisTitleMouseOver(d) {
        if(options.events && options.events.yAxisTitle &&
            options.events.yAxisTitle.mouseOver) options.events.yAxisTitle.mouseOver(d, this);
    }
    function handleYAxisTitleMouseOut(d) {
        if(options.events && options.events.yAxisTitle &&
            options.events.yAxisTitle.mouseOut) options.events.yAxisTitle.mouseOut(d, this);
    }
    function handleYAxisTitleClick(d) {
        if(options.events && options.events.yAxisTitle &&
            options.events.yAxisTitle.click) options.events.yAxisTitle.click(d, this);
    }
    function handleLegendTitleMouseOver() {
        if(options.events && options.events.legendTitle &&
            options.events.legendTitle.mouseOver) options.events.legendTitle.mouseOver(_ds.Dimension(options.z), this);
    }
    function handleLegendTitleMouseOut() {
        if(options.events && options.events.legendTitle &&
            options.events.legendTitle.mouseOut) options.events.legendTitle.mouseOut(_ds.Dimension(options.z), this);
    }
    function handleLegendTitleClick() {
        if(options.events && options.events.legendTitle &&
            options.events.legendTitle.click) options.events.legendTitle.click(_ds.Dimension(options.z), this);
    }

    // Create a filter with valid default values
    function createDefaultFilter() {
        var filter = {};
        _ds.id.map(d => {
            if((d != options.x) && (d != options.z)) {
                // Maintain existing filter value if possible.
                if((options.filter !== undefined) && (options.filter[d] != null)) filter[d] = options.filter[d];
                else filter[d] = _ds.Dimension(d).id[0]; // Use first value.
            }
            else filter[d] = null; // x and y dimensions are discarded from filter.
        });

        return filter;
    }

    if(options.filter === undefined || options.filter == null) options.filter = createDefaultFilter();

    var dirtySlices = false;

    function redraw() {
        _ds = options.data.Dataset(options.dataset);
        var hasZ = (options.x != options.z);

        if(options.filter === undefined || options.filter == null) options.filter = createDefaultFilter();

        var chartHeight = options.height - options.margin.top - options.margin.bottom;
        var xNames = _ds.Dimension(options.x).Category().map(d => d.label);
        var zNames = _ds.Dimension(options.z).id;
        
        // Get a list of all values
        function allValues() {
            var filter = JSON.parse(JSON.stringify(options.filter));;
            var values = [];
            var xDim = _ds.Dimension(options.x);

            // Scale data values over entire range of a given dimension.
            var scaleOver = [];
            if(options.scaleToFitDimension) {
                scaleOver = _ds.Dimension(options.scaleToFitDimension).id;
            }
            else scaleOver.push(''); // Dummy entry.

            for(var k = 0; k < scaleOver.length; k++) {
                if(options.scaleToFitDimension) filter[options.scaleToFitDimension] = scaleOver[k];

                // Loop through x
                for(var i = 0; i < xDim.length; i++) {
                    filter[options.x] = xDim.id[i];

                    var zDim = _ds.Dimension(options.z);

                    // Loop through z
                    for(var j = 0; j < zDim.length; j++) {
                        filter[options.z] = zDim.id[j];
                        values.push(_ds.Data(filter).value);
                    }
                }
            }

            return values;
        }

        // Find the maximum data value
        function maxValue() {
            // Return maximum of values
            return d3.max(allValues());
        }

        // Retrieve a value from the data for a given x and y dimension value.
        function dsValue(x, z) {
            options.filter = options.filter || createDefaultFilter();
            options.filter[options.x] = x;
            options.filter[options.z] = z;

            var value = _ds.Data(options.filter).value;
            return value;
        }

        svg_g_title.text(options.title)
            .attr('x', 0 - options.margin.left)
            .attr('y', 0 - options.margin.top / 2);

        svg_g.attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

        x0.range([0, options.width - options.margin.left - options.margin.right])
            .round(.1);

        y.range([chartHeight, 0]);

        xAxis.scale(x0)
            .tickSize(5);

        yAxis.scale(y);

        // Apply formatting to the values on the Y-Axis.
        if(options.yAxisFormat !== undefined) yAxis.tickFormat(d3.format(options.yAxisFormat));

        var color = d3.scaleOrdinal()
            .range(options.colors);

        x0.domain(xNames);
        
        x1.domain(zNames)
            .range([options.zSpacing, x0.bandwidth()-options.zSpacing]);

        y.domain([0, maxValue()]);

        svg.attr("width", options.width + options.margin.left + options.margin.right)
            .attr("height", chartHeight + options.margin.top + options.margin.bottom);

        svg_g_xaxis.attr("transform", "translate(0," + chartHeight + ")")

        var t = d3.transition().duration(500);
        svg_g_xaxis.call(xAxis)
            .selectAll("text")
                .attr("y", 0)
                .attr("x", 9)
                .attr("transform", "rotate(45)")
                .style("text-anchor", "start");;
        svg_g_yaxis.call(yAxis);

        // When slices are dirty, bars and legend need to be removed.
        if(dirtySlices) {
            svg_g.selectAll('.slice').remove();
            svg_g.selectAll('.legend').remove();
            dirtySlices = false; // Slices are ok.
        }

        svg_g.selectAll(".slice")
            .data(_ds.Dimension(options.x).id)
            .enter().append("g")
                .attr("class", "slice");
        
        svg_g.selectAll('.slice')
            .attr("transform", d => "translate(" + x0(_ds.Dimension(options.x).Category(d).label) + ",0)");

        var rects = svg_g.selectAll(".slice").selectAll('rect')
            .data(function(x) {
                if(!hasZ) return [{ x: x, z: x, value: dsValue(x, x) }];
                else return _ds.Dimension(options.z).id.map(function (z) {
                    return { x: x, z: z, value: dsValue(x, z) };
                });
            })
            .enter().append("rect")
                .attr('class', (d, i) => 'chart-bar chart-bar-' + i, true)
                .attr("y", d => options.animate? y(0) : y(d.value))
                .attr("height", d => options.animate? 0 : chartHeight - y(d.value))
                .on("mouseover", handleBarMouseOver)
                .on("mouseout", handleBarMouseOut)
                .on('click', handleBarClick);

        var rects = svg_g.selectAll('.slice rect');

        if(hasZ) { // Multiple bars per slice.
            rects.attr("width", x1.bandwidth())
                .attr("x", d => x1(d.z))
                .style("fill", d => color(d.z));
        }
        else { // Just one bar per slice.
            rects.attr('width', x0.bandwidth() - (options.zSpacing * 2))
                .attr('x', options.zSpacing)
                .style("fill", d => color(d.z));
        }

        if(options.animate) {
            rects.transition(t)
                .attr("y", d => y(d.value))
                .attr("height", d => chartHeight - y(d.value));
        }
        else {
            rects.attr("y", d => y(d.value))
                .attr("height", d => chartHeight - y(d.value));
        }

        // Legend
        svg_g_legend_title.text(_ds.Dimension(options.z).label)
            .attr('x', options.width - options.margin.right - options.margin.left + options.legendPadding)
            .attr('y', -10)
            .style("text-anchor", "start")
            .on('mouseover', handleLegendTitleMouseOver)
            .on('mouseout', handleLegendTitleMouseOut)
            .on('click', handleLegendTitleClick);

        svg_g.selectAll(".legend")
            .data(zNames)
                .enter()
                .append("g")
                    .attr("class", (d, i) => "legend legend-" + i)
                    .on('mouseover', handleLegendMouseOver)
                    .on('mouseout', handleLegendMouseOut)
                    .on('click', handleLegendClick);

        svg_g.selectAll('.legend').append("rect")
            .attr('class', 'legend-key')
            .attr("width", 20)
            .attr("height", 20);

        svg_g.selectAll('.legend').append("text")
            .attr('class', 'legend-text')
            .attr("dy", ".35em")
            .attr("y", 9);

        svg_g.selectAll('.legend-key')
            .attr("x", options.width - options.margin.right - options.margin.left + options.legendPadding)
            .style("fill", d => color(d));

        svg_g.selectAll('.legend-text')
            .attr("x", options.width - options.margin.right - options.margin.left + options.legendPadding + 24)
            .attr("height", 20)
            .text(d => _ds.Dimension(options.z).Category(d).label);
        
        svg_g.selectAll('.legend')
            .attr("transform", function(d,i) { return "translate(0," + (i * 20) + ")"; });

        // text label for the x axis
        svg_g.selectAll('.x-axis-title').data([_ds.Dimension(options.x)]).enter()
            .append("text")
            .style("text-anchor", "middle")
            .attr('class', 'x-axis-title');

        svg_g.selectAll('.x-axis-title')
            .attr("x", (options.width - options.margin.left - options.margin.right)/2)
            .attr('y', options.height - 50)
            .text(f => f.label)
            .on('mouseover', handleXAxisTitleMouseOver)
            .on('mouseout', handleXAxisTitleMouseOut)
            .on('click', handleXAxisTitleClick);
        
        // text label for the y axis
        svg_g.selectAll('.y-axis-title').data([_ds.Dimension(options.y)]).enter()
            .append("text")
            .style("text-anchor", "middle")
            .style('writing-mode', 'tb')
            .style("glyph-orientation-vertical", "90")
            .attr('class', 'y-axis-title');

        svg_g.selectAll('.y-axis-title')
            .attr("x", 0 - options.margin.left + 10)
            .attr('y', chartHeight / 2)
            .text(f => f.Category(options.filter[options.y]).label + ' (' + _ds.Dimension(options.y).label + ')')
            .on('mouseover', handleYAxisTitleMouseOver)
            .on('mouseout', handleYAxisTitleMouseOut)
            .on('click', handleYAxisTitleClick);
    }

    function setX(x) {
        if(x == options.x) return false;
        if(x == options.y) options.y = options.x; // Swap into y.
        if(x == options.z) options.z = options.x; // Swap into z.
        if(options.x == options.z) options.z = x; // Syncronize.
        options.x = x;
        dirtySlices = true; // Bars need to be removed on next redraw.
        options.filter = createDefaultFilter();
        return true;
    }

    function setY(y) {
        if(y == options.y) return false;
        if(y == options.x) options.x = options.y; // Swap into x.
        if(y == options.z) options.z = options.y; // Swap into z.
        options.y = y;
        options.filter = createDefaultFilter();
        dirtySlices = true; // Potential change to x, so bars need to be removed.
        return true;
    }

    function setZ(z) {
        if(z == null) options.z = options.x;
        else {
            if(z == options.z) return false;
            if(z == options.x) {
                if(options.z != options.x) options.x = options.z; // Swap into x.
                else return false; // Cannot take y.
            }
            if(z == options.y) {
                if(options.z != options.y && options.x != options.z) options.y = options.z; // Swap into y.
                else return false; // Cannot take x.
            }

            options.z = z;
        }

        options.filter = createDefaultFilter();
        dirtySlices = true; // Potential change to x, so bars need to be removed.
        return true;
    }

    redraw();

    return {
        redraw: redraw,
        options: options,
        setX: setX,
        setY: setY,
        setZ: setZ
    };
}