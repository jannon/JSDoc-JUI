JSDoc-JUI
=========

This is a JSDoc3 plugin and template developed to document the JUI set of JavaScript widgets.
It should be useful for documenting any widgets built with the jQuery UI widget factory.

Notice
------

This is *beta software*! It is available for testing purposes and may not be 
suitable for production use yet.

Prerequisites
-------------

You should have JSDoc3 installed somewhere.  Check out https://github.com/micmath/jsdoc 
for more information about JSDoc3.

*NOTE: There are pending pull requests, but currently the above version of JSDoc3 doesn't
quite have what it takes.  Visit the fork at https://github.com/jannon/jsdoc for the version
currently required by this plugin/template.*

If you want to use the build tools to automatically install the plugin/template
into your JSDoc3 installation, which can save some time if you're actively making 
changes to the plugin or template, you'll need to have the following installed: 

- Jake: https://github.com/mde/jake

Otherwise, you can just copy the files over manually.

Installation
------------

Presumably, you've already got the code, but if not, go and get it:  
https://github.com/jannon/JSDoc-JUI

### Manual installation ###

Whether you cloned the repo or downloaded an archive, you should see the following
partial directory structure:

    plugins
      \-jquery-ui-widget.js
    templates
      \-jui
        \-static
        \-tmpl
        \-publish.js

Simply copy the _plugins_ and the _templates_ directories into your JSDoc3 installation.
You'll also need to edit the JSDoc3 conf.json to add the plugin. See the JSDoc documentation.

### Automatic installation ###

If you're going to be making frequent changes to your repo, you can use the provided
Jake _install_ task.  It will copy the files over and edit the conf.json.  It just
needs to know where your JSDoc3 is located.  You can either tell it on the commandline:

    $>jake install[path/to/JSDoc3]

_note: on some systems (like MacOS X), you may need to quote the target name and parameters_:

    $>jake 'install[path/to/JSDoc3]'

or set a JSDOC_HOME environment variable and just run:

    $>jake install

Usage
----- 

Thanks to some recent upgrades to the flexibility of the parser and plugin system
in JSDoc3 (found in the fork mentioned in the _Prerequisites_ section above), you
shouldn't have to do anything special to document your widget.  In fact, if you
don't include any comments at all, you will still generate basic documentation
that lists the methods, options and events of the widget.  But you'll proabably
want to make things a little easier for people using your widget so below you'll 
find instructions for documenting your code for use with this plugin/template.

