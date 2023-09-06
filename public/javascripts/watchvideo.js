var play = document.querySelector("#play")
var paused = document.querySelector("#paused")
var unmutedvideo = document.querySelector("#unmuted")
var mutedvideo = document.querySelector("#muted")
var videos = document.getElementById("myVideo");


function playvideo(){
    play.addEventListener("click",function(){
    videos.play();
    play.style.display = "none";
    paused.style.display = "initial";
})
}

function pauseVideo(){
    paused.addEventListener("click",function(){ 
    videos.pause();
    paused.style.display = "none"
    play.style.display = "initial"
})
}

function unmutedVideo(){
    mutedvideo.addEventListener("click",function(){ 
    videos.muted = false;
    mutedvideo.style.display = "none"
    unmutedvideo.style.display = "initial"
})
}

function mutedVideo(){
    unmutedvideo.addEventListener("click",function(){ 
    videos.muted = true;
    unmutedvideo.style.display = "none"
    mutedvideo.style.display = "initial"
})
}



  var  video = document.querySelector("#video")
  var fullscreenbtn = document.querySelector('#fullscreenbtn')
  var exitfullscreenbtn = document.querySelector('#exitfullscreenbtn')

function fullscreen(){
    fullscreenbtn.addEventListener("click", function(){
        video.style.position = "absolute";
        video.style.top = 0;
        video.style.left = 0;
        video.style.width = "100%";
        video.style.marginLeft = "0vh";
        video.style.marginTop = "0vh";
        video.style.height = "100%";
        fullscreenbtn.style.display = "none";
        exitfullscreenbtn.style.display = "initial";
    })
}



function exitfullscreen(){
     
    exitfullscreenbtn.addEventListener("click", function(){
        video.style.position = "absolute";
        video.style.top = "";
        video.style.left = "10%";
        video.style.width = "60%";
        video.style.height = "80vh";
        fullscreenbtn.style.display = "initial";
        exitfullscreenbtn.style.display = "none";
    })
}

// exitfullscreen()
// fullscreen()
// playvideo()
// pauseVideo()
// unmutedVideo()
// mutedVideo()


