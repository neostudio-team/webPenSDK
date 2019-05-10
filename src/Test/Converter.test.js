import Converter from '../pensdk/Util/Converter'
import {SettingType} from '../pensdk'

let res = Converter.toUTF8Array('0,0,0,0')
console.log("Test Start", res)
it('utf8 string to uint8array', () =>
{
  expect(res).toEqual([48, 44, 48, 44, 48, 44, 48])
});

expect(res).toEqual([48, 44, 48, 44, 48, 44, 48])

let keys = Object.keys(SettingType).find(key => SettingType[key] === 5)
console.log("SettingType", keys)

const testv = { a: 1, b: 3}
testv.a = 5
