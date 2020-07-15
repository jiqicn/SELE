/**
 * Minimap operator class
 */
var Minimap = function() {
    this.segmentList = {};
    this.numSeg = 0;
    this.maxTimeGap = 0;
    this.maxStack = 0;
    this.container = null;
    this.leftPos = 0;
    this.hg = null;
    this.hq = null;
}

Minimap.prototype.layout = function() {
    // basic setup
    var minimap = this;
    var setting = frame.widgetList['control'].operator.setting;
    var data = frame.widgetList['control'].operator.file.data;   
    var segLength = setting.segLength;
    var segWidthClose = setting.segWidthClose;
    var segWidthOpen = setting.segWidthOpen;
    var timeline = data.timeline;
    var timelineLength = timeline.length;
    for (i = 1; i < timelineLength; i++) {
        temp = parseInt(timeline[i]) - parseInt(timeline[i-1]);
        this.maxTimeGap = temp > this.maxTimeGap ? temp : this.maxTimeGap;
    }
    var layoutData = data.layout;
    for (i in layoutData) {
        temp = layoutData[i].length;
        this.maxStack = temp > this.maxStack ? temp : this.maxStack;
    }
    this.numSeg = parseInt(timelineLength / segLength); // number of segments  

    // build segments
    this.container.empty(); // clear all the old content for relayout
    var container = $('<div style="display:flex;float:left;height:100%"><div>');
    this.container.css('overflow-x', 'auto');
    this.container.append(container);
    this.container = container;
    var segContainer, i;
    for (i = 0; i < this.numSeg; i++) {
        segContainer = $('<div class="segContainer" id="no'+i+'" data-selected="N" style="width:'+segWidthClose+'px;height:100%;position:relative"><div>');
        this.container.append(segContainer);
        this.segmentList['no'+i] = new Segment(segContainer, i);
        this.segmentList['no'+i].background();
        this.segmentList['no'+i].front();        
    }

    // event response
    var id, isSelected;
    $('.segContainer').on('click', function() {
        id = $(this).attr('id'); // id of the clicked segment
        isSelected = $(this).attr('data-selected');

        // if the current clicked segment is not selected yet, then unfold it
        if (isSelected == "N") {
            $('.segContainer').each(function() {                                                 
                if ($(this).attr("id") == id) {                   
                    $(this).attr('data-selected', "Y");
                    $(this).animate({
                        width: segWidthOpen + 'px'
                    }, 100, function(){
                        minimap.segmentList[id].background();
                        minimap.segmentList[id].showDragWindow();           
                        minimap.segmentList[id].front(); 
                        minimap.segmentList[id].reLayoutCurrentView();  
                    });                                          
                }
                else {                              
                    var label = $(this).attr('data-selected');
                    var currId = $(this).attr('id');
                    $(this).animate({
                        width: (segWidthClose / 2) + 'px'
                    }, 100, function(){
                        if (label == 'Y') {                                  
                            minimap.segmentList[currId].background();
                            minimap.segmentList[currId].hideDragWindow();
                            minimap.segmentList[currId].front();                                                              
                        }  
                    });
                    $(this).attr('data-selected', "N");                                     
                }                                
            });         
        }
        else { // if the current clicked segment is already unfolded, then fold all the segments
            $(this).attr('data-selected', "N");
            $('.segContainer').each(function() {
                var currId = $(this).attr("id");
                $(this).animate({
                    width: segWidthClose + 'px'
                }, 100, function(){
                    // for (i in minimap.segmentList)
                    //     minimap.segmentList[i].front();
                    if (currId == id) {
                        minimap.segmentList[id].background();
                        minimap.segmentList[id].hideDragWindow();
                        minimap.segmentList[id].front();                                                
                    }
                });
            });
        }
    });
}

