const name = document.getElementById('userName').innerText;
//this joined the client with server 

const socket = io();
const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.getElementById("main");
const togle = document.querySelector('.togle');


socket.emit('new-user-joined',name);
       
//this function use for append all the messages inside current working user chat room
const append  = ( message , position ) =>{
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.append(messageElement);
}

const online =  new Set();
getData();
function getData(){
  socket.emit('get_data');
}
socket.on('send-data',data=>{
  data.forEach(e=>{
    online.add(e);
    uniclyAdd();
  });
})
online.add(name);
function uniclyAdd(){
  online.forEach(element=>{
    addActive(element);
  });
}


function addActive(Name){
  let targetDiv = document.getElementById(Name);
  if (targetDiv != null) {
    targetDiv.classList.add('activated');
  }
}
function removeActive(Name){
  let targetDiv = document.getElementById(Name);
  if (targetDiv != null) {
    targetDiv.classList.remove('activated');
  }
}

//first of we add self user online

socket.on('user-joined',(data)=>{
    append(`${data.user} joined the chat`,'right');
    var getValues = (data.TotelUser);
       (getValues).forEach(element => {
        online.add(element);
      });
      uniclyAdd();
});
socket.on('receive',data=>{
    append(`${data.name} : ${data.message}`,'right');
});

//this is run when user click on send button
form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const message = messageInput.value;
      append(`you : ${message}`,'left');
      socket.emit('send',message);
      messageInput.value = "";
});


socket.on('left',name=>{
     removeActive(name);
     append(`${name} left the meeting`,'left');
});

//---this function working for uploding picture
function changeProfilePic(event)
{
  let image = URL.createObjectURL(event.target.files[0]);
 // document.write(image);
 let label = document.getElementById('proFileLabel');
 var newImage = document.createElement('img');
 newImage.src = image;
 newImage.classList.add('prfilePic');
 label.innerHTML = "";
 label.appendChild(newImage);
}

//------------on mobile secreen show user-----
function GetOnline(){
  let sideBar = document.getElementById('leftsidebar');
  let main = document.getElementById('main');
  let InputCon = document.getElementById('send-container');
  let OnlineLI = document.getElementById('onlineLI');

  sideBar.style.display = "block";
  main.style.display = "none";
  InputCon.style.display = "none";
  OnlineLI.innerHTML = `<a class="nav-link" onclick="GetPage()">BackToPage</a>`;
}

function GetPage(){
  let sideBar = document.getElementById('leftsidebar');
  let main = document.getElementById('main');
  let InputCon = document.getElementById('send-container');
  let OnlineLI = document.getElementById('onlineLI');

  sideBar.style.display = "none";
  // sideBar.style.width = window.innerWidth;
  main.style.display = "block";
  InputCon.style.display = "block";
  OnlineLI.innerHTML = `<a class="nav-link" onclick="GetOnline()">Online</a>`;
}
