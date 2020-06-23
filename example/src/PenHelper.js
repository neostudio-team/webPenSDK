import { PenController, PenMessageType, Dot, SettingType} from "webpensdk"
// import usb from "usb"

const serviceUuid = parseInt("0x19F1");
const characteristicUuidNoti = parseInt("0x2BA1");
const characteristicUuidWrite = parseInt("0x2BA0");

const PEN_SERVICE_UUID_128 = "4f99f138-9d53-5bfa-9e50-b147491afe68"
const PEN_CHARACTERISTICS_NOTIFICATION_UUID_128 = "64cd86b1-2256-5aeb-9f04-2caf6c60ae57"
const PEN_CHARACTERISTICS_WRITE_UUID_128 = "8bc8cc7d-88ca-56b0-af9a-9bf514d0d61a"

const vid = 1155;
const pid = 22336; 

let penInstance;

export default class PenHelper {
  constructor() {
    if (penInstance) return penInstance;

    this.controller = new PenController();
    this.controller.addCallback(this.handleDot, this.handleMessage);
    this.controller.addWrite(this.handelwrite);
    this.device = null;
    this.dotCallback = null;
    this.messageCallback = null;
    penInstance = this
    // this.initUSB()
  }

  isConnected = () => {
    return this.writecharacteristic ? true : false
  }

  // MARK: Dot Event Callback
  handleDot = args => {
    let dot = args.Dot;
    if (this.dotCallback) this.dotCallback(dot);
  };

  // MARK: Pen Event Callback
  handleMessage = (type, args) => {
    switch (type) {
      case PenMessageType.PEN_AUTHORIZED:
        console.log("PenHelper PEN_AUTHORIZED");
        this.controller.RequestAvailableNotes();
        break;
      default:
        break
    }
    if (this.messageCallback) this.messageCallback(type, args);
  };

