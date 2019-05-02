/*
Most files in FFmpeg are under the GNU Lesser General Public License version 2.1
or later (LGPL v2.1+). Read the file COPYING.LGPLv2.1 for details. Some other
files have MIT/X11/BSD-style licenses. In combination the LGPL v2.1+ applies to
FFmpeg.

The source code used to build this file can be obtained at https://github.com/bgrins/videoconverter.js,
and in zip form at https://github.com/bgrins/videoconverter.js/archive/master.zip
*/
importScripts('./ffmpeg-all-codecs.js');

var now = Date.now;

function print(text) {
  postMessage({
    'type' : 'stdout',
    'data' : text
  });
}

onmessage = function(event) {

  var message = event.data;

  if (message.type === "command") {

    var Module = {
      print: print,
      printErr: print,
      files: message.files || [],
      arguments: message.arguments || [],
      TOTAL_MEMORY: 268435456
      // Can play around with this option - must be a power of 2
      // TOTAL_MEMORY: 268435456
    };

    postMessage({
      'type' : 'start',
      'data' : Module.arguments.join(" ")
    });

    postMessage({
      'type' : 'stdout',
      'data' : 'Received command: ' +
                Module.arguments.join(" ") +
                ((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
    });

    var time = now();
    var result = ffmpeg_run(Module);

    var totalTime = now() - time;
    postMessage({
      'type' : 'stdout',
      'data' : 'Finished processing (took ' + totalTime + 'ms)'
    });

    postMessage({
      'type' : 'done',
      'data' : result,
      'time' : totalTime
    });
  }
};

postMessage({
  'type' : 'ready'
});
