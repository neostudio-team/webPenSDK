export default class StrokeStudio {
  constructor(st, scale) {
    this.penTipType = st.penTipType;
    this.penTipColor = st.color;
    this.penThickness = st.thickness;
    this.dotCount = st.dotCount;
    this.time = st.startTime
    if (typeof(st.data) === "string"){
      var binary_string = window.atob(st.data);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      this.dotData = bytes
    } else {
      this.dotData = st.data.toUint8Array()
    }
    this.scale = scale;
  }

  /**
   * Returns 'rgba(255,255,255,1)'
   * @returns {string}
   */
  getColor() {
    let color = intToByteArray(this.penTipColor);
    let r = color[2];
    color[2] = color[0];
    color[0] = r;
    let rgb = color.slice(0, 3);
    let a = color[3] / 255; 
    let hexColor = "rgba(" + rgb.toString() + "," + a + ")";
    return hexColor
    
    // let hexColor = this.penTipColor.toString(16)
    // return "#" + hexColor.slice(2,8);
  }

  getDots() {
    var dots = [];
    var time = this.time;
    let pencolor = this.penTipColor;

    let dotBlob = this.dotData;
    for (let i = 0; i < this.dotCount; i++) {

      let st = i * 16;
      let end = st + 16;
      let d = dotBlob.slice(st, end);

      let deltaTime = d[0];
      let force = toFloat(d, 1);
      let x = toFloat(d, 5) * this.scale;
      let y = toFloat(d, 9) * this.scale;
  
      var dot = {};
      time += deltaTime;
      dot.time = time;
      dot.penTipType = this.pentype;
      dot.penTipColor = pencolor;
      dot.force = force;
      dot.x = x;
      dot.y = y;
      dots.push(dot);
    }

    return dots;
  }
}

function toFloat(d, index) {
  var byte = d.slice(index, index+4)
  var view = new DataView(byte.buffer);
  return view.getFloat32(0, true)
}

// function floatToByteArray(input) {
//   var farr = new Float32Array(1)
//   farr[0] = input
//   var f = new Uint8Array(farr.buffer)
//   return f
// }

export function intToByteArray(input) {
  let arr = new Uint8Array(4)
  let dv = new DataView(arr.buffer)
  dv.setUint32(0, input, true)
  return Array.from(arr)
}
