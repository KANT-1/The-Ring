let canvas = document.querySelector("#canvas");
canvas.style.display="none";
let context = canvas.getContext("2d");
let video = document.querySelector("#video");
var link = document.getElementById("link");

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
    video.srcObject = stream;
    video.play();
  });
}

document.getElementById("snap").addEventListener("click", () => {
  context.drawImage(video, 0, 0, 640, 480);
  var image = canvas.toDataURL("image/jpeg");
  downloadImage(image, "ID.jpeg");
})

function downloadImage(data, filename = "untitled.jpeg") {
  var a = document.createElement("a");
  a.href = data;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
}
