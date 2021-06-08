import {PenController, Dot, PenMessageType, SettingType} from '../index'

test("PenController", () => {
  const temp1 =  [192, 129, 0, 65, 0, 78, 87, 80, 45, 70, 51, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 46, 48, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 46, 49, 56, 0, 0, 0, 0, 83, 109, 97, 114, 116, 112, 101, 110, 32, 100, 105, 109, 111, 95, 100, 0, 1, 0, 156, 123, 210, 66, 0, 111, 1, 193]
  const u8 = new Uint8Array(temp1)
  const penConn = new PenController()
  penConn.putData(u8)
});

