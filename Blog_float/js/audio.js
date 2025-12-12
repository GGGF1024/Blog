// 获取音频播放器对象
var audio = document.getElementById('audioTag');

// 歌曲名
var musicTitle = document.getElementById('music-title');
// 歌曲作者
var author = document.getElementById('author-name');

// 进度条
var progress = document.getElementById('progress');
// 总进度条
var progressTotal = document.getElementById('progress-total');

// 已进行时长
var playedTime = document.getElementById('playedTime');
// 总时长
var audioTime = document.getElementById('audioTime');

// 播放模式按钮
var mode = document.getElementById('playMode');
// 上一首
var skipForward = document.getElementById('skipForward');
// 暂停按钮
var pause = document.getElementById('playPause');
// 下一首
var skipBackward = document.getElementById('skipBackward');
// 倍速
var speed = document.getElementById('speed');

// 音乐列表面板
var musicList = document.getElementById('musicListBox');

// 暂停/播放功能实现
pause.onclick = function (e) {
    if (audio.paused) {
        audio.play();
        pause.classList.remove('icon-play');
        pause.classList.add('icon-pause');
    } else {
        audio.pause();
        pause.classList.remove('icon-pause');
        pause.classList.add('icon-play');
    }
}

// 更新进度条
audio.addEventListener('timeupdate', updateProgress); // 监听音频播放时间并更新进度条
function updateProgress() {
    var value = audio.currentTime / audio.duration;
    progress.style.width = value * 100 + '%';
    playedTime.innerText = transTime(audio.currentTime);
}

//音频播放时间换算
function transTime(value) {
    var time = "";
    var h = parseInt(value / 3600);
    value %= 3600;
    var m = parseInt(value / 60);
    var s = parseInt(value % 60);
    if (h > 0) {
        time = formatTime(h + ":" + m + ":" + s);
    } else {
        time = formatTime(m + ":" + s);
    }

    return time;
}

// 格式化时间显示，补零对齐
function formatTime(value) {
    var time = "";
    var s = value.split(':');
    var i = 0;
    for (; i < s.length - 1; i++) {
        time += s[i].length == 1 ? ("0" + s[i]) : s[i];
        time += ":";
    }
    time += s[i].length == 1 ? ("0" + s[i]) : s[i];

    return time;
}

// 点击进度条跳到指定点播放
progressTotal.addEventListener('mousedown', function (event) {
    // 只有音乐开始播放后才可以调节，已经播放过但暂停了的也可以
    if (!audio.paused || audio.currentTime != 0) {
        var pgsWidth = parseFloat(window.getComputedStyle(progressTotal, null).width.replace('px', ''));
        var rate = event.offsetX / pgsWidth;
        audio.currentTime = audio.duration * rate;
        updateProgress(audio);
    }
});

// 存储当前播放的音乐序号
var musicId = 0;

// 后台音乐列表
let musicData = [
    ['告白气球', '周杰伦'],
    ['夜曲', '周杰伦'],
    ['夜的第七章', '周杰伦'],
    ['Love Story', 'Taylor Swift'],
    ["i don't wanna see u anymore 2019", 'NINEONE'],
    ['爱人错过', '告五人'],
    ['侧脸', '于果'],
    ['Shape of You', 'Ed Sheeran'],
    ['虚拟', '陈粒'],
    ['也罢', '鲁向卉'],
    ['Dance Monkey', 'Tones and Ihires'],
    ['FRIDAY9', '可可爱kkluv'],
    ['Old Town Road', 'Lil Nas X'],
    ['下个，路口，见', '李宇春']];

// 初始化音乐
function initMusic() {
    audio.src = "audio/music" + musicId.toString() + ".mp3";
    audio.load();
    audio.ondurationchange = function () {
        musicTitle.innerText = musicData[musicId][0];
        author.innerText = musicData[musicId][1];
        audioTime.innerText = transTime(audio.duration);
        // 重置进度条
        audio.currentTime = 0;
        updateProgress();
        refreshRotate();
    }
}
initMusic();

