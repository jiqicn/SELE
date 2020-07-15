/**
 * Control operator class
 */

var Control = function() {
    this.file = {
        name: null,
        type: null,
        data: {}
    };
    this.setting = {
        keyStart: null,
        keyEnd: null,
        segLength: 5000,
        segWidthClose: 50,
        segWidthOpen: 800,
        gapX: 5,
        gapY: 3
    }
    this.container = null;
    this.saved = false;
    this.prevent = false;
    this.frameChanged = false;
}

Control.prototype.layout = function() {
    // setup the container
    var control = this;
    this.container.css("overflow-y", "scroll");

    // initial components
    var legendLoad = $("<h5>Input file (.xes / .txt)</h5>");
    var buttonLoadHide = $('<input type="file" style="display:none"></input>');
    var buttonLoadShow = $('<div class="border"><input type="button" value="Browes"></input></div>');
    var legendKeys = $('<h5><spam style="color:orange">START</spam> and <spam style="color:orange">END</spam> attributes</h5>');
    var dropdownStart = $('<div class="border"><div></div></div>');
    var dropdownEnd = $('<div class="border"><div></div></div>');
    var legendSetting = $('<h5>Settings</h5>')
    var sliderSegLen = $('<div class="border slider"><h6>Segment Length</h6><div></div></div>');
    var sliderSegWidthClose = $('<div class="border slider"><h6>Segment Width Closed</h6><div><div></div>');
    var sliderSegWidthOpen = $('<div class="border slider"><h6>Segment Width Open</h6><div><div></div>');
    var sliderGapX = $('<div class="border slider"><h6>X-axis Gap</h6><div><div></div>');    
    var sliderGapY = $('<div class="border slider"><h6>Y-axis Gap</h6><div><div></div>'); 
    var legendRun = $('<h5>Run Visualization</h5>');
    var buttonRun = $('<div class="border"><input type="button" value="Run"></input></div>');
    
    // layout components
    this.container.append(legendLoad);
    this.container.append(buttonLoadHide);
    this.container.append(buttonLoadShow);
    this.container.append(legendKeys);
    this.container.append(dropdownStart);
    this.container.append(dropdownEnd);
    this.container.append(legendSetting);
    this.container.append(sliderSegLen);
    this.container.append(sliderSegWidthClose);
    this.container.append(sliderSegWidthOpen);
    this.container.append(sliderGapX);
    this.container.append(sliderGapY);
    this.container.append(legendRun);
    this.container.append(buttonRun);

    // build components
    buttonLoadShow.children("input").jqxButton({template: TEMPLATE, width: '100%'});
    dropdownStart.children("div").jqxDropDownList({template: TEMPLATE, source:[], selectedIndex: 0, width: '100%', autoOpen: false});
    dropdownEnd.children("div").jqxDropDownList({template: TEMPLATE, source:[], selectedIndex: 0, width: '100%', autoOpen: false});
    dropdownStart.children("div").jqxDropDownList('setContent', 'Time Start');
    dropdownEnd.children("div").jqxDropDownList('setContent', 'Time End');    
    sliderSegLen.children("div").jqxSlider({ template: TEMPLATE, tooltip: true, mode: 'fixed', width: '100%', min: 1000, max: 9000, step: 1000, ticksFrequency: 1000, value: this.setting.segLength, showTickLabels: true});
    sliderSegWidthClose.children("div").jqxSlider({ template: TEMPLATE, tooltip: true, mode: 'fixed', width: '100%', min: 30, max: 70, step: 5, ticksFrequency: 5, value: this.setting.segWidthClose});
    sliderSegWidthOpen.children("div").jqxSlider({ template: TEMPLATE, tooltip: true, mode: 'fixed', width: '100%', min: 500, max: 1100, step: 100, ticksFrequency: 100, value: this.setting.segWidthOpen});
    sliderGapX.children('div').jqxSlider({ template: TEMPLATE, tooltip: true, mode: 'fixed', width: '100%', min: 3, max: 7, step: 1, ticksFrequency: 1, value: this.setting.gapX});
    sliderGapY.children('div').jqxSlider({ template: TEMPLATE, tooltip: true, mode: 'fixed', width: '100%', min: 1, max: 5, step: 1, ticksFrequency: 1, value: this.setting.gapY});    
    buttonRun.children('input').jqxButton({template: TEMPLATE, width: '100%'});
    legendLoad.jqxTooltip({content: "Load the data file of software event logs as input. Format of this file could be either .xes or .txt.", position: "mouse", width: 200});
    legendKeys.jqxTooltip({content: "Choose the attributes of start and end timestamp from all the attributes logged in the data file.", position: "mouse", width: 200});
    legendSetting.jqxTooltip({content: "Settings of different widgets", position: "mouse"});
    sliderSegLen.children('h6').jqxTooltip({content: "This is to set how many time points are involved in each of the segment in the minimap.", position: "mouse", width: 200});
    sliderSegWidthClose.children('h6').jqxTooltip({content: "This is to set the width of segments when no segment is closed.", position: "mouse", width: 200});
    sliderSegWidthOpen.children('h6').jqxTooltip({content: "This is to set the width of opened segments, while the rest segments are then reduced to half-size.", position: "mouse", width: 200});
    sliderGapX.children('h6').jqxTooltip({content: "This is to set the gap between timepoins on the x-axis of the detailed view.", position: "mouse", width: 200});    
    sliderGapY.children('h6').jqxTooltip({content: "This is to set the gap between event lines on the y-axis of the detailed view.", position: "mouse", width: 200});    
    legendRun.jqxTooltip({content: "Run the visualization to show the minimap and detailed view.", position: "mouse", width: 200});        

    // event responses
    buttonLoadShow.children('input').on('click', function(){buttonLoadHide.trigger('click')});
    buttonLoadHide.on('change', function(evt){
        var file = evt.target.files[0];
        if (file) {
            control.file.name = file.name.split('.')[0];
            control.file.type = file.name.split('.')[1];
            var reader = new FileReader();
            reader.onload = function(evt) {
                if (control.file.type == "xes") {
                    // get events
                    var data = evt.target.result;
                    console.log('start parsing...')
                    console.time('xml parsing');                    
                    var parser = new DOMParser();
                    var xml = parser.parseFromString(data, "text/xml");
                    // var json = xmlToJSON.parseString(data);
                    console.timeEnd('xml parsing');
                    var events = xml.getElementsByTagName("trace")[0].getElementsByTagName("event");
                    
                    var numEvent = events.length, tempObj;
                    control.file.data.events = [];
                    console.log('start transfering...')
                    console.time('transfer')
                    for (var i = 0; i < numEvent; i++) {
                        var contents = events[i].getElementsByTagName('string');
                        contents = Array.from(contents);
                        tempObj = {};
                        contents.map(function(el) {
                            var key = el.getAttribute('key');
                            var val = el.getAttribute('value');
                            tempObj[key] = val;
                        });
                        control.file.data.events.push(tempObj);
                    }
                    console.timeEnd('transfer')                      
                    
                    // console.log('start transfering...')
                    // console.time('transfer')
                    // var events = json.log[0].trace[0].event;
                    // var numEvent = events.length;
                    // control.file.data.events = [];
                    // for (var i = 0; i < numEvent; i++) {
                    //     var contents = events[i].string;
                    //     var tempObject = {};
                    //     contents.map(function(el) {
                    //         var attr = el['_attr'];
                    //         tempObject[attr.key['_value']] = attr.value['_value'];
                    //     });
                    //     control.file.data.events.push(tempObject);                     
                    // }
                    // console.timeEnd('transfer')  

                    // // transfer to object
                    // var i, j, numEvent = events.length, numChild, key, value, tempEvent;
                    // control.file.data.events = []; // empty the file object
                    // console.log('Number of events: ' + numEvent);
                    // console.log('start transfering...')
                    // for (i = 0; i < numEvent; i++) {
                    //     numChild = events[i].children.length;
                    //     tempEvent = {};
                    //     console.time('transfer: '+i+'...')
                    //     for (j = 0; j < numChild; j++) { // for each attribute
                    //         var attrs = events[i].children[j].attributes;
                    //         // key = events[i].children[j].attributes[0].nodeValue;
                    //         // value = events[i].children[j].attributes[1].nodeValue;
                    //         key = attrs[0].nodeValue;
                    //         value = attrs[1].nodeValue;
                    //         tempEvent[key] = value            
                    //     }                
                    //     console.timeEnd('transfer: '+i+'...')                             
                    //     control.file.data.events.push(tempEvent);
                    // }
                    // console.log('end transfering...')

                    // // for combinition
                    // var tempDict = {}
                    // for (i = 0; i < numEvent; i++) {
                    //     var id = control.file.data.events[i]['concept:name'] + " " + control.file.data.events[i]['software:threadid']
                    //     if (id in tempDict)
                    //         if (control.file.data.events[i]['lifecycle:transition'] == "Start")
                    //             tempDict[id].start.push(i)
                    //         else
                    //             tempDict[id].end.push(i)
                    //     else {
                    //         tempDict[id] = {start: [], end: []}
                    //         if (control.file.data.events[i]['lifecycle:transition'] == "Start")
                    //             tempDict[id].start.push(i)
                    //         else
                    //             tempDict[id].end.push(i)
                    //     }
                    // }

                    // var keys = Object.keys(control.file.data.events[0]);
                    // remove(keys, "software:starttimenano");

                    // var intervalEvents = []
                    // for (i in tempDict) {
                    //     var len = tempDict[i].start.length;
                    //     while (tempDict[i].end.length > 0) {
                    //         var ei = tempDict[i].end[0];
                    //         tempDict[i].end.shift();
                    //         for (l = 0; l < tempDict[i].start.length; l++) {
                    //             if (tempDict[i].start[l] < ei)
                    //                 continue;
                    //             else
                    //                 break;
                    //         }
                    //         var si = tempDict[i].start[l - 1];
                    //         remove(tempDict[i].start, si);

                    //         var tempEvent = {};
                    //         var se = control.file.data.events[si];
                    //         var ee = control.file.data.events[ei];

                    //         for (k in keys) {
                    //             if (se[keys[k]] == ee[keys[k]])
                    //                 tempEvent[keys[k]] = se[keys[k]];
                    //             else
                    //                 tempEvent[keys[k]] = se[keys[k]] + " " + ee[keys[k]];
                    //         }
                    //         tempEvent["starttimenano"] = se["software:starttimenano"];
                    //         tempEvent["endtimenano"] = ee["software:starttimenano"];
                    //         intervalEvents.push(tempEvent)
                    //     }
                    // }
                    // intervalEvents.sort(function(x, y) {
                    //     return parseInt(x['starttimenano']) - parseInt(y['starttimenano']);
                    // });
                    // control.file.data.events = intervalEvents;
                    // console.log(intervalEvents);

                    function remove(array, element) {
                        const index = array.indexOf(element);
                        array.splice(index, 1);
                    }
                    
                    // get the key list
                    var keys = []
                    for (i = 0; i < 10; i++)
                        keys = keys.concat(Object.keys(control.file.data.events[i]));
                    keys = Array.from(new Set(keys));
                    control.file.data.keys = keys;
                    resetOptions(dropdownStart, control.file.data.keys);
                    resetOptions(dropdownEnd, control.file.data.keys);
                    dropdownStart.children("div").jqxDropDownList('setContent', 'Time Start');
                    dropdownEnd.children("div").jqxDropDownList('setContent', 'Time End');

                    // reset the options for dropdownlist
                    function resetOptions(dropdownList, options) {
                        dropdownList.children('div').jqxDropDownList('clear');
                        for (var i in options)
                            dropdownList.children('div').jqxDropDownList('addItem', {label: options[i], value: options[i]});
                    }
                }
                else if (control.file.type == "txt") {
                    control.file.data = JSON.parse(evt.target.result);
                    control.file.data.timeline = Object.keys(control.file.data.layout);
                    control.file.data.timeline = control.file.data.timeline.sort(function(a, b) {return parseInt(a) - parseInt(b)})
                    control.setting.keyStart = control.file.data.keyStart;
                    control.setting.keyEnd = control.file.data.keyEnd;
                    dropdownStart.children("div").jqxDropDownList('setContent', control.setting.keyStart);
                    dropdownEnd.children("div").jqxDropDownList('setContent', control.setting.keyEnd);
                    dropdownStart.children("div").jqxDropDownList({ disabled: true });
                    dropdownEnd.children("div").jqxDropDownList({ disabled: true });                    
                }
                else {
                    alert("Input format should be either .xes or .txt!");
                }
            }
            reader.readAsText(file);
        }
    });
    dropdownStart.children('div').on('change', function(evt){
        control.file.data.keyStart = dropdownStart.children('div').jqxDropDownList('getSelectedItem').value;
        control.setting.keyStart = control.file.data.keyStart;
    });
    dropdownEnd.children('div').on('change', function(evt){
        control.file.data.keyEnd = dropdownEnd.children('div').jqxDropDownList('getSelectedItem').value;
        control.setting.keyEnd = control.file.data.keyEnd;
    });
    sliderSegLen.children('div').on("change", function(){
        control.setting.segLength = sliderSegLen.children('div').jqxSlider('val');
        control.frameChanged = true;
    });
    sliderSegWidthClose.children('div').on("change", function(){
        control.setting.segWidthClose = sliderSegWidthClose.children('div').jqxSlider('val');
        control.frameChanged = true;
        
    });
    sliderSegWidthOpen.children('div').on("change", function(){
        control.setting.segWidthOpen = sliderSegWidthOpen.children('div').jqxSlider('val');
        control.frameChanged = true;        
    });
    sliderGapX.children('div').on("change", function(){
        control.setting.gapX = sliderGapX.children('div').jqxSlider('val');
    });
    sliderGapY.children('div').on("change", function(){
        control.setting.gapY = sliderGapY.children('div').jqxSlider('val');
    });   
    buttonRun.children('input').on('click', function(){
        if (control.file.name == null) {
            alert("Please load the input file firstly!");
            return;
        }

        // process the data
        if (control.file.type == 'xes') {
            // setup the data gonna be recorded
            var timeline = [];
            var layout = {};
            var statis = {};
            var start = control.file.data.keyStart;
            var end = control.file.data.keyEnd;
            var i, j, numEvent = control.file.data.events.length;
            control.file.data.events.sort(function(a, b){
                return parseInt(a[start]) - parseInt(b[start]);
            });

            // compute the timeline
            for (i = 0; i < numEvent; i++) {
                timeline.push(control.file.data.events[i][start]);
                timeline.push(control.file.data.events[i][end]);
            }
            timeline = Array.from(new Set(timeline)); // remove duplication
            timeline.sort(function(a, b) {
                return parseInt(a) - parseInt(b);
            });
            control.file.data.timeline = timeline;
            console.log('timeline length: ' + timeline.length);

            // compute the layout
            console.log('start layout...')
            console.time("Layout");        
            var numTime = timeline.length, indexS, indexE, indexDict = {};
            for (i = 0; i < numTime; i++) { // initialize layout
                layout[timeline[i]] = [];
                indexDict[timeline[i]] = i;
            }

            for (i = 0; i < numEvent; i++) { // fill in layout data one by one                           
                indexS = indexDict[control.file.data.events[i][start]];
                indexE = indexDict[control.file.data.events[i][end]];                                
                
                for (j = indexS; j <= indexE; j++) {
                    layout[timeline[j]].push(i);
                }
                control.file.data.events[i].indexStart = indexS;       
                control.file.data.events[i].indexEnd = indexE;       
            }
            control.file.data.layout = layout;
            console.timeEnd("Layout");        

            // compute the statis
            console.log('start statis...')
            console.time("Statis");                
            var keysNSE = $.extend(true, [], control.file.data.keys);
            keysNSE = keysNSE.filter(function(x){if (x != start && x != end) return x});
            var numKey = keysNSE.length, key, value;
            for (i = 0; i < numKey; i++) { // initialize statis
                statis[keysNSE[i]] = {};
            }
            for (i = 0; i < numEvent; i++) {
                for (j = 0; j < numKey; j++) {
                    key = keysNSE[j];
                    value = control.file.data.events[i][key];
                    if (statis[key][value] == undefined)
                        statis[key][value] = [i];
                    else
                        statis[key][value].push(i);
                }
            }
            control.file.data.statis = statis;
            console.timeEnd("Statis");    
            
            // save the output
            if (!control.saved) {
                var outputFile = new File([JSON.stringify(control.file.data)], "Output.txt", {type: "text/plain;charset=utf-8"});
                saveAs(outputFile);
                control.saved = true;
            }
        }
        
        // active the minimap, detail, and attrval widget
        if (!control.prevent) { // for the first time of pressing the run button
            frame.widgetList['minimap'].setOperator(Minimap);
            frame.widgetList['minimap'].operator.layout();   
            
            frame.widgetList['detail'].setOperator(Detail);
            frame.widgetList['detail'].operator.layout();    
            
            frame.widgetList['attrval'].setOperator(Attrval);
            // frame.widgetList['attrval'].operator.layout();
            $('#attrval').draggable({handle: 'div#title'});
            
            frame.widgetList['selection'].setOperator(Selection);
            frame.widgetList['selection'].operator.layout();

            frame.widgetList['query'].setOperator(Query);
            frame.widgetList['query'].operator.layout();

            frame.widgetList['pattern'].setOperator(Pattern);
            frame.widgetList['pattern'].operator.layout();

            control.prevent = true;
        }
        else {
            if (control.frameChanged) { // if change the segLength, segWidthClosed, segWidthOpen, relayout the minimap, otherwise just redraw
                frame.widgetList['minimap'].operator.layout();
                frame.widgetList['selection'].operator.updateSelection(); 
                control.frameChanged = false;
            }
            frame.widgetList['minimap'].operator.redraw();
            frame.widgetList['detail'].operator.layout();            
        }

        $('#message').jqxNotification({
            theme: 'metrodark',
            width: 200, position: "top-right", opacity: 0.9,
            autoOpen: false, animationOpenDelay: 800, autoClose: true, autoCloseDelay: 3000, template: "info"
        });

        // // update all the selection views
        // var selectionKeys = Object.keys(frame.widgetList);
        // selectionKeys = selectionKeys.filter(function(x) {
        //     if (x.indexOf("Selection") > -1 || x.indexOf("Query") > -1) return x
        // });
        // for (i in selectionKeys) {
        //     frame.widgetList[selectionKeys[i]].operator.layout();
        // } 
        control.updateViews();
    });
}

Control.prototype.updateViews = function() {
    var selectionKeys = Object.keys(frame.widgetList);
    selectionKeys = selectionKeys.filter(function(x) {
        if (x.indexOf("Selection") > -1 || x.indexOf("Query") > -1) return x
    });
    selectionKeys.push('detail');
    for (i in selectionKeys) {
        frame.widgetList[selectionKeys[i]].operator.layout();
    }  
}