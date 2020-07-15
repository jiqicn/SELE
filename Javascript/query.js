/**
 * query operator class
 */
var Query = function() {
    this.container = null;
    this.queryList = {};
    this.count = 0;
};

Query.prototype.layout = function() {
    // one thing could be layout initially is the color legend of attributes
    this.container.css('overflow', 'auto');    
    var innerContainer = $('<div id="innerContainer" style="width:100%;height:auto"></div>')
    this.container.append(innerContainer);
    this.container = innerContainer;
}

Query.prototype.setQuery = function(wholeLayoutData, queryLayout, detailID, operaList) {
    // create new querytag
    var qt = new QueryTag(this.container, wholeLayoutData, queryLayout, detailID, this.count, operaList);
    this.queryList[this.count++] = qt;
};

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
 * @param container query container
 * @param wholeLayout whole data that is gonna be matched
 * @param queryLayout query data as selected by the user
 * @param source detail view ID as the source of the query
 * @param id id of this query tag
 */
var QueryTag = function(container, wholeLayout, queryLayout, source, id, operaList) {
    this.container = container;
    this.wholeLayout = wholeLayout;
    this.query = queryLayout;
    this.source = source;
    this.id = id
    this.ebLayout = null;
    this.baselines = null;
    this.draw = null;
    this.svgList = {};
    this.hlColor = null;
    this.isHighlighted = false;
    this.isSearched = false;
    this.operaList = operaList;

    // query result intervals and event layout
    this,intervals = null;
    this.queryEList = [];

    // layout the tag container
    this.layout();
};

QueryTag.prototype.createDetailView = function() {
    var id = "Query" + this.id;

    // configuation of the selection detail view
    var newConfig = {
        title: "Query#" + this.id + ' View <input class="queryButton" id="'+id+'" type="button" value="Query"></input>',
        type: 'component',
        isClosable: false,
        componentName: 'widget',
        id: id,
        componentState: {}
    };

    // get new layout data for the query
    var data = frame.widgetList['control'].operator.file.data;
    var timeline = data.timeline;
    var events = data.events;
    var eList = this.queryEList;
    var layout = {};
    var numEvent = eList.length;
    var numTime = timeline.length;
    for (i = 0; i < numTime; i++)
        layout[timeline[i]] = [];
    for (i = 0; i < numEvent; i++) {
        eid = eList[i];
        s = events[eid].indexStart;
        e = events[eid].indexEnd;
        for (j = s; j <= e; j++)
            layout[timeline[j]].push(eid);
    }

    // add new widget
    var result = frame.addNewWidget('detail', newConfig);
    if (!result) return;
    frame.widgetList[id].setOperator(Detail, this.queryEList);
    var leftPos = frame.widgetList['minimap'].operator.leftPos;
    frame.widgetList[id].operator.layout(leftPos, layout);
};

