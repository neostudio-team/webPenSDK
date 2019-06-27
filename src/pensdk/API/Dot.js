const DotTypes = Object.freeze({
  PEN_DOWN: 1,
  PEN_MOVE: 2,
  PEN_UP: 3,
  PEN_HOVER: 4,
  PEN_ERROR: 5
});

class Dot {
  constructor(){
    this.Section = 0;
    this.Owner = 0;
    this.Note = 0;
    this.Page = 0;
    this.X = 0;
    this.Y = 0;
    this.Angle = {
      TiltX: 0,
      TiltY: 0,
      Twist: 0
    };
    this.Force = 0;
    this.Color = 0;
    this.Timestamp = 0;
    this.DotType = Dot.DotTypes.PEN_DOWN;
  }

  static MakeDot(paper, x, y, force, type, color, angel = {x:0, y: 0, t: 0}) {
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
      .color(color)
      .angle(angel);
    return builder.Build();
  }

  Clone() {
    let newDot = new Dot();
    newDot.Section = this.Section;
    newDot.Owner = this.Owner;
    newDot.Note = this.Note;
    newDot.Page = this.Page;
    newDot.X = this.X;
    newDot.Y = this.Y;
    newDot.Force = this.Force;
    newDot.Timestamp = this.Timestamp;
    newDot.DotType = this.DotType;
    newDot.Color = this.Color;
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
    this.mDot.Owner = owner;
    return this;
  }

  section(section) {
    this.mDot.Section = section;
    return this;
  }

  note(note) {
    this.mDot.Note = note;
    return this;
  }

  page(page) {
    this.mDot.Page = page;
    return this;
  }

  timestamp(timestamp) {
    this.mDot.Timestamp = timestamp;
    return this;
  }

  coord(x, y) {
    this.mDot.X = x
    this.mDot.Y = y
    return this;
  }

  angle(angle) {
    this.mDot.Angle.TiltX = angle.x;
    this.mDot.Angle.TiltY = angle.y;
    this.mDot.Angle.Twist = angle.t;
    return this;
  }

  tilt(x, y) {
    this.mDot.Angle.TiltX = x;
    this.mDot.Angle.TiltY = y;
    return this;
  }

  twist(twist) {
    this.mDot.Angle.Twist = twist;
    return this;
  }

  force(force) {
    this.mDot.Force = force
    return this;
  }

  dotType(dotType) {
    this.mDot.DotType = dotType;
    return this;
  }

  color(color) {
    this.mDot.Color = color;
    return this;
  }

  Build() {
    return this.mDot;
  }
}

export default Dot;

export { DotBuilder, DotTypes };
