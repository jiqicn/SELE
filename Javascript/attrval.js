var Attrval = function() {
    this.container = $('#attrval');
    this.attrList = Object.keys(frame.widgetList['control'].operator.file.data.statis);
    this.leftAttr = this.attrList[0];
    this.operation = 'EQUAL';
    this.rightChoice = 'ATTRS'
    this.rightAttr = null;
    this.rightVals = null;
    this.totalEventNum = null;
    this.selection = null;
    this.dataStatis = null;
    this.initialized = false;
};

Attrval.prototype.layout = function(statis, x, y) {
    // style the window
    this.container.css('display', 'block');
    this.container.css('left', x + "px");
    this.container.css('top', y + "px");

    // data process;
    this.dataStatis = statis;
    var selectedData = statis[this.leftAttr];
    this.totalEventNum = 0;
    var data = [];
    for (i in selectedData) {
        data.push({
            Value: i,
            Occurrence: selectedData[i].length
        });
        this.totalEventNum += selectedData[i].length;
    }
    var source = {
        localData: data,
        dataType: "array",
        dataFields:
        [
            { name: 'Value', type: 'string' },
            { name: 'Occurrence', type: 'number' },
        ]
    }
    var dataAdapter = new $.jqx.dataAdapter(source);

    // setup
    var buttonSubmit = this.container.children('#title').children('#submit');
    var buttonRemove = this.container.children('#title').children('#close');
    var listLeft = this.container.children('#view').children('#left');
    var listRight = this.container.children('#view').children('#right');
    var barRatio = this.container.children('#ratio');
    var tabs = this.container.children('#view').children('#tabs');
    var operaEqual = this.container.children('#view').children('#opera').children('#equal');
    var operaNotEqual = this.container.children('#view').children('#opera').children('#notequal');
    var rightViewAttrs = listRight.children('#attrs');
    var rightViewVals = listRight.children('#vals');
    var tabAttrs = tabs.children('#attrs');
    var tabVals = tabs.children('#vals');
    var attrval = this;

    // udpate the data table
    barRatio.jqxProgressBar({theme: 'metrodark', width: "100%", height: 5, animationDuration: 0, value: 0});    
    rightViewVals.children('div').jqxDataTable({
        width: '100%',
        height: '100%',
        filterable: true,
        filterMode: "advanced",
        theme: 'metrodark',
        selectionMode: 'multipleRows',
        toolbarHeight: 20,
        sortable: true,
        source: dataAdapter,
        columnsResize: true,
        columns: [
            { text: 'Value', dataField: 'Value'},
            { text: 'Freq', dataField: 'Occurrence', width: 50},
        ]
    });

    if (!this.initialized) {
        // layout components
        buttonSubmit.children('input').jqxButton({template: TEMPLATE, width: '70px', height: 15});
        buttonRemove.children('input').jqxButton({template: TEMPLATE, width: '70px', height: 15});
        listLeft.jqxListBox({theme: 'metrodark', selectedIndex: 0, source: this.attrList, width: '43%', height: '100%', rtl: true});
        operaEqual.jqxRadioButton({theme: 'metrodark', height: 25, checked: true});
        operaNotEqual.jqxRadioButton({theme: 'metrodark', height: 25});
        rightViewAttrs.jqxListBox({theme: 'metrodark', source: this.attrList, width: '100%', height: '100%'});    
        
        // event response    
        buttonRemove.children('input').on('click', function() {
            attrval.hide();
        });
        buttonSubmit.children('input').on('click', function() {
            var message = $('#message');
            var selection = attrval.getSelection();
            if (!selection)
                message.jqxNotification('open');
            else {
                var statis = {};
                var events = frame.widgetList['control'].operator.file.data.events;
                for (i in attrval.attrList)
                    statis[attrval.attrList[i]] = {};
                for (i in selection) {
                    var index = selection[i]
                    var event = events[index];
                    for (j in attrval.attrList) {
                        var attr = attrval.attrList[j];
                        var val = event[attr];
                        if (statis[attr][val] == undefined)
                            statis[attr][val] = [index];
                        else
                            statis[attr][val].push(index);
                    }
                }
                attrval.hide();
                frame.widgetList['selection'].operator.addSelection(statis, selection);
            }
        });
        tabAttrs.on('click', function() {
            if ($(this).css('color') != "rgb(255, 165, 0)") {
                $(this).css('color', "rgb(255, 165, 0)");
                tabVals.css('color', 'white');
                rightViewAttrs.css('display', 'block');
                rightViewVals.css('display', 'none');
                attrval.rightChoice = 'ATTRS';
                setRatio();
            }
        });
        tabVals.on('click', function() {
            if ($(this).css('color') != "rgb(255, 165, 0)") {
                $(this).css('color', "rgb(255, 165, 0)");
                tabAttrs.css('color', 'white');            
                rightViewAttrs.css('display', 'none');
                rightViewVals.css('display', 'block');
                attrval.rightChoice = 'VALS';
                setRatio();
            }
        });
        listLeft.on('change', function(event) {
            attrval.leftAttr = event.args.item.label;
            attrval.rightVals = null;
            selectedData = attrval.dataStatis[attrval.leftAttr];
            data = [];
            for (i in selectedData) {
                data.push({
                    Value: i,
                    Occurrence: selectedData[i].length
                });
            }
            source.localData = data;
            dataAdapter = new $.jqx.dataAdapter(source);
            rightViewVals.children('div').jqxDataTable({
                width: '100%',
                height: '100%',
                filterable: true,
                filterMode: "advanced",
                theme: 'metrodark',
                selectionMode: 'multipleRows',
                toolbarHeight: 20,
                sortable: true,
                source: dataAdapter,
                columnsResize: true,
                columns: [
                    { text: 'Value', dataField: 'Value'},
                    { text: 'Freq', dataField: 'Occurrence', width: 50},
                ]
            });
            setRatio();
        });
        operaEqual.on('checked', function() {
            attrval.operation = 'EQUAL';
            setRatio();
        });
        operaNotEqual.on('checked', function() {
            attrval.operation = 'NOT_EQUAL';
            setRatio();
        });
        rightViewAttrs.on('change', function(event) {
            attrval.rightAttr = event.args.item.label;
            setRatio();
        });
        rightViewVals.children('div').on('rowSelect', function(event) {
            attrval.rightVals = $(this).jqxDataTable('getSelection');
            setRatio();
        });
        this.initialized = true;
    }    

    function setRatio() {
        var selection = attrval.getSelection();
        if (!selection)
            var value = 0;
        else 
            var value = (selection.length / attrval.totalEventNum) * 100;
        barRatio.jqxProgressBar('val', value);
    }
};

