/**
 * Frame class
 * @param {*} config 
 * @param {*} idList 
 */

var Frame = function(config = undefined, idList = undefined) {
    this.config = config == undefined ? DEFAULT_LAYOUT : config;
    this.idList = idList == undefined ? DEFAULT_IDLIST : idList;
    
    this.layout = new window.GoldenLayout(this.config, $('#layoutContainer'));
    this.layout.registerComponent('widget', function( container, state ){});
    this.layout.init();

    this.widgetList = {};
    for (var i in this.idList) 
        this.widgetList[this.idList[i]] = null;
    this.widgetList['attrval'] = null;
};

/**
 * initialize the widget list
 */
Frame.prototype.init = function() {
    var frame = this;
    setTimeout(function() {
        // initial all the widgets
        var container;
        for (var i in frame.idList) {
            // get the content div as the container of the widget
            container = frame.layout.root.getItemsById(frame.idList[i])[0].element.children('.lm_content');
            container.attr("id", frame.idList[i]);
            frame.widgetList[frame.idList[i]] = new Widget(container, frame.idList[i]);
        }
        frame.widgetList['attrval'] = new Widget($('#attrval'), "attrval")

        // initial the control widget firstly
        frame.widgetList['control'].setOperator(Control);
        frame.widgetList['control'].operator.layout();

        // redraw the detail view responding to the resize event
        frame.layout.root.getItemsById('detail')[0].container.on('resize', function() {
            if (frame.widgetList['detail'].operator != null)
                frame.widgetList['detail'].operator.layout();
        });

        frame.layout.root.getItemsById('detail')[0].container.on('show', function() {
            if (frame.widgetList['detail'].operator != null) {
                frame.widgetList['detail'].operator.layout(frame.widgetList['minimap'].operator.leftPos)
            }
        });

        frame.layout.root.getItemsById('minimap')[0].container.on('resize', function() {
            if (frame.widgetList['minimap'].operator != null) {
                frame.widgetList['minimap'].operator.redraw();
            }
        });

        // rerender the control view responding to the resize event
        frame.layout.root.getItemsById('control')[0].container.on('resize', function() {
            frame.widgetList['control'].container.children('.slider').each(function(){
                $(this).children('div').jqxSlider('render');
            });
        });

        // // rerender the control view responding to the resize event
        // frame.layout.root.getItemsById('query')[0].container.on('resize', function() {
        //     console.log('resize query')
        //     frame.widgetList['query'].container.children('#queryView').jqxGrid('render');
        // });
    }, 50);
};

// id is the id of the parent component you want to add widget to
Frame.prototype.addNewWidget = function(id, config) {
    if (config.id in this.widgetList)
        return false;
    var frame = this;
    this.layout.root.getItemsById(id)[0].parent.addChild(config);
    var container = this.layout.root.getItemsById(config.id)[0].element.children('.lm_content');
    this.widgetList[config.id] = new Widget(container, config.id);

    // add resize event response to the new widget
    this.layout.root.getItemsById(config.id)[0].container.on('resize', function() {
        if (frame.widgetList[config.id].operator != null) {
            frame.widgetList[config.id].operator.layout();
        }
    });

    this.layout.root.getItemsById(config.id)[0].container.on('show', function() {
        if (frame.widgetList[config.id].operator != null) {
            frame.widgetList[config.id].operator.layout(frame.widgetList['minimap'].operator.leftPos)
        }
    });
    return true;
};

Frame.prototype.removeWidget = function(id) {
    var item = this.layout.root.getItemsById(id)[0];
    if (item != undefined) {
        item.parent.removeChild(item, false);
        delete this.widgetList[id];
    }
}

/**
 * Widget class
 * @param {*} container 
 */

var Widget = function (container, id) {
    this.container = container;
    this.container.attr('id', id);
    this.operator = null;
};

Widget.prototype.setOperator = function(conductor, args = undefined) {
    // conductor is the class conductor of the operator
    if (args == undefined)
        this.operator = new conductor();
    else
        this.operator = new conductor(args);
    this.operator.container = this.container;
}