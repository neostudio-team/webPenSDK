import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import * as Icons from "@material-ui/icons";
import { Button } from "@material-ui/core";

const propTypes = {
  classes: PropTypes.object.isRequired,
  handleDrawerOpen: PropTypes.func,
  open: PropTypes.bool
};

const defaultProps = {};

const styles = theme => ({
  leftMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 70,
    height: 60,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 0,
    zIndex: 1100,
    "&:hover": {
      opacity: 1,
      backgroundColor: theme.palette.primary.main,
    }
  }
});

class DefaultHeader extends React.Component {
  render() {
    const { classes, open, handleDrawerOpen } = this.props;
    return (
      <Fragment>
      {!open && (
        <Button className={classes.leftMenu} aria-label="Menu" onClick={handleDrawerOpen}>
          <Icons.Menu style={{color:'white'}}/>
        </Button>
      )}
      </Fragment>
    );
  }
}

DefaultHeader.propTypes = propTypes;
DefaultHeader.defaultProps = defaultProps;

export default withStyles(styles)(DefaultHeader);
