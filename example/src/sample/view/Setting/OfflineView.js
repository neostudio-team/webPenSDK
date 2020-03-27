import React from "react";
import * as Icons from "@material-ui/icons";

import { Dialog, Divider, Typography, IconButton, List, ListItem, ListItemText, Button } from "@material-ui/core";

export default class OfflineView extends React.Component {
  selectNote = note => {
    // console.log("selectnote", note)
    this.props.selectNote(note);
    this.note = note;
  };

  downloadNote = (event, note) => {
    event.preventDefault();
    event.stopPropagation();
    // console.log("downloadNote", note)
    this.props.downloadNote(note);
  };

  deleteNote = (event, note) => {
    event.preventDefault();
    event.stopPropagation();
    // console.log("downloadNote", note)
    this.props.deleteNote(note);
  };

  selectPage = page => {
    this.props.selectPage(this.note, page);
  };

  render() {
    const { offlineNote, offlinePage, handleOffline, openOffView } = this.props;
    let pages = [];
    if (offlinePage) {
      if (offlinePage.Pages) pages = offlinePage.Pages;
    }
    return (
      <Dialog fullScreen open={openOffView} onClose={handleOffline}>
        <IconButton onClick={handleOffline} style={{ width: 45, height: 45 }}>
          <Icons.CloseOutlined />
        </IconButton>
        {/* Note List */}
        <Typography variant="h6" style={{ marginLeft: 50 }}>
          {"Note List"}
        </Typography>
        <Divider />
        <List>
          {offlineNote.map((note, index) => {
            return (
              <ListItem key={index} button onClick={() => this.selectNote(note)}>
                <ListItemText
                  primary={"Section: " + note.Section + ", Owner: " + note.Owner + ", Note: " + note.Note}
                />
                <Button color="primary" onClick={e => this.downloadNote(e, note)}>
                  Download
                </Button>
                <Button color="primary" onClick={e => this.deleteNote(e, note)}>
                  Delete
                </Button>
              </ListItem>
            );
          })}
        </List>
        <Divider />
        
        {/* PageList */}
        <Typography variant="h6" style={{ marginLeft: 50 }}>
          {"Page List"}
        </Typography>
        <Divider />
        <List>
          {pages.map((page, index) => {
            return (
              <ListItem key={index} button onClick={() => this.selectPage(page)}>
                <ListItemText primary={page} />
              </ListItem>
            );
          })}
        </List>
      </Dialog>
    );
  }
}
