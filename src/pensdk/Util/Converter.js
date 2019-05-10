export default class Converter {
  static toUTF8Array = str => {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(
          0xe0 | (charcode >> 12),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
      // surrogate pair
      else {
        i++;
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode =
          0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
    }
    return utf8;
  };

  static byteArrayToInt = bytes => {
    let arr = new Uint8Array(bytes);
    let dv = new DataView(arr.buffer);
    return dv.getInt32(0, true);
  };

  static intToByteArray(input) {
    let arr = new Uint8Array(4);
    let dv = new DataView(arr.buffer);
    dv.setUint32(0, input, true);
    return Array.from(arr);
  }

  static byteArrayToShort(bytes) {
    let arr = new Uint8Array(bytes);
    let dv = new DataView(arr.buffer);
    return dv.getInt16(0, true);
  }

  static shortToByteArray(input) {
    let arr = new Uint8Array(2);
    let dv = new DataView(arr.buffer);
    dv.setUint16(0, input, true);
    return Array.from(arr);
  }

  /**
  * Returns the sum of a and b
  * @param {array} bytes
  * @returns {number} bicInt64
  */
  static byteArrayToLong(bytes) {
    let arr = new Uint8Array(bytes);
    let dv = new DataView(arr.buffer);
    let result = dv.getBigUint64(0, true)
    return parseInt(result)
  }

  static longToByteArray(input) {
    let bigint = window.BigInt(input)
    let arr = new Uint8Array(8);
    let dv = new DataView(arr.buffer);
    dv.setBigUint64(0, bigint, true);
    return Array.from(arr);
  }
}

export {}