/**
    @overview This plugin implements the jsdoc hooks necessary to produce
    documentation for jquery ui widgets when used in conjunction with the jui
    template
    @module plugins/jquery-ui-widget
    @author Jannon Frank (jannon.net)
 */

exports.newDoclet = function(e) {
    // console.log("----------");
    // console.log("New Doclet");
    // console.log("----------");
    // printFields(e);
    if (e.doclet.tags) {
        for(var i = 0, l = e.doclet.tags.length; i < l; i++) {
            var tag = e.doclet.tags[i];
                
            switch(tag.title) {
                case "widget":
                    e.doclet.kind = tag.title;
                    break;
                case "require":
                    // Add requires...need to use this tag since the "requires" tag
                    // assumes too much (specifically, assumes commmonJS module requires)
                    if (!e.doclet.requires) { e.doclet.requires = []; }
                    e.doclet.requires.push(tag.value);
                    break;
                case "demo":
                    e.doclet.kind = tag.title;
                    if (!e.doclet.demo) { e.doclet.demo = {}; }
                    if (tag.value) { e.doclet.demo.name = tag.value; }
                    break;
                case "demoscript":
                case "demomarkup":
                    if (!e.doclet.demo) { e.doclet.demo = {}; }
                    e.doclet.demo[tag.title.replace("demo", "")] = tag.value;
                    break;
            }
        }
    }
    if (e.doclet.kind == "file") {
        //printFields(e);
    }
    
    if ((e.doclet.kind == "function" || e.doclet.kind == "method") && e.doclet.memberof.indexOf("ui.") != -1) {
        //Set all the widget methods scope to instance
        e.doclet.scope = "instance";
        //Set all the methods that start with '_' to private
        if (e.doclet.name.indexOf("_") === 0) {
            e.doclet.access = "private";
        }
    }
};

exports.fileBegin = function(e) {
    /* e.filename: the name of the file
     */
    widgetName = null;
};

exports.beforeParse = function(e) {
    /* e.filename: the name of the file
     * e.source: the contents of the file
     */
    
    //Retrieve the name of the widget to set the memberof attribute of the
    // common method doclets
    var match = e.source.match(/\$\.widget\("(ui\.\w+)"/);
    if (match) {
        widgetName = match[1];
    }
    
    //Create the common method doclets
    addMethod(e, "disable");
    addMethod(e, "enable");
    addMethod(e, "widget");
    //this might conflict with previously defined destroy methods until 
    //jQuery UI 1.9 when they switch to using _destroy like _setOption
    //addMethod(e, "destroy");
    
    //The option methods have parameters defined
    addMethod(e, "option", [
        {
            name:       "optionName",
            description:"The option to set or retrieve.",
            type:       "String" 
        },
        {
            name:       "value",
            description:"The value to set.",
            optional:   true
        }
    ]);
   
   addMethod(e, "option-2", [
        {
            name:       "options",
            description:"The map of options to set",
            type:       "Object"
        }
    ]);
};


/*
exports.jsdocCommentFound = function(e) {
    console.log("--------------------");
    console.log("JS Doc Comment Found");
    console.log("--------------------");
    printFields(e);
};

exports.symbolFound = function(e) {
    console.log("------------");
    console.log("Symbol Found");
    console.log("------------");
    printFields(e);
};

exports.fileComplete = function(e) {
    //e.filename: the name of the file
    //e.source: the contents of the file
};

exports.sourceFileFound = function(e) {
    console.log("-----------------");
    console.log("Source File Found");
    console.log("-----------------");
    printFields(e);
};
*/

/** @private */
function printFields(e, depth) {
    depth = depth || 0;
    var prefix = "";
    for(var i = 0; i < depth; i++) {
        prefix += "\t";
    }
    
    for (var f in e) {
        if (e['hasOwnProperty'] && e.hasOwnProperty(f)) {
            if (typeof e[f] != 'object') {
                console.log(prefix + f + ": " + e[f] + " (" + typeof e[f] + "),");
            } else {
                console.log(prefix + f + ": {");
                printFields(e[f], ++depth);
                console.log(prefix + "}");
            }
        }
    }
}

function makeParamType(param) {
    var type = param.type || "Object",
        isOptional = param.optional,
        result = ["{", type, (isOptional?"=":""), "}"].join("");
    return result;
}

var widgetName = null,
    commonDescriptions = {
        "disable":  "Disable the ${widget}.",
        "enable":   "Enable the ${widget}.",
        "widget":   "Returns the ${widget} element.",
        "destroy":  "Remove the ${widget} functionality completely. This will return the element back to its pre-init state.",
        "option":   "Get or set any ${widget} option. If no value is specified, will act as a getter.",
        "option-2": "Set multiple ${widget} options at once by providing an options object."
    };

function addMethod(e, name, params) {
    // The basics
    var source = ["",
        "/**",
        commonDescriptions[name].replace("${widget}", widgetName.substring(widgetName.indexOf('.') + 1)),
        "@name " + name.replace(/-\d+/, ""),
        "@memberof " + widgetName,
        "@function" 
    ],
    param, paramStr;
    
    //Add any parameters
    if (params) {
        for(var i = 0, l = params.length; i < l; i++) {
            param = params[i];
            paramStr = ["@param", makeParamType(param), param.name, param.description].join(" ");
            source.push(paramStr);
        }
    }
    
    //And close it out
    source.push("*/");

    //Add it to the source
    e.source += source.join("\n");
}