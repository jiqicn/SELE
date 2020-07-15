// frame instance
var frame;

// setting object of the frame layout
const DEFAULT_LAYOUT = {
    content: [{
        type: 'row',
        content: [{
            type: 'column',
            width: 13,
            content: [{
                type: 'component',
                componentName: 'widget',
                id: 'control',
                isClosable: false,
                title: "Control Panel",
            }, {
                type: 'component',
                componentName: 'widget',
                id: 'selection',
                isClosable: false,
                title: 'Selections',
            }]
        }, {
            type: 'column',
            content: [{
                type: 'component',
                height: 13,
                componentName: 'widget',
                id: 'minimap',
                isClosable: false,
                title: 'Mini Map',
            }, {
                type: 'component',
                componentName: 'widget',
                id: 'detail',
                isClosable: false,
                title: 'Detail View <input class="queryButton" id="detail" type="button" value="Query"></input>',
            }]
        }, {
            type: 'column',
            width: 13,
            content: [{
                type: 'component',              
                componentName: 'widget',
                id: 'query',
                isClosable: false,
                title: 'Queries',
            }, {
                type: 'component',
                componentName: 'widget',
                id: 'pattern',
                isClosable: false,
                title: 'Patterns'
            }]
        }]
    }]
};

// default list of widget id

const DEFAULT_IDLIST = ['control', 'minimap', 'detail', 'query', 'pattern', 'selection'];

// template of jqwidgets
const TEMPLATE = 'inverse';

// stack ratio
const STACK_RATIO = 1;

// quickly find at least one common between two arrays
var findOne = function (haystack, arr) {
    if (arr.length < haystack.length)
        return arr.some(function (v) {
            return haystack.includes(v);
        });
    else
        return haystack.some(function (v) {
            return arr.includes(v);
        });
};

/**
 * optimized algorithm for finding the intersection between multiple arrays
 * reference: https://gist.github.com/lovasoa/3361645
 */
var arrayIntersect = function() {
    var i, all, shortest, nShortest, n, len, ret = [], obj={}, nOthers;
    nOthers = arguments.length-1;
    nShortest = arguments[0].length;
    shortest = 0;
    for (i=0; i<=nOthers; i++){
      n = arguments[i].length;
      if (n<nShortest) {
        shortest = i;
        nShortest = n;
      }
    }
  
    for (i=0; i<=nOthers; i++) {
      n = (i===shortest)?0:(i||shortest); //Read the shortest array first. Read the first array instead of the shortest
      len = arguments[n].length;
      for (var j=0; j<len; j++) {
          var elem = arguments[n][j];
          if(obj[elem] === i-1) {
            if(i === nOthers) {
              ret.push(elem);
              obj[elem]=0;
            } else {
              obj[elem]=i;
            }
          }else if (i===0) {
            obj[elem]=0;
          }
      }
    }
    return ret;
};

// convert random string to number
function string2HEX (string, type = "Grey_mean") {
    var stringHexNumber = (                       // 1
        parseInt(                                 // 2
            parseInt(string, 36)  // 3
                .toExponential()                  // 4
                .slice(2,-5)                      // 5
        , 10) & 0xFFFFFF                          // 6
    ).toString(16).toUpperCase(); // "32EF01"     // 
    if (type == 'Color')
        return '#' + ('000000' + stringHexNumber).slice(-6);
    else {
        stringHexNumber = ('000000' + stringHexNumber).slice(-6);
        var r = parseInt(stringHexNumber.slice(0,2), 16),
            g = parseInt(stringHexNumber.slice(2,4), 16),
            b = parseInt(stringHexNumber.slice(4,6), 16);
        if (type == 'Grey_mean')
            var gs = parseInt((r + g + b) / 3);
        else if (type == 'Grey_light')
            var gs = Math.max(r, g, b);
        else if (type == 'Grey_dark')
            var gs = Math.min(r, g, b);
        return 'rgb('+gs+', '+gs+', '+gs+')';
    }
}

// // convert arbitrous string to color
// function string2HEX (str) {
//     return '#' + intToARGB(hashCode(str));

//     function hashCode(str) { // java String#hashCode
//         var hash = 0;
//         for (var i = 0; i < str.length; i++) {
//            hash = str.charCodeAt(i) + ((hash << 5) - hash);
//         }
//         return hash;
//     } 
    
//     function intToARGB(i){
//         return ((i>>24)&0xFF).toString(16) + 
//                ((i>>16)&0xFF).toString(16) + 
//                ((i>>8)&0xFF).toString(16) + 
//                (i&0xFF).toString(16);
//     }
// }

// cleanup string
function cleanup (string) {
    if (string == undefined) return "";
    else return string.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_");
}

// limit the color style addition
var colorClasses = [];

// Array.prototype.indexOfAny = function (array) {
//     return this.findIndex(function(v) { return array.indexOf(v) != -1; });
// }

// Array.prototype.containsAny = function (array) {
//     return this.indexOfAny(array) != -1;
// }

var globalTest = null;

function strReverse (str) {
    return str.split('').reverse().join('');
}

// $('body').on('click', function() {
//     $('#attrval').css('display', 'none');
// });

function xmlToJson(xml) {
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};