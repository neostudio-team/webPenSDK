const DotTypes = Object.freeze({
    "PEN_DOWN": 1,
    "PEN_MOVE": 2,
    "PEN_UP": 3,
    "PEN_HOVER": 4,
    "PEN_ERROR": 5,
})

class Dot {
    Clone() {
        let newDot = new Dot()
        newDot.Section = this.Section

        newDot.Owner = this.Owner
        newDot.Section = this.Section;
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

    static get DotTypes(){
        return DotTypes
    }
}
Dot.prototype.Section = 0
Dot.prototype.Owner = 0
Dot.prototype.Note = 0
Dot.prototype.Page = 0
Dot.prototype.X = 0
Dot.prototype.Y = 0
Dot.prototype.TiltX = 0
Dot.prototype.TiltY = 0
Dot.prototype.Twist = 0
Dot.prototype.Force = 0
Dot.prototype.Color = 0
Dot.prototype.Timestamp = 0
Dot.prototype.DotType = Dot.DotTypes.PEN_DOWN

class DotBuilder {
    constructor(maxiumForce) {
        this.mDot = new Dot()
        if (arguments.length === 1) {
            this.maxForce = maxiumForce
            this.scale = this.RefindMaxForce / this.maxForce
        }
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
        this.mDot.X = x;
        this.mDot.Y = y;
        return this;
    }

    tilt(x, y) {
        this.mDot.TiltX = x;
        this.mDot.TiltY = y;
        return this;
    }

    twist(twist) {
        this.mDot.Twist = twist;
        return this;
    }

    force(force) {
        if (this.maxForce === -1)
            this.mDot.Force = force;
        else {
            this.mDot.Force = Math.round(force * this.scale); // 반올림

            // if (Support.PressureCalibration.Instance.Factor != null)
            // 	mDot.Force = (int)Support.PressureCalibration.Instance.Factor[mDot.Force];
        }

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

DotBuilder.prototype.RefindMaxForce = 1023
DotBuilder.prototype.maxForce = -1
DotBuilder.prototype.scale = -1

export default Dot

export {
    DotBuilder, DotTypes
}
