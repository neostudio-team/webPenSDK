import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import * as Actions from "../../store/actions";
import { withRouter } from "react-router-dom";
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import SideMenu from './SideMenuView'

const propTypes = {};

const defaultProps = {};

class SideMenuModel extends Component {

  handleRouting = route => {
    let withdown = isWidthDown("sm", this.props.width);
    if (withdown) {
      this.props.handleDrawer(false);
    }
    this.props.history.push(route);
  };

  render() {
    return (
      <Fragment>
        <SideMenu
          handleRouting={this.handleRouting}
          handleDrawer={this.props.handleDrawer}
          handleColor={this.props.handleColor}
          handleThickness={this.props.handleThickness}
        />
      </Fragment>
    );
  }
}

SideMenuModel.propTypes = propTypes;
SideMenuModel.defaultProps = defaultProps;


 const mapStateToProps = (state) => {
  return {
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleDrawer: (open) => dispatch(Actions.drawer(open)),
    handleThickness: (thickness) => dispatch(Actions.thickness(thickness)),
    handleColor: (color) => dispatch(Actions.color(color))
  };
};

const withRouterView = withRouter(SideMenuModel);
const withWidthView  = withWidth()(withRouterView);

export default connect(mapStateToProps, mapDispatchToProps)(withWidthView)
 