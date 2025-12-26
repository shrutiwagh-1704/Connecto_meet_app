import React from 'react'
import { useState,useEffect, useRef } from 'react';
import styles from "../styles/videoComponent.module.css"
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client"
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import SendIcon from '@mui/icons-material/Send';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';



const server_url = "http://localhost:8000";

// used in connectToSocketServer
var connections ={}

var peerConfigConnections={
    "iceServers":
    [
        {
            "urls":"stun:stun.l.google.com:19302"
        }
    ]
    
}

export default function Videomeet() {

    var socketRef=useRef();
    var socketIdRef=useRef();

    let localVideoRef = useRef();

    let [videoAvailable,setVideoAvailable]=useState(true);

    let [audioAvailable,setAudioAvailable] =useState(true);

    //To check video and audio are available or not to system setting true or false 
    let [video,setVideo]=useState([]);

    let[audio,setAudio] = useState();

    let [screen,setScreen] = useState();

    let [screenAvailable,setScreenAvailable] = useState();

    let [showModal,setModal] = useState(true);

    let [messages,setMessages] =useState([]);

    let [message,setMessage] = useState("");

    let [newMessages,setNewMessages] = useState(1);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username,setUsername] =useState("");

    const videoRef = useRef([]);

    //
    let [videos,setVideos] =useState([]);

    const getPermission =async()=>
    {
        try{
            const videoPermission=await navigator.mediaDevices.getUserMedia({video:true})

            if(videoPermission)
            {
                setVideoAvailable(true);
            }
            else{
                setVideoAvailable(false);
            }

            // if videoPermission return mediastream object means permission is given so it just setting that system has video and audio and permission is granted 

            const audioPermission=await navigator.mediaDevices.getUserMedia({audio:true})

            if(audioPermission)
            {
                setAudioAvailable(true);
            }
            else{
                setAudioAvailable(false);
            }
            
            // Yaha sirf feature check hota hai
            // ScreenAvailable state ka kaam kya?

            // Agar browser support karta hai → function exist karta hai
            // Agar support nahi karta → undefined hota hai
            if(navigator.mediaDevices.getDisplayMedia)
            {
                setScreenAvailable(true);

            }
            else{
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable)
            {
                // First call permission leta hai.
                // Later calls direct already-allowed stream deti hain.
                // Popup repeat nahi hota unless browser forced kare.

                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable,audio: audioAvailable})

                if(userMediaStream)
                {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current)
                    {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        }
        catch(err)  {
        console.log(err);
            
        }
    }

    let routeTo = useNavigate();

    // 2nd step call this connect function and remove that textfeild from ui and getmedia runs 
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let getUserMediaSuccess =(stream)=>
    {
        try{
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e){console.log(e)}

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections)
        {
            if(id == socketIdRef.current) continue;

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description)=>
            {
                connections[id].setLocalDescription(description)
                .then(()=>
                {
                    socketRef.current.emit("signal",id,JSON.stringify({"sdp":connections[id].localDescription}))
                })
                .catch(e=>console.log(e));
                
            })
        }

        // if user off his camera/mic then this onended event trigger
        stream.getTracks().forEach(track => track.onended = ()=>
        {
            setVideo(false);
            setAudio(false);
            try 
            {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            }
            catch (e){ console.log(e)}

            // TODO blackSilence
            // black and silence funtion declare bellow 
            let blackSilence = (...args) => new MediaStream([black(...args),silence()])
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;
          

            // again creating new offer with new empty video and silence changes
            // Offer dubara isliye bhej rahe hain kyunki media tracks change hue hain, 
            for(let id in connections)
            {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description)=>
                {
                    connections[id].setLocalDescription(description)
                    .then(()=>
                    {
                        socketRef.current.emit("signal",id,JSON.stringify({"sdp": connections[id].localDescription}))
                    })
                    .catch(e=>console.log(e))
                })
            }

        })
    }

    // creating fake audio in broswer but not enabling it means we are just filling the space inside the broswer not to display on screen just to stay connection alive 
    let silence = ()=>
    {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    // just creating black video screen to store in broswer to keep webrtc connection alive not to display on UI screen 
    let black = ({width = 640, height =480}={}) =>
    {
        let canvas = Object.assign(document.createElement("canvas"),{width,height});
        canvas.getContext('2d').fillRect(0,0,width,height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0],{enabled:false})
    }

    // after connect when user did on off to the video at thatime he wants to new stream so for that we use this getUserMedia function 
    let getUserMedia =()=>
    {
        if((video && videoAvailable) || (audio && audioAvailable))
        {
            navigator.mediaDevices.getUserMedia({ video: video, audio:audio})
            .then (getUserMediaSuccess) //TODO:getUserMediaSuccess
            .then((stream)=>{})         //window.localStream = stream;
            .catch((e) => console.log(e));
        }

        // setVideo==>false this runs 
        else
        {
            try
            {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            }
            catch(e)
            {
                console.log(e);
            }
        }
    }


    // on page load it will run first 
    useEffect(()=>
    {
        getPermission();
    },[])


    // 4rth step 
    useEffect(()=>
    {
        if(video !=undefined && audio !=undefined)
        {
            getUserMedia();
        }
    },[audio,video]);


    // first offer created then send to signaling server and from that we reach here and from here we are sending answer of offer of connecting 
    let gotMessageFromServer=(fromId,message)=>
    {
        var signal = JSON.parse(message);

        if(fromId !=socketIdRef.current)
        {
            if(signal.sdp)
            {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(()=>
                {
                    if(signal.sdp.type ==="offer")
                    {
                        connections[fromId].createAnswer().then((description)=>
                        {
                            connections[fromId].setLocalDescription(description).then(()=>
                            {
                                socketRef.current.emit("signal",fromId,JSON.stringify({"sdp": connections[fromId].localDescription}))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if(signal.ice)
            {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }

    }

    // TODO addMessage

    let addMessage=(data,sender,socketIdSender)=>
    {
        setMessages((prevMessages) =>
        [...prevMessages,
            {sender: sender , data: data}
        ]);

        if(socketIdSender !== socketIdRef.current)
        {
            setNewMessages((prevMessages) => prevMessages + 1)
        }
    }
     
    // 5th step
    let connectToSocketServer=()=>
    {
        // after clicked on connect we connected to connectToSocketServer of backend also
        // this line is for handshake request to backend to start communication 
        socketRef.current= io.connect(server_url,{secure:false})
        // socketRef.current.id on frontend equals socket.id on backend.
        console.log("Socket object: ", socketRef.current);

        socketRef.current.on('signal',gotMessageFromServer);

        // automatically trigers this 'connect' callback when handshake done means after connection successfully done 
        socketRef.current.on('connect',()=>
        {
            console.log("connection success..")
            socketRef.current.emit("join-call",window.location.href);
            // window.location.href ==> frontend url
            // http://localhost:5173/:url

            socketIdRef.current = socketRef.current.id

            socketRef.current.on("chat-message",addMessage);

            socketRef.current.on("user-left",(id)=>
            {
                setVideos((videos)=>
                    videos.filter((video)=>video.socketId!==id))
            })

            // listening from backend
            // socket.id =>id
            // clients => whole array of who are connected in current room 
            // e.g connections[http://localhost:5173/:url]==>[socket.id1,socket.id2]
            // if I joined then at backend i got the socketId so it is that id here and clients is array who are connected in same server
            socketRef.current.on("user-joined",(id,clients)=>
            {
                console.log("user-joined event fired!");
                console.log("My socketId:", id);
                console.log("All clients in room:", clients);
    
                clients.forEach((socketListId)=>
                {   
                    if(socketListId === socketIdRef.current) {
                        console.log("Skipping self connection:", socketListId);
                        return; // Skip this iteration
                    }
                    console.log("Setting up connection for:", socketListId);
                    // This creates a WebRTC connection object.(pipe)
                    // onicecandidate and onaddstream are event handlers attached on that SAME object.
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    // this find all possible paths and public ip and port from stun server and store inside the candidate
                    // and after that onicecandidate event trigger automatically 
                    // but this event triggers only after the offer is created 
                    connections[socketListId].onicecandidate =(event)=>
                    {
                        if(event.candidate != null)
                        {
                            console.log("ICE candidate found for:", socketListId);
                            socketRef.current.emit("signal",socketListId,JSON.stringify({'ice':event.candidate}))
                        }
                    }


                     //→  after exchanging ICE
                    // → after exchanging SDP
                    // → after both addStream done
                    // → after WebRTC finds a working path
                    connections[socketListId].onaddstream   = (event)=>
                    {
                        console.log("onaddstream FIRED for:", socketListId);
                        console.log("Stream received:", event.stream);
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if(videoExists)
                        {
                            console.log("Video exists?", videoExists);
                            setVideos(videos =>
                            {
                                const updateVideos = videos.map(video=>
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                );
                                videoRef.current = updateVideos;
                                return updateVideos;
                            })
                        }
                        else
                        {
                            console.log("Creating NEW video for:", socketListId);
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline:true
                            }

                            setVideos(videos => 
                            {   
                                // copy old array element and add this new one 
                                const updatedVideos =[...videos,newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                    };

                    
                    if(window.localStream !== undefined && window.localStream !== null)
                    {
                        connections[socketListId].addStream(window.localStream);
                    }
                    else{
                        // TODO BLACKSILENCE
                        // let blacksilence

                        let blackSilence = (...args) => new MediaStream([black(...args),silence()])
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                })

                if(id ==socketIdRef.current)
                {
                    for(let id2 in connections)
                    {
                        if(id2 == socketIdRef.current) continue

                        try
                        {
                            connections[id2].addStream(window.localStream)
                        }
                        catch(e)
                        {
                            console.log(e);
                        }
                        connections[id2].createOffer().then((description)=>
                            {
                                connections[id2].setLocalDescription(description)
                                .then(()=>
                                {
                                    socketRef.current.emit("signal",id2,JSON.stringify({"sdp":connections[id2].localDescription}))
                                })
                                .catch(e =>console.log(e));

                            })
                    }
                }
            })
        })
    }

    // 3rd step video and audio state changes first time runs only once as after connect button hits 
    // video and audio are user controls (their inputs )
    let getMedia =() =>
    {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    useEffect(() => {
    console.log(" Videos state changed:", videos);
    }, [videos]);

    let handleVideo = ()=>
    {
        setVideo(!video);

    }

    let handleAudio = ()=>
    {
        setAudio(!audio);
        
    }


    let handleScreen = () =>
    {
        // setScreen(!screen);
        if(screen)
    {
        
        window.localStream.getTracks().forEach(track => track.stop());
        setScreen(false);
        getUserMedia();  
    }
    else
    {
        setScreen(true);
    }
    }
    
    let getDisplayMediaSuccess = (stream) =>
    {
        try
        {
            window.localStream.getTracks().forEach(track => track.stop())

        }
        catch(e)
        {
            console.log(e)
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections)
        {
            if ( id == socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer()
            .then((description)=>
            {
            connections[id].setLocalDescription(description)
            .then(()=>
            {
                socketRef.current.emit("signal",id,JSON.stringify({"sdp": connections[id].localDescription}))
            })
            .catch(e =>console.log(e));
        
            })

        }

          stream.getTracks().forEach(track => track.onended = ()=>
        {
            setScreen(false);
            
            try 
            {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            }
            catch (e){ console.log(e)}

            // TODO blackSilence
            // black and silence funtion declare bellow 
            let blackSilence = (...args) => new MediaStream([black(...args),silence()])
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;
          

            getUserMedia();

        })
    }

    let getDisplayMedia =() =>
    {
        if(screen)
        {
            if(navigator.mediaDevices.getDisplayMedia)
            {
                navigator.mediaDevices.getDisplayMedia({video: true, audio:true})
                .then(getDisplayMediaSuccess)
                .then((stream) => {})
                .catch((e) => console.log(e))
            }
        }
    }

    // screen sharing useEffectsidjfie
    useEffect(()=>
    {
        if(screen != undefined)
        {
            getDisplayMedia();
        }
    },[screen])

    // chat handling 

    let sendMessage =()=>
    {
        socketRef.current.emit("chat-message",message,username);
        setMessage("");

    }

  let handleEndCall = () => {
  try {
    
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => track.stop());
      window.localStream = null;
    }

 
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }


    for (let id in connections) {
      connections[id].close();
      delete connections[id];
    }

   
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

  } catch (e) {
    console.log(e);
  }

  //Route change LAST
  routeTo("/home");
};


  return (

    <div>
        {askForUsername == true ? 
        <div>
            <TextField id="outlined-basic" label="Username" variant="outlined" value={username} onChange={(e)=>setUsername(e.target.value)} />
            <Button variant="contained" onClick={connect}>connect</Button>

            <div>
                <video ref={localVideoRef} autoPlay muted>

                </video>
            </div>
        </div>
        :<div className={styles.meetVideoContainer} >

            {showModal ? 
            <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>
                    <h1>chats </h1>

                    <div className={styles.chattingDisplay}>
                        {
                            messages.length > 0 ? messages.map((item,index) =>{
                                return (
                                    <div style={{marginBottom: "20px"}} key={index}>
                                        <p style={{fontWeight: "bold"}}>{item.sender}</p>
                                        <p>{item.data}</p>

                                    </div>
                                )
                            }): <></>
                        }

                    </div>

                    <div className={styles.chattingArea}>
                        <TextField value={message} onChange={e => setMessage(e.target.value)}
                        id="outlined-basic" label="Enter your chat" variant="outlined" />
                      
                        <IconButton onClick={sendMessage} style={{color:"blue"}}>
                            <SendIcon/>
                        </IconButton>
                    </div>
                </div>
                
            </div>: <></> }
            
            <div className={styles.buttonContainers}>
                <IconButton onClick={handleVideo} style={{color:"white"}}>
                    {(video == true) ? <VideocamIcon/>:<VideocamOffIcon/> }
                </IconButton>

                <IconButton onClick={handleEndCall} style={{color:"white"}}>
                    <CallEndIcon/>
                </IconButton>

                <IconButton onClick={handleAudio} style={{color:"white"}}>
                    {(audio == true) ? <MicIcon/>:<MicOffIcon/> }
                </IconButton>

                {screenAvailable == true ?
                <IconButton onClick={handleScreen} style={{color:"white" }}>
                    {screen === true ? <ScreenShareIcon/>:<StopScreenShareIcon/>}
                </IconButton>:<></>}

                <Badge badgeContent = {newMessages} max={999} color='secondary'>
                    <IconButton onClick={()=> setModal(!showModal)} style={{color:"white"}}>
                        <ChatIcon/>
                    </IconButton>
                </Badge>
              
            </div>
            <video className={styles.meetuserVideo} ref={localVideoRef} autoPlay muted>
                <h2>hello</h2>
            </video>

            <div className={styles.conferenceView}>
                {videos.map((video)=>
                (
                    <div key={video.socketId}>
                        
                        <video 
                        data-socket={video.socketId}
                        ref={ref =>{
                            if(ref && video.stream)
                            {
                                ref.srcObject = video.stream;
                            }
                        }}
                        autoPlay muted 
                        
                        onClick={(e) => {
                        const videoEl = e.target;

                        if (!document.fullscreenElement) 
                        {
                            // ENTER fullscreen
                            if (videoEl.requestFullscreen) {
                            videoEl.requestFullscreen();
                            }
                        } else 
                        {
                            // EXIT fullscreen
                            if (document.exitFullscreen) {
                            document.exitFullscreen();
                            }
                        }
                        }}
                        ></video>
                    </div>

                    
                ))}
            </div>
        </div>  
        
        
    }

     
        

        
      
    </div>
    
  )
}
