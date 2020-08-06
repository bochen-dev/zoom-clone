const socket = io('/');

const myPeer = new Peer(undefined, {
  host: 'localhost',
  port: '3001',
  path: '/'
});

const videoGrid = document.getElementById('video-grid');

const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: {
      facingMode: 'user',
    },
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', (call) => {
      call.answer(stream);
      const videoEl = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        addVideoStream(videoEl, userVideoStream);
      });
    });

    socket.on('user-connected', (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on('user-disconnected', (userId) => {
  if (peers[userId]) {
    peers[userId].close();

    console.log('peers', peers)
  }
});

myPeer.on('open', (userId) => {
  socket.emit('join-room', ROOM_ID, userId);
});

function addVideoStream(videoEl, stream) {
  videoEl.srcObject = stream;
  videoEl.addEventListener('loadedmetadata', () => {
    videoEl.play();
  });
  videoGrid.append(videoEl);
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const videoEl = document.createElement('video');

  call.on('stream', (userVideoStream) => {
    addVideoStream(videoEl, userVideoStream);
  });

  call.on('close', () => {
    videoEl.remove();
  });

  peers[userId] = call;
}
