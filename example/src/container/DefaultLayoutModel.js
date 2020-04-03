import React from "react";
import DefaultHeader from "./DefaultHeader";
import DefaultSider from "./DefaultSider";
import DefaultMain from "./DefaultMain";

import CssBaseline from "@material-ui/core/CssBaseline";
import { withRouter } from "react-router-dom";

import * as Actions from "../store/actions";
import { connect } from "react-redux";

class DefaultLayoutModel extends React.Component {
  handleDrawerOpen = () => {
    this.props.handleDrawer(!this.props.open);
  };

  handleDrawerClose = () => {
    this.props.handleDrawer(false);
  };

  render() {
    const { open } = this.props;
    return (
      <div className="defaultLayout" style={{ display: "flex", position: 'relative' }}>
        <DefaultHeader handleDrawerOpen={this.handleDrawerOpen} open={open} />
        <CssBaseline />
        <DefaultSider user={this.props.user} open={open} handleDrawerClose={this.handleDrawerClose} />
        <DefaultMain open={open} />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    open: state.drawer.open
  };
};

const mapDispatchToProps = dispatch => {
  return {
    handleDrawer: open => dispatch(Actions.drawer(open)),
  };
};

const withDefaultLayout = withRouter(DefaultLayoutModel);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withDefaultLayout);
