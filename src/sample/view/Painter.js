import React from "react";
import { fabric } from "fabric";
import { Dot } from "../../pensdk";
import * as Global from "../Global";
import { SketchPicker } from "react-color";
import { Button, Box, Paper } from "@material-ui/core";
import Thickness from "./Thickness";

const canvasBackgroundColor = "white";

export default class Painter extends React.Component {
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
    let size = { w: 500, h: 600 };
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
    console.log("canvas info", canvas);

    // free drawing Setting
    canvas.freeDrawingBrush.color = "rgba(0,0,0,1)";
    canvas.freeDrawingBrush.width = Global.getThickness();
  }

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

  darwLines = ps => {
    let lines = "M";
    ps.forEach((p, index) => {
      if (index === 0) {
        lines += p.x + "," + p.y;
      } else {
        lines += "L" + p.x + "," + p.y;
      }
    });
    lines += "Z";
    return lines;
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

  drawSimplePath = point => {
    var simplePath = "M" + point[0].x + "," + point[0].y;
    var controlPoints = [];
    point.forEach(p => {
      if (controlPoints.length < 5) {
        controlPoints.push(p);
        return;
      }
      let endPoint = {
        x: (controlPoints[2].x + p.x) / 2,
        y: (controlPoints[2].y + p.y) / 2
      };

      simplePath += this.point3Curve(
        controlPoints[1],
        controlPoints[2],
        endPoint
      );
      controlPoints = [endPoint, p];
    });

    if (controlPoints.length > 1) {
      for (let i = 0; i < controlPoints.length; i++) {
        simplePath += "L" + controlPoints[i].x + "," + controlPoints[i].y;
      }
    }
    return simplePath;
  };

  /// Pen Event and Controll
  onDot = d => {
    // console.log("Ondot", d)
    let scale = 5;
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