Minimap.prototype.addSelection = function(eList, id, color) {
    for (i in this.segmentList) {                 
        var condition = findOne(this.segmentList[i].eList, eList);                    
        if (condition) {
            this.segmentList[i].addSelection(id, eList, color);
            this.segmentList[i].front();
        }
    }
};

Minimap.prototype.removeSelection = function(eList, id) {
    for (i in this.segmentList) {
        if (findOne(this.segmentList[i].eList, eList)) {
            this.segmentList[i].removeSelection(id);
            this.segmentList[i].front();
        }
    }
};

Minimap.prototype.updateSelection = function(eList, id, color) {
    for (i in this.segmentList) {
        if (findOne(this.segmentList[i].eList, eList)) {
            this.segmentList[i].updateSelection(id, color);
            this.segmentList[i].front();
        }
    }
}

Minimap.prototype.addQuery = function(intervals, id, color) {
    for (i in this.segmentList) {
        var rangeStart = this.segmentList[i].rangeStart;
        var rangeEnd = this.segmentList[i].rangeEnd;
        var activedIntervals = [];
        for (j in intervals) {
            if (intervals[j][1] <= rangeStart)
                continue;
            else if (intervals[j][0] >= rangeEnd)
                break;
            else
                activedIntervals.push({
                    interval: intervals[j], 
                    index: j
                });
        }
        this.segmentList[i].addQuery(id, activedIntervals, color);
        this.segmentList[i].front();
    }
};

Minimap.prototype.removeQuery = function(id) {
    for (i in this.segmentList) {
        this.segmentList[i].removeQuery(id);
        this.segmentList[i].front();
    }
};

Minimap.prototype.redraw = function() {
    for (i in this.segmentList) {
        this.segmentList[i].background();
        this.segmentList[i].front();
    }
};

Minimap.prototype.redrawFront = function() {
    for (i in this.segmentList) {
        this.segmentList[i].front();
    }
}

Minimap.prototype.setHighlightedHitGroup = function(group, query) {
    this.hg = group
    this.hq = query
}

/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */
/********************************************************************* */

/**
 * Segment class
 * @param {*} container 
 * @param {*} id 
 */
var Segment = function(container, id) {
    this.container = container;
    this.container.css("position", "relative");
    this.container.empty();
    this.id = id;
    this.selectionList = {};
    this.queryList = {};

    // hidden layer drawing background
    var hiddenLayer = $('<canvas class="hiddenLayer" style="display:none"><canvas>');
    this.container.append(hiddenLayer);

    // color layer drawing color marks
    var colorLayer = $('<canvas class="colorLayer" style="position:absolute;top:0;left:0"></canvas>');
    this.container.append(colorLayer);
    var canvas = this.container.children('.colorLayer').get(0);
    canvas.width = this.container.width();
    canvas.height = this.container.height();

    // drag window
    var dragWindow = $('<div class="dragWindow" style="display:none;z-index:100"></div>')
    this.container.append(dragWindow);

    // basic setup
    var data = frame.widgetList['control'].operator.file.data;
    var numSeg = frame.widgetList['minimap'].operator.numSeg;
    var setting = frame.widgetList['control'].operator.setting;
    this.maxTimeGap = frame.widgetList['minimap'].operator.maxTimeGap;
    this.maxStack = frame.widgetList['minimap'].operator.maxStack;
    this.timeline = data.timeline;
    this.layout = data.layout;
    this.origin = data.events;
    this.keyStart = setting.keyStart;
    this.keyEnd = setting.keyEnd;
    this.realLength = parseInt(this.timeline.length / numSeg);
        // start and end index on timeline
    this.rangeStart = this.id * this.realLength;
    this.rangeEnd = this.rangeStart + this.realLength - 1;
    this.ratio = STACK_RATIO;
    this.leftPos = this.rangeStart;

    // get event list for the segment
    this.eList = [];
    for (i = this.rangeStart; i <= this.rangeEnd; i++)
        Array.prototype.push.apply(this.eList, this.layout[this.timeline[i]]);
    this.eList = Array.from(new Set(this.eList));
};

