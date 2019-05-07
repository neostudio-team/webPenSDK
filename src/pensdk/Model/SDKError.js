export default class SDKError {
  constructor(msg){
    this.message = msg;
    this.name="SDKError";
  }
  toString() {
    return this.name + ": " + this.message;
  }
}
function ArgumentNullException(msg) {
  this.message = msg;
  this.name="ArgumentNullException";
}

ArgumentNullException.prototype.toString = function () {
  return this.name + ': "' + this.message + '"';
}

function ArgumentOutOfRangeException(msg) {
  this.message = msg;
  this.name="ArgumentOutOfRangeException";
}


ArgumentOutOfRangeException.prototype.toString = function () {
  return this.name + ': "' + this.message + '"';
}

export {SDKError, ArgumentNullException, ArgumentOutOfRangeException}