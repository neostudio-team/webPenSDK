import React from 'react';
import PropTypes from "prop-types";

import FabricRender from './FabricRender'
import Filesaver from 'file-saver'
import { withStyles } from "@material-ui/core/styles";
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { Paper} from "@material-ui/core"

const propTypes = {
  scaleType: PropTypes.number, // 0: fit scale, 1: fit height, 2: fit width 
  scale: PropTypes.number,
  // stroke: PropTypes.array,
  rect: PropTypes.object,
  bgurl: PropTypes.string,
  page: PropTypes.object,
  note: PropTypes.object,
  saveBind: PropTypes.func,
};

const defaultProps = {};

const styles = theme => ({
  root: {
    overflow: "scroll",
    // overflowX: "hidden",
    display: 'flex',
    position: 'relative',
    paddingTop: 10,
  },
  paper: {
    // marginTop: 10,
    margin: "auto",
    backgroundColor: "yello"
  },
});

class RenderingView extends React.Component {
  state = {
    renderer: null,
    drawing: false,
  }

  render() {
    const {classes, scaleType, scale, width, rect} = this.props
    const pageHeight = window.innerHeight - 140
    let h = pageHeight - 20; // for divider
    let w = window.innerWidth - 10;
    // console.log("OriginSize", w, h)
    let withdown = isWidthDown('sm', width)
    if (withdown) {
      w = (window.innerWidth - 20) * scale * 0.01;
      h = w * rect.height / rect.width
      // console.log(w,h, rect.height , rect.width)
    }else{
      // scale to height
      if (scaleType === 1) {
        h = h * scale * 0.01;
        w = h *  rect.width / rect.height
        // scale to width
      } else if (scaleType === 2) {
        h = w * rect.height / rect.width * scale * 0.01
        w = w * scale * 0.01
      }
    }

    this.size = {
      w: w,
      h: h
    };

    // console.log("Size:", this.size, "Scale:", scale, "w: ", this.size.w / scale * 100)

    if (this.state.renderer){
      // console.log("render resize", this.size)
      this.state.renderer.resize(this.size)
    }
    return (
      <div className={classes.root} style={{height: pageHeight}}>
        <Paper className={classes.paper} style={{height: this.size.h, width: this.size.w}}>
          <canvas id="c"/>
        </Paper>
      </div>
    );
  }

  saveCanvas = () => {
    const {page} = this.props
    const fileName = page.notetitle + "_" + page.page + ".png"
    console.log("save canvas", fileName)
    var canvas = this.state.renderer.canvas
    canvas.getElement().toBlob(function(blob) {
      Filesaver.saveAs(blob, fileName);
    },'imge/png',0.1);
  }

  shouldComponentUpdate(nextProps, nextState){
    if (nextProps.isPlay !== this.props.isPlay) {
      this.state.renderer.replayStart()
      return false
    }
    if (nextProps.isSaveTrigger !== this.props.isSaveTrigger){
      this.saveCanvas()
      return false
    }
    if (nextProps.playTime !== this.props.playTime){
      this.state.renderer.setPlayTime(nextProps.playTime)
      return false
    }
    if (nextProps.color !== this.props.color){
      this.state.renderer.setColor(nextProps.color)
      return false
    }
    if (nextProps.thickness !== this.props.thickness){
      this.state.renderer.setThickness(nextProps.thickness)
      return false
    }
    return true
  }


  componentDidMount() {
    let size = this.size
    // console.log("view size", size)
    const {page, rect, bgurl} = this.props
    // console.log("Draw Stroke size", page.strokes.length, "canvas size",size, "rect", rect)

    let renderer = new FabricRender('c')
    renderer.setCanvas(size, bgurl)
    renderer.drawingPage(page, rect, size)
    renderer.setSeekHandeler(this.props.seekHandler)
    this.setState({ renderer: renderer });
  }

}

RenderingView.propTypes = propTypes;
RenderingView.defaultProps = defaultProps;

export default withWidth()(withStyles(styles)(RenderingView));
