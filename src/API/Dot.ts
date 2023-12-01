import { Paper } from "../Util/type";
import PageInfo from "./PageInfo";

const DotTypes = Object.freeze({
  PEN_DOWN: 0,
  PEN_MOVE: 1,
  PEN_UP: 2,
  PEN_HOVER: 3,
  PEN_INFO: 4,
  PEN_ERROR: 5,
});

type Angle = {
  tx: number;
  ty: number;
  twist: number;
};

class Dot {
  pageInfo: PageInfo;
  x: number;
  y: number;
  f: number;
  dotType: number;
  timeDiff: number;
  timeStamp: number;
  penTipType: number;
  color: number;
  angle: Angle;

  constructor() {
    this.pageInfo = new PageInfo(0, 0, 0, 0);
    this.x = 0;
    this.y = 0;
    this.angle = {
      tx: 0,
      ty: 0,
      twist: 0,
    };
    this.f = 0;
    this.color = 0x000000ff;
    this.timeDiff = 0;
    this.timeStamp = 0;
    this.dotType = Dot.DotTypes.PEN_DOWN;
    this.penTipType = 0; // 0: Normal, 1: Eraser
  }

  static MakeDot(
    paper: Paper,
    x: number,
    y: number,
    force: number,
    type: number,
    penTipType: number,
    color: number,
    angel = { tx: 0, ty: 0, twist: 0 }
  ) {
    let builder = new DotBuilder();

    const xx = parseFloat(x.toFixed(2));
    const yy = parseFloat(y.toFixed(2));
    builder
      .owner(paper.owner)
      .section(paper.section)
      .note(paper.note)
      .page(paper.page)
      .timeDiff(paper.TimeDiff)
      .timeStamp(paper.Time)
      .coord(xx, yy)
      .force(force)
      .dotType(type)
      .penTipType(penTipType)
      .color(color)
      .angle(angel);
    return builder.Build();
  }

  Clone() {
    let newDot = new Dot();
    newDot.pageInfo = this.pageInfo;
    newDot.x = this.x;
    newDot.y = this.y;
    newDot.f = this.f;
    newDot.timeDiff = this.timeDiff;
    newDot.timeStamp = this.timeStamp;
    newDot.dotType = this.dotType;
    newDot.penTipType = this.penTipType;
    newDot.color = this.color;
    newDot.angle = this.angle;
    return newDot;
  }

  static get DotTypes() {
    return DotTypes;
  }
}

class DotBuilder {
  mDot: Dot;

  constructor() {
    this.mDot = new Dot();
  }

  section(section: number) {
    this.mDot.pageInfo.section = section;
    return this;
  }

  owner(owner: number) {
    this.mDot.pageInfo.owner = owner;
    return this;
  }

  note(note: number) {
    this.mDot.pageInfo.book = note;
    return this;
  }

  page(page: number) {
    this.mDot.pageInfo.page = page;
    return this;
  }

  timeDiff(timeDiff: number) {
    this.mDot.timeDiff = timeDiff;
    return this;
  }

  timeStamp(timeStamp: number) {
    this.mDot.timeStamp = timeStamp;
    return this;
  }

  coord(x: number, y: number) {
    this.mDot.x = x;
    this.mDot.y = y;
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
    this.mDot.f = force;
    return this;
  }

  dotType(dotType: number) {
    this.mDot.dotType = dotType;
    return this;
  }

  penTipType(penTipType: number) {
    this.mDot.penTipType = penTipType;
    return this;
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
