const Converter = require('./converter')

class ByteUtil {
    constructor() {
        let length = this.Const.DEF_LIMIT
        this.mEscDele = null
        if (arguments.length === 0)
        {
            this.mBuffer = new Array(length)
        }
        if (arguments.length === 1)
        {
            this.mEscDele = arguments[0]
            this.mBuffer = new Array(length)
        }
        else if(arguments.length === 2)
        {
            this.mEscDele = arguments[1]
            this.mBuffer = arguments[0].slice()
        }
        this.mPosWrite = 0
        this.mPosRead = 0
    }

    get Size() {
        if (!this.mBuffer)
            return 0
        return this.mBuffer.length
    }
    get Max() {
        return !this.mBuffer !== null ? this.mBuffer.length - 1 : 0
    }

    Clear() {
        this.mPosWrite = 0
        this.mPosRead = 0
        this.mBuffer = new Array(this.mBuffer.length)
    }

    Expand(increase) {
        this.mBuffer.length += increase
    }

    PutByte(input) {
        if (this.mPosWrite > this.Max) {
            this.Expand( this.Const.DEF_GROWTH )
        }

        this.mBuffer[this.mPosWrite++] = (input === undefined ? 0x00 : input)
    }

    Put(input, escapeIfExist = true) {
        if ( this.mEscDele && escapeIfExist ) {
            let escDatas = this.mEscDele(input)

            let length = escDatas.length;
            for ( let i = 0; i < length; ++i ) {
                this.PutByte(escDatas[i])
            }
        }
        else {
            this.PutByte(input)
        }

        return this
    }

    PutArray(inputs, length) {
        // let alength = inputs.length < length ? inputs.length : length
        let result = inputs.slice()
        result.length = length 

        for( let i = 0; i < length; ++i ) {
            this.Put(result[i])
        }
        return this
    }

    PutNull(length) {
        for (let i = 0; i < length; ++i) {
            this.Put(0x00)
        }

        return this
    }

    PutInt(input) {
        let arr = Conveter.intToByteArray(input)
        return this.PutArray(arr, arr.length)
    }
    PutLong(input) {
        let arr = Converter.longToByteArray(input)
        return this.PutArray(arr, arr.length)
    }
    PutShort(input) {
        let arr = Converter.shortToByteArray(input)
        return this.PutArray(arr, arr.length)
    }

    //
    // Get
    //
    GetBytes(size) {
        let length = 0
        if (arguments.length === 0) length = this.mPosWrite - this.mPosRead
        else if (arguments.length === 1) length = arguments[0]

        let result = this.mBuffer.slice(this.mPosRead, this.mPosRead + length)
        this.mPosRead += length 
        return result
    }

    GetByte() {
        return this.GetBytes(1)[0]
    }

    GetByteToInt() {
        return (this.GetByte() & 0xFF)
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

    GetString(length) {
        return String.fromCharCode(null, this.GetBytes(length)).trim();
    }

    GetCheckSum(length) {
        let bytes = this.mBuffer.slice(this.mPosRead, this.mPosRead + length)
        let CheckSum = 0
        let bufSize = bytes.length
        for (let i = 0; i < bufSize; ++i) {
            CheckSum += (bytes[i] & 0xFF)
        }

        return (CheckSum & 0xFF)
    }

    ToArray() {
        return this.mBuffer.slice(0, this.mPosWrite)
    }
}

// Defines
ByteUtil.prototype.Const = Object.freeze({
    "DEF_LIMIT": 1000,
    "DEF_GROWTH": 1000,
})

module.exports = ByteUtil