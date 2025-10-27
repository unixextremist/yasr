class MinimalRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timer = null;
        
        this.init();
    }

    init() {
        this.getElements();
        this.bindEvents();
        this.loadTheme();
    }

    getElements() {
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.themeBtn = document.getElementById('theme-toggle');
        this.quality = document.getElementById('quality-select');
        this.bitrate = document.getElementById('bitrate-select');
        this.format = document.getElementById('format-select');
        this.status = document.getElementById('status');
        this.duration = document.getElementById('duration');
        this.size = document.getElementById('size');
        this.preview = document.getElementById('preview');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    async start() {
        try {
            this.status.textContent = 'requesting access';
            
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: this.getVideoConstraints(),
                audio: true
            });

            this.status.textContent = 'starting';
            
            const options = {
                mimeType: this.getMimeType(),
                videoBitsPerSecond: parseInt(this.bitrate.value) * 1000
            };

            this.mediaRecorder = new MediaRecorder(stream, options);
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => this.save();

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            
            this.updateUI();
            this.startTimer();
            
            this.status.textContent = 'recording';
            this.status.classList.add('recording');
            
        } catch (err) {
            this.status.textContent = 'error: ' + err.message;
            this.reset();
        }
    }

    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopTimer();
            this.status.textContent = 'processing';
        }
    }

    save() {
        const blob = new Blob(this.chunks, { type: this.getMimeType() });
        const url = URL.createObjectURL(blob);
        
        this.preview.src = url;
        this.preview.style.display = 'block';
        
        const mb = (blob.size / (1024 * 1024)).toFixed(1);
        this.size.textContent = mb + 'mb';
        
        this.download(blob);
        this.reset();
        this.status.textContent = 'saved';
    }

    download(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ext = this.format.value;
        const time = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        a.href = url;
        a.download = `rec-${time}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    getVideoConstraints() {
        const q = this.quality.value;
        const sizes = {
            high: { width: 1920, height: 1080 },
            medium: { width: 1280, height: 720 },
            low: { width: 854, height: 480 }
        };
        
        const size = sizes[q];
        return {
            width: size.width,
            height: size.height,
            frameRate: 30
        };
    }

    getMimeType() {
        const fmt = this.format.value;
        const types = {
            webm: 'video/webm;codecs=vp9,opus',
            mp4: 'video/mp4;codecs=h264,aac'
        };
        
        const type = types[fmt];
        return MediaRecorder.isTypeSupported(type) ? type : '';
    }

    updateUI() {
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.quality.disabled = true;
        this.bitrate.disabled = true;
        this.format.disabled = true;
    }

    reset() {
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.quality.disabled = false;
        this.bitrate.disabled = false;
        this.format.disabled = false;
        this.status.classList.remove('recording');
        this.duration.textContent = '00:00';
        this.size.textContent = '0mb';
        
        setTimeout(() => {
            if (!this.isRecording) this.status.textContent = 'ready';
        }, 2000);
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const mins = Math.floor(elapsed / 60000);
                const secs = Math.floor((elapsed % 60000) / 1000);
                this.duration.textContent = 
                    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const theme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('browser does not support screen recording');
        return;
    }

    if (!window.MediaRecorder) {
        alert('browser does not support media recording');
        return;
    }

    new MinimalRecorder();
});
