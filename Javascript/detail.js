/**
 * Detail operator class
 */
var Detail = function(eList = undefined) {
    this.container = null;
    this.leftPos = 0;

    var data = frame.widgetList['control'].operator.file.data;
    var events = data.events;
    var setting = frame.widgetList['control'].operator.setting;
    this.timeline = data.timeline;
    this.layoutData = data.layout;
    this.queryRange = null;
    this.ebLayout = null;
    this.eList = eList == undefined ? numberList(events.length) : eList;

    function numberList (length) {
        var result = []
        for (i = 0; i < length; i++)
            result.push(i)
        return result;
    }

    this.intervals = null;
    this.rangeColor = null;
    this.isHighlighted = false;

    this.highlightHitGroup = null;

    // conduct the operation list for this view
    this.operaList = {};
    for (var i in this.timeline)
        this.operaList[this.timeline[i]] = [];
    for (var i in this.eList) {
        var eid = this.eList[i];
        var event = events[eid];
        var start = this.timeline[event.indexStart];
        var end = this.timeline[event.indexEnd];
        this.operaList[start].push({state: 's', eid: eid});
        this.operaList[end].push({state: 'e', eid: eid});
    }
};

Detail.prototype.setRangeHighlight = function(intervals, color, isHighlighted) {
    if (isHighlighted) {
        this.intervals = intervals;
        this.rangeColor = color;
    }
    this.isHighlighted = isHighlighted;
}

Detail.prototype.setHighlightedHitGroup = function(group) {
    this.highlightHitGroup = group;
}

