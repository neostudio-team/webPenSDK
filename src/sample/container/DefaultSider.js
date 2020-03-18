import React from "react";
import PropTypes from "prop-types";

import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import { drawerWidth } from "./config";
import SideMenuModel from "../view/SideMenu/SideMenuModel";
import IconButton from "@material-ui/core/IconButton";
import * as Icons from "@material-ui/icons";

import { Avatar, Typography, Collapse, Divider } from "@material-ui/core";

const propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool,
  user: PropTypes.object,
  handleDrawerClose: PropTypes.func
};

const defaultProps = {};

const styles = theme => ({
  hide: {
    display: "none"
  },
  drawer: {
    width: drawerWidth,
    flexGrow: 1
  },

  drawerPaper: {
    width: drawerWidth,
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper
  },

  drawerHeader: {
    position: 'relative',
    backgroundColor: theme.palette.background.paper
  },
  divider: {
    backgroundColor: theme.palette.grey[50]
  },
  big: {
    marginTop: 100,
    height: 172,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%"
  },
  small: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    marginLeft: 20
  },
  close: {
    marginTop: 6.5,
    float: "right"
  }
});

class DefaultSider extends React.Component {
  state = {
    expanded: true
  };

  listenToScroll = e => {
    e.stopPropagation();
    const top = e.target.scrollTop;
    if (top < 1) {
      this.setState({ expanded: true });
    } else {
      this.setState({ expanded: false });
    }
  };

  render() {
    const { classes, open, user, handleDrawerClose } = this.props;
    const { expanded } = this.state;
    return (
      <Drawer
        className={classes.drawer}
        onScroll={this.listenToScroll}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={classes.drawerHeader}>
          <Divider className={classes.divider} style={{position:'absolute', top: 60, width:'100%'}}/>

          {user && (
            <Collapse in={expanded} collapsedHeight="60px">
              <IconButton aria-label="close" onClick={handleDrawerClose} className={classes.close}>
                <Icons.ChevronLeft />
              </IconButton>

              <div className={expanded ? classes.big : classes.small}>
                <Avatar
                  src={user.photoURL}
                  alt="None"
                  style={expanded ? { width: 71, height: 71 } : { marginTop: 6 }}
                />
                <Typography
                  variant="h3"
                  style={{
                    fontWeight: 500,
                    maxWidth: 140,
                    marginLeft: expanded ? 0 : 10,
                    marginTop: expanded ? 10 : 6
                  }}
                >
                  {user.displayName}
                </Typography>
                <Typography
                  variant="body1"
                  inline="true"
                  style={{ color: "#aaa", maxWidth: 140, display: expanded ? "" : "none" }}
                >
                  <i>{"Beta 1.0"}</i>
                </Typography>
              </div>
            </Collapse>
          )}
        </div>

        <SideMenuModel handleDrawerClose={handleDrawerClose} />
      </Drawer>
    );
  }
}

DefaultSider.propTypes = propTypes;
DefaultSider.defaultProps = defaultProps;

export default withStyles(styles, { withTheme: true })(DefaultSider);
