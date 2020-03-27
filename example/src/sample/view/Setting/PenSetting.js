import React from "react";

import { PenMessageType, SettingType } from "../../../../../lib";
import { Box, Button, Typography } from "@material-ui/core";
import * as Global from "../../Global";
import PenSettingSub from "./PenSettingSub";
import OfflineView from "./OfflineView";
import FWView from "./FWView";
import PenHelper from "../../PenHelper"

const setting = [
  "Clear",
  "PenInfo",
  "PenSetting",
  "Set Password",
  "SetTime",
  "Offline",
  "FWUpdate"
];

export default class PenSetting extends React.Component {
  constructor(props) {
    super(props);
    let pen = new PenHelper()
    pen.messageCallback = this.onMessage;
    this.state = {
      pen: pen,
      log: [],
      pensetting: null,
      offlineNote: [],
      offlinePage: null,
      openOffView: false,
      openFWView: false
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
    let { pen } = this.state;
    if (name === "Clear") {
      this.setState({ log: [] });
      return;
    }
    // TEMP FOR FW TEST
    if (name ===   "FWUpdate"){
      this.setState({openFWView: true})
      return
    }
    if (!pen.isConnected()) {
      this.log("Pen 연결이 필요합니다.");
      return;
    }
    switch (name) {
      case "Clear":
        break;
      case "PenInfo":
        let version = pen.controller.RequestVersionInfo();
        this.log(JSON.stringify(version));
        break;
      case "PenSetting":
        pen.controller.RequestPenStatus();
        break;
      case "SetTime":
        pen.controller.SetRtcTime(Date.now);
        break;
      case "Set Password":
        let result = prompt("Set Password");
        let oldps = Global.getPassword();
        this.log("SetPassword " + oldps + " => " + result);
        pen.controller.SetPassword(oldps, result);
        break;
      case "Offline":
        // pen.controller.RequestOfflineNoteList()
        pen.controller.RequestOfflineNoteList(3, 27);
        break;
      case "FWUpdate":
        this.setState({openFWView: true})
        break;
      default:
        this.log("TODO Event: " + name);
        break;
    }
  };

  handleOffline = () => {
    this.setState({ offlineNote: [], offlinePage: null, openOffView: false });
  };


  selectNote = (note) => {
    console.log("selectnote", note)
    let { pen } = this.state;
    pen.controller.RequestOfflinePageList(note.Section, note.Owner, note.Note)
  }

  downloadNote = (note) => {
    console.log("downloadNote", note)
    this.setState({openOffView:false})
    let { pen } = this.state;
    pen.controller.RequestOfflineData(note.Section, note.Owner, note.Note)
  }

  deleteNote = (note) => {
    console.log("deleteNote", note)
    let { pen } = this.props;
    pen.controller.RequestOfflineDelete(note.Section, note.Owner, [note.Note])
  }

  selectPage =(note, page) => {
    console.log("download Page Data",note, page)
    this.setState({openOffView:false})
    let { pen } = this.state;
    pen.controller.RequestOfflineData(note.Section, note.Owner, note.Note, true, [page])
  }

  // FW Update
  handleFWClose = () => {
    this.setState({openFWView: false})
  }

  render() {
    let { log } = this.state;
    return (
      <div className="SeetingView" style={{marginTop: 50}}>
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
                style={{ color: "white", wordBreak: "break-all" }}
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
              {this.state.pensetting && (
                <PenSettingSub
                  pen={this.state.pen}
                  pensetting={this.state.pensetting}
                />
              )}
            </Box>
          </Box>
        </Box>
        <OfflineView
          openOffView = {this.state.openOffView}
          offlineNote={this.state.offlineNote}
          offlinePage={this.state.offlinePage}
          handleOffline={this.handleOffline}
          selectNote={this.selectNote}
          downloadNote={this.downloadNote}
          deleteNote={this.deleteNote}
          selectPage={this.selectPage}
        />
        <FWView
          openFWView={this.state.openFWView}
          handleFWClose={this.handleFWClose}
          pen={this.state.pen}
         />
      </div>
    );
  }

  onMessage = (type, args) => {
    let { handleOfflineStroke } = this.props;
    let {pen} = this.state
    if (!pen) {
      this.log("pen is null");
      return;
    }
    switch (type) {
      case PenMessageType.PEN_AUTHORIZED:
        this.log("PenHelper PEN_AUTHORIZED");
        break;
      case PenMessageType.PEN_PASSWORD_REQUEST:
        this.log("request password", args);
        let result = prompt(
          "Input Password (시도횟수: " +
            args.RetryCount +
            ", 10회 실패시 펜초기화됩니다."
        );
        Global.setPassword(result);
        pen.controller.InputPassword(result);
        break;
      case PenMessageType.PEN_SETTING_INFO:
        this.log("PenHelper Setting Info", args);
        this.setState({ pensetting: args });
        break;
      case PenMessageType.PEN_SETUP_SUCCESS:
        let settingtype = Object.keys(SettingType).filter(
          key => SettingType[key] === args.SettingType
        );
        this.log(
          settingtype + "Setting success",
          args,
          typeof args.SettingType
        );
        break;
      case PenMessageType.EVENT_DOT_ERROR:
        // this.log("Dot Error", type,"Arg", args);
        break;
      case PenMessageType.OFFLINE_DATA_NOTE_LIST:
        this.log("OFFLINE_DATA_NOTE_LIST", args.length > 0 ? args :"No Data");
        console.log(args);
        this.setState({ offlineNote: args, openOffView: true });
        break;
      case PenMessageType.OFFLINE_DATA_PAGE_LIST:
        this.log("OFFLINE_DATA_PAGE_LIST", args);
        this.setState({ offlinePage: args });
        break;
      //Offline Data Process
      case PenMessageType.OFFLINE_DATA_SEND_START:
          console.log("Offline Progress Start")
          break
      case PenMessageType.OFFLINE_DATA_SEND_STATUS:
        console.log("Offline Progress 0~100%", args)
        break
      case PenMessageType.OFFLINE_DATA_SEND_SUCCESS:
        console.log("Offline Data", args)
        handleOfflineStroke(args)
        break
      case PenMessageType.OFFLINE_DATA_SEND_FAILURE:
        console.log("Offline Fail")
        break
      default:
        console.log("TODO: type: ", type, this.getMessage(type),"Arg", args)
        // this.log("TODO: type: ", type, "Arg", args);
    }
  };

  getMessage = (type) => {
    let messageType = Object.keys(PenMessageType).filter(
      key => SettingType[key] === type
    );
    return messageType
  }
}
