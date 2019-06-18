import React from "react";
import { fabric } from "fabric";
import { Button, Box } from "@material-ui/core";
import PenHelper from "./PenHelper";
import { Dot } from "../pensdk";
import * as Global from "./Global";
import { SketchPicker } from "react-color";

export default class Painter extends React.Component {
  constructor(props) {
    super(props);
    this.pen = new PenHelper();
    this.pen.dotCallback = this.onDot;
    this.state = {
      selected: []
    };
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
        <Button variant="outlined" color="primary" onClick={this.setTime}>
          SetPenTime
        </Button>
        <Button variant="outlined" color="primary" onClick={this.peninfo}>
          PenSettingInfo
        </Button>
        <Button variant="outlined" color="primary" onClick={this.usingnotes}>
          Using Note Set
        </Button>
        <Button variant="contained" color="secondary" onClick={this.clear}>
          clear
        </Button>

        <Box display="flex" flexDirection="row">
          <canvas id="c" />
          <SketchPicker
            color={Global.getColor()}
            onChangeComplete={this.handleChangeComplete}
          />
        </Box>
      </div>
    );
  }

  handleChangeComplete = color => {
    Global.setColor(color.hex);
  };
  connect = () => {
    this.pen.connect();
  };

  componentDidMount() {
    let size = { w: 800, h: 1000 };

    var canvas = new fabric.Canvas("c", {
      backgroundColor: "rgb(230,230,230)",
      // selectionColor: 'blue',
      selectionLineWidth: 2,
      width: size.w,
      height: size.h
    });
    canvas.isDrawingMode = false;
    canvas.selection = false;
    this.canvas = canvas;
    console.log("canvas info", canvas);

    // free drawing Setting
    canvas.freeDrawingBrush.color = "rgba(0,0,0,1)";
    canvas.freeDrawingBrush.width = 2;

    let hexmod = false;
    // Curve Draw Base line
    let linecount = 8;
    if (hexmod) {
      this.drawGuideHex(canvas);
    } else {
      this.drawGuidLine(linecount, canvas);
    }

    // Draw line
    canvas.on("mouse:down", opt => {
      var e = opt.e;
      if (e.altKey === true) {
        canvas.isDragging = true;
        canvas.selection = false;
        this.last = opt.pointer;
      }
    });

    canvas.on("mouse:move", opt => {
      if (canvas.isDragging) {
        var last = opt.pointer;
        if (hexmod) {
          this.drawHex(this.last, last, canvas);
        } else {
          this.drawCopyLine(linecount, this.last, last, canvas);
        }
        this.last = last;
      }
    });

    canvas.on("mouse:up", opt => {
      canvas.isDragging = false;
      canvas.selection = true;
    });

    console.log(canvas.width, canvas.height);

    canvas.on("selection:created", ele => {
      console.log("selected a something", ele.selected.length);
      this.setState({ selected: ele.selected });
    });

    canvas.on("selection:cleared", () => {
      console.log("clear");
      this.setState({ selected: [] });
    });
  }

  // App Event
  peninfo = () => {
    this.pen.controller.RequestPenStatus();
  };

  setTime = () => {
    let now = Date.now();
    console.log("set Pen time", now, new Date(now));
    this.pen.controller.SetRtcTime(now);
  };

  usingnotes = () => {
    this.pen.controller.RequestAvailableNotes();
  };

  clear = () => {
    this.canvas.clear();
    this.drawGuidLine(8, this.canvas);
  };

  pen = () => {
    const { canvas } = this.state;
    if (canvas) {
      canvas.isDrawingMode = true;
    }
  };

  /// Step 1: Guid line
  drawGuidLine = (linecount, canvas) => {
    let p0 = { x: canvas.width / 2, y: canvas.height / 2 };

    let p1 = { x: p0.x * 3, y: p0.y };
    console.log(p0, p1, linecount);
    let radian = (Math.PI * 2) / linecount;
    for (let i = 0; i < linecount; i++) {
      let line = this.drawlineAngle(p0, p0, p1, radian * i);
      console.log(line);
      let path = new fabric.Path(line, {
        stroke: "black",
        strokeWidth: 1,
        objectCaching: false
      });
      path.selectable = false;
      path.evented = false;

      canvas.add(path);
    }
  };

  /// Step 1: Guid line for Hex
  drawGuideHex = canvas => {
    let r = 50;
    let unitX = parseInt(canvas.width / r / 4);
    let unitY = parseInt(canvas.height / r / 2 / Math.sqrt(3)) + 1;
    let pArray = [];
    for (let i = 0; i < unitX; i++) {
      for (let j = 0; j < unitY; j++) {
        let x = 6 * r * i;
        let y = Math.sqrt(3) * 2 * r * j;
        pArray.push({ x: x, y: y });
        let x1 = x - 3 * r;
        let y1 = y + Math.sqrt(3) * r;
        pArray.push({ x: x1, y: y1 });
      }
    }

    // lines
    pArray.forEach(p => {
      this.drawHexWithPoint(p, r, canvas);
    });
  };

  drawHexWithPoint = (center, r, canvas) => {
    let pa = [];
    for (let i = 0; i < 6; i++) {
      let p = { x: center.x + 2 * r, y: center.y };
      let angel = Math.PI / 3;
      p = this.transformation(center, p, angel * i);
      pa.push(p);
    }
    let lines = this.darwLines(pa);
    let path = new fabric.Path(lines, {
      fill: "translate",
      stroke: "black",
      strokeWidth: 2,
      objectCaching: false
    });
    path.selectable = false;
    path.evented = false;

    canvas.add(path);
  };

  drawCopyLine = (linecount, p1, p2, canvas) => {
    let angle = (Math.PI * 2) / linecount;
    let p0 = { x: canvas.width / 2, y: canvas.height / 2 };
    for (let i = 0; i < linecount; i++) {
      let line = this.drawlineAngle(p0, p1, p2, angle * i);
      let path = new fabric.Path(line, {
        stroke: Global.getColor(),
        strokeWidth: 2,
        objectCaching: false
      });
      path.selectable = false;
      path.evented = false;

      canvas.add(path);
    }
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
    return line;
  };

  drawlineAngle = (p0, m1, m2, angel) => {
    let p1 = this.transformation(p0, m1, angel);
    let p2 = this.transformation(p0, m2, angel);
    var line = "M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y;
    return line;
  };

  transformation = (p0, p, rad) => {
    var rx = (p.x - p0.x) * Math.cos(rad) - (p.y - p0.y) * Math.sin(rad) + p0.x;
    var ry = (p.x - p0.x) * Math.sin(rad) + (p.y - p0.y) * Math.cos(rad) + p0.y;
    return { x: rx, y: ry };
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

  point3Curve = (p1, p2, p3) => {
    // bezier.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    return (
      "C" +
      p1.x +
      ", " +
      p1.y +
      "," +
      p2.x +
      ", " +
      p2.y +
      "," +
      p3.x +
      "," +
      p3.y
    );
  };

  clone = obj => {
    if (obj === null || typeof obj !== "object") return obj;

    var copy = obj.constructor();

    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = this.clone(obj[attr]);
      }
    }
    return copy;
  };

  /// Pen Event and Controll
  scanPen = () => {
    this.pen.scanPen();
  };

  disconnect = () => {
    this.pen.disconnect();
  };
  canvasInit = () => {
    console.log("TODO: init canvas");
  };
  onDot = dot => {
    if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
      if (this.currentPage !== dot.Page) {
        this.canvasInit();
        this.currentPage = dot.Page;
      }
      this.dots = [];
      this.predot = dot;
      this.dots.push(dot);
      console.log("dot", dot);
    } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
      this.dots.push(dot);
      let p0 = { x: this.predot.X * 10, y: this.predot.Y * 10 };
      let p1 = { x: dot.X * 10, y: dot.Y * 10 };
      this.drawlineOne(p0, p1);
      this.predot = dot;
    } else {
      let p0 = { x: this.predot.X * 10, y: this.predot.Y * 10 };
      let p1 = { x: dot.X * 10, y: dot.Y * 10 };
      this.drawlineOne(p0, p1);
      this.dots.push(dot);
      this.predot = dot;
    }
  };

  drawlineOne = (d1, d2) => {
    this.drawCopyLine(12, d1, d2, this.canvas);
  };

  drawline = dd => {
    var c = document.getElementById("myCanvas");
    if (c == null) {
      console.log("element is null");
      return;
    }
    if (dd.length < 2) {
      return;
    }
    var ctx = c.getContext("2d");
    // ctx.fillStyle='black';
    var scale = 1;
    var count = dd.length;
    ctx.beginPath();
    ctx.moveTo(dd[0].X * scale, dd[0].Y * scale);

    for (let i = 0; i < count; i++) {
      ctx.lineTo(dd[i].X * scale, dd[i].Y * scale);
    }
    ctx.stroke();
  };
}
