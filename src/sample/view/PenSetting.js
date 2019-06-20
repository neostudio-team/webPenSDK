import React from "react";

import { PenMessageType, SettingType } from "../../pensdk";
import { Box, Button, Typography } from "@material-ui/core";
import * as Global from "../Global";

const setting = ["Clear", "PenInfo", "SetTime", "UsingNote", "Set Password"];

export default class PenSetting extends React.Component {
  constructor(props) {
    super(props);
    this.props.pen.messageCallback = this.onMessage;
    this.state = {
      log: []
    };
  }

  log = (l, ...arg) => {
    let loglist = this.state.log;
    loglist.push(l);
    arg.forEach(param => {
      let jString = JSON.stringify(param);
      loglist.push(jString);
    });
    this.setState({ log: loglist });
  };

  handleButton = name => {
    let { pen } = this.props;
    switch (name) {
      case "Clear":
        this.setState({ log: [] });
        break;
      case "PenInfo":
        pen.controller.RequestPenStatus();
        break;
      case "Set Password":
        let result = prompt("Set Password");
        let oldps = Global.getPassword()
        this.log("SetPassword " + oldps + " => " + result);
        pen.controller.SetPassword(oldps, result)
        break;
      default:
        this.log("TODO Event: " + name);
        break;
    }
  };

  dummytext = () => {
    let loglist = []
    let dd = ""
    for (let i = 0; i< 100; i++){
      dd += (" " + i)
      loglist.push(dd)
    }
    this.setState({log:loglist})
  }


  render() {
    let { log } = this.state;

    return (
      <div className="SeetingView">
        <Box display="flex" flexDirection="column">
          <Box
            style={{
              height: 400,
              backgroundColor: "black",
              overflow: "scroll",
              padding: 5
            }}
          >
            {log.map((l, index) => (
              <Typography
                key={index}
                variant="body2"
                style={{ color: "white" }}
              >
                {l}
              </Typography>
            ))}
          </Box>
          <Box className="ControlBox" display="flex" flexDirection="row">
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              style={{ margin: 5 }}
            >
              {setting.map((name, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  color="primary"
                  onClick={() => this.handleButton(name)}
                >
                  {name}
                </Button>
              ))}
            </Box>
            <Box
              width="50%"
              display="flex"
              flexDirection="column"
              style={{ margin: 5 }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={this.dummytext}
              >
                DummyText
              </Button>
            </Box>
          </Box>
        </Box>
      </div>
    );
  }

  onMessage = (type, args) => {
    let { pen } = this.props;
    if (!pen) {
      this.log("pen is null");
      return;
    }
    switch (type) {
      case PenMessageType.PEN_AUTHORIZED:
        this.log("PenHelper PEN_AUTHORIZED");
        pen.controller.RequestAvailableNotes();
        break;
      case PenMessageType.PEN_PASSWORD_REQUEST:
        this.log("request password", args);
        let result = prompt("Input Password (시도횟수: " + args.RetryCount + ", 10회 실패시 펜초기화됩니다.");
        Global.setPassword(result)
        pen.controller.InputPassword(result);
        break;
      case PenMessageType.PEN_SETTING_INFO:
        this.log("PenHelper Setting Info", args);
        break;
      case PenMessageType.PEN_SETUP_SUCCESS:
        let settingtype = Object.keys(SettingType).filter(
          key => SettingType[key] === args.SettingType
        );
        this.log(
          "PenHelper Setting success",
          settingtype,
          args,
          typeof args.SettingType
        );
        break;
      case PenMessageType.EVENT_DOT_ERROR:
        // this.log("Dot Error", type,"Arg", args);
        break;
      default:
        this.log("TODO: type: ", type,"Arg", args);
    }
  };
}
