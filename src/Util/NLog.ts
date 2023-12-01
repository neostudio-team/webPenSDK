var debug = true;
function log(...arg: any) {
  if (debug) console.log(...arg);
}

function setDebug(bool: boolean) {
  debug = bool;
}

export { log, debug, setDebug };
