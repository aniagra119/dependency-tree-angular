import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as go from 'gojs';

const $ = go.GraphObject.make;

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
})
export class DiagramComponent {
  public diagram: go.Diagram = null;

  @Input()
  public model: go.Model;

  @Output()
  public nodeClicked = new EventEmitter();

  constructor() {}

  public ngAfterViewInit() {
    this.diagram = $(go.Diagram, 'myDiagramDiv', {
      allowCopy: false,
      allowDelete: false,
      //initialAutoScale: go.Diagram.Uniform,
      maxSelectionCount: 1, // users can select only one part at a time
      validCycle: go.Diagram.CycleDestinationTree, // make sure users can only create trees
      'clickCreatingTool.archetypeNodeData': {
        // allow double-click in background to create a new node
        name: '(new person)',
        title: '',
        comments: '',
      },
      'clickCreatingTool.insertPart': function (loc) {
        // override to scroll to the new node
        const node = go.ClickCreatingTool.prototype.insertPart.call(this, loc);
        if (node !== null) {
          this.diagram.select(node);
          this.diagram.commandHandler.scrollToPart(node);
          this.diagram.commandHandler.editTextBlock(node.findObject('NAMETB'));
        }
        return node;
      },
      layout: $(go.TreeLayout, {
        isOngoing: true,
        treeStyle: go.TreeLayout.StyleLastParents,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        // properties for most of the tree:
        angle: 90,
        layerSpacing: 35,
        // properties for the "last parents":
        alternateAngle: 90,
        alternateLayerSpacing: 35,
        alternateAlignment: go.TreeLayout.AlignmentBus,
        alternateNodeSpacing: 20,
      }),
      'undoManager.isEnabled': true,
    });

    // define the Node template
    this.diagram.nodeTemplate = $(
      go.Node,
      'Spot',
      // for sorting, have the Node.text be the data.name
      // end Horizontal Panel
      $(
        go.Panel,
        'Auto',
        new go.Binding('text', 'name'),
        // bind the Part.layerName to control the Node's layer depending on whether it isSelected
        new go.Binding('layerName', 'isSelected', function (sel) {
          return sel ? 'Foreground' : '';
        }).ofObject(),
        // define the node's outer shape
        $(
          go.Shape,
          'Rectangle',
          {
            name: 'SHAPE',
            fill: 'lightblue',
            stroke: null,
            // set the port properties:
            portId: '',
            fromLinkable: true,
            toLinkable: true,
            cursor: 'pointer',
          },
          new go.Binding('fill', '', function (node) {
            // modify the fill based on the tree depth level
            const levelColors = [
              '#AC193D',
              '#2672EC',
              '#8C0095',
              '#5133AB',
              '#008299',
              '#D24726',
              '#008A00',
              '#094AB2',
            ];
            let color = node.findObject('SHAPE').fill;
            const dia: go.Diagram = node.diagram;
            if (dia && dia.layout.network) {
              dia.layout.network.vertexes.each(function (v: go.TreeVertex) {
                if (v.node && v.node.key === node.data.key) {
                  const level: number = v.level % levelColors.length;
                  color = levelColors[level];
                }
              });
            }
            return color;
          }).ofObject()
        ),
        $(
          go.Panel,
          'Horizontal',
          $(
            go.Panel,
            'Table',
            {
              maxSize: new go.Size(150, 999),
              margin: new go.Margin(6, 10, 0, 3),
              defaultAlignment: go.Spot.Left,
            },
            $(go.RowColumnDefinition, { column: 2, width: 4 }),
            $(
              go.TextBlock,
              { font: '9pt  Segoe UI,sans-serif', stroke: 'white' }, // the name
              {
                row: 0,
                column: 0,
                columnSpan: 5,
                font: '12pt Segoe UI,sans-serif',
                editable: true,
                isMultiline: false,
                minSize: new go.Size(10, 16),
                alignment: go.Spot.Center,
              },
              new go.Binding('text', 'name').makeTwoWay()
            ),
            $(
              go.TextBlock,
              { font: '9pt  Segoe UI,sans-serif', stroke: 'white' },
              { row: 2, column: 0 },
              new go.Binding('text', 'id', function (v) {
                return 'ID: ' + v;
              })
            ),
            $(
              go.TextBlock,
              { font: '9pt  Segoe UI,sans-serif', stroke: 'white' },
              { name: 'Parent', row: 2, column: 3 },
              // we include a name so we can access this TextBlock when deleting Nodes/Links
              new go.Binding('text', 'parent', function (v) {
                return 'Parent: ' + v;
              })
            )
          ) // end Table Panel
        )
      ),
      $(
        'TreeExpanderButton',
        { alignment: go.Spot.Bottom, alignmentFocus: go.Spot.Top },
        { visible: true }
      )
    ); // end Node

    this.diagram.model = this.model;

    // when the selection changes, emit event to app-component updating the selected node
    this.diagram.addDiagramListener('ChangedSelection', (e) => {
      const node = this.diagram.selection.first();
      this.nodeClicked.emit(node);
    });
  }

  public reload(data) {
    this.diagram.model = data;
  }

  removeNodeParts($event) {
    this.diagram.startTransaction();
    this.diagram.removeParts($event.findTreeParts());
    this.diagram.commitTransaction();
  }
}
