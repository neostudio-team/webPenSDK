import React from "react";
import StrokeView from "./view/StrokeView";
import PenSetting from "./view/PenSetting";
import { Box } from "@material-ui/core";
import PenHelper from "./PenHelper";

class App extends React.Component {
  constructor(props) {
    super(props);
    let pen = new PenHelper();

    this.state = {
      pen,
      stroke: []
    };
  }

  render() {
    return (
      <div className="App">
        <Box display="flex">
          <Box width="100%">
            <StrokeView pen={this.state.pen} stroke={this.state.stroke}/>
          </Box>
          <Box width="50%">
            <PenSetting pen={this.state.pen} handleOfflineStroke={this.handleOfflineStroke}/>
          </Box>
        </Box>
      </div>
    );
  }

  componentDidMount() {

  }

  handleOfflineStroke = (st) => {
    // console.log("Stroke", st)
    this.setState({stroke: st})
  }
}

export default App;
