import { fabric } from "fabric";
import StrokeStudio from "../../Data/ShareStudioData";
import PenHelper, {Dot} from "../../PenHelper";

export default class FabricRender {
  constructor(canvasName) {
    this.canvasName = canvasName;
    this.canvas = null;
    this.frameconfig = 1;
    this.bgcolor = 0;
    this.bgurl = "";
    this.rect = null;
    this.originSize = { w: 800, h: 1000 };
    this.strokWidth = 800;
    this.strokHeight = 1000;
    this.lineScale = [1, 3, 5, 7, 10];
    this.pathArray = [];
    this.renderCount = 0;
    this.replaySpeed = 5;
    this.color = "rgba(0,0,0,1)";
    this.thickness = 1;
    let pen = new PenHelper();
    pen.dotCallback = this.onDot;
    this.dotArray = [];
    this.tempPath = null
    this.undoHistory = []
  }

  setColor = color => {
    this.color = color;
    if (this.canvas) {
      this.canvas.freeDrawingBrush.color = color;
    }
  };

  setThickness = thickness => {
    this.thickness = thickness;
    if (this.canvas) {
      this.canvas.freeDrawingBrush.width = thickness;
    }
  };

  onDot = dot => {
    // console.log("Ondot", d)
    // let scale = 10;
    if (dot.Owner === 1013 && dot.Note === 1){
      this.symbolAction(dot)
      return
    }
    if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
      if (this.currentPage !== dot.Page) {
        console.log("Page change");
        this.canvas.clear();
        this.currentPage = dot.Page;
      }
      this.dotArray = [];
      this.dotArray.push(dot);
      console.log("start dot", dot);
    } else if (dot.DotType === Dot.DotTypes.PEN_MOVE) {
      this.dotArray.push(dot);
      this.drawDotRealTime(this.dotArray)
    } else {
      this.dotArray.push(dot);
      this.drawDotPath(this.dotArray);
    }
  };

  symbolAction = (dot) => {
    let m = 1.8
    if (dot.DotType === Dot.DotTypes.PEN_DOWN) {
      console.log("dot", dot)
      if (dot.Y > 14 && dot.Y < 18){
        if (dot.X >14 && dot.X < 18){
          console.log("Record")
          this.canvas.clear();
          this.pathArray = [];
        }else if ((dot.X >63.83-m && dot.X < 63.83+m)){
          console.log("color Red")
          this.color = "rgba(255,0,0,1)"
        }else if ((dot.X >68.42-m && dot.X < 68.42+m)){
          console.log("color yello")
          this.color = "rgba(255,255,0,1)"
        }else if ((dot.X >72.9-m && dot.X < 72.9+m)){
          console.log("color green")
          this.color = "rgba(0,255,0,1)"
        }else if ((dot.X >77.7-m && dot.X < 77.7+m)){
          console.log("color cyan")
          this.color = "rgba(0,255,255,1)"
        }else if ((dot.X >82.23-m && dot.X < 82.23+m)){
          console.log("color black")
          this.color = "rgba(0,0,0,1)"
        }else if ((dot.X >87.02-m && dot.X < 87.02+m)){
          console.log("color white")
          this.color = "rgba(255,255,255,1)"
        }else if ((dot.X >49.84-m && dot.X < 49.84+m)){
          console.log("thick 1")
          this.thickness = 1
        }else if ((dot.X >54.66-m && dot.X < 54.66+m)){
          console.log("thick 2")
          this.thickness = 3
        }else if ((dot.X >59.15-m && dot.X < 59.15+m)){
          console.log("thick 3")
          this.thickness = 5
        }else if ((dot.X >96.17-m && dot.X < 96.17+m)){
          console.log("undo")
          let lastobj = this.canvas.getObjects().pop()
          if (lastobj){
            this.canvas.remove(lastobj)
            this.undoHistory.push(lastobj)
          }
        }
        else if ((dot.X >101.28-m && dot.X < 101.28+m)){
          console.log("redo")
          let lastobj = this.undoHistory.pop()
          if (lastobj){
            this.canvas.add(lastobj)
          }
        }

      }
    }
  }

  drawDotRealTime = dots => {
    console.log("dot Count", dots.length);
    let rect = this.rect;
    console.log(rect);
    let scaleX = this.originSize.w / rect.width;
    let scaleY = this.originSize.h / rect.height;
    let pointArray = [];
    dots.forEach(dot => {
      let p = dot.Force;
      let x = dot.X - rect.x;
      let y = dot.Y - rect.y;
      x *= scaleX;
      y *= scaleY;

      pointArray.push({ x, y, p});
    });

    // Draw Stroke
    let color = this.color;
    let thickness = this.thickness;
    console.log("Color, thickness", color, thickness);
    console.log(pointArray.length, pointArray[0]);
    const pathOption = {
      objectCaching: false
    };
    pathOption.stroke = color;
    let tempThickness = thickness * 0.5;
    pathOption.strokeWidth = tempThickness;
    pathOption.strokeLineCap = "round";
    pathOption.fill = color;
    let pathData = this.drawPath(pointArray, thickness);

    var path = new fabric.Path(pathData, pathOption);
    path.color = color;
    // TODO: selectable and evented
    path.selectable = false;
    path.evented = true;
    if (this.canvas) {
      this.canvas.remove(this.tempPath)
      this.tempPath = path
      this.canvas.add(this.tempPath);
      console.log("Add Path", path);
    }
  }

  // Draw Dot from Pen
  drawDotPath = dots => {
    console.log("dot Count", dots.length);
    let rect = this.rect;
    console.log(rect);
    let scaleX = this.originSize.w / rect.width;
    let scaleY = this.originSize.h / rect.height;
    let pointArray = [];
    dots.forEach(dot => {
      let p = dot.Force;
      let x = dot.X - rect.x;
      let y = dot.Y - rect.y;
      x *= scaleX;
      y *= scaleY;

      pointArray.push({ x, y, p});
    });

    // Draw Stroke
    let color = this.color;
    let thickness = this.thickness;
    console.log("Color, thickness", color, thickness);
    console.log(pointArray.length, pointArray[0]);
    const pathOption = {
      objectCaching: false
    };
    pathOption.stroke = color;
    let tempThickness = thickness * 0.5;
    pathOption.strokeWidth = tempThickness;
    pathOption.strokeLineCap = "round";
    pathOption.fill = color;
    let pathData = this.drawPath(pointArray, thickness);

    var path = new fabric.Path(pathData, pathOption);
    path.color = color;
    // TODO: selectable and evented
    path.selectable = false;
    path.evented = true;
    this.pathArray.push(path);
    if (this.canvas) {
      this.canvas.add(path);
      console.log("Add Path", path);
    }
  };

  resize = size => {
    var zoom = size.w / this.originSize.w;
    this.canvas.setZoom(zoom);
    this.canvas.setHeight(size.h);
    this.canvas.setWidth(size.w);
  };

  //step 1: canvas set size and background image
  setCanvas = (size, bgurl) => {
    this.bgurl = bgurl;
    this.originSize = size;
    this.canvas = new fabric.Canvas(this.canvasName, {
      backgroundColor: "rgb(255,255,255)",
      // selectionColor: 'blue',
      selection: false,
      controlsAboveOverlay: true,
      centeredScaling: true,
      allowTouchScrolling: true,
      selectionLineWidth: 4,
      width: size.w,
      height: size.h
    });
    this.canvas.isDrawingMode = true;

    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        bgurl,
        img => {
          img.scaleToWidth(size.w);
          // img.scaleToHeight(size.h)

          img.selectable = false;
          this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas));
          console.log("image size", size, img.width, img.height);
          resolve();
        },
        { crossOrigin: "Anonymous" }
      );
    });
  };

  replayStart = () => {
    console.log("Replay Start");
    // this.canvas.clear()
    this.renderCount = 0;
    clearInterval(this.runroop);
    this.pathArray.forEach(path => {
      path.opacity = 0;
    });
    this.runroop = setInterval(() => {
      this.renderUpdate();
    }, 100);
  };

  renderUpdate = () => {
    let start = this.renderCount * this.replaySpeed;
    this.renderCount += 1;
    let end = this.renderCount * this.replaySpeed;
    let arr = this.pathArray.slice(start, end);
    arr.forEach(path => {
      path.opacity = 1;
    });
    this.canvas.requestRenderAll();
    if (this.pathArray.length < end) {
      clearInterval(this.runroop);
    }
  };

  // Step2: Set Data, Drawing iOS Data Format
  drawingPage = (page, rect, size) => {
    if (!page) {
      this.rect = rect;
      return;
    }
    this.strokWidth = size.w;
    this.strokHeight = size.h;
    let scaleX = size.w / rect.width;
    let scaleY = size.h / rect.height;
    let strokes = page.strokes;
    if (page.replaySpeed) {
      this.replaySpeed = page.replaySpeed * 5;
    }
    // console.log("draw neostudio Data", strokes.length, scaleX, scaleY);
    strokes.forEach(stroke => {
      var pointArray = [];
      stroke.isJson = page.isJson;
      let st = new StrokeStudio(stroke, 1);
      st.getDots().forEach(dot => {
        let p = dot.force;
        let x = dot.x - rect.x;
        let y = dot.y - rect.y;
        x *= scaleX;
        y *= scaleY;

        pointArray.push({
          x: x,
          y: y,
          p: p
        });
      });
      let color = st.getColor();
      const pathOption = {
        objectCaching: false
      };
      let penType = 0; //stroke.extraData[0]; // 0: NeoPen, 1: TouchPen, 2: HighlightPen
      let pathData;
      if (penType === 0) {
        // console.log("NeoPen Type");
        pathOption.stroke = color;
        let tempThickness = scaleX * st.penThickness * 0.5;
        pathOption.strokeWidth = tempThickness;
        pathOption.strokeLineCap = "round";
        pathOption.fill = color;
        pathData = this.drawPath(pointArray, scaleX * st.penThickness);
      } else if (penType === 1) {
        // console.log("TouchPen Type");
        pathOption.fill = "transparent";
        pathOption.stroke = color;
        pathOption.strokeWidth = this.lineScale[st.penThickness];
        pathOption.strokeLineCap = "round";
        pathData = this.drawCurvePath(pointArray);
      } else if (penType === 2) {
        // console.log("HighlightPen Type");
        pathOption.fill = "transparent";
        pathOption.stroke = color;
        pathOption.strokeWidth = this.lineScale[st.penThickness];
        pathOption.strokeLineCap = "round";
        pathData = this.drawCurvePath(pointArray);
      } else {
        console.log("Not Supported Pen Type");
        return;
      }

      if (parseInt(st.penThickness) > 1) {
        pathOption.stroke = color;
        pathOption.strokeWidth = st.penThickness;
      }

      var path = new fabric.Path(pathData, pathOption);
      path.time = st.time;
      path.color = color;
      // TODO: selectable and evented
      path.selectable = false;
      path.evented = true;
      path.on("mousedown", this.eventHandler);
      this.pathArray.push(path);
      this.canvas.add(path);
    });
  };

  drawLinePath = point => {
    const len = point.length;
    if (len < 1) {
      return;
    }

    let path = "";
    path += "M" + point[0].x + "," + point[0].y;

    for (var i = 1; i < len - 1; i++) {
      const p = point[i];

      path += "L" + p.x + ", " + p.y;
    }
    return path;
  };

  drawCurvePath = point => {
    if (point.length < 1) {
      return;
    }
    let bezier = "";
    bezier += "M" + point[0].x + "," + point[0].y;

    let n = point.length - 1;
    var controlPoints = [];

    for (let i = 0; i < n; i++) {
      let p = point[i];

      if (controlPoints.length < 5) {
        controlPoints.push(p);
        continue;
      }

      let endPoint = {
        x: (controlPoints[2].x + p.x) / 2,
        y: (controlPoints[2].y + p.y) / 2
      };

      bezier += this.point3Curve(controlPoints[1], controlPoints[2], endPoint);
      controlPoints = [endPoint, p];
    }
    let p = point[n];

    while (controlPoints.length < 5) {
      controlPoints.push(p);
    }
    bezier += this.point3Curve(controlPoints[1], controlPoints[2], p);

    return bezier;
  };
  // Event
  setSeekHandeler = handler => {
    this.seekCallback = handler;
  };

  eventHandler = event => {
    console.log(event, event.target.time);
    this.seekCallback(event.target.time + 1);
  };

  // Drawing Function
  drawPath = (point, lineWidth) => {
    if (point.length < 3) {
      return;
    }
    var bezier = "";
    let scaled_pen_thickness = lineWidth;
    // first 1.0f --> lineScale
    var x0;
    var x1;
    var x2;
    var x3;
    var y0;
    var y1;
    var y2;
    var y3;
    var p0;
    var p1;
    var p2;
    var p3;
    var vx01;
    var vy01;
    var vx21;
    var vy21;
    // unit tangent vectors 0->1 and 1<-2
    var norm;
    var n_x0;
    var n_y0;
    var n_x2;
    var n_y2;
    // the normals
    var temp = { x: 0, y: 0 };
    var endPoint = { x: 0, y: 0 };
    var controlPoint1 = { x: 0, y: 0 };
    var controlPoint2 = { x: 0, y: 0 };
    // the first actual point is treated as a midpoint
    x0 = point[0].x + 0.1;
    y0 = point[0].y;
    p0 = point[0].p;
    x1 = point[1].x + 0.1;
    y1 = point[1].y;
    p1 = point[1].p;
    vx01 = x1 - x0;
    vy01 = y1 - y0;
    // instead of dividing tangent/norm by two, we multiply norm by 2
    norm = Math.sqrt(vx01 * vx01 + vy01 * vy01 + 0.0001) * 2.0;
    vx01 = (vx01 / norm) * scaled_pen_thickness * p0;
    vy01 = (vy01 / norm) * scaled_pen_thickness * p0;
    n_x0 = vy01;
    n_y0 = -vx01;
    // Trip back path will be saved.
    var pathPointStore = [];
    temp.x = x0 + n_x0;
    temp.y = y0 + n_y0;

    endPoint.x = x0 + n_x0;
    endPoint.y = y0 + n_y0;
    controlPoint1.x = x0 - n_x0 - vx01;
    controlPoint1.y = y0 - n_y0 - vy01;
    controlPoint2.x = x0 + n_x0 - vx01;
    controlPoint2.y = y0 + n_y0 - vy01;
    //Save last path. I'll be back here....
    let ep = this.clone(endPoint);
    let cp1 = this.clone(controlPoint1);
    let cp2 = this.clone(controlPoint2);
    pathPointStore.push({
      endPoint: ep,
      controlPoint1: cp1,
      controlPoint2: cp2
    });

    // drawing setting
    bezier += "M" + temp.x + "," + temp.y;
    for (var i = 2; i < point.length - 1; i++) {
      x3 = point[i].x;
      // + 0.1f;
      y3 = point[i].y;
      p3 = point[i].p;
      x2 = (x1 + x3) / 2.0;
      y2 = (y1 + y3) / 2.0;
      p2 = (p1 + p3) / 2.0;
      vx21 = x1 - x2;
      vy21 = y1 - y2;
      norm = Math.sqrt(vx21 * vx21 + vy21 * vy21 + 0.0001) * 2.0;
      vx21 = (vx21 / norm) * scaled_pen_thickness * p2;
      vy21 = (vy21 / norm) * scaled_pen_thickness * p2;
      n_x2 = -vy21;
      n_y2 = vx21;
      if (norm < 0.6) {
        continue;
      }
      // The + boundary of the stroke
      endPoint.x = x2 + n_x2;
      endPoint.y = y2 + n_y2;
      controlPoint1.x = x1 + n_x0;
      controlPoint1.y = y1 + n_y0;
      controlPoint2.x = x1 + n_x2;
      controlPoint2.y = y1 + n_y2;
      bezier += this.point3Curve(controlPoint1, controlPoint2, endPoint);

      // THe - boundary of the stroke
      endPoint.x = x0 - n_x0;
      endPoint.y = y0 - n_y0;
      controlPoint1.x = x1 - n_x2;
      controlPoint1.y = y1 - n_y2;
      controlPoint2.x = x1 - n_x0;
      controlPoint2.y = y1 - n_y0;
      let ep = this.clone(endPoint);
      let cp1 = this.clone(controlPoint1);
      let cp2 = this.clone(controlPoint2);
      pathPointStore.push({
        endPoint: ep,
        controlPoint1: cp1,
        controlPoint2: cp2
      });
      x0 = x2;
      y0 = y2;
      p0 = p2;
      x1 = x3;
      y1 = y3;
      p1 = p3;
      vx01 = -vx21;
      vy01 = -vy21;
      n_x0 = n_x2;
      n_y0 = n_y2;
      //
    }
    // the last actual point is treated as a midpoint
    x2 = point[point.length - 1].x;
    // + 0.1f;
    y2 = point[point.length - 1].y;
    p2 = point[point.length - 1].p;
    vx21 = x1 - x2;
    vy21 = y1 - y2;
    norm = Math.sqrt(vx21 * vx21 + vy21 * vy21 + 0.0001) * 2.0;
    vx21 = (vx21 / norm) * scaled_pen_thickness * p2;
    vy21 = (vy21 / norm) * scaled_pen_thickness * p2;
    n_x2 = -vy21;
    n_y2 = vx21;
    endPoint.x = x2 + n_x2;
    endPoint.y = y2 + n_y2;
    controlPoint1.x = x1 + n_x0;
    controlPoint1.y = y1 + n_y0;
    controlPoint2.x = x1 + n_x2;
    controlPoint2.y = y1 + n_y2;
    bezier += this.point3Curve(controlPoint1, controlPoint2, endPoint);
    endPoint.x = x2 - n_x2;
    endPoint.y = y2 - n_y2;
    controlPoint1.x = x2 + n_x2 - vx21;
    controlPoint1.y = y2 + n_y2 - vy21;
    controlPoint2.x = x2 - n_x2 - vx21;
    controlPoint2.y = y2 - n_y2 - vy21;
    bezier += this.point3Curve(controlPoint1, controlPoint2, endPoint);

    endPoint.x = x0 - n_x0;
    endPoint.y = y0 - n_y0;
    controlPoint1.x = x1 - n_x2;
    controlPoint1.y = y1 - n_y2;
    controlPoint2.x = x1 - n_x0;
    controlPoint2.y = y1 - n_y0;
    bezier += this.point3Curve(controlPoint1, controlPoint2, endPoint);

    // Trace back to the starting point
    // console.log("reverse start", pathPointStore)
    while (pathPointStore.length) {
      var repath = pathPointStore.pop();
      bezier += this.point3Curve(repath.controlPoint1, repath.controlPoint2, repath.endPoint);
    }
    return bezier;
  };

  point3Curve = (p1, p2, p3) => {
    // bezier.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    return "C" + p1.x + ", " + p1.y + "," + p2.x + ", " + p2.y + "," + p3.x + "," + p3.y;
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
}