// 初始化并播放
function initAndPlay() {
    initMusic();
    pause.classList.remove('icon-play');
    pause.classList.add('icon-pause');
    audio.play();
    rotateRecord();
}

// 播放模式设置
var modeId = 3; // 1-顺序播放 2-循环播放 3-随机播放
mode.style.backgroundImage = "url('img/mode" + modeId.toString() + ".png')";
mode.addEventListener('click', function (event) {
    modeId = modeId + 1;
    if (modeId > 3) {
        modeId = 1;
    }
    mode.style.backgroundImage = "url('img/mode" + modeId.toString() + ".png')";
});

audio.onended = function () {
    if (modeId == 2) {
        // 跳转至下一首歌
        musicId = (musicId + 1) % 14;
    }
    else if (modeId == 3) {
        // 随机生成下一首歌的序号 - 优化避免连续播放同一首歌
        var oldId = musicId;
        var attempts = 0;
        while (attempts < 10) { // 最多尝试10次
            musicId = Math.floor(Math.random() * 14); // 0-13
            if (musicId != oldId) { 
                break; 
            }
            attempts++;
        }
        // 如果10次都失败，就播下一首
        if (attempts >= 10) {
            musicId = (oldId + 1) % 14;
        }
    }
    initAndPlay();
}


// 上一首
skipForward.addEventListener('click', function (event) {
    musicId = musicId - 1;
    if (musicId < 0) {
        musicId = 13;
    }
    initAndPlay();
});

// 下一首
skipBackward.addEventListener('click', function (event) {
    musicId = musicId + 1;
    if (musicId > 13) {
        musicId = 0;
    }
    initAndPlay();
});

// 倍速功能
speed.addEventListener('click', function (event) {
    var speedText = speed.innerText;
    if (speedText == "1.0X") {
        speed.innerText = "1.5X";
        audio.playbackRate = 1.5;
    }
    else if (speedText == "1.5X") {
        speed.innerText = "2.0X";
        audio.playbackRate = 2.0;
    }
    else if (speedText == "2.0X") {
        speed.innerText = "0.5X";
        audio.playbackRate = 0.5;
    }
    else if (speedText == "0.5X") {
        speed.innerText = "1.0X";
        audio.playbackRate = 1.0;
    }
});

// 捆绑列表音乐
document.getElementById("music0").addEventListener('click', function (event) {
    musicId = 0;
    initAndPlay();
});
document.getElementById("music1").addEventListener('click', function (event) {
    musicId = 1;
    initAndPlay();
});
document.getElementById("music2").addEventListener('click', function (event) {
    musicId = 2;
    initAndPlay();
});
document.getElementById("music3").addEventListener('click', function (event) {
    musicId = 3;
    initAndPlay();
});
document.getElementById("music4").addEventListener('click', function (event) {
    musicId = 4;
    initAndPlay();
});
document.getElementById("music5").addEventListener('click', function (event) {
    musicId = 5;
    initAndPlay();
});
document.getElementById("music6").addEventListener('click', function (event) {
    musicId = 6;
    initAndPlay();
});
document.getElementById("music7").addEventListener('click', function (event) {
    musicId = 7;
    initAndPlay();
});
document.getElementById("music8").addEventListener('click', function (event) {
    musicId = 8;
    initAndPlay();
});
document.getElementById("music9").addEventListener('click', function (event) {
    musicId = 9;
    initAndPlay();
});
document.getElementById("music10").addEventListener('click', function (event) {
    musicId = 10;
    initAndPlay();
});
document.getElementById("music11").addEventListener('click', function (event) {
    musicId = 11;
    initAndPlay();
});
document.getElementById("music12").addEventListener('click', function (event) {
    musicId = 12;
    initAndPlay();
});
document.getElementById("music13").addEventListener('click', function (event) {
    musicId = 13;
    initAndPlay();
});
