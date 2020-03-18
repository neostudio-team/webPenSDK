import React from "react";
import PropTypes from "prop-types";

import * as ROUTES from "../../routes";

//UI elemnet
import * as Icons from "@material-ui/icons";
import { withStyles } from "@material-ui/core/styles";
import { MenuItem, Typography, ListItem, Box } from "@material-ui/core";

//Menu item
import ListItemIcon from "@material-ui/core/ListItemIcon";
import PenHelper from "../../PenHelper";

// Color Setting
import { SketchPicker } from "react-color";
import Thickness from "./Thickness";

const studioLogo = "../../assets/img/studioLogo.svg";

const propTypes = {
  user: PropTypes.object,
  firebase: PropTypes.object,
  handleRouting: PropTypes.func,
  search: PropTypes.func
};

const defaultProps = {};

const styles = theme => ({
  sidemenu: {
    width: "100%",
    height: "100%",
    overflowY: "scroll",
    boxSizing: "content-box",
    display: "flex",
    flexDirection: "column"
  },
  menu: {
    // minHeight: 60,
    height: 60,
    "&:focus": {
      "& svg": {
        color: theme.palette.primary.main
      },
      "& h3": {
        color: theme.palette.primary.main
      }
    },
    "& svg": {
      color: theme.palette.grey[500]
    },
    "& h3": {
      color: theme.palette.grey[300]
    }
  },
  menuSelected: {
    "& svg": {
      color: theme.palette.primary.main
    },
    "& h3": {
      color: theme.palette.primary.main
    }
  },
  menuContact: {
    height: 60,
    "& svg": {
      color: theme.palette.grey[500]
    },
    "& h3": {
      color: theme.palette.grey[300]
    }
  },
  icon: {
    padding: 10
  },
  title: {
    marginLeft: -10
  },
  divider: {
    backgroundColor: theme.palette.grey[50]
  },
  space: {
    flex: 1
  },
  logo: {
    display: "flex",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 20
  }
});

class SideMenu extends React.Component {
  changeMainView = route => {
    this.props.handleRouting(route);
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.sidemenu}>
        {/* Close Menu */}
        <MenuItem className={classes.menu} onClick={() => this.props.handleDrawer(false)}>
          <ListItemIcon className={classes.icon}>
            <Icons.Close/>
          </ListItemIcon>
        </MenuItem>
        {/* Conect Pen */}
        <MenuItem className={classes.menu} onClick={this.conectPen}>
          <ListItemIcon className={classes.icon}>
            <Icons.Create/>
          </ListItemIcon>
          <Typography variant="h4" className={classes.title}>
            Connect Pen
          </Typography>
        </MenuItem>
        {/* Item 1 */}
        <MenuItem className={classes.menu} onClick={() => this.changeMainView(ROUTES.MAIN_PAGE)}>
          <ListItemIcon className={classes.icon}>
            <Icons.Note />
          </ListItemIcon>
          <Typography variant="h4" className={classes.title}>
            Canvas
          </Typography>
        </MenuItem>
        {/* Item 2 */}
        <MenuItem className={classes.menu} onClick={() => this.changeMainView(ROUTES.MAIN_SETTING)}>
          <ListItemIcon className={classes.icon}>
            <Icons.SettingsOutlined />
          </ListItemIcon>
          <Typography variant="h4" className={classes.title}>
            Setting
          </Typography>
        </MenuItem>

        <div className={classes.space} />
        <Box>
          <SketchPicker
            // color={Global.getColor()}
            onChangeComplete={this.handleColorChange}
          />

          <Thickness 
            handleThickness={this.handleThickness}
          />
        </Box>


        <ListItem className={classes.logo}>
          <img src={studioLogo} alt="NEO NOTES STUDIO" />
        </ListItem>
      </div>
    );
  }
  componentDidMount() {}

  conectPen = () => {
    let pen = new PenHelper()
    pen.scanPen()
  }

  handleColorChange = color => {
    const rgb = "rgba(" + Object.values(color.rgb) + ")"
    console.log(rgb)
    this.props.handleColor(rgb)
  };

  handleThickness = (thickness) => {
    this.props.handleThickness(thickness)

  }
}

SideMenu.propTypes = propTypes;
SideMenu.defaultProps = defaultProps;

export default withStyles(styles)(SideMenu);
