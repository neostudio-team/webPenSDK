import React from "react";
import { Divider } from "@material-ui/core";
import withWidth from "@material-ui/core/withWidth";

// Redux
import { connect } from 'react-redux'
import * as Actions from "../../store/actions";

// View
import PageBottomView from "./PageBottomView";
import RenderingView from "./RenderingView";


const propTypes = {};

const defaultProps = {};

class PageDetailModel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rect: {x: 0,y: 0, width: 120, height: 60},
      scale: 100,
      ratioWH: 1.414,
      scaleType: 1, // 1: ScaleTo: Height, 2 ScaleTo: Width
      isSaveTrigger: false,
      url: null,
      files: null,
      page: null,
    };
  }

  // Render
  render() {
    const h = window.innerHeight;
    let {color, thickness} = this.props
    console.log("Page Model color, thickness", color, thickness)
    return (
      <div
        className="PageDetailView"
        style={{
          display: "flex",
          flexDirection: "column",
          height: h
        }}
      >
        <RenderingView
          scaleType={this.state.scaleType}
          scale={this.state.scale}
          // stroke={this.state.stroke}
          rect={this.state.rect}
          page={this.state.page}
          isSaveTrigger={this.state.isSaveTrigger}
          color={color}
          thickness={thickness}
        />
        <Divider />
        <PageBottomView
          zoom={this.zoom}
          scale={this.state.scale}
          zoomAtWidth={this.zoomAtWidth}
          playHandler={this.playHandler}
          linkshare={this.linkshare}
        />
      </div>
    );
  }
  // File Open Call back
  fileHandler = files => {
    this.setState({ id: null, files });
  };

  neoinkHandler = page => {
    this.setState({ id: "default", page: page, isConverter: false });
    this.loadingData(page);
  };

  audioHandler = (url, audioStarted) => {
    this.setState({ url, audioStarted });
  };

  // Share Event
  linkshare = () => {
    console.log("link share");
    if (this.state.id) {
      if (this.state.id !== "default") {
        console.log("share with id", this.state.id);
        this.shareurl(this.state.id);
        return;
      }
    }
    console.log("share with files");
  };

  shareurl = id => {
    console.log("Share with id", id);
    let url = window.location.origin + "/?id=" + id;
    if (navigator.share) {
      // Web Share API is supported
      console.log("share start", url);
      navigator
        .share({ title: "Web Share Video", url: url })
        .then(() => console.log("share complete"))
        .catch(err => console.log(err));
    } else {
      console.log("not support share");
      var textField = document.createElement("textarea");
      textField.innerText = url;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand("copy");
      textField.remove();
      alert("Copied this page Data.");
    }
  };

  // From AudioView To Canvas
  playedSecondsHendler = playedSeconds => {
    let playTime = this.state.audioStarted + playedSeconds * 1000;
    console.log("playsecond", playedSeconds, new Date(playTime));
    this.setState({ playTime });
  };
  // From Canvas To Audio
  seekHandler = strokTime => {
    let seek = (strokTime - this.state.audioStarted) * 0.001;
    this.setState({ seek });
  };

  clearCanvas = () => {
    
  }

  zoom = zoomin => {
    const scaleParam =
      this.state.scaleType === 1
        ? [50, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400]
        : [25, 50, 75, 80, 90, 100, 110, 125, 150, 175, 200];
    let scale = null;
    if (zoomin) {
      scale = scaleParam.filter(v => v > this.state.scale).shift();
    } else {
      scale = scaleParam.filter(v => v < this.state.scale).pop();
    }
    if (scale) {
      this.setState({ scale: scale });
    }
  };

  // Zoom to With or height
  zoomAtWidth = width => {
    if (width) {
      this.setState({ scale: 100, scaleType: 2 });
    } else {
      this.setState({ scale: 100, scaleType: 1 });
    }
  };

  playHandler = () => {
    // console.log("Play status", this.state.isPlay)
    if (this.state.isPlay) {
      this.setState({ isPlay: false });
    } else {
      this.setState({ isPlay: true });
    }
  };
}

PageDetailModel.propTypes = propTypes;
PageDetailModel.defaultProps = defaultProps;

const mapStateToProps = state => {
  return {
    color: state.color.color,
    thickness: state.thickness.thickness

  };
};

const mapDispatchToProps = dispatch => {
  return {
    handleDrawer: open => dispatch(Actions.drawer(open))
  };
};
const withWidthView = withWidth()(PageDetailModel);

export default connect(mapStateToProps, mapDispatchToProps)(withWidthView);
