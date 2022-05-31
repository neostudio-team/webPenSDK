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


  /**
   * 버퍼에 데이터를 추가하는 함수
   * @param {number} input 
   */
  PutByte(input: number) {
    this.mBuffer.push(input)
  }

  /**
   * 버퍼에 데이터를 추가하며 escape 여부를 확인하는 함수
   * @param {number} input 
   * @param {boolean} escapeIfExist - false = 버퍼의 시작과 끝에 추가하여 escape처리를 안할 때
   * @returns 
   */
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

  /**
   * 버퍼에 특정 크기만큼의 배열을 추가하는 함수
   * @param {array} inputs 
   * @param {number} length 
   * @returns 
   */
  PutArray(inputs: Uint8Array, length: number) {
    let result = inputs.slice();
    for (let i = 0; i < length; ++i) {
      this.Put(result[i]);
    }
    return this;
  }

  /**
   * 버퍼에 특정 크기만큼 빈 값을 추가하는 함수
   * @param {number} length 
   * @returns 
   */
  PutNull(length: number) {
    for (let i = 0; i < length; ++i) {
      this.Put(0x00);
    }

    return this;
  }

  /**
   * 버퍼에 4바이트 크기의 값을 추가하는 함수
   * @param {number} input 
   * @returns 
   */
  PutInt(input: number) {
    let arr = Converter.intToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  /**
   * 버퍼에 8바이트 크기의 값을 추가하는 함수
   * @param {number} input 
   * @returns 
   */
  PutLong(input: number) {
    let arr = Converter.longToByteArray(input);
    // NLog.log("put long", arr)
    return this.PutArray(arr, arr.length);
  }
  
  /**
   * 버퍼에 2바이트 크기의 값을 추가하는 함수
   * @param {number} input 
   * @returns 
   */
  PutShort(input: number) {
    let arr = Converter.shortToByteArray(input);
    return this.PutArray(arr, arr.length);
  }

  //
  // Get
  //
  /**
   * 버퍼에서 원하는 바이트 크기만큼의 값을 반환하고, 바이트 위치값을 수정하는 함수
   * @param {number} size 
   * @returns 
   */
  GetBytes(size: number) {
    let length = 0;
    if (size) {
      length = size
    }else{
      length = this.mBuffer.length - this.mPosRead;
    }
    let result = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    this.mPosRead += length;
    const u8 = new Uint8Array(result)
    return u8;
  }

  /**
   * 버퍼에서 1바이트 크기의 값을 반환받는 함수
   * @returns 
   */
  GetByte() {
    return this.GetBytes(1)[0];
  }

  /**
   * 버퍼에서 4바이트 크기의 값을 반환받는 함수
   * @returns 
   */
  GetInt() {
    return Converter.byteArrayToInt(this.GetBytes(4));
  }

  /**
   * 버퍼에서 2바이트 크기의 값을 반환받는 함수
   * @returns 
   */
  GetShort() {
    return Converter.byteArrayToShort(this.GetBytes(2));
  }

  /**
   * 버퍼에서 8바이트 크기의 값을 반환받는 함수
   * @returns 
   */
  GetLong() {
    return Converter.byteArrayToLong(this.GetBytes(8));
  }

  /**
   * 버퍼에서 원하는 바이트 크기만큼의 값을 반환받는 함수
   * @param {number} length 
   * @returns 
   */
  GetString(length: number) {
    const arr = Array.from(this.GetBytes(length))
    return String.fromCharCode(...arr).trim()
  }

  /**
   * 버퍼에서 원하는 위치, 바이트 크기만큼의 값을 반환받는 함수
   * @param {number} offset 
   * @param {number} size 
   * @returns 
   */
  GetBytesWithOffset(offset: number, size: number){
    let packetSize = 0;
    if(offset + size > this.mBuffer.length){
      packetSize = this.mBuffer.length - offset; 
    }else{
      packetSize = size;
    }

    let result = this.mBuffer.slice(offset, offset + packetSize);

    const u8 = new Uint8Array(result);
    return u8;
  }

  /**
   * 원하는 크기만큼의 버퍼의 검사합을 반환받는 함수
   * @param {number} length 
   * @returns 
   */
  GetCheckSum(length: number) {
    let bytes = this.mBuffer.slice(this.mPosRead, this.mPosRead + length);
    let CheckSum = 0;
    let bufSize = bytes.length;
    for (let i = 0; i < bufSize; ++i) {
      CheckSum += bytes[i] & 0xff;
    }

    return CheckSum & 0xff;
  }

  /**
   * 버퍼 전체의 검사합을 반환받는 함수
   * @returns 
   */
  GetCheckSumBF(){
    let CheckSum = 0;
    for(let i = 0; i < this.mBuffer.length; i++){
      CheckSum +=  this.mBuffer[i] & 0xff;
    }
    return CheckSum & 0xff;
  }

  /**
   * 원하는 버퍼의 검사합을 반환받는 함수
   * @param {Uint8Array} data 
   * @returns 
   */
  GetCheckSumData(data: Uint8Array){
    let CheckSum = 0;
    for( let i = 0; i < data.length; i++){
      CheckSum += data[i] & 0xFF;
    }
    return CheckSum & 0xff;
  }

  /**
   * 현 버퍼를 Uint8Array 배열로 변환 후 반환하는 함수
   * @returns {array}
   */
  ToU8Array() {
    let u8 = new Uint8Array(this.mBuffer)
    return u8
  }

  /**
   * 패킷 내 실데이터 값으로 패킷의 시작, 끝 값인 STX, ETX가 포함되어 있을 때 escape 처리를 위한 함수
   * @param {number} input 
   * @returns {array}
   */
  Escape(input: number) {
    if (input === CONST.PK_STX || input === CONST.PK_ETX || input === CONST.PK_DLE) {
      return [CONST.PK_DLE, input ^ 0x20];
    } else {
      return [input];
    }
  }
}

/**
 * byte를 16진수문자열로 변환시키는 함수
 * @param {array} bytes 
 * @returns 
 */
export function toHexString(bytes: Uint8Array) {
  const hex = Array.from(bytes).map( x => (x as any).toString(16).padStart(2, '0')).join("");
  return hex
}

/**
 * section, owner를 4byte 크기의 데이터로 변환시키는 함수
 * @param {number} section 
 * @param {number} owner 
 * @returns 
 */
export function  GetSectionOwnerByte(section: number, owner: number ) {
  let ownerByte = Converter.intToByteArray(owner);
  ownerByte[3] = section & 0xff;
  return ownerByte;
}

// 4 byte array
/**
 * 패킷에서 피상된 4byte 크기의 데이터를 노트 정보인 section, owner로 치환하는 함수
 * @param {array} bytes 
 * @returns {array}
 */
export function GetSectionOwner(bytes: Uint8Array) {
  let section = bytes[3] & 0xff
  let owner = bytes[0] + bytes[1] * 256 + bytes[2] * 65536;
  return [section, owner];
}

