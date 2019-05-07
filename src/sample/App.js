import React from "react";
import pen_controller, { Dot } from "../pensdk";

const serviceUuid = parseInt("0x19F1");
const characteristicUuidNoti = parseInt("0x2BA1");
const characteristicUuidWrite = parseInt("0x2BA0");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.initPen();
  }

  render() {
    return (
      <div className="App">
        <header>NeoSmartPen Sample App</header>
        <button onClick={this.scanPen}>Scan Pen</button>
        <div></div>
        <canvas id="myCanvas" className="myCanvas" style={{width: 1000, height:800, backgroundColor: 'gray'}} />
      </div>
    );
  }

  initPen = () => {
    this.controller = new pen_controller();
    this.controller.on("Write", this.writeData);
    this.controller.on("Connect", (sender, args) => {
      console.log("connected", sender, args);
    });
    this.controller.on("Authenticated", (sender, args) => {
      console.log("Authenticated", sender, args);
      this.controller.RequestPenStatus();
      setTimeout(() => this.controller.AddAvailableNote(), 700);
      // this.controller.AddAvailableNote()
      // controller.RequestOfflineDataList()
    });
    this.controller.on("PenStatusReceived", (sender, args) => {
      console.log("PenStatusReceived", sender, args);
    });
    this.controller.on("PasswordRequested", (sender, args) => {
      console.log("Request Password");
      this.controller.InputPassword("0000");
    });
    this.controller.on("DotReceived", (sender, args) => {
      // console.log(args);
      let dot = args.Dot;
      if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
        if (this.currentPage !== dot.Page) {
          this.canvasInit();
          this.currentPage = dot.Page;
        }
        this.dots = [];
        this.predot = dot;
        this.dots.push(dot);
      } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
        this.dots.push(dot);
        this.drawlineOne(this.predot, dot);
        this.predot = dot;
      } else {
        this.drawlineOne(this.predot, dot);
        this.dots.push(dot);
        this.predot = dot;
      }
    });
  };

  canvasInit = () => {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d", {
      alpha: false
    });
    ctx.clearRect(0, 0, c.width, c.clientHeight);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.clientHeight);
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

  handleNotifications = event => {
    let value = event.target.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push(value.getUint8(i));
    }
    // console.log("> " + a.join(" "));
    this.controller.OnDataReceived(a);
  };

  writeData = (sender, data) => {
    if (!this.writecharacteristic) {
      console.log("writecharacteristic is null");
      return;
    }
    console.log("send data----------------");
    console.log(data);
    this.writecharacteristic
      .writeValue(data)
      .then(res => console.log("write success res", res))
      .catch(err => console.log(err));
    // this.writecharacteristic.write(data, false, function (error) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log("write complete");
    //     }
    // })
  };

  drawlineOne = (d1, d2) => {
    var c = document.getElementById("myCanvas");
    if (c == null) {
        console.log("element is null")
        return
    }
    var ctx = c.getContext("2d");
    var scale = 1
    ctx.beginPath();
    ctx.moveTo(d1.X * scale, d1.Y * scale);
    ctx.lineTo(d2.X * scale, d2.Y * scale);
    ctx.stroke();
}

 drawline = (dd) => {
    var c = document.getElementById("myCanvas");
    if (c == null) {
        console.log("element is null")
        return
    }
    if (dd.length < 2) {
        return
    }
    var ctx = c.getContext("2d");
    // ctx.fillStyle='black';
    var scale = 1
    var count = dd.length
    ctx.beginPath();
    ctx.moveTo(dd[0].X * scale, dd[0].Y * scale);

    for (let i = 0; i < count; i++) {
        ctx.lineTo(dd[i].X * scale, dd[i].Y * scale);
    }
    ctx.stroke();
};

}

export default App;
