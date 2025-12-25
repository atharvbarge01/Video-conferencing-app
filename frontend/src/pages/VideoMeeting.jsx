
import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, Container, Card, Typography, Grid } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ChatIcon from '@mui/icons-material/Chat';
import { useParams, useNavigate } from 'react-router-dom';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

const server_url = "http://localhost:3000";

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeeting() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);


    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])


    const { url } = useParams();


    useEffect(() => {
        getPermissions();
    }, [])

    let getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setVideoAvailable(true);
            setAudioAvailable(true);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.log(error);
            try {
                // Retry with only video if audio fails, or only audio if video fails could optionally go here
                // For now, if it fails, valid to just log or set availability to false
                setVideoAvailable(false);
                setAudioAvailable(false);
            } catch (err) {
                console.log(err)
            }
        }
    }


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('connect', () => {

            socketRef.current.emit('join-call', url)

        })

        socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: sender, data: data }
            ]);
            socketIdRef.current = socketIdSender;
        })

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach((client) => {

                connections[client] = new RTCPeerConnection(peerConfigConnections);

                connections[client].onicecandidate = (event) => {
                    if (event.candidate !== null) {
                        socketRef.current.emit("signal", client, JSON.stringify({ 'ice': event.candidate }));

                    }
                }

                connections[client].onaddstream = (event) => {
                    let videoExists = videoRef.current.find(video => video.socketId === client);

                    if (videoExists) {
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === client ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    } else {
                        let newVideo = {
                            socketId: client,
                            stream: event.stream,
                            autoPlay: true,
                            playsinline: true
                        };

                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[client].addStream(window.localStream);
                } else {

                    // let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    // window.localStream = blackSilence();
                    // connections[client].addStream(window.localStream);

                }

            })

            if (id === socketRef.current.id) {
                clients.forEach((client) => {

                    connections[client].createOffer().then((description) => {
                        connections[client].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", client, JSON.stringify({ "sdp": connections[client].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                })
            }

        })


        socketRef.current.on("signal", (id, message) => {
            let signal = JSON.parse(message);

            if (id !== socketRef.current.id) {
                if (signal.sdp) {

                    let media = new RTCSessionDescription(signal.sdp);

                    connections[id].setRemoteDescription(media).then(() => {
                        if (signal.sdp.type === "offer") {
                            connections[id].createAnswer().then((description) => {
                                connections[id].setLocalDescription(description).then(() => {
                                    socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                                })
                            })
                        }
                    })
                }

                if (signal.ice) {
                    connections[id].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
                }
            }
        })
    }



    let handleScreen = () => {
        if (!screen) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then((stream) => {
                    setScreen(true);
                    let videoTrack = stream.getVideoTracks()[0];
                    videoTrack.onended = () => {
                        setScreen(false);
                        getUserWebcam();
                    };

                    if (window.localStream) {
                        try {
                            window.localStream.getVideoTracks()[0].stop();
                            window.localStream.removeTrack(window.localStream.getVideoTracks()[0]);
                            window.localStream.addTrack(videoTrack);
                            localVideoRef.current.srcObject = window.localStream;
                        } catch (e) { console.log(e) }
                    }

                    Object.keys(connections).forEach((key) => {
                        try {
                            const sender = connections[key].getSenders().find(s => s.track.kind === 'video');
                            if (sender) {
                                sender.replaceTrack(videoTrack);
                            }
                        } catch (e) { console.log(e) }
                    })
                })
                .catch((e) => console.log(e))
        } else {
            setScreen(false);
            getUserWebcam();
        }
    }

    let getUserWebcam = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                let videoTrack = stream.getVideoTracks()[0];

                if (window.localStream) {
                    window.localStream.getVideoTracks()[0].stop();
                    window.localStream.removeTrack(window.localStream.getVideoTracks()[0]);
                    window.localStream.addTrack(videoTrack);
                    localVideoRef.current.srcObject = window.localStream;
                }

                Object.keys(connections).forEach((key) => {
                    try {
                        const sender = connections[key].getSenders().find(s => s.track.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    } catch (e) { console.log(e) }
                })
            })
            .catch((e) => console.log(e))
    }


    let join = () => {

        setAskForUsername(false);
        connectToSocketServer();

    }


    let handleVideo = () => {
        setVideoAvailable(!videoAvailable);
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = !videoAvailable;
        }
    }

    let handleAudio = () => {
        setAudioAvailable(!audioAvailable);
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = !audioAvailable;
        }
    }


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudioAvailable(audioAvailable);
        connectToSocketServer();
    }


    const sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");

    }

    let handleMessage = (e) => {
        setMessage(e.target.value);
    }



    return (
        <div>

            {askForUsername === true ?

                <div className="landingPageContainer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Card style={{ padding: '40px', backgroundColor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
                        <Typography variant="h4" gutterBottom style={{ fontWeight: 'bold' }}>Enter Lobby</Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{ style: { color: 'white' } }}
                            InputLabelProps={{ style: { color: '#aaa' } }}
                            style={{ marginBottom: '20px' }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#555' },
                                    '&:hover fieldset': { borderColor: '#888' },
                                    '&.Mui-focused fieldset': { borderColor: '#FF9839' },
                                }
                            }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={join}
                            disabled={!username}
                            style={{ backgroundColor: '#FF9839', color: 'black', fontWeight: 'bold' }}
                        >
                            Connect
                        </Button>

                        <div style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                            <video ref={localVideoRef} autoPlay muted style={{ width: '100%', borderRadius: '10px' }}></video>
                        </div>
                    </Card>
                </div> :


                <div className='meetVideoContainer'>

                    <div className='chatRoom' style={{ display: showModal ? 'block' : 'none', backgroundColor: '#1E1E1E', borderRight: '1px solid #333', color: 'white' }}>
                        <div className='chatContainer' style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h5" style={{ marginBottom: '20px' }}>Chat</Typography>

                            <div className='chattingDisplay' style={{ flex: 1, overflowY: 'auto' }}>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {messages.map((item, index) => {
                                        return (
                                            <li key={index} style={{ marginBottom: '10px' }}>
                                                <Typography variant="body2"><strong>{item.sender}</strong>: {item.data}</Typography>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>

                            <div className='chattingArea' style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <TextField
                                    fullWidth
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    size="small"
                                    InputProps={{ style: { color: 'white' } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#555' },
                                            '&:hover fieldset': { borderColor: '#888' },
                                            '&.Mui-focused fieldset': { borderColor: '#FF9839' },
                                        }
                                    }}
                                />
                                <Button variant='contained' onClick={sendMessage} style={{ backgroundColor: '#FF9839', color: 'black' }}>Send</Button>
                            </div>

                        </div>
                    </div>

                    <div className='buttonContainers'>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(videoAvailable === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: 'white' }}>
                            {audioAvailable === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                            {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: 'white' }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                        <IconButton onClick={() => window.location.href = '/dashboard'} style={{ color: 'red' }}>
                            <CallEndIcon />
                        </IconButton>
                    </div>


                    <video className='meetUserVideo' ref={localVideoRef} autoPlay muted></video>

                    <div className='conferenceView'>
                        {videos.map((video) => (
                            <div key={video.socketId} style={{ position: 'relative' }}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    style={{ borderRadius: '15px' }}
                                ></video>
                            </div>
                        ))}
                    </div>

                </div>

            }

        </div>
    )
}
