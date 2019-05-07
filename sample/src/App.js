import React from "react";
import pen_controller from "smartpensdk";
import {Dot} from 'smartpensdk'

const serviceUuid = parseInt("0x19F1");
const characteristicUuidNoti = parseInt("0x2BA1");
const characteristicUuidWrite = parseInt("0x2BA0");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.initPen()
  }

  render() {
    return (
      <div className="App">
        <header>NeoSmartPen Sample App</header>
        <button onClick={this.scanPen}>Scan Pen</button>
      </div>
    );
  }

  initPen = () => {
    this.controller = new pen_controller();
    this.controller.on('Write', this.writeData)
    this.controller.on('Connect', (sender, args) => {
        console.log('connected')
        console.log(args);
    })
    this.controller.on('Authenticated', (sender, args) => {
        console.log('Authenticated')
        this.controller.RequestPenStatus()
        this.controller.AddAvailableNote()
        // controller.RequestOfflineDataList()
    })
    this.controller.on('PasswordRequested', (sender, args) => {
        console.log('Request Password')
        this.controller.InputPassword('0000')
    })
    this.controller.on('DotReceived', (sender, args) => {
        // console.log(args);
        let dot = args.Dot
        if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
            if (this.currentPage !== dot.Page) {
              this.canvasInit()
              this.currentPage = dot.Page
            }
            this.dots = []
            this.predot = dot
            this.dots.push(dot)
        } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
            this.dots.push(dot)
            this.drawlineOne(this.predot, dot)
            this.predot = dot
        } else {
            this.drawlineOne(this.predot, dot)
            this.dots.push(dot)
            this.predot = dot
        }
    });
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

        return device.gatt.connect();
      })
      .then(service => {
        console.log("Get Service");
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

            this.controller.OnConnected()
          })
          .catch(err => console.log(err));

        service
          .getCharacteristic(characteristicUuidWrite)
          .then(writecharacteristic => {
            console.log("Get characteristic for write", writecharacteristic);
            this.writecharacteristic = writecharacteristic
          })
          .catch(err => console.log(err));
      })

      .then()
      .catch(err => console.log(err));
  };

  handleNotifications = event => {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push(value.getUint8(i));
    }
    console.log('> ' + a.join(' '));
    this.controller.OnDataReceived(a);
  };

  writeData = (sender, data) => {
    if (!this.writecharacteristic) {
        console.log("writecharacteristic is null")
        return;
    }
    console.log('send data----------------')
    console.log(data)
    this.writecharacteristic.writeValue(data)
    .then(res => console.log("write success res", res))
    .catch(err => console.log(err))
    // this.writecharacteristic.write(data, false, function (error) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log("write complete");
    //     }
    // })
}
}

export default App;
