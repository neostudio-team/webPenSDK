import React from 'react';

import {Button} from "@material-ui/core";
import * as Icon from "@material-ui/icons";

const propTypes = {};

const defaultProps = {};

export default class ConverterView extends React.Component {
  render() {
    return (
      <div>
        <Button
        variant="contained"
        color="primary"
        startIcon={<Icon.OpenInBrowser />}
        onClick={this.fileOpen} 
        style={{margin: 10}}>
          Upload Files
        </ Button>
      </div>
    );
  }

  // File Open Step1: add Component when componentDidMount
  buildFileSelector = () => {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('multiple', 'multiple');
    return fileSelector;
  }

  neoinkHandler = (page) => {
    this.props.neoinkHandler(page)
  }

  audioHandler = (url, audioStarted) => {
    this.props.audioHandler(url, audioStarted)
  }

  // File Open
  fileOpen = () => {
    this.fileSelector.click();
    // console.log(this.fileSelector)
    this.fileSelector.addEventListener("change", e => {
      let files = e.target.files
      // console.log(files)
      this.props.fileHandler(files)

      Array.from(files).forEach(file=> {
        // console.log(file)
        if (file.name.includes(".neoink")){
          console.log("neoink file", file)
          const reader = new FileReader();
          reader.onload = (res) => {
            let pageData = JSON.parse(res.target.result)
            console.log("read page", pageData)
            this.neoinkHandler(pageData)
          }
          reader.readAsText(file)
        } else if (file.type.includes("audio")) {
          let audioStarted = parseInt(file.name.split(".")[0])
          console.log("audio file", file)
          let url = URL.createObjectURL(file)
          this.audioHandler(url, audioStarted);
        }
      })
    }, false);
  }

  componentDidMount() {
    this.fileSelector = this.buildFileSelector()
  }
}

 ConverterView.propTypes = propTypes;
 ConverterView.defaultProps = defaultProps;

