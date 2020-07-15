/**
 * selection operator class
 */

var Selection = function() {
    this.container = null;
    this.selectionList = {};
    this.idCount = 0;
    this.colorCard = {};
    this.from = null;
    this.to = null;
    this.isDragging = false;
    this.setOpera = null;
};

Selection.prototype.layout = function() {
    var dataStatis = frame.widgetList['control'].operator.file.data.statis;
    var numEvent = frame.widgetList['control'].operator.file.data.events.length;
    var eList = [];
    for (i = 0; i < numEvent; i++)
        eList.push(i);
    this.container.css('overflow-y', 'scroll');
    this.selectionList['whole'] = new Card(this.container, 'whole', dataStatis, eList, false, false, false);
    this.selectionList['whole'].layout('The whole set');
};

Selection.prototype.addSelection = function(statis, eList) {
    // add selection card
    this.selectionList[this.idCount] = new Card(this.container, this.idCount, statis, eList, true, true, true);
    this.selectionList[this.idCount].layout('The selection #' + this.idCount);
    frame.widgetList['control'].operator.updateViews();
    this.idCount++;
};

Selection.prototype.removeSelection = function(selectionId) {
    delete this.selectionList[selectionId];
};

Selection.prototype.registerColorCard = function(eList, cardID) {
    var numEvent = eList.length;
    var event;
    for (var i = 0; i < numEvent; i++) {
        event = eList[i];
        if (this.colorCard[event] == undefined)
            this.colorCard[event] = [cardID];
        else
            this.colorCard[event].push(cardID);
    }
};

Selection.prototype.hideColorCard = function(eList, cardID) {
    // if the selection is not marked, directly return
    var condition = this.selectionList[cardID].marked;
    if (!condition) return;

    // else remove the color code from the color card
    var numEvent = eList.length;
    var idList;
    for (var i = 0; i < numEvent; i++) {
        idList = this.colorCard[eList[i]];
        var index = idList.indexOf(cardID);
        idList.splice(index, 1);
    }    
};

Selection.prototype.getColorByEventID = function(eventID) {
    var selection = frame.widgetList['selection'].operator;
    var idList = selection.colorCard[eventID];
    if (idList == undefined)
        return undefined;
    else {
        var s = selection.selectionList[idList[idList.length - 1]];
        return s == undefined ? undefined : s.getColor();
    }
};

Selection.prototype.merge = function(f, t) {
    this.from = this.from == null ? f : this.from;
    this.to = this.to == null ? t : this.to;
    var setOpera = this.setOpera

    if (this.from != null && this.to != null) {
        // get the event list based on the set operation choice
        var eList = [],
            fromList = this.selectionList[this.from].eList,
            toList = this.selectionList[this.to].eList;
        if (setOpera == "U") { // union
            eList.push.apply(eList, fromList);
            eList.push.apply(eList, toList);
            eList = Array.from(new Set(eList)); // remove duplication
        }
        else if (setOpera == 'I') { // intersection
            eList = fromList.filter(el => toList.includes(el));
        }
        else if (setOpera == 'C') { // complementary
            eList = fromList.filter(el => !toList.includes(el));
        }
        else
            return;

        // compute the statis
        var statis = {};
        var events = frame.widgetList['control'].operator.file.data.events;
        var attrList = frame.widgetList['control'].operator.file.data.keys;
        for (i in attrList)
            statis[attrList[i]] = {};
        for (i in eList) {
            var index = eList[i]
            var event = events[index];
            for (j in statis) {
                var attr = j;
                var val = event[attr];
                if (statis[attr][val] == undefined)
                    statis[attr][val] = [index];
                else
                    statis[attr][val].push(index);
            }
        }

        // create the new card for the merge
        this.selectionList[this.idCount] = new Card(this.container, this.idCount, statis, eList, true, true, true);
        this.selectionList[this.idCount].layout('The selection #' + this.idCount);
        this.idCount++;
    }
};


// Selection.prototype.updateSelection = function() {
//     for (i in this.selectionList)
//         this.selectionList[i].addSelection();
// }

// Selection.prototype.getColorByEventID = function(id) {
//     var color = this.colorCard[id];
//     return color == undefined ? "grey" : color;
// }

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