  scanPen = () => {
    this.checkAvailability()
    if (navigator.bluetooth) {
      console.log("bluetooth support")
    } else {
      alert("Bluetooth not support")
      return
    }
    console.log("Scan start")
    navigator.bluetooth
      .requestDevice({
        filters: [
          { services: [serviceUuid]  },
          { services: [PEN_SERVICE_UUID_128] }
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

  checkAvailability = () => {
    // const bluetoothUI = document.querySelector('#bluetoothUI');
    navigator.bluetooth.getAvailability().then(isAvailable => {
      console.log("isAvailable", isAvailable)
      // bluetoothUI.hidden = !isAvailable;
      if (!isAvailable) {
        alert("Bluetooth not support")
      }
    });
  }
  
  connectDevice = device => {
    if (!device) return;
    console.log("Connect start", device)
    device.gatt
      .connect()
      .then(service => {
        console.log("Get Service", service);
        if (service.device.name.includes("dimo")){
          return service.getPrimaryService(PEN_SERVICE_UUID_128)
        } else {
          return service.getPrimaryService(serviceUuid);
        }
      })
      .then(service => {
        console.log("binding service", service)
        this.serviceBinding(service)
      })
      .then()
      .catch(err => console.log(err));
  };

  serviceBinding = (service) => {
    // 128bit service id
    if (service.uuid === PEN_SERVICE_UUID_128){
      service.getCharacteristic(PEN_CHARACTERISTICS_NOTIFICATION_UUID_128)
      .then(characteristic => this.readCharacteristicBinding(characteristic))
      .catch(e =>{  
        console.log("readCharacteristicBinding error", e)
      })

      service.getCharacteristic(PEN_CHARACTERISTICS_WRITE_UUID_128)
      .then(characteristic => this.writeCharacteristicBinding(characteristic))
      .catch(e => {
        console.log("writeCharacteristicBinding error", e)
      })
    
      // 16bit service id
    } else {
      service.getCharacteristic(characteristicUuidNoti)
      .then(characteristic => this.readCharacteristicBinding(characteristic))
      .catch(e => {
        console.log("readCharacteristicBinding error", e)
      })

      service.getCharacteristic(characteristicUuidWrite)
      .then(characteristic => this.writeCharacteristicBinding(characteristic))
      .catch(e => {
        console.log("writeCharacteristicBinding error", e)
      })
    }

  }

  readCharacteristicBinding = (characteristic) => {
    characteristic.startNotifications();
    characteristic.addEventListener( "characteristicvaluechanged",  this.handleNotifications );
    this.controller.OnConnected();
  }

  writeCharacteristicBinding = (characteristic) => {
    this.writecharacteristic = characteristic;
  }

  connect = () => {
    console.log("Requesting any Bluetooth Device...", this.device);
    if (this.device) this.connectDevice(this.device);
  };

  disconnect = () => {
    if (this.device) this.device.gatt.disconnect();
  };

  // MARK: from Pen to SDK
  handleNotifications = event => {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push(value.getUint8(i));
    }
    // console.log("APP -----> ", a);
    this.controller.putData(a);
  };

  // MARK: to Pen
  handelwrite = data => {
    if (!this.writecharacteristic) {
      console.log("writecharacteristic is null");
      return;
    }
    // console.log("Pen ----->", data);
    this.writecharacteristic
      .writeValue(data)
      .then(() => {
        console.log("write success CMD: ", "0x" + data[1].toString(16), data[1]);
      })
      .catch(err => console.log("write Error", err));
  };

  // For USB Mode
  // connectUSB = () => {
  //   console.log("connect usb start");
  //   this.usbpen = usb.findByIds(1155, 22336);
  //   if (this.usbpen) {
  //       this.usbpen.open();
  //       this.usbpen.interfaces[1].claim();
  //       this.openUsbPen()
  //       let result = penparser._ndaclib_Init(1,1)
  //       console.log("result", result)
  //   }
  // }

  // openUsbPen = () => {
  //   var v = new Int8Array(39);
  //   v[0] = 0xc0;
  //   v[1] = 0x01;
  //   v[2] = 34;
  //   v[19] = 0xf0;
  //   v[20] = 0x01;
  //   v[38] = 0xc1;
  //   var data = new Buffer(v);
  //   // pen.interfaces[1].endpoints[0].transfer(data, function(error){
  //   //     console.log("error");
  //   //     console.log(error);
  //   // });
  //   this.usbpen.interfaces[1].endpoints[0].transfer(data, (error) => {
  //       console.log("error");
  //       console.log(error);
  //   });
  //   this.usbpen.interfaces[1].endpoints[1].on("data", (data) => {
  //       // console.log("data", data);
  //       // console.log("usb data size", data.length);
  //       let length = 0
  //       let result = penparser._ndaclib_Decode(data, data.length, length)
  //       let len = penparser.HEAPU8.subarray(length, 1)
  //       console.log("ndac length", len[0])
  //       let v = penparser.HEAPU8.subarray(result, result + len[0]);
  //       console.log("ndac result", v)
  //       this.controller.putData(v);
  //   });

  //   this.usbpen.interfaces[1].endpoints[1].on("error", (error) => {
  //       console.log("error");
  //       console.log(error);
  //   });

  //   this.usbpen.interfaces[1].endpoints[1].on("end", () => {
  //       console.log("end");
  //       penparser._ndaclib_Finalize()
  //   });

  //   this.usbpen.interfaces[1].endpoints[1].startPoll();
  // }

  // initUSB = () => {
  //   usb.on('attach', (device) => {
  //     console.log("attach");
  //     console.log(device);
  //     if (device.deviceDescriptor.idVendor === vid && device.deviceDescriptor.idProduct === pid) {
  //         console.log("neolab device");
  //         device.open();
  //         device.interfaces[1].claim();
  //         this.usbpen = device;
  //     }
  //   })
  
  //   usb.on('detach', (device) => {
  //     console.log("detach");
  //     console.log(device);
  //   })
  // }
}

export {PenMessageType, Dot, SettingType} 