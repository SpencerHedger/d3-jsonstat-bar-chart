# d3-jsonstat-bar-chart
This is a (moderately) simple grouped bar chart. Once configured with data and
options, the x-axis, y-axis and z-axis (optionally for grouping) can be changed
at run-time and the chart redrawn to reflect changes.

Feedback on events is available for a range of interactions, and key elements of
the bar chart have CSS classes assigned to enable customisation.

![Screenshot](docs/images/example.png)

## Example
The file `example.htm` contains a working example with data from an API (in this
case the Nomis API) and also from the `data.csv` file included with this project.

```
<div id="chart1"></div>
<script>
    var ds = null; // Get data and call JSONstat(...) on it.
    barchart1 = d3jsbc({
        data: ds,
        title: 'Title for the chart',
        x: 'gender',
        y: 'measures',
        z: 'time',
        width: 650,
        height: 450,
        target: 'chart1'
    });
</script>
```

## Options
Documentation on options to follow.