function JSONstatD3BarChart(options) {
    // Required options check.
    if(!options.x) console.log('Error: no x dimension option specified.');
    if(!options.y) console.log('Error: no y dimension option specified.');
 
    // Default options.
    options.title = options.title || 'Untitled chart';
    options.width = options.width || 660;
    options.height = options.height || 350;
    options.margin = options.margin || { top: 40, right: 70, bottom: 50, left: 50 };
    options.colors = options.colors || ["#f59a54","#4e9b9d","#88608b","#cb9f20","#c68bc6"]
    if(options.xSpacing === undefined) options.xSpacing = 10;
    if(options.animate === undefined) options.animate = true;
    if(options.dataset === undefined) options.dataset = 0;

    var _ds = options.data.Dataset(options.dataset);
    var _tgt = options.target;
    var x0 = d3.scaleBand();
    var x1 = d3.scaleBand();
    var y = d3.scaleLinear();
    var xAxis = d3.axisBottom();
    var yAxis = d3.axisLeft();
    var svg = d3.select(options.target).append("svg");
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

    // Create a filter with valid default values
    function createDefaultFilter() {
        var filter = {};
        _ds.Dimension().map(d => {
            if((d.label != options.x) && (d.label != options.z)) {
                // Maintain existing filter value if possible.
                if((options.filter !== undefined) && (options.filter[d.label] != null)) filter[d.label] = options.filter[d.label];
                else filter[d.label] = d.id[0]; // Use first value.
            }
            else filter[d.label] = null; // x and y dimensions are discarded from filter.
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
        var xNames = _ds.Dimension(options.x).id;
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

        var color = d3.scaleOrdinal()
            .range(options.colors);

        x0.domain(xNames);
        
        x1.domain(zNames)
            .range([options.xSpacing, x0.bandwidth()-options.xSpacing]);

        y.domain([0, maxValue()]);

        svg.attr("width", options.width + options.margin.left + options.margin.right)
            .attr("height", chartHeight + options.margin.top + options.margin.bottom);

        svg_g_xaxis.attr("transform", "translate(0," + chartHeight + ")")

        var t = d3.transition().duration(500);
        svg_g_xaxis.call(xAxis);
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
            .attr("transform", d => "translate(" + x0(d) + ",0)");

        var rects = svg_g.selectAll(".slice").selectAll('rect')
            .data(function(x) {
                if(!hasZ) return [{ x: x, z: x, value: dsValue(x, x) }];
                else return _ds.Dimension(options.z).id.map(function (z) {
                    return { x: x, z: z, value: dsValue(x, z) };
                });
            })
            .enter().append("rect")
                .attr("y", d => options.animate? y(0) : y(d.value))
                .attr("height", d => options.animate? 0 : chartHeight - y(d.value));

        var rects = svg_g.selectAll('.slice rect');

        if(hasZ) { // Multiple bars per slice.
            rects.attr("width", x1.bandwidth())
                .attr("x", d => x1(d.z))
                .style("fill", d => color(d.z));
        }
        else { // Just one bar per slice.
            rects.attr('width', x0.bandwidth() - (options.xSpacing * 2))
                .attr('x', options.xSpacing)
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
            .attr('x', options.width - 24)
            .attr('y', -10);

        svg_g.selectAll(".legend")
            .data(zNames)
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

        // text label for the x axis
        svg_g.selectAll('.x-axis-label').data([_ds.Dimension(options.x)]).enter()
            .append("text")
            .style("text-anchor", "middle")
            .attr('class', 'x-axis-label');

        svg_g.selectAll('.x-axis-label')
            .attr("x", (options.width - options.margin.left - options.margin.right)/2)
            .attr('y', options.height - options.margin.bottom)
            .text(f => f.label);
        
        // text label for the y axis
        svg_g.selectAll('.y-axis-label').data([_ds.Dimension(options.y)]).enter()
            .append("text")
            .style("text-anchor", "middle")
            .style('writing-mode', 'tb')
            .style("glyph-orientation-vertical", "90")
            .attr('class', 'y-axis-label');

        svg_g.selectAll('.y-axis-label')
            .attr("x", 0 - options.margin.left + 10)
            .attr('y', chartHeight / 2)
            .text(f => f.Category(options.filter[options.y]).label + ' (' + _ds.Dimension(options.y).label + ')');
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