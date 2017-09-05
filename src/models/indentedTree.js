//Adapted from nv.models.indentedTree from NVD3.js

nv.models.indentedTree = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0} //TODO: implement, maybe as margin on the containing div
    , width = "960px"
    , height = 500
    , color = nv.utils.defaultColor()
    , id = Math.floor(Math.random() * 10000)
    , header = true
    , noData = "No Data Available."
    , childIndent = 10
    , columns = [{key:'key', label: 'Name', type:'text'}] //TODO: consider functions like chart.addColumn, chart.removeColumn, instead of a block like this
    , tableClass = null
    , iconOpen = 'images/grey-plus.png' //TODO: consider removing this and replacing with a '+' or '-' unless user defines images
    , iconClose = 'images/grey-minus.png'
    , dispatch = d3.dispatch('elementClick', 'elementDblclick', 'elementMouseover', 'elementMouseout')
    ;

  //============================================================

  function chart(selection) {
    selection.each(function(data) {
      var i = 0,
          depth = 1;

      var tree = d3.layout.tree()
          .children(function(d) { return d.expanded ? d.values:null; })
          .size([height, childIndent]); //Not sure if this is needed now that the result is HTML

      chart.update = function() { selection.transition().call(chart) };
      chart.container = this;


      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.
      if (!data[0]) data[0] = {key: noData};

      //------------------------------------------------------------


      var nodes = tree.nodes(data[0]);


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      selection.style("width", width);
      var wrap = d3.select(this).selectAll('div').data([[nodes]]);
      var wrapEnter = wrap.enter().append('div')
        .attr('class', 'nvd3 nv-wrap nv-indentedtree');
      var tableEnter = wrapEnter.append('table');
      var table = wrap.select('table')
        .attr('width', '100%')
        .attr('class', tableClass);

      //------------------------------------------------------------


      if (header) {
        var thead = tableEnter.append('thead');

        var theadRow1 = thead.append('tr');

        columns.forEach(function(column) {
          theadRow1
            .append('th')
              .attr('width', column.width ? column.width : '10%')
              .style('text-align', column.type == 'numeric' ? 'right' : 'left')
            .append('span')
              .text(column.label);
        });
      }


      var tbody = table.selectAll('tbody')
                    .data(function(d) {return d });
      tbody.enter().append('tbody');



      //compute max generations
      depth = d3.max(nodes, function(node) { return node.depth });
      tree.size([height, depth * childIndent]); //TODO: see if this is necessary at all


      // Update the nodes…
      var node = tbody.selectAll('tr')
          .data(function(d) { return d }, function(d) { return d.id || (d.id == ++i)});
          //.style('display', 'table-row'); //TODO: see if this does anything

      node.exit().remove();

      node.select('img.nv-treeicon')
          .attr('src', icon)
          .classed('folded', folded);

      var nodeEnter = node.enter().append('tr');

      columns.forEach(function(column, index) {

        var nodeName = nodeEnter.append('td')
            .style('padding-left', function(d) { return (index ? 0 : (d.depth-1) * childIndent +7 + (icon(d) ? 0 : 7)) + 'px' }, 'important') //TODO: check why I did the ternary here

        if(index==0){
          nodeName.append("div")
              .style("width", function(d){
                return (d.depth ? 10 : 0) + "px";
              })
              .style("height", 13 + "px")
              .style("display", "inline-block")
              .style("overflow", "auto")
            .append("svg")
              .style("width", function(d){
                return (d.depth ? 10 : 0) + "px";
              })
              .style("height",13)
            .append("polyline")
              .attr("class", "treeLine")
              .attr("points", "0.5,0.5 0.5,7.5 30.5,7.5")
              .style("fill", "none")
              .style("stroke", "#444444")
              // .append("path")
        }

        nodeName.style('text-align', function(d){
          if(column.textAlign){
            return column.textAlign;
          }
          else{
            switch(column.type){
              case "numeric": return "right";
              case "checkbox": return "center";
              default: return "left";
            }
          }
        });

        if(column.type=="blank"){
          return;
        }

        if (index == 0) {
          nodeName.append('img')
              .classed('nv-treeicon', true)
              .classed('nv-folded', folded)
              .attr('src', icon)
              .style('width', '14px')
              .style('height', '14px')
              .style('padding', '0px 1px 2px 0px')
              .style('display', function(d) { return icon(d) ? 'inline-block' : 'none'; })
              .on('click', click);
        }

        // add content
        if(column.type=="checkbox"){
          nodeName.append("label")
              .attr("class", "checkbox")
//              .style("padding-left", "21px")
            .append("input")
              .attr("type", "checkbox")
              .property("checked", function(d){return d[column.key]==true?true:false})
              .on("click", function(d){ toggle(d, column.key) })
        }
        else{
          nodeName.append('span')
            .attr('class', d3.functor(column.classes) )
            .text(function(d) { return column.format ? column.format(d[column.key]) :
                                        (d[column.key] || '-') });
        }

        // if(column.showCount)
        //   nodeName.append('span')
        //       .attr('class', 'nv-childrenCount')
        //       .text(function(d) {
        //         return ((d.values && d.values.length) || (d._values && d._values.length)) ?
        //             '(' + ((d.values && d.values.length) || (d._values && d._values.length)) + ')'
        //           : ''
        //       });

        // add custom click handler
        if (column.click)
          nodeName.select('span').on('click', column.click);

      });


      node
        .order()
        .on('click', function(d) {
          dispatch.elementClick({
            row: this, //TODO: decide whether or not this should be consistent with scatter/line events or should be an html link (a href)
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('dblclick', function(d) {
          dispatch.elementDblclick({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('mouseover', function(d) {
          dispatch.elementMouseover({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('mouseout', function(d) {
          dispatch.elementMouseout({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        });


      function toggle(d, columnKey){
        d3.event.stopPropagation();

        if(d[columnKey]){
          d[columnKey] = false;
        }
        else{
          d[columnKey] = true;
        }

        if(!hasChildren(d)) {
          //download file
          //window.location.href = d.url;
          return true;
        }
        else{
          if(d[columnKey]){
              d.values && d.values.forEach(function(node){
                setCheck(node, columnKey, true);
              });
          }
          else{
              d.values && d.values.forEach(function(node){
                setCheck(node, columnKey, false);
              });
          }
        }
        chart.update();
      }

      function setCheck(d, columnKey, checked){
        d[columnKey] = checked;
        d.values && d.values.forEach(function(node){
          setCheck(node, columnKey, checked);
        });
      }

      // Toggle children on click.
      function click(d, _, unshift) {
        d3.event.stopPropagation();

        if(d3.event.shiftKey && !unshift) {
          //If you shift-click, it'll toggle fold all the children, instead of itself
          d3.event.shiftKey = false;
          d.values && d.values.forEach(function(node){
            if (node.values){
              click(node, 0, true);
            }
          });
          return true;
        }
        if(!hasChildren(d)) {
          //download file
          //window.location.href = d.url;
          return true;
        }

        if(d.expanded){
          d.expanded = false;
        }
        else{
          d.expanded = true;
        }
        chart.update();
      }


      function icon(d) {
        if(hasChildren(d)){
          if(folded(d)){
            return iconOpen;
          }
          else{
            return iconClose;
          }
        }
        else{
          return '';
        }
      }

      function folded(d) {
        return !d.expanded;
      }

      function hasChildren(d) {
        return d.values && d.values.length>0;
      }


    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    scatter.color(color);
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.header = function(_) {
    if (!arguments.length) return header;
    header = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  chart.columns = function(_) {
    if (!arguments.length) return columns;
    columns = _;
    return chart;
  };

  chart.tableClass = function(_) {
    if (!arguments.length) return tableClass;
    tableClass = _;
    return chart;
  };

  chart.iconOpen = function(_){
     if (!arguments.length) return iconOpen;
    iconOpen = _;
    return chart;
  }

  chart.iconClose = function(_){
     if (!arguments.length) return iconClose;
    iconClose = _;
    return chart;
  }

  chart.childIndent = function(_){
     if (!arguments.length) return childIndent;
    childIndent = _;
    return chart;
  }

  //============================================================


  return chart;
}
