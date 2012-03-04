(function() {

    var _ = require('underscore/underscore'),
        template = require('underscore/template'),
        fs = require('fs'),
        helper = require('jsdoc/util/templateHelper'),
        scopeToPunc = { 'static': '.', 'inner': '~', 'instance': '#' };
        
        template.settings.evaluate    = /<\?js([\s\S]+?)\?>/g;
        template.settings.interpolate = /<\?js=([\s\S]+?)\?>/g;
    
    /**
        @global
        @param {TAFFY} data See <http://taffydb.com/>.
        @param {object} opts
        @param {Tutorial} tutorials
     */
    publish = function(data, opts, tutorials) {
        var /* The template for widgets */
            containerTemplate = template.render(fs.readFileSync(__dirname + '/templates/jui/tmpl/container.tmpl')),
            /* The template for the index page */
            indexTemplate = template.render(fs.readFileSync(__dirname + '/templates/jui/tmpl/index.tmpl')),
            /* The template for external tutuorials */
            tutorialTemplate = template.render(fs.readFileSync(__dirname + '/templates/jui/tmpl/tutorial.tmpl')),
            /* The template for inline widget demos */
            demoTemplate = template.render(fs.readFileSync(__dirname + '/templates/jui/tmpl/demo.tmpl')),
            /* Directory jsdoc was executed from */
            execDir = String(java.lang.System.getProperty("user.dir")),
            /* Ordering specs */
            orderSpecs = {
                'name': ['longname', 'version', 'since'],
                'code': ['lineno', 'longname']
            };
        
        // set up tutorials for helper
        helper.setTutorials(tutorials);

        /*
         * Helper function used to render subtemplates
         */
        function render(tmpl, partialData) {
            var renderFunction = arguments.callee.cache[tmpl];
            if (!renderFunction) {
                renderFunction = arguments.callee.cache[tmpl] = template.render(fs.readFileSync(__dirname + '/templates/jui/tmpl/'+tmpl));
            }
            partialData.render = arguments.callee;
            partialData.find = find;
            partialData.order = order;
            partialData.linkto = linkto;
            partialData.tutoriallink = tutoriallink;
            partialData.htmlsafe = htmlsafe;
            partialData.titleCase = titleCase;
            
            return renderFunction.call(partialData, partialData);
        }
        render.cache = {};
        
        /**
         * Helper to retrieve the file doclet that the doclet belongs to
         */
        function getFileDoclet(d) {
            var file = arguments.callee.cache[d.longname];
            if (!file) {
                var files = find({kind: 'file', 'memberof': {'isUndefined': true}});
                if (files) {
                    for(var i = 0, l = files.length; i < l; i++) {
                        if (files[i].name.indexOf(d.memberof) != -1) {
                            file = arguments.callee.cache[d.longname] = files[i];
                        }
                    }
                }
            }
            return file;
        }
        getFileDoclet.cache = {};

        /**
         * Helper function for looking up doclets
         * @param spec The lookup specification
         */
        function find(spec) {
            return data.get( data.find(spec) );
        }
        
        /**
         * Helper function for ordering doclets
         * @param spec the orderBy specification
         */
        function order(spec) {
            data.orderBy(orderSpecs[spec]);
        }

        /**
         * Helper function for making strings html safe
         * @param str The string to make safe
         */
        function htmlsafe(str) {
            return str.replace(/</g, '&lt;');
        }
        
        /**
         * Adds the parameters of a function/method to its signature.  Optional
         * parameters will be surrounded by brackets.  For instance, if a function
         * has a 'name' parameter and an optional 'value' parameter, this will
         * add '(name, [value])' to the function's signature
         * @param {Doclet} f The function doclet
         * @param {Array.<string>=} params An optional list of extra param names, prepended to the function params
         */
        function addSignatureParams(f, params) {
            var pnames = params || [];
            if (f.params) {
                f.params.forEach(function(p) {
                    if (p.name && p.name.indexOf('.') === -1) {
                        if (p.optional || p.type.optional) { pnames.push('<span class="optional">['+p.name+']</span>'); }
                        else { pnames.push(p.name); }
                    }
                });
            }
            
            f.signature = (f.signature || '') + '('+pnames.join(', ')+')';
        }
        
        /**
         * Retrieve a list of ancestors for the specified doclet
         * @param thisdoc the doclet
         * @returns {Array.<string>} The doclet's anscestors
         */
        function generateAncestry(thisdoc) {
            var ancestors = [],
                doc = thisdoc;

            while (doc = doc.memberof) {
                doc = find({longname: doc});
                if (doc) { doc = doc[0]; }
                if (!doc) break;
                ancestors.unshift( linkto(doc.longname, (scopeToPunc[doc.scope] || '') + doc.name) );
            }
            if (ancestors.length) {
                ancestors[ancestors.length-1] += (scopeToPunc[thisdoc.scope] || '');
            }
            return ancestors;
        }
        
        /**
         * Adds the return type to the signature of a function
         * @param {Doclet} f the function doclet
         */
        function addSignatureReturns(f) {
            var returnTypes = [];
            
            if (f.returns) {
                f.returns.forEach(function(r) {
                    if (r.type && r.type.names) {
                        if (! returnTypes.length) { returnTypes = r.type.names; }
                    }
                });
            }
            
            if (returnTypes && returnTypes.length) {
                returnTypes = _.map(returnTypes, function(r) {
                    return linkto(r);
                });
            }
            f.signature = '<span class="signature">'+(f.signature || '') + '</span>' + '<span class="type-signature">'+(returnTypes.length? ' &rarr; {'+returnTypes.join('|')+'}' : '')+'</span>';
        }
        
        /**
         * Adds the type to the signature of a member variable or constant
         * @param {Doclet} f the variable's doclet 
         */
        function addSignatureType(f) {
            var types = [];
            
            if (f.type && f.type.names) {
                types = f.type.names;
            }
            
            if (types && types.length) { //JJF from default
                types = _.map(types, function(t) {
                    return linkto(t, htmlsafe(t));
                });
            }//end form default
            
            f.signature = (f.signature || '') + '<span class="type-signature">'+htmlsafe(types.length? ' :'+types.join('|') : '')+'</span>';
        }
        
        /**
         * Adds the attributes to the signature of a doclet.  Attributes include
         * scope (e.g. 'static'), access (e.g. 'private'), and others such as
         * 'virtual', 'readonly', and 'constant'
         * @param {Doclet} f the doclet 
         */
        function addAttribs(f) {
            var attribs = [];
            
            if (f.virtual) {
                attribs.push('virtual');
            }
            
            if (f.access && f.access !== 'public') {
                attribs.push(f.access);
            }
            
            if (f.scope && f.scope !== 'instance' && f.scope !== 'global') {
                if (f.kind == 'function' || f.kind == 'member' || f.kind == 'constant') attribs.push(f.scope);
            }
            
            if (f.readonly === true) {
                if (f.kind == 'member') attribs.push('readonly');
            }
            
            if (f.kind === 'constant') {
                attribs.push('constant');
                f.kind = 'member';
            }
            
            f.attribs = '<span class="type-signature">'+htmlsafe(attribs.length? '<'+attribs.join(', ')+'> ' : '')+'</span>';
        }
        
        //remove the irrelevant doclet information from the data
        data.remove({undocumented: true, scope: ['global', 'inner']});
        data.remove({undocumented: true, kind: 'member'});
        data.remove({ignore: true});
        if (!opts['private']) { data.remove({access: 'private'}); }
        data.remove({memberof: '<anonymous>'});
        
        var packageInfo = (find({kind: 'package'}) || [])[0];
        
        data.forEach(function(doclet) {
            doclet.attribs = '';
            doclet.signature = '';
            
            if (doclet.kind === 'member') {
                addSignatureType(doclet);
                addAttribs(doclet);
            }
            
            if (doclet.kind === 'constant') {
                addSignatureType(doclet);
                addAttribs(doclet);
            }
            
            if (doclet.examples) {
                doclet.examples = doclet.examples.map(function(example) {
                    var caption, code;
                    
                    if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                        caption = RegExp.$1;
                        code    = RegExp.$3;
                    }
                    
                    return {
                        caption: caption || '',
                        code: code || example
                    };
                });
            }
            else if (doclet.see) {
                doclet.see.forEach(function(seeItem, i) {
                    doclet.see[i] = hashToLink(doclet, seeItem);
                });
            }
        });
        
        data.orderBy(orderSpecs.name);

        // copy static files to outdir
        var delim = String(java.lang.System.getProperty("file.separator")),
            outdir = opts.destination,
            fromDir = __dirname + delim + 'templates' + delim + 'jui' + delim + 'static',
            staticFiles = fs.ls(fromDir, 3);

        if (packageInfo && packageInfo.name) {
            outdir += delim + packageInfo.name + delim + packageInfo.version;
        }
        fs.mkPath(outdir);
            
        staticFiles.forEach(function(fileName) {
            var toDir = fs.toDir(fileName.replace(fromDir, outdir + delim + 'media'));
            fs.mkPath(toDir);
            fs.copyFile(fileName, toDir);
        });
        
        //copy the source files to the outdir
        if (packageInfo && packageInfo.files) {
            var toJSDir = fs.toDir(outdir + delim + 'media' + delim + 'js'),
                toCSSDir = fs.toDir(outdir + delim + 'media' + delim + 'css');
            packageInfo.files.forEach(function(fileName) {
                var fromFile = execDir + delim + fileName;
                fs.copyFile(fromFile, toJSDir);
                
                fromFile = execDir + delim + fileName.replace(/\.js$/, ".css");
                try {
                    fs.copyFile(fromFile, toCSSDir);
                } catch (e) {
                    //no-op
                }
            });
        }
        
        /**
         * Helper for creating links to other parts of the documentation
         */
        function linkto(longname, linktext, attrs) {
            var url = helper.longnameToUrl[longname];
            return url ? '<a href="' + url + '" ' + (attrs||'' ) + '>' + (linktext || longname) + '</a>' : (linktext || longname);
        }
        
        /**
         * Helper for creating tutorial links
         */
        function tutoriallink(tutorial) {
            return helper.toTutorial(tutorial);
        }
        
        function externalsNameFn(d) {
            return  d.name.replace(/(^"|"$)/g, '');
        }
        
        function widgetsNameFn(d) {
            return titleCase(d.name.substring(3));
        }
        
        function onSameModuleName(module, d) {
            d.name = d.name.replace('module:', 'require(')+')';
            moduleSameName[0].module = d;
        }
        
        /**
         * Helper function for adding navigation sections
         * @param {string} title The title of the section
         * @param {Array.<Doclet>} content the items in the section
         * @param {Object} seen An object keeping track of what items have already been seen
         * @param {Function=} nameFn An optional callback that returns the name to use for section items. By default the item's name is used. It is passed the item.
         * @param {Function=} moduleFn An optional callback to 
         */
        function addNavSection(title, content, seen, nameFn, moduleFn) {
            result = '';
            if (content.length) {
                result = result + '<dt>' + title + '</dt>';
                content.forEach(function(d) {
                    var moduleSameName = find({kind: 'module', longname: d.longname});
                    if (moduleSameName.length && moduleFn) {
                        moduleFn(moduleSameName, d);
                    }
                    if ( !seen.hasOwnProperty(d.longname) ) result += '<dd>'+linkto(d.longname, (nameFn && nameFn(d) || d.name))+'</dd>';
                    seen[d.longname] = true;
                });
            }
            return result;
        }
        
        //var containers = ['class', 'widget', 'module', 'external', 'namespace', 'mixin', 'demo'];
        
        data.forEach(function(doclet) {
            var url = createLink(doclet);
            helper.registerLink(doclet.longname, url);
        });
        
        data.forEach(function(doclet) {
            var url = helper.longnameToUrl[doclet.longname];

            if (url.indexOf('#') > -1) {
                doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
            }
            else {
                doclet.id = doclet.name;
            }
            
            if (doclet.kind === 'function' || doclet.kind === 'class' || doclet.kind === 'widget') {
                // if it is a widget method, add the method name to the signature
                var params = (doclet.kind === 'function' && doclet.memberof && doclet.memberof.indexOf("ui.") != -1 && doclet.access !== 'private') ? ['"' + doclet.name + '"'] : null; 
                addSignatureParams(doclet, params);
                addSignatureReturns(doclet);
                addAttribs(doclet);
            }
        });

        // do this after the urls have all been generated
        data.forEach(function(doclet) {
            doclet.ancestors = generateAncestry(doclet);
        });

        //Building the content for the main documentation navigation
        var nav = '',
            seen = {},
            modules = find({kind: 'module'}),
            externals = find({kind: 'external'}),
            classes = find({kind: 'class'}),
            widgets = find({kind: 'widget'}),
            namespaces = find({kind: 'namespace'}),
            mixins = find({kind: 'mixin'}),
            globals = find({kind: ['member', 'function', 'constant', 'typedef'], 'memberof': {'isUndefined': true}});

        nav += addNavSection("Modules", modules, seen);
        nav += addNavSection("Externals", externals, seen, externalsNameFn);
        nav += addNavSection("Classes", classes, seen, null, onSameModuleName);
        nav += addNavSection("Widgets", widgets, seen, widgetsNameFn, onSameModuleName);
        nav += addNavSection("Namespaces", namespaces, seen);
        nav += addNavSection("Mixins", mixins, seen);

        //Tutorials
        if (tutorials.children.length) {
            nav = nav + '<dt>Tutorials</dt>';
            tutorials.children.forEach(function(t) {
                nav = nav + '<dd>'+tutoriallink(t.name)+'</dd>';
            });
        }

        //Globals
        if (globals.length) {
            nav = nav + '<dt>Global</dt>';
            globals.forEach(function(g) {
                if ( g.kind !== 'typedef' && !seen.hasOwnProperty(g.longname) ) nav += '<li>'+linkto(g.longname, g.name)+'</li>';
                seen[g.longname] = true;
            });
        }

        //Generating the actual files
        for (var longname in helper.longnameToUrl) {
            var classes = find({kind: 'class', longname: longname});
            if (classes.length) generate('Class: '+classes[0].name, classes, helper.longnameToUrl[longname], containerTemplate);

            var widgets = find({kind: 'widget', longname: longname});
            if (widgets.length) generate(titleCase(widgets[0].name.substring(3)), widgets, helper.longnameToUrl[longname], containerTemplate);

            var modules = find({kind: 'module', longname: longname});
            if (modules.length) generate('Module: '+modules[0].name, modules, helper.longnameToUrl[longname], containerTemplate);

            var namespaces = find({kind: 'namespace', longname: longname});
            if (namespaces.length) generate('Namespace: '+namespaces[0].name, namespaces, helper.longnameToUrl[longname], containerTemplate);        

            var mixins = find({kind: 'mixin', longname: longname});
            if (mixins.length) generate('Mixin: '+mixins[0].name, mixins, helper.longnameToUrl[longname], containerTemplate);        

            var externals = find({kind: 'external', longname: longname});
            if (externals.length) generate('External: '+externals[0].name, externals, helper.longnameToUrl[longname], containerTemplate);

            var demos = find({kind: 'demo', longname: longname});
            if (demos.length) generate('Demo: ' + demos[0].name, demos, helper.longnameToUrl[longname], demoTemplate);
        }

        if (globals.length) generate('Global', [{kind: 'globalobj'}], 'global.html', containerTemplate);
        
        var classes = data.get( data.find({kind: ['class', 'widget']}) );
        if (classes.length) generate('Table of Contents', classes, 'index.html', indexTemplate);


        function generate(title, docs, filename, template) {
            var data = {
                title: title,
                docs: docs,
                nav: nav,

                // helpers
                render: render,
                find: find,
                order: order,
                linkto: linkto,
                tutoriallink: tutoriallink,
                htmlsafe: htmlsafe,
                titleCase: titleCase,
                getFileDoclet: getFileDoclet
            };

            var path = outdir + '/' + filename,
                html = template.call(data, data);

            html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

            fs.writeFileSync(path, html);
        }

        function generateTutorial(title, tutorial, filename, template) {
            var data = {
                title: title,
                header: tutorial.title,
                content: tutorial.parse(),
                children: tutorial.children,
                nav: nav,

                // helpers
                render: render,
                find: find,
                order: order,
                linkto: linkto,
                tutoriallink: tutoriallink,
                htmlsafe: htmlsafe,
                titleCase: titleCase,
                getWidgetLongName: getWidgetLongName
            };

            var path = outdir + '/' + filename,
                html = template.call(data, data);

            // yes, you can use {@link} in tutorials too!
            html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

            fs.writeFileSync(path, html);
        }

        // tutorials can have only one parent so there is no risk for loops
        function saveChildren(node) {
            node.children.forEach(function(child) {
                generateTutorial('Tutorial: '+child.title, child, helper.tutorialToUrl(child.name), tutorialTemplate);
            });
        }
        saveChildren(tutorials);
    };

    function hashToLink(doclet, hash) {
        if ( !/^(#.+)/.test(hash) ) { return hash; }

        var url = createLink(doclet);

        url = url.replace(/(#.+|$)/, hash);
        return '<a href="'+url+'">'+hash+'</a>';
    }

    var hash = require('pajhome/hash'),
        dictionary = require('jsdoc/tag/dictionary'),
        containers = ['class', 'widget', 'module', 'external', 'namespace', 'mixin', 'demo'], // each container gets its own html file
        globalName = 'global',
        fileExtension = '.html';

    /**
     * Helper to retrieve the namespace specified by a certain doclet type
     */
    function getNamespace(kind) {
        if (dictionary.isNamespace(kind)) {
            return kind+':';
        }
        return '';
    }

    function strToFilename(str) {
        if ( /[^$a-z0-9._-]/i.test(str) ) {
            return hash.hex_md5(str).substr(0, 10);
        }
        return str;
    }

    /**
     * Helper to convert a string to title case (Capitalize First Letter Of Every Word)
     */
    function titleCase(name) {
        if (!name || !name.length) { return ""; }
        var arr = name.split(" "),
            temp = null;
        for(var i = 0, l = arr.length; i < l; i++) {
            temp = arr[i];
            arr[i] = temp.substring(0, 1).toUpperCase() + temp.substring(1);
        }
        return arr.join(" ");
    }

    /** Turn a doclet into a URL. */
    var createLink = function(doclet) {
        var url = '';

        if (containers.indexOf(doclet.kind) < 0) {
            var longname = doclet.longname,
                filename = strToFilename(doclet.memberof || globalName); // TODO handle name collisions

            url = filename + fileExtension + '#' + getNamespace(doclet.kind) + doclet.name;
        }
        else {
            var longname = doclet.longname,
                filename = strToFilename(longname); // TODO handle name collisions

            url = filename + fileExtension;
        }

        return url;
    };
})();

function privateSort ( a, b )
{
    var x = a.name.replace(/^_/, 'zz').toLowerCase();
    var y = b.name.replace(/^_/, 'zz').toLowerCase();
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}
