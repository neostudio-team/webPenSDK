import * as Converter from '../Util/Converter'
import * as NLog from '../Util/NLog'

class Packet {
    Cmd: number
    Result: number
    mIndex: number
    Data: Uint8Array
    length: number

    constructor() {
        this.Cmd = 0;
        this.Result = 0;
        this.mIndex = 0;
        this.Data = new Uint8Array(0)
        this.length = 0
    }
    
    GetChecksum() {
        if (this.Data.length === 0) {
            return 0;
        }
        let length = 0;
        if (arguments.length === 0) {
            length = this.Data.length - this.mIndex;
        } else {
            length = arguments[0];
        }
        let bytes = this.Data.slice(this.mIndex, this.mIndex + length);
        let checkSum = 0;
        bytes.forEach(b=> checkSum += b & 0xFF)
        // for (var b in bytes) {
        //     checkSum += (b & 0xFF);
        // }
        return (checkSum & 0xFF);
        // return (byte)(checkSum)
    }

    CheckMoreData() {
        return this.Data.length > this.mIndex;
    }

    Move(size: number) {
        this.mIndex += size;
    }

    GetByte() {
        return this.GetBytes(1)[0];
    }


    GetBytes(arg: number | null) {
        let size = 0;
        if (arg) {
            size = arg
        }else {
            size = this.Data.length - this.mIndex;
        }
        console.log("GetBytes", size, this.Data.length)
        let result = this.Data.slice(this.mIndex, this.mIndex + size);
        if ( result.length === 0)
        {
            NLog.log("zero data");
        }
        this.Move(size);
        return result;
    }

    GetInt() {
        return Converter.byteArrayToInt(this.GetBytes(4))
    }

    GetShort() {
        console.log("GetShort", this.mIndex, this.Data.length)
        let u8 = this.GetBytes(2)
        console.log("GetShort u8", u8)
        let v = Converter.byteArrayToShort(u8)
        console.log("GetShort value", this.mIndex, this.Data.length, v)

        return v
    }

    GetLong() {
        return Converter.byteArrayToLong(this.GetBytes(8))
    }

    GetString(length: number) {
        let bytes = this.GetBytes(length);
        const filteru8 = bytes.filter(byte => byte !== 0x00)
        return new TextDecoder().decode(filteru8)
    }
}


class PacketBuilder {
    mPacket: Packet

    constructor() {
        this.mPacket = new Packet()
    }

    cmd(cmd: number) {
        this.mPacket.Cmd = cmd
        return this
    }

    result(code: number) {
        this.mPacket.Result = code
        return this
    }

    data(data: Uint8Array) {
        this.mPacket.Data = data
        return this
    }

    length(length: number){
        this.mPacket.length = length
        return this
    }

    Build() {
        return this.mPacket
    }
}
export default Packet
export {Packet, PacketBuilder}
