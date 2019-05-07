module.exports.toUTF8Array = function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

module.exports.byteArrayToInt = function byteArrayToInt(bytes) {
    let arr = new Uint8Array(bytes)
    let dv = new DataView(arr.buffer)
    return dv.getInt32(0, true)
}

module.exports.intToByteArray = function intToByteArray(input) {
    let arr = new Uint8Array(4)
    let dv = new DataView(arr.buffer)
    dv.setUint32(0, input, true)
    return Array.from(arr)
}

module.exports.byteArrayToShort = function byteArrayToShort(bytes) {
    let arr = new Uint8Array(bytes)
    let dv = new DataView(arr.buffer)
    return dv.getInt16(0, true)
}

module.exports.shortToByteArray = function shortToByteArray(input) {
    let arr = new Uint8Array(2)
    let dv = new DataView(arr.buffer)
    dv.setUint16(0, input, true)
    return Array.from(arr)
}

module.exports.byteArrayToLong = function byteArrayToLong(bytes) {
    return ((bytes[0] & 0xff)) | ((bytes[1] & 0xff) << 8) 
            | ((bytes[2] & 0xff) << 16) | ((bytes[3] & 0xff) << 24) 
            | ((bytes[4] & 0xff) << 32) | ((bytes[5] & 0xff) << 40) 
            | ((bytes[6] & 0xff) << 48) | ((bytes[7] & 0xff) << 56)
}

module.exports.longToByteArray = function longToByteArray(input) {
    let arr = new Uint8Array([
        input & 0xff,
        (input >> 8) & 0xff,
        (input >> 16) & 0xff,
        (input >> 24) & 0xff,
        (input >> 32) & 0xff,
        (input >> 40) & 0xff,
        (input >> 48) & 0xff,
        (input >> 56) & 0xff
    ]);
    return Array.from(arr)
}