var Card = function(container, id, statis, eList, isClosable=true, isHidable=true, isColorable=true) {
    this.container = container;
    this.id = id;
    this.color = null;
    this.cardName = this.id;
    this.dataStatis = statis;
    this.eList = eList;
    this.widgetShown = false;
    this.marked = false;

    // get new layout data for the selection
    var data = frame.widgetList['control'].operator.file.data;
    var timeline = data.timeline;
    var events = data.events;
    eList.sort(function(a, b) {return a - b;});
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
    this.layoutData = layout;

    // // register the event list to the color card
    // if (id != 'whole')
    //     frame.widgetList['selection'].operator.registerColorCard(eList, id);

    // compute the ratio of bar
    this.totalEventNum = frame.widgetList['control'].operator.file.data.events.length;
    this.numEvent = eList.length;
    this.ratio = this.numEvent * 100 / this.totalEventNum;

    // configuration of the card for showing close, hide, and color picker button
    // default to be true
    // should be set to false for all for the whole view
    this.isClosable = isClosable;
    this.isHidable = isHidable;
    this.isColorable = isClosable;
};

Card.prototype.layout = function(cardName) {
    var idText = cardName == undefined ? this.id : cardName; // name of the card, could be by the user
    this.cardName = cardName == undefined ? this.cardName : cardName; // update card name if exist
    var cardId = 'card' + idText;
    var cardContainer = $('<div class="cardContainer" id="'+cardId+'"></div>');
    var cardTitleBar = $('<div class="cardTitle" style="font-weight: bold"></div>');
    var cardToolBar = $('<div class="cardTool" style="display:flex"></div>');
    var cardViewBar = $('<div class="cardView"></div>');
    var dropdownColor = $('<div id="dropdownColor'+this.id+'" style="width:20%;"><div id="dropDownButtonS'+this.id+'"></div></div>');
    var colorPicker = $('<div id="colorPicker'+this.id+'" style="padding:3px"><div id="pickerS'+this.id+'" style="float:left"></div></div>');
    var buttonShow = $('<div id="buttonShow" style="margin-left: 5px; width: calc(28% - 5px)"><input type="button" value="Details" style="font-size: 9px !important"></input></div>');
    var buttonHighlight = $('<div id="buttonShow" style="margin-left: 5px; width: calc(22% - 5px)"><input type="button" value="Mark" style="font-size: 9px !important"></input></div>');    
    var buttonRemove = $('<div id="buttonRemove" style="margin-left: 5px; width: calc(30% - 5px)"><input type="button" value="Remove" style="font-size: 9px !important"></input></div>');
    var progressBar = $('<div id="progressBar" style="overflow: hidden;position: relative;top: 5px"></div>');
    var setLayer = $('<div class="setLayer"><div class="setOpera" data-c="I" style="background-color: rgba(0, 255, 0, 0.5)">&#8745;</div><div class="setOpera" data-c="U" style="background: rgba(0, 0, 255, 0.5)">&#8746;</div><div class="setOpera" data-c="C" style="font-family: sans-serif;font-weight: normal !important;background: rgba(255, 0, 0, 0.5)">&#67;</div></div>')
    var selection = frame.widgetList['selection'].operator;
    var card = this;

    // layout components
    cardToolBar.append(dropdownColor);
    dropdownColor.children('div').append(colorPicker);
    cardToolBar.append(buttonShow);
    cardToolBar.append(buttonHighlight);
    cardToolBar.append(buttonRemove);
    cardViewBar.append(progressBar);
    cardContainer.append(cardTitleBar);
    cardContainer.append(cardToolBar);
    cardContainer.append(cardViewBar);
    cardContainer.append(setLayer);
    this.container.append(cardContainer);

    // insert details
    cardTitleBar.text(idText);
    colorPicker.children('div').jqxColorPicker({ color: "ffaabb", colorMode: 'hue', width: 220, height: 220});
    dropdownColor.children('div').jqxDropDownButton({template: TEMPLATE, width: '100%', height: 17, animationType: 'fade', disabled: !card.isColorable});
    buttonShow.children('input').jqxButton({template: TEMPLATE, width: '100%', disabled: !card.isHidable});
    buttonHighlight.children('input').jqxButton({template: TEMPLATE, width: '100%', disabled: !card.isHidable});
    buttonRemove.children('input').jqxButton({template: TEMPLATE, width: '100%', disabled: !card.isClosable});
    progressBar.jqxProgressBar({template: TEMPLATE, width: "100%", height: 5, animationDuration: 0, value: this.ratio});
    if (this.id != 'whole') {
        dropdownColor.children('div').jqxDropDownButton('setContent', getTextElementByColor());
        // buttonHighlight.children('input').attr('style', function(i, s) {
        //     var prev = s.split(';background')[0];
        //     return prev + ';background: orange !important';
        // });   
    }

    // event response
    colorPicker.children('div').on('colorchange', function (event) {
        // set the color of the dropdown button
        dropdownColor.children('div').jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
        
        // get and set the color
        card.color = '#' + event.args.color.hex;
        cardTitleBar.css('color', "#" + card.color.hex);

        // change the color of the progress bar
        progressBar.children('div').first().attr('style', function(i, s) {
            var prev = s.split(';background')[0];
            return prev + ";background: " + card.color + " !important";
        });

        // change the color of events in all the actived detailed views
        frame.widgetList['control'].operator.updateViews();
        
        // if already marked, update the color on the minimap
        if (card.marked)
            frame.widgetList['minimap'].operator.updateSelection(card.eList, card.id, card.color);        
    });
    cardContainer.on('contextmenu', function(event) {
        event.stopPropagation();
        
        // show the attrval panel for making selection
        var isActived = frame.widgetList['attrval'].operator.isActived();
        if (!isActived)
            frame.widgetList['attrval'].operator.layout(card.dataStatis, event.pageX, event.pageY);

        return false;
    });
    buttonHighlight.children('input').on('click', function() {
        if (!card.marked) {
            frame.widgetList['selection'].operator.registerColorCard(card.eList, card.id);
            frame.widgetList['control'].operator.updateViews();
            frame.widgetList['minimap'].operator.addSelection(card.eList, card.id, card.color);

            card.marked = true;

            $(this).attr('style', function(i, s) {
                var prev = s.split(';background')[0];
                return prev + ';background: orange !important';
            });
        } else {
            frame.widgetList['selection'].operator.hideColorCard(card.eList, card.id);
            frame.widgetList['control'].operator.updateViews();        
            frame.widgetList['minimap'].operator.removeSelection(card.eList, card.id);
                
            card.marked = false;

            $(this).attr('style', function(i, s) {
                var prev = s.split(';background')[0];
                return prev + ';background: #363636 !important';
            });
        }
    });
    
    buttonRemove.children('input').on('click', function() {
        cardContainer.remove();
        frame.removeWidget("Selection" + card.id);
        frame.widgetList['selection'].operator.hideColorCard(card.eList, card.id);        
        frame.widgetList['selection'].operator.removeSelection(card.id);
        frame.widgetList['control'].operator.updateViews();     
        frame.widgetList['minimap'].operator.removeSelection(card.eList, card.id);
    });
    buttonShow.children('input').on('click', function() {
        var id = "Selection" + card.id;

        if (!card.widgetShown) {
            // configuation of the selection detail view
            var newConfig = {
                title: "Selection#" + card.id + ' View <input class="queryButton" id="'+id+'" type="button" value="Query"></input>',
                type: 'component',
                isClosable: false,
                componentName: 'widget',
                id: id,
                componentState: {}
            };

            // add new widget
            frame.addNewWidget('detail', newConfig);
            frame.widgetList[id].setOperator(Detail, card.eList);
            var leftPos = frame.widgetList['detail'].operator.leftPos;
            frame.widgetList[id].operator.layout(leftPos, card.layoutData);
            card.widgetShown = true;
            $(this).attr('style', function(i, s) {
                var prev = s.split(';background')[0];
                return prev + ';background: orange !important';
            }); 
        } else {
            // remove the widget
            frame.removeWidget("Selection" + card.id);
            card.widgetShown = false;
            $(this).attr('style', function(i, s) {
                var prev = s.split(';background')[0];
                return prev + ';background: #363636 !important';
            });
        }
    });
    cardContainer.draggable({
        helper: "clone",
        opacity: 0.5,
        start: function(event, ui) {
            selection.isDragging = true;            
            $(ui.helper).addClass("ui-draggable-helper");
            selection.from = null;
            selection.to = null;
            card.setOpera = null;
        },
        stop: function(event) {
            var fromID = card.id;
            selection.isDragging = false;
            selection.merge(fromID, null);
            setLayer.css('visibility', 'hidden');                        
        }
    });
    cardContainer.droppable({
        drop: function(event) {
            var toID = card.id;
            setLayer.css('visibility', 'hidden');          
            selection.merge(null, toID);
        }
    });
    cardContainer.on('mouseover', function() {
        if (selection.isDragging) {
            setLayer.css('visibility', 'visible');
            // setLayer.animate({
            //     opacity: 1
            // }, 200);
        }
    });
    cardContainer.on('mouseout', function() {
        if (selection.isDragging) {
            // setLayer.animate({
            //     opacity: 0.000001
            // }, 200);
            setLayer.css('visibility', 'hidden');            
        }
    });
    setLayer.children('div').each(function() {
        $(this).on('mouseover', function() {
            $(this).css('border', '3px solid white');
            selection.setOpera = $(this).attr('data-c');
        });
        $(this).on('mouseout', function() {
            $(this).css('border', '3px solid rgba(255, 255, 255, 0.5)');
        });
    })

    // additional function
    function getTextElementByColor(color = undefined) {
        if (color == undefined) {
            // generate a random color
            var element = $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</div>");
            var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
            card.color = color;
            element.css('background', color);
            element.addClass('jqx-rc-all');
            progressBar.children('div').first().attr('style', function(i, s) {
                var prev = s.split(';background')[0];
                return prev + ";background: " + color + " !important";
            });
            return element;
        }
        else if (color == 'transparent' || color.hex == "") {
            return $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>transparent</div>");
        }
        else {
            var element = $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</div>");
            var nThreshold = 105;
            var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
            var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
            element.css('color', foreColor);
            element.css('background', "#" + color.hex);
            element.addClass('jqx-rc-all');
            return element;
        }
    }
};

