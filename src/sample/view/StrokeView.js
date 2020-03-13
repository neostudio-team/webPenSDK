import React from "react";
import { fabric } from "fabric";
import { Dot } from "../../pensdk";
import * as Global from "../Global";
import { SketchPicker } from "react-color";
import { Button, Box, Paper } from "@material-ui/core";
import Thickness from "./Thickness";

const canvasBackgroundColor = "white";

export default class StrokeView extends React.Component {
  constructor(props) {
    super(props);
    this.props.pen.dotCallback = this.onDot;
  }

  scanPen = () => {
    this.props.pen.scanPen();
  };

  connect = () => {
    this.props.pen.connect();
  };

  disconnect = () => {
    this.props.pen.disconnect();
  };

  clear = () => {
    this.canvas.clear();
    this.canvas.backgroundColor = canvasBackgroundColor;
  };

  colorPick = () => {
    console.log("color selector click")
    const colorSelector = document.createElement('input');
    colorSelector.focus()
    colorSelector.setAttribute('value', '#ffcc00');
    // fileSelector.setAttribute('multiple', 'multiple');
    colorSelector.click()
  }

  handleColorChange = color => {
    const rgb = "rgba(" + Object.values(color.rgb) + ")"
    console.log(rgb)
    Global.setColor(rgb);
    this.canvas.freeDrawingBrush.color = rgb;
  };

  handleThickness = (value) => {
    Global.setThickness(value)
    this.canvas.freeDrawingBrush.width = Global.getThickness();
  }

  render() {
    return (
      <div>
        <Button variant="contained" color="primary" onClick={this.scanPen}>
          Scan Pen
        </Button>
        <Button variant="contained" color="primary" onClick={this.connect}>
          Connect
        </Button>

        <Button variant="outlined" color="primary" onClick={this.disconnect}>
          DisConnect
        </Button>

        <Button variant="contained" color="secondary" onClick={this.clear}>
          clear
        </Button>

        <Button variant="contained" color="secondary" onClick={this.colorPick}>
          ColorPick
        </Button>

        <Box display="flex" flexDirection="row">
          <Paper>
            <canvas id="c" />
          </Paper>
          <Box>
            <SketchPicker
              color={Global.getColor()}
              onChangeComplete={this.handleColorChange}
              style={{ margin: 5 }}
            />
            <Thickness 
              handleThickness={this.handleThickness}
            />
          </Box>
        </Box>
      </div>
    );
  }

  componentDidMount() {
    let size = { w: 1080, h: 720 };
    var canvas = new fabric.Canvas("c", {
      backgroundColor: canvasBackgroundColor,
      // selectionColor: 'blue',
      selectionLineWidth: 2,
      width: size.w,
      height: size.h
    });
    canvas.isDrawingMode = true;
    canvas.selection = false;

    this.canvas = canvas;
    // console.log("canvas info", canvas);

    // free drawing Setting
    canvas.freeDrawingBrush.color = "rgba(0,0,0,1)";
    canvas.freeDrawingBrush.width = Global.getThickness();
  }

  componentDidUpdate(preProp, preState) {
    let st = this.props.stroke
    this.drawWtroke(st)
  }

  drawWtroke = (st) => {
    console.log("draw stroke", st.length);
    this.canvas.clear();
    const pathOption = {
      fill: "transparent",
      stroke: "black",
      strokeWidth: 1,
      selectable: false,
      evented: false
    };

    st.forEach(st => {
      let line = this.darwLines(st.Dots);
      var path = new fabric.Path(line, pathOption);
      this.canvas.add(path);
    });
  }
  
  darwLines = ps => {
    const scale = 20
    let lines = "M";
    ps.forEach((p, index) => {
      const x = p.X * scale
      const y = p.Y * scale
      if (index === 0) {
        lines += x + "," + y;
      } else {
        lines += "L" + x + "," + y;
      }
    });
    // lines += "Z";
    return lines;
  };

  // App Event
  peninfo = () => {
    this.props.pen.controller.RequestPenStatus();
  };

  setTime = () => {
    let now = Date.now();
    console.log("set Pen time", now, new Date(now));
    this.props.pen.controller.SetRtcTime(now);
  };

  usingnotes = () => {
    this.props.pen.controller.RequestAvailableNotes();
  };


  drawline = (p1, p2) => {
    var line = "M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y;
    const pathOption = {
      objectCaching: false,
      fill: "transparent",
      stroke: Global.getColor(),
      strokeWidth: Global.getThickness(),
      strokeLineCap: "round",
      selectable: false,
      evented: false
    };
    var path = new fabric.Path(line, pathOption);
    this.canvas.add(path);
  };


  /// Pen Event and Controll
  onDot = d => {
    // console.log("Ondot", d)
    let scale = 10;
    let dot = d;
    if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
      if (this.currentPage !== dot.Page) {
        console.log("Page change");
        this.clear();
        this.currentPage = dot.Page;
      }
      this.predot = dot;
      console.log("start dot", dot);
    } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
      if (this.predot) {
        let p0 = { x: this.predot.X * scale, y: this.predot.Y * scale };
        let p1 = { x: dot.X * scale, y: dot.Y * scale };
        this.drawline(p0, p1);
      }
      this.predot = dot;
    } else {
      this.predot = null;
    }
  };
}