Attrval.prototype.getSelection = function() {
    if (this.rightChoice == "ATTRS") {
        if (this.rightAttr == null) {
            return false;
        }        
        else {
            var leftValList = Object.keys(this.dataStatis[this.leftAttr]);
            var rightValList = Object.keys(this.dataStatis[this.rightAttr]);
            var commonList = leftValList.filter(el => rightValList.includes(el));
            var result = [];
            for (i in commonList) {
                var value = commonList[i];
                var leftList = this.dataStatis[this.leftAttr][value];
                var rightList = this.dataStatis[this.rightAttr][value];          
                var temp = leftList.filter(el => rightList.includes(el));
                result = result.concat(temp);
            }
            
            // if the operation is not equal, get the rest part
            if (this.operation != 'EQUAL') {
                result.sort(function(a, b) {return a - b;});
                var rest = []
                for (i = 0; i < this.totalEventNum; i++) {
                    if (i == result[0]) {
                        result.shift();
                    }
                    else
                        rest.push(i);
                }
                result = rest;  
            }
        
            return result;            
        }
    } else {
        if (this.rightVals == null) {
            return false;
        }
        else {
            var result = [];            
            if (this.operation == 'EQUAL') { 
                // if the operation is equal
                var restValList = this.rightVals.map(a => a.Value);
            } else {
                var wholeValList = Object.keys(this.dataStatis[this.leftAttr]);
                var rightVals = this.rightVals.map(a => a.Value);
                var restValList = wholeValList.filter(function(el) {
                    return !rightVals.includes(el);
                });

            }
            for (i in restValList) {
                var value = restValList[i];
                var temp = this.dataStatis[this.leftAttr][value]
                result = result.concat(temp);
            }

            return result;
        }
    }
};

Attrval.prototype.hide = function() {
    this.container.css('display', 'none');
};

Attrval.prototype.isActived = function() {
    return this.container.css('display') != 'none';
};

// var Attrval = function() {
//     this.container = null;
//     this.color = null;
// }

// Attrval.prototype.layout = function() {
//     var attrval = this;
//     var data = frame.widgetList['control'].operator.file.data;
//     var statis = data.statis;
//     var attrList = Object.keys(statis).sort();
//     var selectedAttr = attrList[0];
//     var selectedData = statis[selectedAttr];
//     var data = [];
//     for (i in selectedData) {
//         data.push({
//             Value: i,
//             Occurrence: selectedData[i].length
//         });
//     }
//     var source = {
//         localData: data,
//         dataType: "array",
//         dataFields:
//         [
//             { name: 'Value', type: 'string' },
//             { name: 'Occurrence', type: 'number' },
//         ]
//     }
//     var dataAdapter = new $.jqx.dataAdapter(source);
    
//     // setup and layout components