Card.prototype.getColor = function() {
    return this.color;
};

// var Card = function(container, id, query, eList = null, from = null, to = null) {
//     this.query = query;
//     this.container = container;
//     this.id = id;
//     this.isHighlighted = false;
//     this.eList = eList;
//     this.from = from;
//     this.to = to;
//     this.rangeSeg = [];

//     // if eList == null, it means the card is not from merge
//     if (this.eList == null) {
//         // basic setup, get the event list by query, and the range list
//         var data = frame.widgetList['control'].operator.file.data;
//         var statis = data.statis[query.attr];
//         var eList = [];
//         for (i = 0; i < query.values.length; i++) {
//             eList = eList.concat(statis[query.values[i].Value]);
//         }
//         this.eList = eList;
//     }

//     this.eList = Array.from(new Set(this.eList)); // remove duplication
//     this.eList = this.eList.sort(function(a, b){return a - b;}); // sort
//     this.layoutData = null;
// };

// Card.prototype.createDetailView = function() {
//     var id = "Selection" + this.id;
//     // configuation of the selection detail view
//     var newConfig = {
//         title: "Selection#" + this.id + ' View <input class="queryButton" id="'+id+'" type="button" value="Query"></input>',
//         type: 'component',
//         isClosable: false,
//         componentName: 'widget',
//         id: id,
//         componentState: {}
//     };

