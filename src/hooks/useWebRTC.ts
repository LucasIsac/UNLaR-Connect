"use client";

import { useEffect, useRef, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface WebRTCOptions {
  roomId: string;
  isTutor: boolean;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onFailed?: (errorMsg: string) => void;
}

export function useWebRTC({
  roomId,
  isTutor,
  onConnectionStateChange,
  onFailed,
}: WebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const supabase = createBrowserClient();
  const channelRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration with Google's public STUN servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    let active = true;

    async function initMediaAndRTC() {
      try {
        // 1. Get user media (mic & camera)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Create peer connection
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 3. Set remote track listener
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          } else {
            // Fallback for browsers that don't pass streams in event
            const rStream = new MediaStream();
            rStream.addTrack(event.track);
            setRemoteStream(rStream);
          }
        };

        // 4. Set ICE candidate listener
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "ice-candidate",
              payload: {
                candidate: event.candidate.toJSON(),
                sender: isTutor ? "tutor" : "student",
              },
            });
          }
        };

        // 5. Connection state listener with timeout fallback
        pc.onconnectionstatechange = () => {
          if (!active) return;
          const state = pc.connectionState;
          setConnectionState(state);
          if (onConnectionStateChange) {
            onConnectionStateChange(state);
          }

          if (state === "connected") {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          } else if (state === "failed") {
            handleFailedConnection();
          }
        };

        // Set safety connection timeout (15s)
        timeoutRef.current = setTimeout(() => {
          if (pc.connectionState !== "connected" && active) {
            handleFailedConnection();
          }
        }, 15000);

        // 6. Setup Supabase Signaling Channel
        const channelName = `call_signaling_${roomId}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
          .on("broadcast", { event: "offer" }, async ({ payload }) => {
            if (isTutor && payload.sender === "student" && pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);

              channel.send({
                type: "broadcast",
                event: "answer",
                payload: {
                  sdp: answer,
                  sender: "tutor",
                },
              });
            }
          })
          .on("broadcast", { event: "answer" }, async ({ payload }) => {
            if (!isTutor && payload.sender === "tutor" && pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
          })
          .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
            if (payload.sender !== (isTutor ? "tutor" : "student") && pcRef.current) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.error("Error adding ICE candidate:", e);
              }
            }
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && !isTutor) {
              // The Student initiates the call by sending an offer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              channel.send({
                type: "broadcast",
                event: "offer",
                payload: {
                  sdp: offer,
                  sender: "student",
                },
              });
            }
          });

      } catch (err: any) {
        console.error("Failed to initialize WebRTC:", err);
        if (active) {
          onFailed?.("No pudimos acceder a tu cámara o micrófono. Por favor, habilitá los permisos e intentá de nuevo.");
        }
      }
    }

    initMediaAndRTC();

    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Stop tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close peer connection
      if (pcRef.current) {
        pcRef.current.close();
      }

      // Unsubscribe from channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId, isTutor]);

  function handleFailedConnection() {
    onFailed?.("No pudimos conectar el video en esta red. Podés seguir por chat o reintentar.");
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  };
}
