import React from "react";
import {
  Typography,
  FormControlLabel,
  Switch,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Divider
} from "@material-ui/core";

export default class PenSettingSub extends React.Component {
  constructor(props) {
    super(props);
    const { pensetting } = this.props;
    this.state = pensetting;
  }
  handleAutoShutdownTime = event => {
    console.log(event.target.name, event.target.value);
    this.setState({ [event.target.name]: parseInt(event.target.value) });
    this.props.pen.controller.SetAutoPowerOffTime(parseInt(event.target.value));
  };

  handleChangeInOff = name => event => {
    let isOn = event.target.checked;
    console.log(name, event.target.checked);
    this.setState({ [name]: isOn });
    switch (name) {
      case "AutoPowerOn":
        this.props.pen.controller.SetAutoPowerOnEnable(isOn);
        break;
      case "PenCapPower":
        this.props.pen.controller.SetPenCapPowerOnOffEnable(isOn);
        break;
      case "Beep":
        this.props.pen.controller.SetBeepSoundEnable(isOn);
        break;
      default:
        console.log("TODO Set....");
    }
  };

  render() {
    const pensetting = this.state;
    if (!pensetting) {
      return <div> Pen Info </div>;
    }
    const {
      Timestamp,
      AutoShutdownTime,
      AutoPowerOn,
      PenCapPower,
      Beep
    } = pensetting;

    return (
      <div>
        <Typography>{Timestamp}</Typography>
        <Typography>{new Date(Timestamp).toTimeString()}</Typography>
        <FormControl>
          <InputLabel htmlFor="AutoShutdownTime">AutoShutdownTime</InputLabel>
          <Select
            value={AutoShutdownTime}
            onChange={this.handleAutoShutdownTime}
            inputProps={{
              name: "AutoShutdownTime",
              id: "AutoShutdownTime"
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={40}>40</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={60}>60</MenuItem>
          </Select>
        </FormControl>
        <Divider />
        <FormControlLabel
          control={
            <Switch
              checked={AutoPowerOn}
              onChange={this.handleChangeInOff("AutoPowerOn")}
              value="AutoPowerOn"
              color="primary"
            />
          }
          label="AutoPowerOn"
        />
        <FormControlLabel
          control={
            <Switch
              checked={PenCapPower}
              onChange={this.handleChangeInOff("PenCapPower")}
              value="PenCapPower"
              color="primary"
            />
          }
          label="PenCapPower"
        />
        <FormControlLabel
          control={
            <Switch
              checked={Beep}
              onChange={this.handleChangeInOff("Beep")}
              value="Beep"
              color="primary"
            />
          }
          label="Beep"
        />
      </div>
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    const propsChnage =
      JSON.stringify(this.props.pensetting) !==
      JSON.stringify(nextProps.pensetting);
    if (propsChnage) this.setState(nextProps.pensetting);
    return true;
  }
}