//     // get new layout data for the selection
//     var data = frame.widgetList['control'].operator.file.data;
//     var timeline = data.timeline;
//     var events = data.events;
//     var eList = this.eList;
//     var layout = {};
//     var numEvent = eList.length;
//     var numTime = timeline.length;
//     for (i = 0; i < numTime; i++)
//         layout[timeline[i]] = [];
//     for (i = 0; i < numEvent; i++) {
//         eid = eList[i];
//         s = events[eid].indexStart;
//         e = events[eid].indexEnd;
//         for (j = s; j <= e; j++)
//             layout[timeline[j]].push(eid);
//     }
//     this.layoutData = layout;

//     // add new widget
//     frame.addNewWidget('detail', newConfig);
//     frame.widgetList[id].setOperator(Detail, this.eList);
//     var leftPos = frame.widgetList['detail'].operator.leftPos;
//     frame.widgetList[id].operator.layout(leftPos, layout);
// };

// Card.prototype.layout = function(isMerged = false) {
//     // setup components
//     var itself = this;
//     var eList = this.eList;
//     if (!isMerged) var query = this.query;
//     var card = $('<div class="card" id="no'+this.id+'"></div>');
//     var toolbox = $('<div style="width:100%;display:flex;float:left"></div>')
//     var buttonRemove = $('<div class="border" style="padding-top:1.5%;width: auto !important"><input type="button" id="buttonRemove" value="Remove"></input></div>');
//     var selection = frame.widgetList['selection'].operator;    