Segment.prototype.front = function() {
    // setup canvas context and basic metrics
    var canvas = this.container.children('.colorLayer').get(0);
    canvas.width = this.container.width();
    canvas.height = this.container.height();
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var sHeight = this.container.height();
    var xScale = d3.scaleLinear().domain([0, this.realLength - 1]).range([0, this.container.width()]);
    var yScaleStack = d3.scaleLinear().domain([0, this.maxStack]).range([0, this.container.height() * this.ratio]);
    var numSeg = frame.widgetList['minimap'].operator.numSeg;
    var numEvent = frame.widgetList['control'].operator.file.data.events.length;
    var thresholdS = parseInt(numEvent / numSeg);
    var thresholdQ = 100;
    var gridSize = frame.widgetList['control'].operator.setting.segWidthClose / 9;    
    var hg = frame.widgetList['minimap'].operator.hg;
    var hq = frame.widgetList['minimap'].operator.hq;

    // draw the colorlayer of the minimap
    var isSelected = this.container.attr('data-selected') == "Y";
    if (!isSelected) {        
        // update the minimap based on the selections
        var centerX = gridSize / 2, centerYS = gridSize / 2;
        var barHeight = gridSize / 2, barMaxWidth = gridSize * 20;
        for (i in this.selectionList) {
            var barWidthRatio = this.selectionList[i].eList.length / thresholdS;
            barWidthRatio = barWidthRatio > 1 ? 1 : barWidthRatio;
            context.beginPath();
            context.fillStyle = this.selectionList[i].color;
            context.fillRect(centerX, centerYS - barHeight / 2, barMaxWidth * barWidthRatio, barHeight);
            if (barWidthRatio > 0) {
                context.lineWidth = 0.5;                
                context.strokeStyle = "white";
                context.strokeRect(centerX, centerYS - barHeight / 2, barMaxWidth * barWidthRatio, barHeight);    
            }
            centerYS += gridSize;
        }

        // update the minimap based on the queries
        var centerYQ = gridSize;
        for (i in this.queryList) {
            barWidthRatio = this.queryList[i].intervals.length / thresholdQ;
            barWidthRatio = barWidthRatio > 1 ? 1 : barWidthRatio;
            context.beginPath();
            context.fillStyle = "rgba("+this.queryList[i].color.r+","+this.queryList[i].color.g+","+this.queryList[i].color.b+",1)";
            context.fillRect(centerX, sHeight - (centerYQ - barHeight / 2), barMaxWidth * barWidthRatio, barHeight);
            if (barWidthRatio > 0) {
                context.lineWidth = 0.5;                
                context.strokeStyle = 'white';
                context.strokeRect(centerX, sHeight - (centerYQ - barHeight / 2), barMaxWidth * barWidthRatio, barHeight);
            }
            centerYQ += gridSize;
        }
    } else {
        // update the minimap based on the selections     
        var baseline = null; // initial baseline
        var len = this.rangeEnd - this.rangeStart + 1
        var layout = new Array(len).fill(0);
        var events, numEvents, start, end, partTimeline = this.timeline.slice(this.rangeStart, this.rangeEnd + 1);
        for (i in this.selectionList) {
            events = this.selectionList[i].eList;
            numEvents = events.length;
            for (j = 0; j < numEvents; j++) { // for all the events, build the layout 
                var e = this.origin[events[j]];
                start = e.indexStart - this.rangeStart;
                end = e.indexEnd - this.rangeStart;   
                start = start < 0 ? 0 : start;
                end = end > len ? len : end; // keep within the segment                                              
                for (k = start; k <= end; k++) {
                    layout[k] += 1;
                }
            }
      
            // draw the stack
            context.beginPath();
            context.fillStyle = this.selectionList[i].color;
            context.moveTo(0, sHeight);
            var numLayout = layout.length
            for (j = 0; j < numLayout; j++) {
                x = xScale(j);
                y = sHeight - yScaleStack(layout[j]);
                context.lineTo(x, y);
            }
            context.lineTo(x, sHeight);
            if (baseline == null)
                context.lineTo(0, sHeight);
            else {
                for (j = numLayout - 1; j >= 0; j--) {
                    x = xScale(j);
                    y = sHeight - yScaleStack(baseline[j]);
                    context.lineTo(x, y);
                }
                context.lineTo(x, sHeight);
            }
            context.closePath();
            context.fill();
            baseline = jQuery.extend(true, [], layout);   
        }     

        // update the minimap based on the queries
        var centerYQ = gridSize, barHeight = gridSize / 2;
        for (i in this.queryList) {
            intervals = this.queryList[i].intervals;
            numInterval = intervals.length;
            for (j = 0; j < numInterval; j++) {
                start = xScale(intervals[j].interval[0] - this.rangeStart);
                end = xScale(intervals[j].interval[1] - this.rangeStart);
                barWidth = end - start;
                context.fillStyle = "rgba("+this.queryList[i].color.r+","+this.queryList[i].color.g+","+this.queryList[i].color.b+", 1)";
                context.fillRect(start, sHeight - (centerYQ - barHeight / 2), barWidth, barHeight);
                context.lineWidth = 0.5;
                context.strokeStyle = 'white';
                context.strokeRect(start, sHeight - (centerYQ - barHeight / 2), barWidth, barHeight);

                // draw the highlight group sign
                if (hg != null && hq == i) {
                    if (hg.iIndex.includes(intervals[j].index)) {
                        context.lineWidth = 2;
                        x = start + barWidth / 2,
                        y = sHeight - (centerYQ - barHeight / 2  - 3);
                        context.beginPath();
                        context.moveTo(x, y);
                        context.lineTo(x - 3, y - 6);
                        context.lineTo(x + 3, y - 6);
                        context.closePath();
                        context.fillStyle = "red";
                        context.fill();
                        context.lineWidth = 1;
                        context.strokeStyle = "black";
                        context.stroke();
                    }
                }
            }
            centerYQ += gridSize;
        }
    }

    // highlight the border for segments involving markers of selected pattern
    if (hg != null) {
        var color = 'black';
        for (j in this.queryList[i].intervals) {
            if (hg.iIndex.includes(this.queryList[i].intervals[j].index)) {
                color = 'red'
                break;
            }
        }
        this.container.css('border', '1px dashed ' + color);         
    } else {
        this.container.css('border', '1px solid black'); 
    }
};

