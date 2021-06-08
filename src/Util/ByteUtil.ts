import * as Converter from "./Converter";
import CONST from "../PenCotroller/Const"

export default class ByteUtil {

  mBuffer: number[]
  mPosRead: number

  constructor() {
    this.mBuffer = []
    this.mPosRead = 0;
  }

  get Size() {
    return this.mBuffer.length;
  }


  Clear() {
    this.mPosRead = 0;
    this.mBuffer = [] //new Uint8Array(this.mBuffer.length);
  }


  PutByte(input: number) {
    this.mBuffer.push(input)
  }

  Put(input: number , escapeIfExist = true) {
    if (escapeIfExist) {
      let escDatas = this.Escape(input);

      let length = escDatas.length;
      for (let i = 0; i < length; ++i) {
        this.PutByte(escDatas[i]);
      }
    } else {
      this.PutByte(input);
    }

    return this;
  }

  PutArray(inputs: Uint8Array, length: number) {
    let result = inputs.slice();
    for (let i = 0; i < length; ++i) {
      this.Put(result[i]);
    }
    return this;
  }

  PutNull(length: number) {
    for (let i = 0; i < length; ++i) {
      this.Put(0x00);
    }

    return this;
  }

  PutInt(input: number) {
    let arr = Converter.intToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  PutLong(input: number) {
    let arr = Converter.longToByteArray(input);
    // NLog.log("put long", arr)
    return this.PutArray(arr, arr.length);
  }
  
  PutShort(input: number) {
    let arr = Converter.shortToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  //
  // Get
  //
  GetBytes(size: number) {
    let length = 0;
    if (size) {
      length = size
    }else{
      length = this.mBuffer.length - this.mPosRead;
      console.log("GetBytes all", length)
    }
    let result = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    this.mPosRead += length;
    const u8 = new Uint8Array(result)
    return u8;
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

  GetString(length: number) {
    const arr = Array.from(this.GetBytes(length))
    return String.fromCharCode(...arr).trim()
  }

  GetCheckSum(length: number) {
    let bytes = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    let CheckSum = 0;
    let bufSize = bytes.length;
    for (let i = 0; i < bufSize; ++i) {
      CheckSum += bytes[i] & 0xff;
    }

    return CheckSum & 0xff;
  }

  ToU8Array() {
    let u8 = new Uint8Array(this.mBuffer)
    return u8
  }

  Escape(input: number) {
    if (input === CONST.PK_STX || input === CONST.PK_ETX || input === CONST.PK_DLE) {
      return [CONST.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }
}

export function toHexString(bytes: Uint8Array) {
  const hex = Array.from(bytes).map( x => (x as any).toString(16).padStart(2, '0')).join("");
  console.log("mac", bytes,hex)
  return hex
}

export function  GetSectionOwnerByte(section: number, owner: number ) {
  let ownerByte = Converter.intToByteArray(owner);
  ownerByte[3] = section & 0xff;
  return ownerByte;
}

// 4 byte array
export function GetSectionOwner(bytes: Uint8Array) {
  let section = bytes[3] & 0xff
  let owner = bytes[0] + bytes[1] * 256 + bytes[2] * 65536;
  return [section, owner];
}

