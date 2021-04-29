// babel.config.js
module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
    ], plugins: [
        ['@babel/plugin-proposal-decorators', { 'legacy': true, 'loose': true }],
        ['@babel/plugin-proposal-class-properties', { 'loose': true }],
        // ["@babel/plugin-transform-modules-commonjs"]
    ]
};