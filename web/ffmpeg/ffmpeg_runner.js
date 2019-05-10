/*
Most files in FFmpeg are under the GNU Lesser General Public License version 2.1
or later (LGPL v2.1+). Read the file COPYING.LGPLv2.1 for details. Some other
files have MIT/X11/BSD-style licenses. In combination the LGPL v2.1+ applies to
FFmpeg.

The source code used to build this file can be obtained at https://github.com/bgrins/videoconverter.js,
and in zip form at https://github.com/bgrins/videoconverter.js/archive/master.zip
*/

class FFMPEG {
	constructor(fileDownloadEle) {
		this.worker = null;
		this.videoData = null;
		this.fileEle = fileDownloadEle;
		this.running = false;
		this.isWorkerLoaded = false;
		this.fileName = null;
		this.progressCallback = null;
	}

	isReady(){
		return !this.running && this.isWorkerLoaded && this.videoData;
	}

	parseArguments(text) {
		text = text.replace(/\s+/g, ' ');
		let args = [];
		// Allow double quotes to not split args.
		text.split('"').forEach(function(t, i) {
			t = t.trim();
			if ((i % 2) === 1) {
				args.push(t);
			} else {
				args = args.concat(t.split(" "));
			}
		});
		return args;
	}

	runCommand(text) {
		if(this.isReady()) {
			this.running = true;
			let args = this.parseArguments(text);
			console.log(args);
			this.worker.postMessage({
				type: "command",
				arguments: args,
				files: [{
					"name": this.fileName,
					"data": this.videoData
				}]
			});
			this.videoData = null;
		}else{
			alert("Not ready to run FFmpeg - is it already running or loading? Try refreshing.");
		}
	}

	static getDownloadLink(fileData, fileName) {
		let a = document.createElement('a');
		let fn = decodeURI(fileName);
		a.download = fn;
		let blob = new Blob([fileData]);
		a.href = window.URL.createObjectURL(blob);
		a.textContent = 'Click here to download [' + fn + "]!";
		return a;
	}

	initWorker(run_command=false) {
		this.worker = new Worker("./ffmpeg/worker-asm.js");
		this.worker.onmessage = (event) => {
			let message = event.data;
			if (message.type === "ready") {
				this.isWorkerLoaded = true;
				if(run_command){
					this.runCommand(run_command);
				}
			} else if (message.type === "stdout") {
				if(this.progressCallback){
					let match = message.data.match(/time=(.+?)\s/i);
					if(match){
						let hms = match[1];
						let a = hms.split(':'); // split it at the colons
						let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
						this.progressCallback({
							'time': seconds
						});
					}
				}
			} else if (message.type === "start") {
				this.fileEle.innerHTML = '';
				if(this.progressCallback){
					this.progressCallback({
						'time': 0
					});
				}
			} else if (message.type === "done") {
				this.running = false;
				let buffers = message.data;
				buffers.forEach((file) => {
					this.fileEle.appendChild(FFMPEG.getDownloadLink(file.data, file.name));
				});
				if(this.progressCallback){
					this.progressCallback({
						'done': true
					});
				}
			}
			if(location.hash.includes("debug")) {
				console.debug(event.data);
			}
		};
	}

	loadFile(file, callback){
		let reader = new FileReader();
		this.fileName = file.name;
		reader.onload = (e) => {
			this.videoData = new Uint8Array(e.target.result);
			console.log("Loaded file.");
			callback();
		};
		reader.readAsArrayBuffer(file);
	}

	start(file, command, progress_callback=null){
		this.progressCallback = progress_callback;
		this.loadFile(file, () => {
			if (!this.isWorkerLoaded) {
				this.initWorker(command);
			} else {
				this.runCommand(command);
			}
		});
	}
}

