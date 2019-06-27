import React from "react";
import * as Icons from "@material-ui/icons";
import { Dialog, Divider, Typography, IconButton, Button } from "@material-ui/core";

const baseUrl = "http://one.neolab.kr/resource/fw20/";
const fwinfo = "firmware_all_3.json";
export default class FWView extends React.Component {
  firemware = () => {
    const fwurl = baseUrl + fwinfo;
    fetch(fwurl, {
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin':'*'
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log(data)
      })
      .catch(err => console.log(err));
  };

  download = () => {
    const fw = "files/NWP-F50_1.03.0143._v_";
    const downloadurl = baseUrl + fw;
    fetch(downloadurl)
      .then(res => console.log(res))
      .catch(err => console.log(err));
  };

  render() {
    let { openFWView, handleFWClose } = this.props;
    return (
      <Dialog fullScreen open={openFWView} onClose={handleFWClose}>
        <IconButton onClick={handleFWClose} style={{ width: 45, height: 45 }}>
          <Icons.CloseOutlined />
        </IconButton>

        <Typography variant="h6" style={{ marginLeft: 50 }}>
          {"Firmware Update"}
        </Typography>

        <Button variant="contained" color="primary" onClick={this.firemware}>
          Firmware Info
        </Button>
        <Divider style={{height:20}}/>

        <Button variant="contained" color="primary" onClick={this.download}>
          download
        </Button>

        <Divider />
      </Dialog>
    );
  }

  componentDidMount;
}
