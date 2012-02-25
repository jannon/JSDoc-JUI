desc('Adds the plugin and template into the JSDoc3 installation.');
task('install', function (jsdocHome) {
    var fs = require('fs'),
        util = require('util'),
        path = require('path'),
        wrench = require('wrench/wrench'),
        jsdoc = jsdocHome || process.env.JSDOC_HOME,
        config, readme;
    
    //If no location, display error and exit
    if (!jsdoc) {
        fail("No JSDoc home specified.");
    }
    
    if (!path.existsSync(jsdoc)) {
        fail("JSDoc home [" + jsdoc + "] is not valid.");
    }
    
    //TODO: Test jsdoc is actually present at location?
    
    //Otherwise, copy over the files
    //First the plugin
    wrench.copyDirSyncRecursive('plugins', path.join(jsdoc, "plugins"), {preserve: true});
    
    //Then the template
    wrench.copyDirSyncRecursive('templates', path.join(jsdoc, "templates"), {preserve: true});
    
    //Also throw in the README so it can be easily accessed
    readme = fs.readFileSync('README.md', 'utf8');
    fs.writeFileSync(path.join(jsdoc, 'templates', 'jui', 'README.md'), readme, 'utf8');
    
    //And finally edit the conf.json
    config = JSON.parse(fs.readFileSync(path.join(jsdoc, 'conf.json'), 'utf8'));
    if (config.plugins.indexOf('plugins/jquery-ui-widget') == -1) {
        config.plugins.push('plugins/jquery-ui-widget');
    }
    fs.writeFileSync(path.join(jsdoc, 'conf.json'), JSON.stringify(config, null, "    "), 'utf8');
      
    process.exit(0);
});