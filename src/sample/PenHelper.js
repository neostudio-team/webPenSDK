import pen_controller, { PenMessageType, SettingType } from "../pensdk";

const serviceUuid = parseInt("0x19F1");
const characteristicUuidNoti = parseInt("0x2BA1");
const characteristicUuidWrite = parseInt("0x2BA0");

export default class PenHelper {
  constructor(){
    this.initPen()
  }

  initPen = () => {
    this.controller = new pen_controller();
    this.controller.addCallback(this.handleDot, this.handleMessage)
    this.controller.addWrite(this.handelwrite)
  };

  handleDot = (args) => {
    let dot = args.Dot;
    this.dotCallback(dot)
  }

  handleMessage = (type, args) =>{
    switch (type) {
      case PenMessageType.PEN_AUTHORIZED:
      console.log("PenHelper PEN_AUTHORIZED")
      this.controller.RequestAvailableNotes()
      break;
      case PenMessageType.PEN_PASSWORD_REQUEST:
        console.log("request password", args)
        this.controller.InputPassword("1234");
        break
      case PenMessageType.PEN_SETTING_INFO:
        console.log("PenHelper Setting Info", args)
        break
      case PenMessageType.PEN_SETUP_SUCCESS:
        let settingtype = Object.keys(SettingType).filter(key => SettingType[key] === args.SettingType)
        console.log("PenHelper Setting success", settingtype, args, typeof(args.SettingType))
        break
      default:
        console.log("PenHelper TODO", type, args)
    }
  }

 scanPen = () => {
    navigator.bluetooth
      .requestDevice({
        filters: [
          {
            services: [serviceUuid]
          }
        ]
      })
      .then(device => {
        console.log("> Name:             " + device.name);
        console.log("> Id:               " + device.id);
        console.log("> Connected:        " + device.gatt.connected);
        this.device = device
        return device.gatt.connect();
      })
      .then(service => {
        console.log("Get Service", service);
        return service.getPrimaryService(serviceUuid);
      })
      .then(service => {
        console.log("Get Service");
        service
          .getCharacteristic(characteristicUuidNoti)
          .then(characteristic => {
            characteristic.startNotifications();
            characteristic.addEventListener(
              "characteristicvaluechanged",
              this.handleNotifications
            );
            console.log("Get characteristic for notification", characteristic);

            this.controller.OnConnected();
          })
          .catch(err => console.log(err));

        service
          .getCharacteristic(characteristicUuidWrite)
          .then(writecharacteristic => {
            console.log("Get characteristic for write", writecharacteristic);
            this.writecharacteristic = writecharacteristic;
          })
          .catch(err => console.log(err));
      })

      .then()
      .catch(err => console.log(err));
  };

  disconnect = () => {
    this.device.gatt.disconnect();
  }

  // from Pen to SDK
  handleNotifications = event => {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push(value.getUint8(i));
    }
    console.log("APP -----> ", a);
    this.controller.putData(a);
  };


  // to Pen
  handelwrite = (data) => {
    if (!this.writecharacteristic) {
      console.log("writecharacteristic is null");
      return;
    }
    console.log("Pen ----->", data);
    this.writecharacteristic
      .writeValue(data)
      .then(() => {
        console.log("write success", data[1])
      })
      .catch(err => console.log("write Error",err));
  };


  
}