//     var toolbar = $('<div id="toolbar" style="width:100%;height:35px;display:flex"></div>');
//     var dropdownAttr = $('<div id="dropdownAttr" style="width:50%;margin:5px"><div></div></div>');
//     var dropdownColor = $('<div id="dropdownColor" style="width:60px;margin:5px"><div id="dropDownButton"></div></div>');
//     var colorPicker = $('<div id="colorPicker" style="padding:3px"><div id="picker" style="float:left"></div></div>');
//     var buttonSelect = $('<div id="buttonSelect" style="width:calc(50% - 60px);margin:5px"><input type="button" value="Select"></input></div>')
//     var table = $('<div id="table" style="width:100%;height:calc(100% - 35px)"><div></div></div>');

//     toolbar.append(dropdownAttr);
//     toolbar.append(dropdownColor); 
//     toolbar.append(buttonSelect);
//     dropdownColor.children('#dropDownButton').append(colorPicker);
//     this.container.append(toolbar);
//     this.container.append(table);

//     // build components
//     dropdownAttr.children('div').jqxDropDownList({template: TEMPLATE, source:attrList, selectedIndex: 0, width: '100%', height: 22, autoOpen: false, dropDownWidth: '200px'});
//     colorPicker.children('#picker').jqxColorPicker({ color: "ffaabb", colorMode: 'hue', width: 220, height: 220});
//     dropdownColor.children('#dropDownButton').jqxDropDownButton({template: TEMPLATE, width: '100%', height: 22, animationType: 'fade'});
//     buttonSelect.children('input').jqxButton({template: TEMPLATE, width: '100%', height: 24});
//     table.children('div').jqxDataTable({
//         width: '100%',
//         height: '100%',
//         filterable: true,
//         filterMode: "advanced",
//         theme: 'metrodark',
//         selectionMode: 'multipleRows',
//         showToolbar: true,
//         toolbarHeight: 20,
//         sortable: true,
//         source: dataAdapter,
//         columnsResize: true,
//         renderToolbar: function(toolbar) {
//             toolbar.text('Number of values: '+data.length);
//         },
//         columns: [
//             { text: 'Value', dataField: 'Value'},
//             { text: 'Freq', dataField: 'Occurrence', width: 50},
//         ]
//     });
    
//     // event response
//     colorPicker.children('div').on('colorchange', function (event) {
//         dropdownColor.children("#dropDownButton").jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
//         attrval.color = event.args.color;
//     });
//     buttonSelect.children('input').on('click', function() {
//         if (attrval.color == null) {
//             alert('Please choose a color before seleting!');
//             return;
//         }
//         else if (table.children('div').jqxDataTable('getSelection').length < 1) {
//             alert('Please select at least one value from the table!');
//             return;
//         } 
//         var query = {
//             color: '#' + attrval.color.hex.toString(),
//             attr: selectedAttr,
//             values: table.children('div').jqxDataTable('getSelection')
//         };

//         // update the selection list
//         frame.widgetList['selection'].operator.addSelection(query);
//     });
//     table.children('div').on('filter', function(evt){
//         if (evt.args.filters.length < 1) {
//             // no filter is actived
//             var number = table.children('div').jqxDataTable('getRows').length;
//         } else 
//             var number = table.children('div').jqxDataTable('getView').length;
//         table.children('div').jqxDataTable({renderToolbar: function(toolbar) {
//             toolbar.text('Number of values: '+number);
//         }});
//         table.children('div').jqxDataTable('render'); // refresh the content of table 
//     });
//     dropdownAttr.children('div').on('change', function(){
//         selectedAttr = $(this).jqxDropDownList('getSelectedItem').value;
//         selectedData = statis[selectedAttr];
//         data = [];
//         for (i in selectedData) {
//             data.push({
//                 Value: i,
//                 Occurrence: selectedData[i].length
//             });
//         }
//         source.localData = data;
//         dataAdapter = new $.jqx.dataAdapter(source);
//         table.children('div').jqxDataTable('updateBoundData');
//         table.children('div').jqxDataTable('clearFilters');     
//         table.children('div').jqxDataTable({renderToolbar: function(toolbar) {
//             toolbar.text('Number of values: '+data.length);
//         }});   
//         table.children('div').jqxDataTable('render'); // refresh the content of table        
//     });

//     // additional function
//     function getTextElementByColor(color) {
//         if (color == 'transparent' || color.hex == "") {
//             return $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>transparent</div>");
//         }
//         var element = $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</div>");
//         var nThreshold = 105;
//         var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
//         var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
//         element.css('color', foreColor);
//         element.css('background', "#" + color.hex);
//         element.addClass('jqx-rc-all');
//         return element;
//     }
// }

// Attrval.prototype.redraw = function() {
//     var table = this.container.children('#table');
//     table.children('div').jqxDataTable('render');
// }