Detail.prototype.layout = function(pos = undefined, layoutInput = undefined) {
    // setup
    var detail = this;
    this.leftPos = pos == undefined ? this.leftPos : pos;
    var startPos = this.leftPos;
    var setting = frame.widgetList['control'].operator.setting;
    var gapX = setting.gapX;
    var gapY = setting.gapY;
    var containerWidth = this.container.parent().width();
    var area = parseInt(containerWidth / gapX) - 1;
    var data = frame.widgetList['control'].operator.file.data;
    var timeline = data.timeline;
    var endPos = startPos + area;
    var timeRange = timeline.slice(startPos, endPos + 1);
    this.layoutData = layoutInput == undefined ? this.layoutData : layoutInput;
    var layout = this.layoutData;
    var events = data.events;
    this.container.css('background-color', 'black');
    var maxTickNum = Math.ceil(this.container.width() / gapX);

    // setup underlayer
    if (this.container.children('#underLayerFrame').length)
        var underLayer = this.container.children('#underLayer');
    else {
        var underLayer = $('<div id="underLayerFrame" style="width:100%;height:100%"><canvas id="underLayer"></canvas></div>');
        this.container.append(underLayer);

        // setup the range selector
        this.container.jqxRangeSelector({ width: '100%', 
            height: '100%', 
            min: 0, 
            max: maxTickNum, 
            range: { from: 5, to: maxTickNum - 5, min: 1, max: maxTickNum - 1 }, 
            majorTicksInterval: maxTickNum - 1, 
            minorTicksInterval: 1, 
            showMarkers: false,
            moveOnClick: false,
            padding: '0px',
            theme: 'metrodark'
        });
    }

    this.container.off('contextmenu');
    this.container.on('contextmenu', function(event) {
        event.stopPropagation(); // prevent the click event from his parent
        var max = $(this).jqxRangeSelector('max');
        var min = $(this).jqxRangeSelector('min');
        for (var i in frame.widgetList) {
            if (i.includes('detail') || i.includes('Query') || i.includes('Selection')) {
                frame.widgetList[i].operator.container.jqxRangeSelector('setRange', min + 5, max - 5);
            }
        }
        return false;
    });

    // setup the query button
    var containerID = this.container.attr('id');
    $('input.queryButton#'+containerID).off('click');
    $('input.queryButton#'+containerID).on('click', function() {
        var queryRange = detail.container.jqxRangeSelector('getRange');
        var queryTimeRange = timeline.slice(detail.leftPos, detail.leftPos + area + 1);
        queryTimeRange = queryTimeRange.slice(queryRange.from - 1, queryRange.to);
        var queryLayout = _.pick(layout, queryTimeRange);
        frame.widgetList['query'].operator.setQuery(layout, queryLayout, containerID, detail.operaList);
    });
    
    var canvas = this.container.children('#underLayerFrame').children('#underLayer').get(0);
    canvas.width = this.container.parent().width();
    canvas.height = this.container.parent().height();
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);    

    // transform layout dataset from timestamps to event-based format
    var i, currTime, currLen, j;
    var ebLayout = {};
    for (i = 0; i <= area; i++) {
        currTime = layout[timeRange[i]];
        currLen = currTime.length;
        for (j = 0; j < currLen; j++) {
            if (ebLayout[currTime[j]] == undefined)
                ebLayout[currTime[j]] = [[i + 1, j + 1]];
            else
                ebLayout[currTime[j]].push([i + 1, j + 1]);
        }
    }

    // simplify the event-based layout data
    // keep turining points that satisfy delta(i, i-1) != delta(i, i+1)
    // as time gap = 1 for both case, condition turns into delta_y(i, i-1) != delta_y(i, i+1)
    var keepList;
    for (i in ebLayout) {
        keepList = [];
        currLen = ebLayout[i].length - 2;
        for (j = 1; j <= currLen; j++) {
            if (Math.abs(ebLayout[i][j][1] - ebLayout[i][j-1][1]) != Math.abs(ebLayout[i][j][1] - ebLayout[i][j+1][1]))
                keepList.push(j);
        }
        keepList.unshift(0);
        keepList.push(currLen + 1); // put back the beginning and ending points
        ebLayout[i] = ebLayout[i].filter(function(x) {
            if (keepList.indexOf(ebLayout[i].indexOf(x)) >= 0)
                return x;
        });
    }
    this.ebLayout = ebLayout;

    // draw timelength
    if (this.container.attr('id') == 'detail') {
        var maxTimeGap = frame.widgetList['minimap'].operator.maxTimeGap;
        // var yScaleTime = d3.scaleLinear().domain([0, Math.pow(maxTimeGap, 0.1)]).range([0, this.container.parent().height() * 0.3]);
        var yScaleTime = d3.scaleLinear().domain([0, Math.pow(maxTimeGap, 0.1)]).range([0, 1]);
        var numTime = timeRange.length;
        var width = gapX, height = this.container.parent().height(), y = 0;
        y = this.container.parent().height() - frame.widgetList['minimap'].operator.maxStack * gapY - 10;
        height = frame.widgetList['minimap'].operator.maxStack * gapY
        // height = frame.widgetList['minimap'].operator.maxStack * gapY;
        for (i = 0; i < numTime - 1; i++) {
            // height = yScaleTime(Math.pow(parseInt(timeRange[i + 1]) - parseInt(timeRange[i]), 0.1));
            // x = (i + 1) * gapX - width / 2;
            x = i * gapX;
            // context.fillStyle = "rgba(255, 255, 255, 0.3)";        
            // context.fillStyle = "rgba(255, 165, 0, "+yScaleTime(Math.pow(parseInt(timeRange[i + 1]) - parseInt(timeRange[i]), 0.1))+")";        
            context.fillStyle = "rgba(100, 100, 100, "+yScaleTime(Math.pow(parseInt(timeRange[i + 1]) - parseInt(timeRange[i]), 0.1))+")";        
            context.fillRect(x, y, width, height);           
        }
    }

    // draw lines
    var cHeight = this.container.parent().height();
    var numPoint, i, j, data;
    // if (this.container.attr('id').indexOf('Query') > -1)
    //     var colorCard = {};
    // else
    var getColor = frame.widgetList['selection'].operator == null ? function(id) {return undefined;} : frame.widgetList['selection'].operator.getColorByEventID;
    for (i in ebLayout) {
        data = ebLayout[i]; // current event path in format of list of points
        numPoint = data.length; // number of points involved in the path
        var eColor = getColor(i);
        if (numPoint > 1) {
            // draw possible lines
            context.beginPath();
            context.moveTo(data[0][0] * gapX, cHeight - data[0][1] * gapY - 10);
            for (j = 1; j < numPoint; j++) {
                context.lineTo(data[j][0] * gapX, cHeight - data[j][1] * gapY - 10);
            }
            context.lineWidth = 2;
            context.strokeStyle = eColor == undefined ? "#919191" : eColor; // default setting
            context.stroke();
        }
        else { // for point events which only have one point within the path
            context.fillStyle = eColor == undefined ? "#919191" : eColor;
            context.fillRect(data[0][0] * gapX - 1, (cHeight - data[0][1] * gapY - 1) - 10, 2, 2);
        }
    }
    
    // draw highlighted range
    if (this.isHighlighted) {
        // get intervals involved in the current range
        var activedIntervals = [];
        for (i in this.intervals) {
            // console.log([this.intervals[i], startPos, endPos]);
            if (this.intervals[i][1] < startPos)
                continue;
            else if (this.intervals[i][0] > endPos)
                break;
            else
                activedIntervals.push({
                    interval: this.intervals[i],
                    hg: this.highlightHitGroup == null ? false : this.highlightHitGroup.iIndex.includes(i)
                });
        }
        // draw the highlight range
        for (i in activedIntervals) {
            currInterval = activedIntervals[i].interval;
            var rangeX = (currInterval[0] - startPos) * gapX,
                rangeY = 0,
                rangeWidth = (currInterval[1] - currInterval[0]) * gapX,
                rangeHeight = cHeight;
            context.fillStyle = "rgba("+this.rangeColor.r+","+this.rangeColor.g+","+this.rangeColor.b+",0.3)"
            context.fillRect(rangeX, rangeY, rangeWidth, rangeHeight);
            context.setLineDash(activedIntervals[i].hg ? [3, 2] : []);
            context.lineWidth = activedIntervals[i].hg ? 2 : 1;
            context.strokeStyle = activedIntervals[i].hg ? 'red' : 'white';
            context.strokeRect(rangeX, rangeY, rangeWidth, rangeHeight);
        }
    }

    // draw max stack line
    if (this.container.attr('id') == 'detail') {
        var maxStack = cHeight - frame.widgetList['minimap'].operator.maxStack * gapY - 10;
        context.beginPath();
        context.moveTo(gapX, maxStack);
        context.lineTo(canvas.width - gapX, maxStack);
        context.lineWidth = 1;
        context.strokeStyle = "white";
        context.stroke();
        context.font = "bold 12px sans-serif";
        context.fillStyle = "white";
        context.fillText("max depth = " + frame.widgetList['minimap'].operator.maxStack, 5, maxStack + 13);
    }

    // setup coverLayer
    if (this.container.children('.coverLayer#' + containerID).length)
        var coverLayer = this.container.children('.coverLayer#' + containerID);
    else {
        var coverLayer = $('<canvas class="coverLayer" id="'+containerID+'"></canvas>');
        this.container.append(coverLayer);
    }

    // update coverLayer
    var clCanvas = coverLayer.get(0);
    clCanvas.width = $(this.container).width();
    clCanvas.height = $(this.container).height();
    var clContext = clCanvas.getContext('2d');
    coverLayer.off('mousemove');
    coverLayer.on('mousemove', function(event){
        var pos = {x: event.offsetX, y: event.offsetY};
        var indexX = Math.round(pos.x / gapX) - 1;
        var currTime = timeRange[indexX];
        var currLayout = layout[currTime];
        var clHeight = $(this.parentNode).height() - 10;
        var indexY = Math.round((clHeight - pos.y) / gapY) - 1;
        var currEvent = currLayout[indexY];
        clContext.clearRect(0, 0, clCanvas.width, clCanvas.height);
        var tooltip = $('#tooltip');
        if (currEvent == undefined) {
            tooltip.css('display', 'none');
            return;
        }
        else var currPath = ebLayout[currEvent];
        
        // highlight the selected event
        if (currPath.length > 1) {
            // draw possible lines
            clContext.beginPath();
            clContext.moveTo(currPath[0][0] * gapX, cHeight - currPath[0][1] * gapY - 10);
            for (j = 1; j < currPath.length; j++) {
                clContext.lineTo(currPath[j][0] * gapX, cHeight - currPath[j][1] * gapY - 10);
            }
            clContext.lineWidth = 2;
            clContext.strokeStyle = "white"; // default setting
            clContext.stroke();
        }
        else { // for point events which only have one point within the path
            clContext.fillStyle = "white";
            clContext.fillRect(currPath[0][0] * gapX - 1, (cHeight - currPath[0][1] * gapY - 1) - 10, 2, 2);
        }

        // draw the tooltip
        var eventData = events[currEvent];
        var attributes = frame.widgetList['control'].operator.file.data.keys.sort();
        var keyStart = frame.widgetList['control'].operator.file.data.keyStart;
        var keyEnd = frame.widgetList['control'].operator.file.data.keyEnd;
        var tooltipText = "<tr><th>Attribute</th><th>&nbsp&nbsp</th><th>Value</th></tr>";
        tooltipText += "<tr><td>EventID</td><td>&nbsp&nbsp</td><td>" + currEvent + "</td></tr>"
        for (i in attributes)
            tooltipText += "<tr><td>" + attributes[i] + "</td><td>&nbsp&nbsp</td><td>" + eventData[attributes[i]] + "</td></tr>";
        tooltipText += "<tr><td>Time</td><td>&nbsp&nbsp</td><td>" + ((parseInt(eventData[keyEnd]) - parseInt(eventData[keyStart])) / 1000000).toFixed(2) + " s</td></tr>";
        tooltip.html(tooltipText);
        tooltip.css("left", function() {
            if (event.pageX <= $(window).width() / 2)
                return (event.pageX + 10) + "px";
            else
                return (event.pageX - $(this).width() - 18) + "px";
        });
        tooltip.css("display", "block"); 
        tooltip.css("top", (event.pageY - 230) + "px");
    });
    coverLayer.off("mouseout");
    coverLayer.on("mouseout", function() {
        $('#tooltip').css("display", "none");
        clContext.clearRect(0, 0, clCanvas.width, clCanvas.height);
    });
};

