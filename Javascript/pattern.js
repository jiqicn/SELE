var Pattern = function() {
    this.container = null;
    this.drawn = false;
    this.wholeLayout = null;
    this.intervals = null;
    this.id = null;
    this.attr = 'empty';
    this.colorAttr = 'empty';
    this.hitList = {};
    this.groupList = {};
    this.titleColor = null;
    this.colorTheme = 'Grey_mean';
    this.keyList = null;
};

Pattern.prototype.layout = function(layout = undefined, intervals = undefined, id = undefined) {
    // initial variables
    this.wholeLayout = layout == undefined ? this.wholeLayout : layout;
    this.intervals = intervals == undefined ? this.intervals : intervals;
    this.id = id == undefined ? this.id : id;

    // setup
    var pattern = this;
    var selection = frame.widgetList['selection'].operator;
    var data = frame.widgetList['control'].operator.file.data;
    var events = data.events;
    var statis = data.statis;
    var timeline = data.timeline;    
    var attrList = Object.keys(statis).sort();
    attrList.unshift('selection');
    attrList.unshift('empty');
    
    if (!this.drawn) { // never layouted before   
        //initial layout
        var titleBar = $('<div id="patternTitle" '+
            'style="font-size: 12px;width: 100%;height: 15px; padding-left: 5px" '+
            '><h5>Patterns</h5></div>');
        var toolBar = $('<div id="patternTool" '+
            'style="flex-wrap: wrap;display: flex;width: 100%;height: 90px"' + '>');
        var listBar = $('<div id="patternList" style="align-content: start;display: flex; flex-wrap: wrap;overflow: auto;width: 100%; height: calc(100% - 105px)"></div>')
        var dropdownAttr = $('<div id="patternAttr" style="font-size: 12px;height: 18px;display:flex;margin:5px"><h5 style="width: 60px;margin-top: 5px">Filtered By: </h5><div></div></div>');        
        var dropdownSort = $('<div id="patternSort" style="font-size: 12px;height: 18px;display:flex;margin:5px"><h5 style="width: 55px;margin-top: 5px">Sorted By: </h5><div></div></div>');                       
        var dropdownColor = $('<div id="patternColor" style="font-size: 12px;display:flex;margin:5px"><h5 style="width: 40px;margin-top: 5px">Theme: </h5><div></div></div>');                

        this.container.append(titleBar);
        this.container.append(toolBar);
        this.container.append(listBar);
        toolBar.append(dropdownAttr);
        toolBar.append(dropdownSort);
        toolBar.append(dropdownColor);

        dropdownAttr.children('div').jqxDropDownList({template: TEMPLATE, source:attrList, selectedIndex: 0, width: 150, height: 22, autoOpen: false, dropDownWidth: 150});        
        dropdownSort.children('div').jqxDropDownList({template: TEMPLATE, source:['Count (increase)', 'Count (decrease)', 'Time (increase)', 'Time (decrease)', 'Depth (increase)', 'Depth (decrease)', 'Hierachy (increase)', 'Hierachy (decrease)'], selectedIndex: 0, width: '150px', height: 22, autoOpen: false, dropDownWidth: '150px'});                      
        dropdownColor.children('div').jqxDropDownList({template: TEMPLATE, source:['Grey_mean', 'Grey_light', 'Grey_dark', 'Color'], selectedIndex: 0, width: '150px', height: 22, autoOpen: false, dropDownWidth: '150px'});        
        
        dropdownAttr.children('div').off('change');
        dropdownAttr.children('div').on('change', function() {
            // get selected value
            pattern.attr = $(this).jqxDropDownList('getSelectedItem').value;
            pattern.layout();
            if (pattern.attr == "selection")
                dropdownColor.children('div').jqxDropDownList({ disabled: true });
            else
                dropdownColor.children('div').jqxDropDownList({ disabled: false });
        });        

        dropdownSort.children('div').off('change');
        dropdownSort.children('div').on('change', function() {
            pattern.layout();            
        });        

        dropdownColor.children('div').off('change');
        dropdownColor.children('div').on('change', function() {
            pattern.colorTheme = $(this).jqxDropDownList('getSelectedItem').value;
            if (Object.keys(pattern.hitList).length > 0)
                for (var i in pattern.hitList)
                    pattern.hitList[i].layout(pattern.attr);
        });

        // change the pattern interface to be state:drawn
        this.drawn = !this.drawn;
    } else {
        // get layout
        var titleBar = this.container.children('#patternTitle');
        var toolBar = this.container.children('#patternTool');
        var listBar = this.container.children('#patternList');
        listBar.empty();
        this.groupList = {};
        this.hitList = {};

        // create groups
        if (this.intervals != null) {
            var idCount = 0;
            var valueList = statis[this.attr];
            for (var i in this.intervals) {
                var eList = [];
                var currInterval = this.intervals[i];
                var currLayout = [];
                for (var j = currInterval[0] - 1; j < currInterval[1]; j++) {
                    eList.push.apply(eList, this.wholeLayout[timeline[j]]);
                    currLayout.push(this.wholeLayout[timeline[j]].slice());
                }
                // var sampleLayout = $.extend(true, [], currLayout);

                eList = Array.from(new Set(eList)).sort(function(a, b) {
                    return parseInt(a) - parseInt(b);
                });
    
                // replace eventID with elist index
                // if the attr is not null, than replace with the combi of event index and attrval index
                for (j in currLayout) {
                    for (k in currLayout[j]) {            
                        currLayout[j][k] = eList.indexOf(currLayout[j][k]) + 
                            (this.attr == "empty" ? '' : 
                                (this.attr == "selection" ? '_' + selection.getColorByEventID(currLayout[j][k]) : // if selection use color as afteraddress
                                    '_' + events[currLayout[j][k]][this.attr])); // if others, use value of attribute as afteraddress
                    }
                }
                
                var groupIndex = JSON.stringify(currLayout);
    
                if (this.groupList[groupIndex] == undefined) {
                    this.groupList[groupIndex] = {id: (idCount++), count: 1, layout: currLayout, iIndex: [i]};
                }
                else {
                    this.groupList[groupIndex].count += 1;
                    this.groupList[groupIndex].iIndex.push(i);
                }
            }

            for (i in this.groupList) {
                var iIndex = this.groupList[i].iIndex;
                var timecount = 0;
                for (j in iIndex) {
                    var currInter = this.intervals[iIndex[j]]
                    timecount += parseInt(timeline[currInter[1]]) - parseInt(timeline[currInter[0]]);
                }
                this.groupList[i].meantime = ((timecount / this.groupList[i].count) / 1000000).toFixed(2);
            }
    
            // show all the pattern groups
            var keyList = Object.keys(this.groupList);
            var dropdownSort = toolBar.children('#patternSort');
            var sortingMethod = dropdownSort.children('div').jqxDropDownList('getSelectedItem').value;
            if (sortingMethod == 'Count (increase)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[a].count - pattern.groupList[b].count);
                });
            }
            else if (sortingMethod == 'Count (decrease)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[b].count - pattern.groupList[a].count);
                });
            }

            else if (sortingMethod == 'Time (increase)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[a].meantime - pattern.groupList[b].meantime);
                });
            }
            else if (sortingMethod == 'Time (decrease)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[b].meantime - pattern.groupList[a].meantime);
                });
            }
            else if (sortingMethod == 'Depth (increase)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[a].layout[0].length - pattern.groupList[b].layout[0].length);
                });
            }
            else if (sortingMethod == 'Depth (decrease)') {
                keyList.sort(function(a, b) {
                    return (pattern.groupList[b].layout[0].length - pattern.groupList[a].layout[0].length);
                });
            }
            else if (sortingMethod == 'Hierachy (increase)') {
                keyList.sort().reverse();
            }
            else {
                keyList.sort();
            }
            this.keyList = keyList;

            for (i in keyList) {
                this.hitList[keyList[i]] = new Hit(this.groupList[keyList[i]].id, this.groupList[keyList[i]], listBar);
                this.hitList[keyList[i]].layout(this.attr);
            }
        }

        titleBar.children('h5').html('Patterns ' + (this.id == undefined ? '' : 'of <span id="titlebarColor">Query#' + this.id + '</span> ('+Object.keys(this.groupList).length+' groups of ' + this.intervals.length + ' hits)')); 
        $('span#titlebarColor').css('color', '#' + this.titleColor.hex);        
    }
};