First, a look at documentation produced by the template.  Check out the [JUI docs] (http://jannon.net/jui/)
The template creates documentation the mimics the look and feel of the standard [jQuery UI documentation] (http://jqueryui.com/demos)

Okay, now here are the relevant things to make that happen:

- The File
- The Widget
- Options
- Methods
- Events
- Demos

### The File ###

There is nothing about this documentation that differs from the standard JSDoc3.
It's just a good idea to have it.  In fact, the template was created with the assumption of its
presence and hasn't yet been tested to see if things blow up if it's not there.
Here's an example file comment.

    [Beginning of file]
    /**
     * @summary     jQuery UI SuperWidget
     * @description Create a super widget that does everything on the entire web!
     * @file        jquery.ui.superwidget.js
     * @version     1.0
     * @author      Jannon Frank (jannon.net)
     * @license     MIT or GPL v3
     *
     * @copyright Copyright 2012 Jannon Frank, all rights reserved.
     *
     * This source file is free software, under either the MIT license or GPL v3 license
     * available at:
     *   http://jannon.net/license_mit
     *   http://jannon.net/license_gpl3
     */

Now for the nitty and the gritty

### The Widget ###

To document the widget just put a comment above your widget factory call.  A
comment might look something like this:

    /**
     * This widget provides UI for being super.  Its the bestest most unbelievablest
     * widget ever created.  Seriously, if you put it on your site, everything will 
     * happen.
     * @require UI Core
     * @require UI Widget
     * @example 
     *      $('&lt;div/&gt;').superwidget();
     * @samplemarkup
     * <pre>
     *  &lt;ul class="ui-widget-content ui-superwidget ui-corner-all"&gt;
     *      &lt;div class="ui-superwidget-power ui-corner-all ui-state-default"&gt;Power&lt;/div&gt;
     *      &lt;div class="ui-superwidget-glory ui-corner-all ui-state-default"&gt;Glory&lt;/div&gt;
     *      ...
     *  &lt;/div&gt;
     * </pre>
     */

First is the description.  That's pretty straightfoward

The ```@require``` tags here (no 's') are not the standard JSDoc3 ```@requires``` ('s') tags because JSDoc3
makes assumptions that we're talking about requiring node modules or something when ```@requires``` is used.

If ```@samplemarkup``` is present, the theming tab in the widget documentation will contain some extra info
including the sample markup provided

### Options ###

You don't really need a comment for the options object itself, since the options object is a standard 
jQuery UI convention.  You can include one, but it doesn't get shown anyhwere in the documentation.

Comments for the individual options are used however.  You can provide descriptions.  The default value is 
pulled automatically from the code, but you can override it if you specify a  ```@default``` tag.
The type is also inferred from the code.  If the default value is something like null, however, the type
will just be set to "Object" so you'll probably want to specify a ```@type``` in that case. So you could
just give a description:

    /**
     * The secret identity of the super widget
     */
    identity: "Mild Mannered Div"
    
or you could include extra stuff:

    /**
     * The secret identity of the super widget
     * @type        String
     * @default     Mild Mannered Div
     */

Both of those will produce the same documentation

### Methods ###

The comments for the widget methods like _create, destroy, and all your custom methods
are just documented like any function, specifying parameters and return types and 
things:

    /**
     * Determines if that's the thing on the page
     * @param {String} thing the thing you think it is
     * @returns {Boolean} Whether or not it's the thing
     */
    whatsThatOnThePage: function(thing) {
        switch(thing) {
            case "br":
                return false;
            case "plugin":
                return false;
            case "superwidget":
                return true;
        }
        throw kryptonite;
    }

### Events ###

If you don't add anything about events in your code, the documentation will still 
display what events are triggered in the code.  It finds all of the ```this._trigger(...)```
calls.  But if you want to add a description of the event or tell users what data
the event handler can expect, or if you fire the event differently (e.g. using ```self._trigger```),
then you have to document the event using a virtual doclet.  Just add JSDOC comments 
about your events to the bottom of your file.  One such comment block might look like this:

    /**
     * Event fired whenever there is danger and the superwidget is needed.
     * @event
     * @name ui.superwidget#change
     * @param {Event}  e jQuery event object
     * @param {Object} ui Event parameters from superwidget
     * @param {String} ui.booth The name of the cookie where the secret identity clothes were left
     */

Once again, the description, first, is straightfoward.

Then well say this is an event with ```@event```

The ```@name``` is what lets us include arbitrary documentation (documentation not tied to a particular code symbol). 
The name should be specified as above, to provide both the name and the widget it belongs to

The ```@param``` tags specify the parameters that callbacks listening to the event will receive

### Demos ###

Everybody likes a demo! Like events, the comment blocks for demos are just placed somewhere at the bottom of the file.  
A demo comment might look like this:

    /**
     * Default superwidget.
     * @demo Default Functionality
     * @demoscript
     *      $(function() {
     *          $("#ck").superwidget();
     *      });
     * @demomarkup
     *      <div class="demo">
     *          <div id="ck"></div>
     *      </div>
     * @memberof ui.superwidget
     * @name default
     */

Again, description first.

The ```@demo``` tag says this is a demo and provides the label for the demo.  This is 
what shows up in the navigation in the documenation.

The ```@demoscript``` tag provides JavaScript for the demo.

The ```@demomarkup``` tag provides markup for the demo.

Again, we have the name so we can document an arbitrary thing.  But this time, 
instead of including the widget it the name, we use a ```@memberof``` tag to specify
that.  This is because separate html files are created for the demos and it needs
to be done this way for JSDoc3 to create the filenames and links properly.

See Also
--------

- JUI Documentation: http://jannon.net/jui
- JUI Source Code: https://github.com/jannon/JUI
- Required JSDoc3 Fork: https://github.com/jannon/jsdoc
- Original JSDoc3 Project: https://github.com/micmath/jsdoc  

License
-------

JSDoc-JUI is copyright (c) 2012 Jannon Frank http://jannon.net

See file "LICENSE.md" in this distribution for more details about
terms of use.
