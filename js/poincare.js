requirejs(["Quaternion", "Input", "InputGroup"], function (Quaternion, Input, InputGroup) {
  $(function () {
      // integrates the lorentz equations and displays the result in a nice
      // flot graph with sliders.
      //
      // graphing: http://www.flotcharts.org/
      // sliders: http://jqueryui.com/
      // the maths: http://en.wikipedia.org/wiki/Lorenz_system

      // set up input boxes.
      




      var parmInputs = new InputGroup(
        {
          alpha0:
            {
              selector: "#alpha0",
              init: 0.995,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha1:
            {
              selector: "#alpha1",
              init: 0.04,
              min: 0,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha2:
            {
              selector: "#alpha2",
              init: 2.6775,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha3:
            {
              selector: "#alpha3",
              init: 0.765,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha4:
            {
              selector: "#alpha4",
              init: 0.2,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha5:
            {
              selector: "#alpha5",
              init: -0.0604,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha6:
            {
              selector: "#alpha6",
              init: -0.12,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          alpha7:
            {
              selector: "#alpha7",
              init: 0.01,
              min: -30,
              max: 30,
              slider: true,
              step: 0.001
            },
          beta:
            {
              selector: "#beta",
              init: 0,
              min: 0,
              max: 30,
              slider: true,
              step: 0.1
            },
          xi:
            {
              selector: "#xi",
              init: 0,
              min: 0,
              max: 30,
              slider: true,
              step: 0.1
            }
          ,
          dzeta:
            {
              selector: "#dzeta",
              init: 0,
              min: 0,
              max: 30,
              slider: true,
              step: 0.1
            },
          gamma:
            {
              selector: "#gamma",
              init: 1,
              min: 0,
              max: 30,
              slider: true,
              step: 0.1
            },
          dt:
            {
              selector: "#dt",
              init: 0.01,
              min: 0,
              max: 1,
              slider: true,
              step: 0.001
            },
          fromSeries:
            {
              selector: "#fromSeries",
              init: 30000,
              min: 0,
              max: 99999,
              slider: false
            },
          toSeries:
            {
              selector: "#toSeries",
              init: 32000,
              min: 1,
              max: 99999,
              slider: false
            },
          betStart:
            {
              selector: "#betStart",
              init: -100,
              min: -999,
              max: 99999,
              slider: false
            }

        });

      var zoomInput = new Input(
            {
              selector: "#zoom",
              init: 1,
              min: 0.1,
              max: 10,
              slider: true,
              step: 0.1
            });

      var updateInput = new Input(
            {
              selector: "#updateInterval",
              init: 50,
              min: 20,
              max: 1000,
              slider: false
            });
      // the array of raw data for all the plot series
      var data = [[]];
      var tempdata=[[]];
      // maxiumum number of points in the series.
      var totalPoints = 10000;
      // length of the axes on the graph.
      var axisLength = 2;
      // true when running.
      var running = true;
      // true during mouse drag.
      var dragging = false;
      // true if shift key down.
      var shifty = false;
      // drag origin
      var dragOrigin = null;
      // current drag Position relative to drag start.
      var dragPos = null;
      // total rotation quaternion
      var rotation = new Quaternion(1, 1, 0, 0);
      // rotation during this mouse drag
      var dragRot = new Quaternion(1, 1, 0, 0);
      // current total rotation (from both above)
      var curRot = new Quaternion(1, 1, 0, 0);
      // number of drag pixels per full rotation
      var dragScale = 200;
      // original x, y, z axes of the plot, in screen coords
      var origAxes = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 0, 0]
      ];
      // current x, y, z axes after rotation, in screen coords.
      // need to define twice or do a deep copy.
      var axes = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 0, 0]
        ];

      // parameter values to use in equation.
      var parmVals = {};
      // the number of data series.
      var numSeries = 1;

      // default values of parameters etc.
      var t = 0;
      getParms();
      //var dt = parmVals.dt;

      var initialPoints = [[parmVals.xi,parmVals.dzeta,parmVals.beta,parmVals.gamma]];
      var iters = 500; // number of iterations per refresh
      var updateInterval = 10; // time in ms per refresh
      var plot; // object to store the flot plot in.

      // scale of the plot (0-10);
      var scale = 1;
      var calcP=0;
      var trData=[];

      function addDataPoint(series) {

        // add a new data point to data[series].
        if (data[series] === undefined) {
          data[series] = [];
          tempdata[series] = [];
          trData=[];
        }
        var sData = tempdata[series];
        calcP+=1;
        var prev = sData.length !== 0 ? sData[sData.length - 1] : initialPoints[series];

      
        if (sData.length >= totalPoints ) {
          // remove first point.
          sData = sData.slice(1);
        }



        var next = [
          // integrate the lorenz equations.
          prev[0] + parmVals.dt * (prev[1]),//ξ
          prev[1] + parmVals.dt * ( 0 - prev[0] + parmVals.alpha1 * prev[1] + parmVals.alpha2* prev[1] * prev[1] - parmVals.alpha3*prev[1]*prev[1]*prev[1] - parmVals.alpha4 * prev[2]),//ζ
          prev[2] + parmVals.dt * (prev[3]),//β
          prev[3] + parmVals.dt * ( 0 - parmVals.alpha0 * prev[2] + parmVals.alpha5 * prev[0] + parmVals.alpha6 * prev[1] - parmVals.alpha7 * prev[3]),//γ
        ];
        



        sData.push(next);
        tempdata[series] = sData;

        if ((parmVals.fromSeries<=calcP) && (calcP<=parmVals.toSeries)) {
          if ((parmVals.betStart-0.002<=next[0]) && (next[0]<=parmVals.betStart+0.002)) {
            trData.push(next);
            data[series]=trData;
            document.getElementById("for_dots").insertAdjacentHTML("beforeEnd", "<tr><td>"+calcP+"</td><td>"+next[2]+"</td><td>"+next[3]+"</td></tr>");
          }
          
        } else if (calcP>parmVals.fromSeries) {
          if (running) {
            $("#pause").text("Play");
            running = false;
          }
        }
      }

      function addAllDataPoints() {

        for (var series = 0; series < numSeries; series++) {
          addDataPoint(series);
        }
      }

      function getSeries(series, axes) {
        // return a data series as an object with formatting parameters.
        return {
          color: "rgba(255, 128, 32, 0.5)",
          points: {
                        show: true,
                        radius: 0.3,
                        fill:false,
                        lineWidth: 0
                    },
          lines:{
            show: false
          },
          data: project(data[series], axes)
        }
      }

      function getAxisSeries(axis) {

        // get the series for the axes
        if (axis === 0) {
          var colour ="rgba(64,255,64,0.7)";
        }
        else if (axis === 2) {
          var colour ="rgba(64,64,255,0.7)";
          var lab= "β";
        }
        else if (axis === 3) {
          var colour ="rgba(255,64,64,0.7)";
          var lab= "ɣ";
        }
        return {
          color: colour,
          lines: {lineWidth: 2},
          label: lab,
          data: [
            [0, 0],
            [
              axisLength * axes[axis][0],
              axisLength * axes[axis][1]
            ]
          ]
        };
      }

      function getAllSeries(axes) {
        // get all data series plus the axes.
        var ret=[];
        for (var series = 0; series < numSeries; series++) {
          ret.push(getSeries(series, axes));
        }
        for (var axis = 0; axis < 4; axis++) {
          ret.push(getAxisSeries(axis));
        }
        return ret;
      }
/*
      function resetAxes() {
        // deep copy origAxes into axes.
        axes = [];
        for (var i = 0; i < 4; i++) {
            axes[i] = [];
          for (var j = 0; j < 4; j++) {
            axes[i][j] = origAxes[i][j];
          }
        }
        rotation.setValues(1, 1, 0, 0);
      }

      function rotatePoint(point, rot) {
        // rotate a 3D point by the quaternion curRot
        var conj = rot.conjugate();
        var pointQuat = new Quaternion().setPoint(point);
        var newPoint = rot.multiply(
            pointQuat.multiply(conj)).getPoint();
        return newPoint;
      }*/

      function projectPoint(point, axes) {
        // project a point using the rotated axes 'axes'
        var newPoint = [];
        for (var i = 0; i < 2; i++) {
          newPoint[i] = 0;
          for (var j = 0; j < 4; j++) {
            newPoint[i] += point[j] * axes[j][i];
          }
        }
        return newPoint;
      }

      function project(data, axes) {
        // return a 2D projected version of the data.
        var ret = [];
        var point;
        for (var i = 0; i < data.length; i++) {
          point = data[i];
          point = projectPoint(point, axes);
          ret.push(point);
        }
        return ret;
      }

      function makePlot() {
        // set up the plot
        var xscale = 5/scale;
        var yscale = xscale * $("#chart").height() / $("#chart").width();
        var options = {
            series: { shadowSize: 0 }, // drawing is faster without shadows
            yaxis: { min: -yscale, max: yscale },
            xaxis: { min: -xscale, max: xscale }
        };
        plot = $.plot($("#chart"), getAllSeries(axes), options);
      }

      function getParms() {
        // put the input values for the parameters into the equation.
        parmInputs.iterMembers(function(parm, input) {
          parmVals[parm] = input.getValue();
          });
      }
      // set up the buttons.
      $("#restart").click(function (evt) {
            data = [];
            tempdata=[];
            calcP=0;
            getParms();
            initialPoints[0]=[parmVals.xi,parmVals.dzeta,parmVals.beta,parmVals.gamma];
            $("#for_dots tr").remove(); 
            running = true;
            $("#pause").text("Pause");
          });

      $("#resetParms").click(function (evt) {
          parmInputs.iterMembers(function(parm, input) {
            input.reset();
            });
          });

      $("#pause").click(function (evt) {
          if (running) {
            $("#pause").text("Play");
            running = false;
          } else {
            $("#pause").text("Pause");
            running = true;
          }
        });

      //$("#resetAxes").click(resetAxes);

      // do mouse drag events.
      /*chartPos = $("#chart").position();

      $("#chart").mousedown(function (evt) {
          dragging = true;
          dragOrigin = null;
        });

      $("#chart").mouseup(function (evt) {
          dragging = false;
          rotation = curRot;
        });

      $("#chart").mousemove(function(evt) {
          if (!dragging) return;
          if (dragOrigin === null) {
            dragOrigin = {
              x: evt.pageX,
              y: evt.pageY
            };
          }
          dragPos = {
            x: evt.pageX - dragOrigin.x,
            y: evt.pageY - dragOrigin.y
          };
        });

      // detect shift key
      $(document).keydown(function(e) {
          if (e.which === 16) {
            shifty = true;
          }
        });

      $(document).keyup(function(e) {
          if (e.which === 16) {
            shifty = false;
          }
        });*/

      // get the initial parameter values.
      getParms();

      // get an initial data point.


      // make the initial plot.
      makePlot();

      function update() {
        // do the animation loop.
        if (zoomInput.getChanged()) {
          // the zoom value has changed.
          scale = zoomInput.getValue();
          zoomInput.setChanged(false);
          makePlot();
        }
        if (running) {
          // animation running.
          for (var i = 0; i < iters; i++) {
            // do iters iterations of the lorenz equations.
            addAllDataPoints();
          }
          parmInputs.setChanged(false);
        } else {
          // animation not running
          if (parmInputs.getChanged()) {
            // one of the parameter values has changed, so redraw from the start.
            parmInputs.setChanged(false);
            getParms();
            data = [];
            for (var i = 0; i < totalPoints; i++) {
              addAllDataPoints();
            }
          }
        }
        if (dragging && dragOrigin !== null) {
          // the mouse is being dragged.
          var angle, axis;
          if (shifty) {
            axis = [1, 1, 0, 0];
            angle = dragPos.x;
          } else {
            var dragDist = Math.sqrt(
              dragPos.x * dragPos.x +
              dragPos.y * dragPos.y
            );
            if (dragDist > 0) {
              axis = [dragPos.y / dragDist, dragPos.x / dragDist, 0];
            } else {
              axis = [1, 1, 0, 0];
            }
            angle = dragDist;
          }
          angle *= 2 * Math.PI / dragScale;
          dragRot.setAxisAngle(axis, angle);
          curRot = dragRot.multiply(rotation);
          /*for (var i = 0; i < 4; i++) {
            // rotate the axes.
            axes[i] = rotatePoint(origAxes[i], curRot);
          }*/
        }
        plot.setData(getAllSeries(axes));
        plot.draw();
        setTimeout(update, updateInput.getValue());
      }


      update();
    });
});
