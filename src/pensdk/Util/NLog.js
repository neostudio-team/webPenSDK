export default class NLog {
  static debug = true;
  static log(...arg){
    if (NLog.debug) console.log(...arg)
  }
}

