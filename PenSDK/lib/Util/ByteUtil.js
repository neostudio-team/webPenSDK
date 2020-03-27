import * as Converter from "./Converter";

export default class ByteUtil {
  constructor() {
    let length = this.Const.DEF_LIMIT;
    this.mEscDele = null;
    if (arguments.length === 0) {
      this.mBuffer = new Array(length);
    }
    if (arguments.length === 1) {
      this.mEscDele = arguments[0];
      this.mBuffer = new Array(length);
    } else if (arguments.length === 2) {
      this.mEscDele = arguments[1];
      this.mBuffer = arguments[0].slice();
    }
    this.mPosWrite = 0;
    this.mPosRead = 0;
  }

  get Size() {
    if (!this.mBuffer) return 0;
    return this.mBuffer.length;
  }
  get Max() {
    return !this.mBuffer !== null ? this.mBuffer.length - 1 : 0;
  }

  Clear() {
    this.mPosWrite = 0;
    this.mPosRead = 0;
    this.mBuffer = new Array(this.mBuffer.length);
  }

  Expand(increase) {
    this.mBuffer.length += increase;
  }

  PutByte(input) {
    if (this.mPosWrite > this.Max) {
      this.Expand(this.Const.DEF_GROWTH);
    }

    this.mBuffer[this.mPosWrite++] = input === undefined ? 0x00 : input;
  }

  Put(input, escapeIfExist = true) {
    if (this.mEscDele && escapeIfExist) {
      let escDatas = this.mEscDele(input);

      let length = escDatas.length;
      for (let i = 0; i < length; ++i) {
        this.PutByte(escDatas[i]);
      }
    } else {
      this.PutByte(input);
    }

    return this;
  }

  PutArray(inputs, length) {
    let result = inputs.slice();
    for (let i = 0; i < length; ++i) {
      this.Put(result[i]);
    }
    return this;
  }

  PutNull(length) {
    for (let i = 0; i < length; ++i) {
      this.Put(0x00);
    }

    return this;
  }

  PutInt(input) {
    let arr = Converter.intToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  PutLong(input) {
    let arr = Converter.longToByteArray(input);
    // NLog.log("put long", arr)
    return this.PutArray(arr, arr.length);
  }
  
  PutShort(input) {
    let arr = Converter.shortToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  //
  // Get
  //
  GetBytes(size) {
    let length = 0;
    if (arguments.length === 0) length = this.mPosWrite - this.mPosRead;
    else if (arguments.length === 1) length = arguments[0];

    let result = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    this.mPosRead += length;
    return result;
  }

  GetByte() {
    return this.GetBytes(1)[0];
  }

  GetInt() {
    return Converter.byteArrayToInt(this.GetBytes(4));
  }

  GetShort() {
    return Converter.byteArrayToShort(this.GetBytes(2));
  }

  GetLong() {
    return Converter.byteArrayToLong(this.GetBytes(8));
  }

  GetString(length) {
    return String.fromCharCode(null, this.GetBytes(length)).trim();
  }

  GetCheckSum(length) {
    let bytes = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    let CheckSum = 0;
    let bufSize = bytes.length;
    for (let i = 0; i < bufSize; ++i) {
      CheckSum += bytes[i] & 0xff;
    }

    return CheckSum & 0xff;
  }

  ToArray() {
    return this.mBuffer.slice(0, this.mPosWrite);
  }
}

export function toHexString(bytes) {
  return bytes
    .map(function(byte) {
      return ("00" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

export function  GetSectionOwnerByte(section, owner) {
  let ownerByte = Converter.intToByteArray(owner);
  ownerByte[3] = section & 0xff;
  return ownerByte;
}

// 4 byte array
export function  GetSectionOwner(bytes) {
  let section = parseInt(bytes[3] & 0xff);
  let owner = bytes[0] + bytes[1] * 256 + bytes[2] * 65536;
  return [section, owner];
}

// Defines
ByteUtil.prototype.Const = Object.freeze({
  DEF_LIMIT: 1000,
  DEF_GROWTH: 1000
});
