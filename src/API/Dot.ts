const DotTypes = Object.freeze({
  PEN_DOWN: 0,
  PEN_MOVE: 1,
  PEN_UP: 2,
  PEN_HOVER: 3,
  PEN_ERROR: 4
});

type Angle = {
  tx: number,
  ty: number,
  twist: number
}

class Dot {
  section: number
  owner: number
  note: number
  page: number
  x: number
  y: number
  angle: Angle
  f: number
  color: number
  timestamp: number
  DotType: number
  PenTipType: number

  constructor(){
    this.section = 0;
    this.owner = 0;
    this.note = 0;
    this.page = 0;
    this.x = 0;
    this.y = 0;
    this.angle = {
      tx: 0,
      ty: 0,
      twist: 0
    };
    this.f = 0;
    this.color = 0;
    this.timestamp = 0;
    this.DotType = Dot.DotTypes.PEN_DOWN;
    this.PenTipType = 0; // 0: Normal, 1: Eraser
  }

  static MakeDot(paper: any, x: number, y: number, force: number, type: number, penTipType: number, color: number, angel = {tx:0, ty: 0, twist: 0}) {
    let builder =  new DotBuilder()

    const xx = parseFloat(x.toFixed(2))
    const yy = parseFloat(y.toFixed(2))
    builder
      .owner(paper.Owner)
      .section(paper.Section)
      .note(paper.Note)
      .page(paper.Page)
      .timestamp(paper.Time)
      .coord(xx, yy )
      .force(force)
      .dotType(type)
      .penTipType(penTipType)
      .color(color)
      .angle(angel);
    return builder.Build();
  }

  Clone() {
    let newDot = new Dot();
    newDot.section = this.section;
    newDot.owner = this.owner;
    newDot.note = this.note;
    newDot.page = this.page;
    newDot.x = this.x;
    newDot.y = this.y;
    newDot.f = this.f;
    newDot.timestamp = this.timestamp;
    newDot.DotType = this.DotType;
    newDot.PenTipType = this.PenTipType
    newDot.color = this.color;
    newDot.angle = this.angle;
    return newDot;
  }

  static get DotTypes() {
    return DotTypes;
  }
}


class DotBuilder {
  mDot: Dot

  constructor(){
    this.mDot = new Dot()
  }

  section(section: number) {
    this.mDot.section = section;
    return this;
  }

  owner(owner: number) {
    this.mDot.owner = owner;
    return this;
  }

  note(note: number) {
    this.mDot.note = note;
    return this;
  }

  page(page: number) {
    this.mDot.page = page;
    return this;
  }

  timestamp(timestamp: number) {
    this.mDot.timestamp = timestamp;
    return this;
  }

  coord(x: number, y: number) {
    this.mDot.x = x
    this.mDot.y = y
    return this;
  }

  angle(angle: Angle) {
    this.mDot.angle.tx = angle.tx;
    this.mDot.angle.ty = angle.ty;
    this.mDot.angle.twist = angle.twist;
    return this;
  }

  tilt(tx: number, ty: number) {
    this.mDot.angle.tx = tx;
    this.mDot.angle.ty = ty;
    return this;
  }

  twist(twist: number) {
    this.mDot.angle.twist = twist;
    return this;
  }

  force(force: number) {
    this.mDot.f = force
    return this;
  }

  dotType(dotType: number) {
    this.mDot.DotType = dotType;
    return this;
  }

  penTipType(penTipType: number) {
    this.mDot.PenTipType = penTipType
    return this
  }

  color(color: number) {
    this.mDot.color = color;
    return this;
  }

  Build() {
    return this.mDot;
  }
}

export default Dot;

export { DotBuilder, DotTypes };
