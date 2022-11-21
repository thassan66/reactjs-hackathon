const NYC = require('nyc');
var nyc = new NYC({
  esModules: true,
});

nyc.instrumentAllFiles('./src', './test/instrumented', process.exit);
