import pen_controller from "../pensdk";

const serviceUuid = parseInt("0x19F1");
const characteristicUuidNoti = parseInt("0x2BA1");
const characteristicUuidWrite = parseInt("0x2BA0");

export default class PenHelper {
  constructor() {
    this.initPen();
    this.device = null;
    this.dotCallback = null;
    this.messageCallback = null;
  }

  initPen = () => {
    this.controller = new pen_controller();
    this.controller.addCallback(this.handleDot, this.handleMessage);
    this.controller.addWrite(this.handelwrite);
  };

  handleDot = args => {
    let dot = args.Dot;
    if (this.dotCallback) this.dotCallback(dot);
  };

  handleMessage = (type, args) => {
    if (this.messageCallback) this.messageCallback(type, args);
  };

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
        this.device = device;
        this.connectDevice(this.device);
      })
      .catch(err => console.log(err));
  };

  connectDevice = device => {
    if (device)
      device.gatt
        .connect()
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
              console.log(
                "Get characteristic for notification",
                characteristic
              );

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

  connect = () => {
    console.log("Requesting any Bluetooth Device...", this.device);
    if (this.device) this.connectDevice(this.device);
  };

  disconnect = () => {
    if (this.device) this.device.gatt.disconnect();
  };

  // from Pen to SDK
  handleNotifications = event => {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push(value.getUint8(i));
    }
    // console.log("APP -----> ", a);
    this.controller.putData(a);
  };

  // to Pen
  handelwrite = data => {
    if (!this.writecharacteristic) {
      console.log("writecharacteristic is null");
      return;
    }
    // console.log("Pen ----->", data);
    this.writecharacteristic
      .writeValue(data)
      .then(() => {
        console.log("write success", data[1]);
      })
      .catch(err => console.log("write Error", err));
  };
}
