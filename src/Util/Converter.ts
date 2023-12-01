function toUTF8Array(str: string): Uint8Array {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

/**
 * 바이트 값을 정수(int)로 변환하는 함수
 * @param {array} bytes
 * @returns
 */
function byteArrayToInt(bytes: Uint8Array) {
  let arr = new Uint8Array(bytes);
  let dv = new DataView(arr.buffer);
  return dv.getUint32(0, true);
}

/**
 * 정수(int)를 4바이트 크기의 배열로 변환하는 함수
 * @param {number} input
 * @returns
 */
function intToByteArray(input: number) {
  let arr = new Uint8Array(4);
  let dv = new DataView(arr.buffer);
  dv.setUint32(0, input, true);
  return Uint8Array.from(arr);
}

/**
 * 바이트 값을 정수(short)로 변환하는 함수
 * @param {array} bytes
 * @returns
 */
function byteArrayToShort(bytes: Uint8Array) {
  let arr = new Uint8Array(bytes);
  let dv = new DataView(arr.buffer);
  return dv.getUint16(0, true);
}

/**
 * 정수(short)를 2바이트 크기의 배열로 변환하는 함수
 * @param {number} input
 * @returns
 */
function shortToByteArray(input: number) {
  let arr = new Uint8Array(2);
  let dv = new DataView(arr.buffer);
  dv.setUint16(0, input, true);
  return Uint8Array.from(arr);
}

/**
 * 바이트 값을 정수(long)로 변환하는 함수
 * @param {array} bytes
 * @returns {number} bicInt64
 */
function byteArrayToLong(bytes: Uint8Array) {
  var byte = new Uint8Array(bytes);
  var view = new DataView(byte.buffer);
  var hi = view.getUint32(0, true);
  let low = view.getUint32(4, true);
  var intValue = hi + low * 4294967296; // 2 ^ 32
  return intValue;
}

/**
 * 정수(long)를 8바이트 크기의 배열로 변환하는 함수
 * @param {number} input
 * @returns
 */
function longToByteArray(input: number) {
  let long = input;
  var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
  for (var index = 0; index < byteArray.length; index++) {
    var byte = long & 0xff;
    byteArray[index] = byte;
    long = (long - byte) / 256;
  }
  return Uint8Array.from(byteArray);
}

export {
  toUTF8Array,
  byteArrayToInt,
  byteArrayToShort,
  intToByteArray,
  shortToByteArray,
  byteArrayToLong,
  longToByteArray,
};
