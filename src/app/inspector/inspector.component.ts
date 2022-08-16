import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import * as go from 'gojs';
import { _ } from 'lodash';

import { DeleteDialogComponent } from './../admin/dialogs/delete-dialog/delete-dialog.component';
import { CreateDialogComponent } from '../admin/dialogs/create-dialog/create-dialog.component';

@Component({
  selector: 'app-inspector',
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.css'],
})
export class InspectorComponent {
  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;

  public _selectedNode: go.Node;
  public data = {
    name: null,
    parent: null,
    id: null,
    pathClicked: null,
    key: null,
    parentName: null,
    link: null,
    selected: true,
  };

  public popup = false;

  @Input()
  public model: go.Model;

  @Input()
  get selectedNode() {
    return this._selectedNode;
  }

  @Output() newItemEvent = new EventEmitter<string>();
  @Output() removeNode = new EventEmitter<go.Node>();

  constructor(public dialog: MatDialog) {}

  set selectedNode(node: go.Node) {
    if (node && node != null) {
      this._selectedNode = node;
      this.data = Object.assign(this._selectedNode.data);
      this.data.parentName =
        this._selectedNode.findTreeParentNode()?.data.name || '';
      console.log(this.data);
    } else {
      this._selectedNode = null;
    }
  }

  getPathClicked(value: string) {
    this._selectedNode.data.isClicked = true;
    this.data.pathClicked = true;
    this.newItemEvent.emit(value);
  }

  public ifFile() {
    if (
      this._selectedNode.data.id > 300000 &&
      this._selectedNode.data.parent < 300000 &&
      !this.data.pathClicked
    ) {
      return true;
    } else {
      return false;
    }
  }

  dialogConfigSetter(value: object) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = Object.assign(value);
    return dialogConfig;
  }

  sendDeleteMessage() {
    this.removeNode.emit(this._selectedNode);
  }

  openDialogDelete(value: object) {
    const dialogConfig = this.dialogConfigSetter(value);
    const dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.sendDeleteMessage();
        this._selectedNode = null;
      }
    });
  }
}
