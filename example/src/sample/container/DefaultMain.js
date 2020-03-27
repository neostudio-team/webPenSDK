import React from "react";
import { withStyles } from "@material-ui/core/styles";

import { Route } from "react-router-dom";
import * as ROUTES from "../routes";

import {drawerWidth} from './config'
import clsx from 'clsx';

//Routing USE
import MainView from "../view/PageDetail/PageDetailModel";
import SettingView from '../view/Setting/PenSetting'

const styles = theme => ({
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    ...theme.mixins.toolbar,
    justifyContent: "flex-end"
  },
  content: {
    flexGrow: 1,
    width:"100%",
    // paddingTop: 10,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: -drawerWidth,
    // backgroundColor: "red",
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0,
  },
  manepage: {
    minwidth: 200
  }
});

class DefaultMain extends React.Component {
  render() {
    const { classes, open} = this.props;
    // console.log(open)
    return (
        <main
          className={clsx(classes.content, {
            [classes.contentShift]: open
          })}
        >

          {/* <div className={classes.drawerHeader} /> */}
          <div className={classes.manepage}>
            {/* <Route exact path={ROUTES.MAIN_PAGE} component={MainView} /> */}
            <Route path={ROUTES.MAIN_PAGE} component={MainView} />
            <Route path={ROUTES.MAIN_SETTING} component={SettingView} />
          </div>
        </main>
    );
  }
}

export default withStyles(styles, { withTheme: true })(DefaultMain);