//     if (!isMerged) { // if this card is the merging result, then no table shown
//         var title = $('<h5 style="font-size: 12px;width: calc(100% - 130px);padding-top:1.5%;margin-left:5px;color:'+(!isMerged ? query.color: 'white')+'">Selection #'+(this.id)+'</h5>')    
//         var buttonHighlight = $('<div class="border" style="padding-top:1.5%;width: auto !important"><input type="button" id="buttonHighlight" value="Highlight"></input></div>');    
//         var tableContent = '<div style="margin:3px"><table style="table-layout:fixed;width:100%;font-family:sans-serif;color:white;font-size:12px">'
//             + '<tr>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Attribute</th>'
//                 + '<th align="left" style="overflow: hidden;text-overflow: ellipsis">'+query.attr+'</th>'
//             + '</tr>'
//             + '</tr>'
//             + '<tr>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Value</th>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Occurrence</th>'
//             + '</tr>';
//         for (i = 0; i < query.values.length; i++) {
//             tableContent += '<tr>'
//                 + '<td style="overflow: hidden;text-overflow: ellipsis">'+query.values[i].Value+'</td>'
//                 + '<td>'+query.values[i].Occurrence+'</td>'
//             + '</tr>'
//         }
//         tableContent += '</table></div>'
//         var table = $(tableContent);
//     }
//     else {
//         var title = $('<h5 style="font-size: 12px;width: calc(100% - 73px);padding-top:1.5%;margin-left:5px;color:'+(!isMerged ? query.color: 'white')+'">Selection #'+(this.id)+'</h5>')    
//         var tableContent = '<div style="margin:3px"><table style="table-layout:fixed;width:100%;font-family:sans-serif;color:white;font-size:12px">'
//             + '<tr>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Merging From:</th>'
//                 + '<th align="left" style="overflow: hidden;text-overflow: ellipsis"></th>'
//             + '</tr>'
//             + '</tr>'
//             + '<tr>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Selection #'+this.from+'</th>'
//                 + '<th align="left" bgcolor="#919191" style="color:black">Selection #'+this.to+'</th>'
//             + '</tr>';
//         var table = $(tableContent);            
//     }

//     // layout components
//     toolbox.append(title)
//     if (!isMerged) toolbox.append(buttonHighlight);
//     toolbox.append(buttonRemove);
//     card.append(toolbox);        
//     card.append(table);
//     this.container.append(card);

//     // add drag and drop function for merging
//     card.draggable({
//         helper: "clone",
//         opacity: 0.5,
//         start: function(event) {
//             selection.from = null;
//             selection.to = null;
//         },
//         stop: function(event) {
//             var fromID = $(this).attr('id');
//             selection.merge(fromID, null);
//         }
//     });

//     card.droppable({
//         drop: function(event) {
//             var toID = $(this).attr('id');
//             selection.merge(null, toID);
//         }
//     });
    
//     // build components
//     if (!isMerged) buttonHighlight.children('input').jqxButton({template: TEMPLATE, width: '100%'});
//     buttonRemove.children('input').jqxButton({template: TEMPLATE, width: '100%'});

//     // response events
//     buttonRemove.children('input').on('click', function() {
//         // remove the selection from the selection list
//         frame.widgetList['selection'].operator.removeSelection(itself.id);   
//         itself.container.children('#no'+itself.id+'').remove();

//         // remove the widget
//         frame.removeWidget("Selection" + itself.id);
        
//         if (!isMerged) {
//             // update color card
//             var numEvent = eList.length;
//             for (i = 0; i < numEvent; i++) {
//                 delete frame.widgetList['selection'].operator.colorCard[eList[i]];
//             }

//             // update the detail view
//             frame.widgetList['detail'].operator.layout();

//             // update the minimap view
//             frame.widgetList['minimap'].operator.removeSelection(eList, itself.id);
//         }
//     });

//     if (!isMerged) {
//         buttonHighlight.children('input').on('click', function() {
//             // highlight or not
//             var numEvent = eList.length;
//             if (!itself.isHighlighted) {
//                 itself.isHighlighted = true;
//                 toolbox.css('background-color', query.color);
//                 title.css('color', 'black');
//                 for (i = 0; i < numEvent; i++) {
//                     frame.widgetList['selection'].operator.colorCard[eList[i]] = query.color;
//                 }
//                 frame.widgetList['minimap'].operator.addSelection(eList, itself.id, query.color);
//             } else {
//                 itself.isHighlighted = false;
//                 toolbox.css('background-color', '#35353A');
//                 title.css('color', query.color);
//                 for (i = 0; i < numEvent; i++) {
//                     delete frame.widgetList['selection'].operator.colorCard[eList[i]];
//                 }
//                 frame.widgetList['minimap'].operator.removeSelection(eList, itself.id);
//             }
    
//             // update the detail view
//             frame.widgetList['detail'].operator.layout();
    
//             // update all the selection views
//             var selectionKeys = Object.keys(frame.widgetList);
//             selectionKeys = selectionKeys.filter(function(x) {
//                 if (x.indexOf("Selection") > -1) return x
//             });
//             for (i in selectionKeys) {
//                 frame.widgetList[selectionKeys[i]].operator.layout();
//             }
//         });
    
//         buttonHighlight.children('input').trigger('click');
//     }
// };

// Card.prototype.addSelection = function() {
//     frame.widgetList['minimap'].operator.addSelection(this.eList, this.id, this.query.color);
// }