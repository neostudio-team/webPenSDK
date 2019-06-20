import React from "react";
import Painter from "./view/Painter";
import PenSetting from "./view/PenSetting";
import { Box } from "@material-ui/core";
import PenHelper from "./PenHelper";

class App extends React.Component {
  constructor(props) {
    super(props);
    let pen = new PenHelper();
    this.state = {
      pen
    };
  }

  render() {
    return (
      <div className="App" style={{ backgroundColor: "rgb(240,240,240)" }}>
        <Box display="flex">
          <Box width="800px">
            <Painter pen={this.state.pen} />
          </Box>
          <Box width="100%">
            <PenSetting pen={this.state.pen} />
          </Box>
        </Box>
      </div>
    );
  }
}

export default App;
