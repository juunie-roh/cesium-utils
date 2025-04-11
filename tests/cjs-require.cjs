const { Viewer } = require('cesium');
const { Collection } = require('../dist/index.cjs');

console.log('Require test with Cesium:', !!Viewer, !!Collection);