Segment.prototype.addSelection = function(id, eList, color) {
    this.selectionList[id] = {
        eList: arrayIntersect(this.eList, eList),
        color: color
    }
};

Segment.prototype.updateSelection = function(id, color) {
    this.selectionList[id].color = color;
};

Segment.prototype.removeSelection = function(id) {
    delete this.selectionList[id];
};

Segment.prototype.addQuery = function(id, intervals, color) {
    this.queryList[id] = {
        intervals: intervals,
        color: color
    }
};

Segment.prototype.removeQuery = function(id) {
    delete this.queryList[id];
};

// update the background
Segment.prototype.background = function() {
    // setup
    var segment = this;
    var timeline = this.timeline;
    var layout = this.layout;
    var rangeStart = this.rangeStart;
    var rangeEnd = this.rangeEnd;
    var xScale = d3.scaleLinear().domain([0, this.realLength - 1]).range([0, this.container.width()]);
    var yScaleStack = d3.scaleLinear().domain([0, this.maxStack]).range([0, this.container.height() * this.ratio]);
    var yScaleTime = d3.scaleLinear().domain([0, Math.pow(this.maxTimeGap, 0.1)]).range([0, this.container.height() * (1 - this.ratio)]);
    var realLength = this.realLength;

    // build-up canvas
    var canvas = this.container.children('.hiddenLayer').get(0);
    canvas.width = this.container.width();
    canvas.height = this.container.height();
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // // draw time
    // var i, x, y
    // context.beginPath();
    // context.moveTo(0.5, 0);
    // for (i = rangeStart; i <= rangeEnd - 1; i++) {
    //     x = xScale(i - rangeStart + 0.5);
    //     y = yScaleTime(Math.pow(parseInt(timeline[i+1]) - parseInt(timeline[i]), 0.1));
    //     context.lineTo(x, y);
    // }
    // context.lineTo(x, 0);
    // context.lineTo(0.5, 0);
    // context.closePath();
    // context.fillStyle = "#919191";
    // context.fill();

    // draw stack
    var i, x, y    
    var height = this.container.height();
    context.beginPath();
    context.moveTo(0, height);
    
    for (i = rangeStart; i <= rangeEnd; i++) {
        x = xScale(i - rangeStart);
        y = height - yScaleStack(layout[timeline[i]].length);
        context.lineTo(x, y);
    }
    context.lineTo(x, height);
    context.lineTo(0, height);
    context.closePath();
    context.fillStyle = "#919191";
    context.fill();

    $(this.container).css("background-image", "url('"+canvas.toDataURL()+"')");

    // drag window
    var dragWindow = this.container.children('.dragWindow');
    var gapX = frame.widgetList['control'].operator.setting.gapX;
    var detailWidth = frame.widgetList['detail'].container.parent().width();
    var segWidthOpen = frame.widgetList['control'].operator.setting.segWidthOpen;
    var windowWidth = ((detailWidth / gapX - 1) / realLength) * segWidthOpen;
    dragWindow.css('width', windowWidth + 'px');
    dragWindow.css('height', '100%');
    dragWindow.off('click');
    dragWindow.on("click", function(event) {
        event.stopPropagation(); // prevent the click event from his parent
    });
    dragWindow.off('mousedown');
    dragWindow.on("mousedown", function(event){
        var originPos = event.pageX;
        var left = parseInt(dragWindow.css("left")); // get the current left as base
        var dragMaxLength = segWidthOpen - windowWidth;
        $(window).off('mousemove');
        $(window).on("mousemove", function(event){
            var pos = left + (event.pageX - originPos); // realtime position = left + offset
            if (pos <= 0) pos = 0;
            else if (pos >= dragMaxLength) pos = dragMaxLength; // left and right boundaries
            dragWindow.css("left", pos); // set the position of drag window
            var leftPos = rangeStart + parseInt((rangeEnd - rangeStart) * (dragMaxLength / segWidthOpen) * (pos / dragMaxLength));
            segment.leftPos = leftPos;
            frame.widgetList['minimap'].operator.leftPos = segment.leftPos;
            segment.reLayoutCurrentView();
        });
        $(window).off('mouseup');
        $(window).on("mouseup", function(event){
            $(window).off("mousemove");
        })
    });
};

Segment.prototype.reLayoutCurrentView = function() {
    // get ids for all the detail views
    var selectionKeys = Object.keys(frame.widgetList);
    selectionKeys = selectionKeys.filter(function(x) {
        if (x.indexOf("Selection") > -1 || x.indexOf("Query") > -1) return x
    });
    selectionKeys.push('detail');

    // relayout all the active detail views
    for (i in selectionKeys) {
        key = selectionKeys[i];
        if (frame.layout.root.getItemsById(key)[0].container.tab.isActive) {
            frame.widgetList[key].operator.layout(frame.widgetList['minimap'].operator.leftPos); 
        }
    }
};

Segment.prototype.showDragWindow = function() {
    this.container.children('.dragWindow').css('display', 'block');
    frame.widgetList['minimap'].operator.leftPos = this.leftPos;
};

Segment.prototype.hideDragWindow = function() {
    this.container.children('.dragWindow').css('display', 'none');
};