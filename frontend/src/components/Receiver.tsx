import { useEffect, useState } from "react";

export const Receiver = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: "receiver",
                })
            );
        };
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const video = document.createElement("video");
        document.body.appendChild(video);
        video.muted = true; // Mute the video initially

        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            console.log(event);
            const stream = new MediaStream([event.track]);
            video.srcObject = stream;
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createOffer") {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(
                            JSON.stringify({
                                type: "createAnswer",
                                sdp: answer,
                            })
                        );
                    });
                });
            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(message.candidate);
            }
        };

        video.oncanplay = () => {
            if (!isPlaying) {
                video.play().catch((error) => {
                    console.error("Error playing video:", error);
                });
                setIsPlaying(true);
            }
        };
    }

    return (
        <div>
            <button onClick={() => setIsPlaying(false)}>Start Video</button>
        </div>
    );
};