Pattern.prototype.updateTitleColor = function(color) {
    this.titleColor = color;
};

Pattern.prototype.clear = function(id) {
    if (this.id == id) {
        var titleBar = this.container.children('#patternTitle');
        var listBar = this.container.children('#patternList');
        
        titleBar.children('h5').html('Patterns');
        this.highlightGroup(null);
        listBar.empty();
    }
};

Pattern.prototype.highlightGroup = function(group) {
    frame.widgetList['Query' + this.id].operator.setHighlightedHitGroup(group);
    frame.widgetList['Query' + this.id].operator.layout();
    frame.widgetList['minimap'].operator.setHighlightedHitGroup(group, this.id);
    frame.widgetList['minimap'].operator.redrawFront();
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

var Hit = function(id, group, pContainer) {
    this.id = id;
    this.group = group
    this.hitLayout = group.layout;
    this.pContainer = pContainer;
    this.pathList = {};
    this.stringIndex = null; // string conducted based on the operation order and sorting attribute
    this.unitHeight = 4;
    this.gapY = 1;
    this.unitWidth = (pContainer.width() - 15) / (this.hitLayout.length - 1);
    this.ebLayout = this.layoutTransfer(this.hitLayout);
};

Hit.prototype.layout = function(attr) {
    var events = frame.widgetList['control'].operator.file.data.events;
    var hit = this;
    var height = 0;
    this.hitLayout.forEach(function(x) {
        var len = x.length;
        height = len > height ? len : height;
    });
    var svgHeight = (height + 1) * (this.unitHeight + this.gapY) + 10;
    var svgWidth = this.pContainer.width() / 2 - 10;
    var toolBarHeight = 30;

    // add the container of current hit
    if (this.pContainer.children('#hit' + this.id).length < 1) {
        // create child container
        var cContainer = $('<div class="hits" id="hit'+this.id+'" style="background-color: #35353A;box-sizing: border-box;border: 5px solid #222222;width: 100%;height: '+(svgHeight+toolBarHeight)+'px"></div>');
        this.pContainer.append(cContainer);
        
        // create svg
        var toolBar = $('<div class="hitToolBar" id="hitToolBar'+this.id+'" style="padding-left: 5px;width: calc(100% - 5px);height: '+toolBarHeight+'px;display: flex"></div>')
        var svg = $('<svg id="hitSvg'+this.id+'"></svg>');
        cContainer.append(toolBar);
        cContainer.append(svg);

        // add contents to toolbar
        var title = $('<h5 style="font-size: 10px;width: calc(100% - 30px)">Group #'+this.id+' ('+this.group.count+' hits, avgTime '+this.group.meantime+'s)</h5>');
        var buttonHighlight = $('<div class="border" style="width:50px !important"><input data-selected="N" id="hgHighlight'+this.id+'" type="button" value="Mark"></input></div>');
        toolBar.append(title);
        toolBar.append(buttonHighlight);

        // setup and set response to the highlight button
        buttonHighlight.children('input').jqxButton({template: TEMPLATE});
        buttonHighlight.children('input').off('click');
        buttonHighlight.children('input').on('click', function() {
            var currToolBar = cContainer.children('.hitToolBar');
            if ($(this).attr('data-selected') == "N") {
                // update the related detailed view
                frame.widgetList['pattern'].operator.highlightGroup(hit.group);
            
                // highlight the selected group in the pattern panel
                hit.pContainer.children('.hits').each(function() {
                    var toolBar = $(this).children('.hitToolBar');
                    if (toolBar.children('div').children('input').attr('data-selected') == "Y") {
                        toolBar.css('background-color', '#35353A');
                        toolBar.children('div').children('input').attr('data-selected', 'N');
                    }
                })
                
                $(this).attr('data-selected', "Y");
                currToolBar.css('background-color', 'red');
            }
            else {
                // clear the highlight group from both minimap and related detailed view
                frame.widgetList['pattern'].operator.highlightGroup(null);

                // remove the highlight from the pattern panel
                $(this).attr('data-selected', "N");
                currToolBar.css('background-color', '#35353A');
            }
        });        
    }
    else {
        var cContainer = this.pContainer.children('#hit' + this.id);
        var toolBar = cContainer.children('#hitToolBar' + this.id);
        var svg = cContainer.children('#hitSvg' + this.id);
        svg.empty();
    }
    
    // draw svg elements
    var draw = SVG("hitSvg" + this.id).size('100%', svgHeight);
    var selection = frame.widgetList['selection'].operator;

    for (var i in this.ebLayout) {
        // draw lines and markers
        var value = i.split('_')[1];
        if (value != undefined) value = value.replace(/[^a-z0-9]/gi,''); 
        var colorTheme = frame.widgetList['pattern'].operator.colorTheme;
        var fillColor = attr == 'empty' ? 'white' : 
            (attr == 'selection' ? '#' + value : 
                string2HEX(strReverse(value), colorTheme));
        var content = "";
        var lenJ = this.ebLayout[i].length;
        for (var j = 0; j < lenJ; j++) {
            if (j == 0)
                content += "M" + (this.ebLayout[i][j][0] * this.unitWidth + this.unitHeight / 2) + " " +
                    ((svgHeight - 10) - this.ebLayout[i][j][1] * (this.unitHeight + this.gapY) - this.unitHeight * 1.5);
            else
                content += "L" + (this.ebLayout[i][j][0] * this.unitWidth + this.unitHeight / 2) + " " +
                    ((svgHeight - 10) - this.ebLayout[i][j][1] * (this.unitHeight + this.gapY) - this.unitHeight * 1.5);
        }
        this.pathList[i] = draw.path(content).fill('none').stroke({color: fillColor, width: this.unitHeight});
        this.pathList[i].data('value', value);
        this.pathList[i].off('mouseover');
        this.pathList[i].on('mouseover', function(event) {
            this.off('mousemove');
            this.on('mousemove', function(event) {
                var tooltip = $('#tooltip');
                tooltip.css('display', 'block');
                tooltip.css('background-color', 'black');
                var tooltipText = '<tr><th>Attribute</th><th>&nbsp&nbsp</th><th>Value</th></tr>';
                tooltipText += '<tr><td>'+attr+'</td><td>&nbsp&nbsp</td><td>'+this.data('value')+'</td></tr>';
                tooltip.html(tooltipText);
                tooltip.css('left', (event.pageX) + "px");
                tooltip.css('top', (event.pageY - 50) + "px");
            });
        });
        this.pathList[i].off('mouseout');
        this.pathList[i].on('mouseout', function(event) {
            this.off('mousemove');
            var tooltip = $('#tooltip');            
            tooltip.css('display', 'none');
            tooltip.css('background-color', 'f5cfcf99')
        });
    }
}

Hit.prototype.layoutTransfer = function(layout) {
    // create event-based layout
    var ebLayout = {}, event;
    var lenI = layout.length;
    for (var i = 0; i < lenI; i++) {
        var lenJ = layout[i].length;
        for (var j = 0; j < lenJ; j++) {
            event = layout[i][j];
            if (ebLayout[event] == undefined)
                ebLayout[event] = [[i, j]];
            else
                ebLayout[event].push([i, j]);
        }
    }

    // simplify event-based layout
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
    
    return ebLayout;
}