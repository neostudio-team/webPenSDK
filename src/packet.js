const Converter = require('./converter')
class Packet {
    constructor() { }
    GetChecksum() {
        if (!this.Data)
            return 0;
        let length = 0;
        if (arguments.length === 0)
            length = this.Data.length - this.mIndex;
        else
            length = arguments[0];
        let bytes = this.Data.slice(this.mIndex, this.mIndex + length);
        let checkSum = 0;
        for (var b in bytes) {
            checkSum += (b & 0xFF);
        }
        return (checkSum & 0xFF);
        // return (byte)(checkSum)
    }
    CheckMoreData() {
        return this.Data > this.mIndex;
    }
    Move(size) {
        this.mIndex += size;
    }
    GetByte() {
        return this.GetBytes(1)[0];
    }
    GetBytes() {
        let size = 0;
        if (arguments.length === 0)
            size = this.Data.length - this.mIndex;
        else
            size = arguments[0];
        let result = this.Data.slice(this.mIndex, this.mIndex + size);
        if ( result.length === 0)
        {
            log("zero data");
        }
        this.Move(size);
        return result;
    }
    GetInt() {
        return Converter.byteArrayToInt(this.GetBytes(4))
    }
    GetShort() {
        return Converter.byteArrayToShort(this.GetBytes(2))
    }
    GetLong() {
        return Converter.byteArrayToLong(this.GetBytes(8))
    }
    GetByteToInt() {
        return (this.GetByte() & 0xFF);
    }
    GetString(length) {
        let bytes = this.GetBytes(length);
        // return String.fromCharCode(null, bytes).trim();
        return (new Buffer(bytes.filter(byte=>byte!=0x00)).toString('utf8')).trim();
    }
}
Packet.prototype.Cmd = 0;
Packet.prototype.Result = 0;
Packet.prototype.mIndex = 0;
Packet.prototype.Data = null;

class PacketBuilder {
    constructor() {
        this.mPacket = new Packet()
    }

    cmd(cmd) {
        this.mPacket.Cmd = cmd
        return this
    }

    result(code) {
        this.mPacket.Result = code
        return this
    }

    data(data) {
        this.mPacket.Data = data
        return this
    }

    Build() {
        return this.mPacket
    }
}

module.exports = {
    Packet: Packet,
    PacketBuilder: PacketBuilder
}