Detail.prototype.highlightEvent = function(eventID) {
    var containerID = this.container.attr('id');
    var setting = frame.widgetList['control'].operator.setting;
    var cHeight = this.container.parent().height();
    var gapX = setting.gapX;
    var gapY = setting.gapY;
    var coverLayer = this.container.children('.coverLayer#' + containerID)
    var clCanvas = coverLayer.get(0);
    clCanvas.width = $(this.container).width();
    clCanvas.height = $(this.container).height();
    var clContext = clCanvas.getContext('2d');

    var ebLayout = this.ebLayout;
    var currPath = ebLayout[eventID]
    if (currPath == undefined)
        return;
    if (currPath.length > 1) {
        // draw possible lines
        clContext.beginPath();
        clContext.moveTo(currPath[0][0] * gapX, cHeight - currPath[0][1] * gapY - 10);
        for (j = 1; j < currPath.length; j++) {
            clContext.lineTo(currPath[j][0] * gapX, cHeight - currPath[j][1] * gapY - 10);
        }
        clContext.lineWidth = 2;
        clContext.strokeStyle = "white"; // default setting
        clContext.stroke();
    }
    else { // for point events which only have one point within the path
        clContext.fillStyle = "white";
        clContext.fillRect(currPath[0][0] * gapX - 1, (cHeight - currPath[0][1] * gapY - 1) - 10, 2, 2);
    }

    // show tooltip with mouse
    var tooltip = $('#tooltip');
    var data = frame.widgetList['control'].operator.file.data;
    var events = data.events;
    var eventData = events[eventID];
    var attributes = Object.keys(eventData).sort();
    var tooltipText = "<tr><th>Attribute</th><th>&nbsp&nbsp</th><th>Value</th></tr>";
    tooltipText += "<tr><td>EventID</td><td>&nbsp&nbsp</td><td>" + eventID + "</td></tr>"
    for (i in attributes)
        tooltipText += "<tr><td>" + attributes[i] + "</td><td>&nbsp&nbsp</td><td>" + eventData[attributes[i]] + "</td></tr>";
    tooltip.html(tooltipText);
    var left = currPath[0][0] * gapX;
    var top = cHeight - currPath[0][1] * gapY - 10;
    tooltip.css("left", function() {
        if (left < $(window).width() / 2)
            return (left + 200) + "px";
        else
            return (left - 50) + "px"
    });
    tooltip.css("display", "block"); 
    tooltip.css("top", (top - 50) + "px");
};

Detail.prototype.removeHighlight = function() {
    var containerID = this.container.attr('id');
    var coverLayer = this.container.children('.coverLayer#' + containerID)
    var clCanvas = coverLayer.get(0);
    var clContext = clCanvas.getContext('2d');
    clContext.clearRect(0, 0, clCanvas.width, clCanvas.height);

    // hide tooltip
    $('#tooltip').css("display", "none");
};