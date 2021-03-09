const DotTypes = Object.freeze({
  PEN_DOWN: 1,
  PEN_MOVE: 2,
  PEN_UP: 3,
  PEN_HOVER: 4,
  PEN_ERROR: 5
});

class Dot {
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
    this.PenTipType = 1;
  }

  static MakeDot(paper, x, y, force, type, penTipType, color, angel = {x:0, y: 0, t: 0}) {
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
    newDot.TiltX = this.TiltX;
    newDot.TiltY = this.TiltY;
    newDot.Twist = this.Twist;
    return newDot;
  }

  static get DotTypes() {
    return DotTypes;
  }
}


class DotBuilder {
  constructor(){
    this.mDot = new Dot()
  }
  owner(owner) {
    this.mDot.owner = owner;
    return this;
  }

  section(section) {
    this.mDot.section = section;
    return this;
  }

  note(note) {
    this.mDot.note = note;
    return this;
  }

  page(page) {
    this.mDot.page = page;
    return this;
  }

  timestamp(timestamp) {
    this.mDot.timestamp = timestamp;
    return this;
  }

  coord(x, y) {
    this.mDot.x = x
    this.mDot.y = y
    return this;
  }

  angle(angle) {
    this.mDot.angle.tx = angle.x;
    this.mDot.angle.ty = angle.y;
    this.mDot.angle.twist = angle.t;
    return this;
  }

  tilt(x, y) {
    this.mDot.angle.tx = x;
    this.mDot.angle.ty = y;
    return this;
  }

  twist(twist) {
    this.mDot.angle.twist = twist;
    return this;
  }

  force(force) {
    this.mDot.f = force
    return this;
  }

  dotType(dotType) {
    this.mDot.DotType = dotType;
    return this;
  }

  penTipType(penTipType) {
    this.mDot.PenTipType = penTipType
    return this
  }

  color(color) {
    this.mDot.color = color;
    return this;
  }

  Build() {
    return this.mDot;
  }
}

export default Dot;

export { DotBuilder, DotTypes };
