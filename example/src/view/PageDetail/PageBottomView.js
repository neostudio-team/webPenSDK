import React from "react";
import IconButton from "@material-ui/core/IconButton";
import * as Icon from "@material-ui/icons";
import { Typography, ButtonBase } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import withWidth, { isWidthDown } from "@material-ui/core/withWidth";

const styles = theme => ({
  bottom: {
    // marginTop: "auto",

    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 140,
    backgroundColor: theme.palette.background.paper, //default or paper
    zIndex: 1100
  },
  itembar: {
    display: "flex",
    justifyContent: "center",
    height: 60,

  },
  banner: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    backgroundColor: "#d6d4e9"
  },
  icon: {
    margin: "auto 0",
    height: 48
  }
});

class PageBottomView extends React.Component {
  zoomIn = () => {
    this.props.zoom(true);
  };

  zoomOut = () => {
    this.props.zoom(false);
  };

  zoomAtWidth = () => {
    this.props.zoomAtWidth(true);
  };

  zoomAtHeight = () => {
    this.props.zoomAtWidth(false);
  };

  openBannerEvent = () => {
    window.open("http://store.neosmartpen.com/goods/goods_view.php?goodsNo=154&utm_source=neostudio&utm_medium=banner&utm_campaign=dimo")
  }

  replay = () => {
    this.props.playHandler()
  }

  linkshare = () => {
    this.props.linkshare()
  }

  render() {
    const { classes, scale } = this.props;

    let withdown = isWidthDown("sm", this.props.width);
    return (
      <div className={classes.bottom}>
        <div className={classes.itembar}>
          <IconButton className={classes.icon} aria-label="ZoomOut" onClick={this.zoomOut}>
            <Icon.Remove />
          </IconButton>

          <Typography variant="button" align="center" style={{ width: 50, margin: "auto 0" }}>
            {scale + "%"}
          </Typography>

          <IconButton className={classes.icon} aria-label="ZoomIn" onClick={this.zoomIn}>
            <Icon.Add />
          </IconButton>

          <IconButton className={classes.icon} onClick={this.zoomAtHeight}>
            <Icon.Fullscreen />
          </IconButton>

          {!withdown && (
            <IconButton className={classes.icon} onClick={this.zoomAtWidth}>
              <Icon.ZoomOutMapRounded />
            </IconButton>
          )}

          <IconButton className={classes.icon} aria-label="Play" onClick={this.replay}>
            <Icon.PlayArrow />
          </IconButton>

          <IconButton className={classes.icon} aria-label="fileshare" onClick={this.linkshare}>
            <Icon.Link />
          </IconButton>

        </div>
        <div style={{height: 5, backgroundColor: "#e9e9e9"}}></div>
        <ButtonBase className={classes.banner} focusRipple onClick={this.openBannerEvent}>
            <img src="../../assets/img/banner.png" alt="Neosmart pen" width="320" height="75" style={{}} />
        </ButtonBase>
      </div>
    );
  }
}

export default withWidth()(withStyles(styles)(PageBottomView));
