import React from "react";
import { Slider } from "@material-ui/core";
import { Typography } from "@material-ui/core";

function valuetext(value) {
  return `${value / 10}`;
}

export default class Thickness extends React.Component {
  handleThickness = (t, v) => {
    this.props.handleThickness(v)
  };

  render() {
    let markers = [];
    const max = 10;
    for (let i = 0; i < max; i++) {
      markers.push({ value: i + 1, label: i + 1 });
    }
    return (
      <div style={{marginTop: 10, marginLeft: 10}}>
        <Typography id="discrete-slider-custom">
          Thickness
        </Typography>
        <Slider
          defaultValue={1}
          getAriaValueText={valuetext}
          aria-labelledby="discrete-slider-custom"
          step={1}
          valueLabelDisplay="auto"
          marks={markers}
          max={max}
          min={1}
          style={{ width: 200}}
          onChange={this.handleThickness}
        />
      </div>
    );
  }
}

