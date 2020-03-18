import React from "react";
import PenHelper from "./PenHelper";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import DefaultLayout from './container';

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
      <Router>
          <div className="App">
            <Switch>
             <DefaultLayout/> 
            </Switch>
          </div>
      </Router>
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
