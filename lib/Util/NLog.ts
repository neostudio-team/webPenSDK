
var debug = true;
function log(...arg: any) {
  if (debug) console.log(...arg)
}

export {log, debug}