QueryTag.prototype.layout = function() {
    // create the tag container
    var qTag = this;
    var svgSetting = {
        lineWidth: 4,
        lineGap: 1,
        unitWidth: 0
    };
    var maxStack = 0;
    for (i in this.query) maxStack = this.query[i].length > maxStack ? this.query[i].length : maxStack;
    var totalHeight = (maxStack + 3) * (svgSetting.lineWidth + svgSetting.lineGap) + 10;

    // all the DOMs
    var tagContainer = $('<div id="queryTag'+this.id+'" class="queryTag" style="max-width:calc(100% - 10px);height:auto"></div>');
    var titleBar = $('<div id="titleBar'+this.id+'" style="flex-wrap: wrap !important;background-color:#35353A;display:flex;width:100%;height:auto;box-sizing: border-box; border:2px solid #35353A"></div>');
    var svgContainer = $('<div id="querySVG'+this.id+'" class="querySVG" style="box-sizing: border-box; border: 5px solid #35353A;overflow: auto;width:100%;height:'+totalHeight+'px"></div>');
    var title = $('<h5 style="font-size: 11px;padding-top: 3px;width: 76;margin-left: 5px;margin-top: 3px">Query#'+this.id+' from '+this.source+'</h5>');
    var dropdownColor = $('<div id="dropdownColor'+this.id+'" style="width:60px;margin:3px;margin-right:6px"><div id="dropDownButtonQ'+this.id+'"></div></div>');
    var colorPicker = $('<div id="colorPicker'+this.id+'"><div id="picker" style="float:left"></div></div>');
    var buttonSearch = $('<div class="border" style="width:auto !important"><input type="button" id="querySearch'+this.id+'" value="Search"></input></div>');
    var buttonHighlight = $('<div class="border" style="width:auto !important"><input type="button" id="queryHighlight'+this.id+'" value="Highlight"></input></div>');
    var buttonCompare = $('<div class="border" style="width:auto !important"><input type="button" id="queryCompare'+this.id+'" value="Compare"></input></div>');
    var buttonRemove = $('<div class="border" style="width:auto !important"><input type="button" id="queryRemove'+this.id+'" value="Remove"></input></div>');
    this.container.append(tagContainer);
    tagContainer.append(titleBar);
    tagContainer.append(svgContainer);
    titleBar.append(title);
    titleBar.append(dropdownColor);
    dropdownColor.children('div').append(colorPicker);
    titleBar.append(buttonSearch);
    titleBar.append(buttonHighlight);
    titleBar.append(buttonCompare);
    titleBar.append(buttonRemove);

        // realize the jqwidget doms
    buttonSearch.children('input').jqxButton({template: TEMPLATE, width: '100%'});
    buttonHighlight.children('input').jqxButton({template: TEMPLATE, width: '100%'});
    buttonCompare.children('input').jqxButton({template: TEMPLATE, width: '100%'});
    buttonRemove.children('input').jqxButton({template: TEMPLATE, width: '100%'});
    colorPicker.children('div').jqxColorPicker({ color: "ffaabb", colorMode: 'hue', width: 220, height: 220});
    dropdownColor.children('div').jqxDropDownButton({template: TEMPLATE, width: '100%', height: 22, animationType: 'fade'});
    $('#dropDownButtonPopupdropDownButtonQ' + this.id).addClass('gapDDCQ');

        // response to button click events
    buttonSearch.children('input').off('click');
    buttonSearch.children('input').on('click', function() {
        if (qTag.hlColor == null)
            alert("Please choose a color before searching!");
        else {
            // get all the query result intervals
            var range = Object.keys(qTag.query);
            var QSeq = [];
            for (var i in range)
                QSeq.push(qTag.operaList[range[i]]);
            var TSeq = [];
            for (i in qTag.operaList)
                TSeq.push(qTag.operaList[i]);
            var qe = new QueryEngine(QSeq, TSeq);
            qTag.intervals = qe.exec();

            // get the query result event list for creating new detailed view
            var timeline = Object.keys(qTag.wholeLayout);
            qTag.intervals.forEach(function(element) {
                var start = element[0], end = element[1];
                for (var i = start; i <= end; i++)
                    qTag.queryEList.push.apply(qTag.queryEList, qTag.wholeLayout[timeline[i]]);
            });
            qTag.queryEList = Array.from(new Set(qTag.queryEList));

            // create detailed view
            qTag.createDetailView();

            // highlight the view
            qTag.isSearched = true; // set a search
            qTag.isHighlighted = false; // automatically highlight
            buttonHighlight.children('input').trigger('click');
            buttonCompare.children('input').trigger('click');
        }
    });

    buttonCompare.children('input').off('click');
    buttonCompare.children('input').on('click', function() {
        if (qTag.isSearched) {
            var layout = qTag.wholeLayout;
            var intervals = qTag.intervals;
            var id = qTag.id;
            frame.widgetList['pattern'].operator.layout(layout, intervals, id);
            frame.widgetList['pattern'].operator.updateTitleColor(qTag.hlColor);
        }
        else {
            alert('Please firstly search from the detailed view!');
        }
    });

    buttonRemove.children('input').off('click');
    buttonRemove.children('input').on('click', function() {
        frame.widgetList['pattern'].operator.clear(qTag.id);
        qTag.remove();
    });

    buttonHighlight.children('input').off('click');
    buttonHighlight.children('input').on('click', function() {
        if (!qTag.isSearched)
            alert("Please firstly search the query!");
        else if (qTag.hlColor == null)
            alert("Please choose a color before Highlighting!");
        else {
            if (!qTag.isHighlighted) {
                titleBar.css('background-color', "#" + qTag.hlColor.hex);
                titleBar.css('border-color', "#" + qTag.hlColor.hex)
                title.css('color', 'black');
                qTag.isHighlighted = true;

                // highlight on the corresponding detail view
                frame.widgetList['Query' + qTag.id].operator.setRangeHighlight(qTag.intervals, qTag.hlColor, qTag.isHighlighted);
                frame.widgetList['Query' + qTag.id].operator.layout();

                // highlight on the minimap
                frame.widgetList['minimap'].operator.addQuery(qTag.intervals, qTag.id, qTag.hlColor);
            } else {
                titleBar.css('background-color', "#35353A");
                titleBar.css('border-color', "#35353A");
                title.css('color', qTag.hlColor == null ? 'white' : "#" + qTag.hlColor.hex);
                qTag.isHighlighted = false;   
                
                // remove highlight from the corresponding detailed view
                frame.widgetList['Query' + qTag.id].operator.setRangeHighlight(null, null, qTag.isHighlighted);
                frame.widgetList['Query' + qTag.id].operator.layout();   
                
                // remove highlight from the minimap
                frame.widgetList['minimap'].operator.removeQuery(qTag.id);
            }
        }
    });

    // change the style of dropdown to be deplay:none
    dropdownColor.children('div').off('open');
    dropdownColor.children('div').on('open', function() {
        $('.dropDownButton#dropDownButtonPopup' + this.id).css('display', 'block');        
    });
    dropdownColor.children('div').off('close')
    dropdownColor.children('div').on('close', function() {
        $('.dropDownButton#dropDownButtonPopup' + this.id).css('display', 'none');
    });

    // return selected color from the color picker
    colorPicker.children('div').on('colorchange', function (event) {
        dropdownColor.children('div').jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
        
        // change the font color of the head while the hits are not highlighted
        title.css('color', qTag.hlColor == null ? 'white' : "#" + qTag.hlColor.hex);
        
        // save the changed color
        qTag.hlColor = event.args.color; // format of full color concept (rgba, hex, ...)
        frame.widgetList['pattern'].operator.updateTitleColor(qTag.hlColor);

        // rehighlight the query results while color changes
        if (qTag.isSearched && qTag.isHighlighted) {
            qTag.isHighlighted = false;
            buttonHighlight.children('input').trigger('click');
        }

        // set the content color to the dropdown button
        function getTextElementByColor(color) {
            if (color == 'transparent' || color.hex == "") {
                return $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>transparent</div>");
            }
            var element = $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</div>");
            var nThreshold = 105;
            var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
            var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
            element.css('color', foreColor);
            element.css('background', "#" + color.hex);
            element.addClass('jqx-rc-all');
            return element;
        }
    });

    // deal with the query data
    var queryTimeline = Object.keys(this.query);
    var queryRange = queryTimeline.length;
    var ebLayout = {}, currTime, currLen;
    for (var i = 0; i < queryRange; i++) {
        currTime = this.query[queryTimeline[i]];
        currLen = currTime.length;
        for (var j = 0; j < currLen; j++) {
            if (ebLayout[currTime[j]] == undefined)
                ebLayout[currTime[j]] = [[i, j + 1]];
            else
                ebLayout[currTime[j]].push([i, j + 1]);
        }
    }
        // remove all the intermedia points along the path
    var keepList;
    for (i in ebLayout) {
        if (ebLayout[i].length < 2) {
            delete ebLayout[i];
            continue;
        }
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

    // compute the baseline
    var numEvent = Object.keys(ebLayout).length;
    var beginStack = this.query[queryTimeline[0]];
    var endStack = this.query[queryTimeline[queryRange - 1]];
    var baselines = arrayIntersect(beginStack, endStack); // get all the baseline events
    var noEnd = endStack.filter(function(x) {
        if (!baselines.includes(x)) return x;
    });
    var noStart = beginStack.filter(function(x) {
        if (!baselines.includes(x)) return x;
    });       
    this.baselines = baselines;

    // generate the svg
    this.draw = SVG('querySVG' + this.id).size('100%', '100%');
    svgSetting.unitWidth = $('#querySVG' + this.id).width() / (Object.keys(this.query).length + 1);
    for (i in ebLayout) {
        this.svgList[i] = new SVGElement(ebLayout[i], this.draw, svgSetting, totalHeight - 5, i, baselines, this.source);
    }
};

QueryTag.prototype.remove = function() {
    $('#queryTag' + this.id).remove();
    frame.removeWidget('Query' + this.id);
    frame.widgetList['minimap'].operator.removeQuery(this.id);
    delete frame.widgetList['query'].operator.queryList[this.id];
};

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
 * @param path path data
 * @param draw draw instance of svg
 * @param setting setting of drawing svg
 * @param totalHeight height of the svg element
 * @param eventID the eventID of the event currently being drawn
 * @param baselines eventIDs of the baseline events
 * @param source the id of the detailed view where this query comes from
 */
var SVGElement = function(path, draw, setting, totalHeight, eventID, baselines, source) {
    this.draw = draw;
    this.group = draw.group();
    this.pathData = path;
    this.path = null;
    this.setting = setting;
    this.totalHeight = totalHeight;
    this.eventID = parseInt(eventID);
    this.color = "#A0A0A0";
    this.source = source

    // layout the line
    this.layout();
}

SVGElement.prototype.layout = function() {
    var numPath = this.pathData.length;

    // create the path content
    var pathContent = "", temp, x, y;
    for (var i = 0; i < numPath; i++) {
        temp = i == 0 ? "M" : "L"; // set if the action is move-to or line-to
        x = this.pathData[i][0] * this.setting.unitWidth;
        y = this.totalHeight - this.pathData[i][1] * (this.setting.lineWidth + this.setting.lineGap) - this.setting.lineWidth;
        temp += " " + x + " " + y;
        pathContent += temp;
    }
    if (numPath == 1)
        pathContent += "L " + (x + 5) + " " + y;

    // create path and add the path to the group
    this.path = this.draw.path(pathContent).fill('none');
    this.path.stroke({
        color: this.color,
        width: this.setting.lineWidth,
        linejoin: 'round'
    });
    this.group.add(this.path);

    // response to hovering events
    var data = frame.widgetList['control'].operator.file.data;
    var events = data.events;
    var source = this.source;
    var eventID = this.eventID;
    var eventData = events[eventID];
    var attributes = data.keys.sort();
    var path = this.path;
    var color = this.color;
    var tooltip = $('#tooltip');    
    this.path.mouseover(function() {
        // set the tooltip content
        this.mousemove(function(event) {
            var tooltipText = "<tr><th>Attribute</th><th>&nbsp&nbsp</th><th>Value</th></tr>";
            for (i in attributes)
                tooltipText += "<tr><td>" + attributes[i] + "</td><td>&nbsp&nbsp</td><td>" + eventData[attributes[i]] + "</td></tr>";
            tooltip.html(tooltipText);
    
            tooltip.css('left', (event.pageX) + "px");
            tooltip.css('top', (event.pageY - 185) + "px");
            tooltip.css('display', 'block');
            tooltip.css('background-color', 'black')
        });

        // change the path color
        path.stroke({
            color: 'white'
        });
    });
    this.path.mouseout(function() {
        tooltip.css('display', 'none');
        tooltip.css('background-color', '#22222299')
        path.stroke({
            color: color
        });
    });
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
 * @param QSeq query sequence
 * @param TSeq target sequence
 */
var QueryEngine = function(QSeq, TSeq) {
    this.QSeq = QSeq; // QSeq and TSeq is for maintaining the original data
    this.TSeq = TSeq;
    this.Q = null; // Q and T is used for shifting
    this.T = null;
    this.pos = 0; // position of matching start
    this.matchLen = 0;
    this.SL = [-1]; // start list
    this.rSL = [-1]
    this.matchList = [];
    // this.restList;
};

QueryEngine.prototype.exec = function() {
    var TLen = this.TSeq.length;
    var QLen = this.QSeq.length;
    var hitted;
    while (this.pos < TLen) {
        // this.restList = [];
        this.SL = [-1]; // initialize start list
        this.rSL = [-1];
        this.matchLen = 0; // computing the match length of target sequence
        this.Q = this.QSeq.slice();
        this.T = this.TSeq.slice(this.pos, this.pos + 300);                
        // this.T = this.TSeq;
        
        hitted = this.match([-1], [-1]);
        // console.log(this.pos + " " + hitted);
        if (!hitted) {
            this.pos += 1
            // this.TSeq = this.restList.concat(this.TSeq);
            // this.TSeq.shift();
        }
        else {
            // console.log("start*************************")
            for (i = 0; i < this.matchLen; i++) {
                // console.log(this.TSeq[this.pos + i])
                if (this.TSeq[this.pos + i].length > 0)
                    break;
            }
            this.matchList.push([this.pos + i + 1, this.pos + this.matchLen]);
            this.pos += this.matchLen;
        }
    }
    this.matchList = this.matchList.filter(function(x) {
        if ((typeof x[0]) == 'number' && (typeof x[1]) == 'number')
            return x;
    });
    return this.matchList;
};

/**
 * target check: if this.T has already been empty
 * length check: if current q and t has the same length
 * state check: if current q and t has the same state
 * hierachy check: update the next sid list and start list based on the input state
 * return check: if the sid list and start list don't have common elements, return 
 */
QueryEngine.prototype.match = function(sid, rsid) {
    var sid = sid;
    var rsid = rsid;
    var result = true;

    while (this.Q.length > 0) {
        var q = [], t = [];
        while (q.length == 0 && this.Q.length > 0) {
            q = this.Q.shift();
            if (t == undefined) return false;            
        }
        while (t.length == 0 && this.T.length > 0) {
            t = this.T.shift();
            // this.restList.push(t);
            if (t == undefined) return false;
            this.matchLen += 1
        }

        // target check
        result = result && (t != undefined);
        if (!result) return result;

        // length check
        result = result && (q.length == t.length);
        if (!result) return result;

        // state check
        for (var i in q) {
            result = result && (q[i].state == t[i].state) 
            if (!result) return result;
        }
        
        // hierachy check
        var nextSid = [], nextRsid = [];
        for (i in q) {
            if (q[i].state == 's') {
                nextSid.push(q[i].eid);
                this.SL.push(q[i].eid);

                nextRsid.push(t[i].eid);
                this.rSL.push(t[i].eid);
            }
            else if (q[i].state == 'e') {
                var index = this.SL.indexOf(q[i].eid);
                if (index != -1)
                    this.SL.splice(index, 1);

                var indexR = this.rSL.indexOf(t[i].eid);
                if (indexR != -1)
                    this.rSL.splice(indexR, 1);              
            }
        }
        result = result && this.match(nextSid, nextRsid);
        if (!result) return result;

        // return check
        var condition = arrayIntersect(this.SL, sid).length == 0;
        var conditionR = arrayIntersect(this.rSL, rsid).length == 0 
        result = result && (condition == conditionR); // make sure query and target have the same return check result
        if (!result) return result; // if they have different of return check result
        if (condition) return result; // if all the sid events has been returned
    }

    // return while all the query has been read
    return result;
};