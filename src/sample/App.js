import React from "react";
import PenHelper from './PenHelper'
import {Dot} from '../pensdk'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.pen = new PenHelper()
    this.pen.dotCallback = this.onDot
  }
  peninfo = () => {
    this.pen.controller.RequestPenStatus()
  }

  setTime = () => {
    let now = Date.now()
    console.log("set Pen time", now, new Date(now))
    this.pen.controller.SetRtcTime(now)
  }

  usingnotes = () => {
    this.pen.controller.RequestAvailableNotes()
  }
  render() {
    return (
      <div className="App">
        <header>NeoSmartPen Sample App</header>
        <button onClick={this.scanPen}>Scan Pen</button>
        <button onClick={this.disconnect}>DisConnect</button>
        <button onClick={this.setTime}>SetPenTime</button>

        <button onClick={this.peninfo}>PenSettingInfo</button>
        <button onClick={this.usingnotes}>Using Note Set</button>

        <div></div>
        <canvas id="myCanvas" className="myCanvas" style={{width: 1000, height:800, backgroundColor: 'gray'}} />
      </div>
    );
  }

  componentDidMount() {

  }

  onDot = (dot) => {
    if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
      if (this.currentPage !== dot.Page) {
        this.canvasInit();
        this.currentPage = dot.Page;
      }
      this.dots = [];
      this.predot = dot;
      this.dots.push(dot);
      console.log("dot", dot)
    } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
      this.dots.push(dot);
      this.drawlineOne(this.predot, dot);
      this.predot = dot;
    } else {
      this.drawlineOne(this.predot, dot);
      this.dots.push(dot);
      this.predot = dot;
    }
  }

  canvasInit = () => {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d", {
      alpha: false
    });
    ctx.clearRect(0, 0, c.width, c.clientHeight);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.clientHeight);  
  }
  
  scanPen = () => {
    this.pen.scanPen()
  };

  disconnect = () => {
    this.pen.disconnect()
  }

 

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
