const register = require('babel-core/register');

register({
    presets: ['es2015-node6', 'stage-3']
});

require('./index.js');