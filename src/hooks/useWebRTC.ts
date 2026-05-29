"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";

export type WebRTCMediaMode = "video-audio" | "audio-only" | "chat-only";

interface WebRTCOptions {
  roomId: string;
  isTutor: boolean;
  currentUserId: string;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onFailed?: (errorMsg: string) => void;
}

type CallRole = "student" | "tutor";
type SignalEvent = "student-ready" | "tutor-ready" | "offer" | "answer" | "ice-candidate";

interface BaseSignalPayload {
  roomId: string;
  senderId: string;
  senderRole: CallRole;
}

interface ReadySignalPayload extends BaseSignalPayload {
  readyAt: string;
}

interface SessionSignalPayload extends BaseSignalPayload {
  offerId: string;
  sdp: RTCSessionDescriptionInit;
}

interface IceSignalPayload extends BaseSignalPayload {
  candidate: RTCIceCandidateInit;
}

type SignalPayload = ReadySignalPayload | SessionSignalPayload | IceSignalPayload;

function getIceServers(): RTCIceServer[] {
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  const turnUrls = process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS;
  if (!turnUrls) {
    return iceServers;
  }

  const urls = turnUrls
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    return iceServers;
  }

  iceServers.push({
    urls,
    username: process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL,
  });

  return iceServers;
}

function isSignalPayload(payload: unknown): payload is SignalPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<SignalPayload>;
  return (
    typeof candidate.roomId === "string" &&
    typeof candidate.senderId === "string" &&
    (candidate.senderRole === "student" || candidate.senderRole === "tutor")
  );
}

export function useWebRTC({
  roomId,
  isTutor,
  currentUserId,
  onConnectionStateChange,
  onFailed,
}: WebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [remoteHasAudio, setRemoteHasAudio] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaMode, setMediaMode] = useState<WebRTCMediaMode>("chat-only");
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const supabase = createBrowserClient();
  const role: CallRole = isTutor ? "tutor" : "student";
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelReadyRef = useRef(false);
  const remoteCandidatesBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const localCandidatesBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const currentOfferIdRef = useRef<string | null>(null);
  const lastOfferSentAtRef = useRef(0);
  const isHandlingOfferRef = useRef(false);
  const answeredOfferIdRef = useRef<string | null>(null);
  const cachedAnswerRef = useRef<SessionSignalPayload | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: getIceServers(),
  };

  useEffect(() => {
    let active = true;

    const getSignalPayload = (): BaseSignalPayload => ({
      roomId,
      senderId: currentUserId,
      senderRole: role,
    });

    const sendSignal = async (event: SignalEvent, payload: SignalPayload) => {
      if (!channelRef.current || !channelReadyRef.current) return;

      await channelRef.current.send({
        type: "broadcast",
        event,
        payload,
      });
    };

    const isCurrentPeerConnection = (pc: RTCPeerConnection) => {
      return active && pcRef.current === pc && pc.signalingState !== "closed";
    };

    const createOfferId = () => {
      return `${currentUserId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    };

    const refreshRemoteTrackState = () => {
      const stream = remoteStreamRef.current;
      setRemoteHasAudio(Boolean(stream?.getAudioTracks().some((track) => track.readyState === "live")));
      setRemoteHasVideo(Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live")));
    };

    const attachRemoteTrackLifecycle = (track: MediaStreamTrack) => {
      track.onunmute = refreshRemoteTrackState;
      track.onended = refreshRemoteTrackState;
    };

    const setRemoteMediaStream = (stream: MediaStream, track: MediaStreamTrack) => {
      remoteStreamRef.current = stream;
      attachRemoteTrackLifecycle(track);
      setRemoteStream(stream);
      refreshRemoteTrackState();
    };

    const sendReady = () => {
      sendSignal(isTutor ? "tutor-ready" : "student-ready", {
        ...getSignalPayload(),
        readyAt: new Date().toISOString(),
      });
    };

    const sendIceCandidate = (candidate: RTCIceCandidateInit) => {
      const payload: IceSignalPayload = {
        ...getSignalPayload(),
        candidate,
      };

      if (!channelReadyRef.current) {
        localCandidatesBufferRef.current.push(candidate);
        return;
      }

      sendSignal("ice-candidate", payload);
    };

    const flushLocalIceCandidates = async () => {
      if (!channelReadyRef.current || localCandidatesBufferRef.current.length === 0) return;

      const candidates = [...localCandidatesBufferRef.current];
      localCandidatesBufferRef.current = [];

      for (const candidate of candidates) {
        await sendSignal("ice-candidate", {
          ...getSignalPayload(),
          candidate,
        });
      }
    };

    const drainRemoteIceCandidates = async () => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription || remoteCandidatesBufferRef.current.length === 0) return;

      const candidates = [...remoteCandidatesBufferRef.current];
      remoteCandidatesBufferRef.current = [];

      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const sendStudentOffer = async () => {
      const pc = pcRef.current;
      if (!pc || isTutor) return;

      try {
        if (pc.localDescription?.type === "offer" && pc.signalingState === "have-local-offer") {
          const now = Date.now();
          if (now - lastOfferSentAtRef.current < 1500) return;

          const offerId = currentOfferIdRef.current ?? createOfferId();
          currentOfferIdRef.current = offerId;
          lastOfferSentAtRef.current = now;

          await sendSignal("offer", {
            ...getSignalPayload(),
            offerId,
            sdp: pc.localDescription.toJSON(),
          });
          return;
        }

        if (pc.signalingState !== "stable") return;

        const offerId = createOfferId();
        currentOfferIdRef.current = offerId;
        const offer = await pc.createOffer();
        if (!isCurrentPeerConnection(pc)) return;
        await pc.setLocalDescription(offer);

        if (!isCurrentPeerConnection(pc)) return;
        if (!pc.localDescription) return;

        lastOfferSentAtRef.current = Date.now();
        await sendSignal("offer", {
          ...getSignalPayload(),
          offerId,
          sdp: pc.localDescription.toJSON(),
        });
      } catch (err) {
        console.error("Student failed to send offer:", err);
      }
    };

    const shouldHandlePayload = (payload: unknown): payload is SignalPayload => {
      if (!isSignalPayload(payload)) return false;
      return payload.roomId === roomId && payload.senderId !== currentUserId && payload.senderRole !== role;
    };

    async function initMediaAndRTC() {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: true,
        });
        setMediaMode("video-audio");
        setMediaWarning(null);
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setMediaMode("audio-only");
          setMediaWarning("No pudimos usar tu cámara, pero podés seguir con audio y chat.");
          setIsCameraOff(true);
        } catch {
          stream = new MediaStream();
          setMediaMode("chat-only");
          setMediaWarning("No pudimos usar tu cámara ni tu micrófono, pero podés seguir por chat.");
          setIsCameraOff(true);
          setIsMuted(true);
        }
      }

      try {
        if (!active) {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        if (stream.getAudioTracks().length === 0) {
          pc.addTransceiver("audio", { direction: "recvonly" });
        }

        if (stream.getVideoTracks().length === 0) {
          pc.addTransceiver("video", { direction: "recvonly" });
        }

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteMediaStream(event.streams[0], event.track);
          } else {
            const stream = remoteStreamRef.current ?? new MediaStream();
            if (!stream.getTracks().some((track) => track.id === event.track.id)) {
              stream.addTrack(event.track);
            }
            setRemoteMediaStream(stream, event.track);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendIceCandidate(event.candidate.toJSON());
          }
        };

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
            if (readyIntervalRef.current) {
              clearInterval(readyIntervalRef.current);
              readyIntervalRef.current = null;
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
          .on("broadcast", { event: "student-ready" }, ({ payload }: { payload: unknown }) => {
            if (!shouldHandlePayload(payload) || !isTutor) return;
            sendReady();
          })
          .on("broadcast", { event: "tutor-ready" }, async ({ payload }: { payload: unknown }) => {
            if (!shouldHandlePayload(payload) || isTutor) return;
            await sendStudentOffer();
          })
          .on("broadcast", { event: "offer" }, async ({ payload }: { payload: unknown }) => {
            if (!shouldHandlePayload(payload) || !isTutor || !("sdp" in payload) || !("offerId" in payload)) return;

            try {
              if (answeredOfferIdRef.current === payload.offerId && cachedAnswerRef.current) {
                await sendSignal("answer", cachedAnswerRef.current);
                return;
              }

              if (isHandlingOfferRef.current || pc.signalingState !== "stable") return;
              isHandlingOfferRef.current = true;

              if (!isCurrentPeerConnection(pc)) return;
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              if (!isCurrentPeerConnection(pc)) return;

              const answer = await pc.createAnswer();
              const answerState = pc.signalingState as RTCSignalingState;
              if (!isCurrentPeerConnection(pc) || answerState !== "have-remote-offer") return;
              await pc.setLocalDescription(answer);
              if (!isCurrentPeerConnection(pc)) return;

              if (!pc.localDescription) return;

              const answerPayload: SessionSignalPayload = {
                ...getSignalPayload(),
                offerId: payload.offerId,
                sdp: pc.localDescription.toJSON(),
              };

              answeredOfferIdRef.current = payload.offerId;
              cachedAnswerRef.current = answerPayload;
              await sendSignal("answer", answerPayload);

              await drainRemoteIceCandidates();
            } catch (e) {
              console.error("Tutor failed to handle offer:", e);
            } finally {
              isHandlingOfferRef.current = false;
            }
          })
          .on("broadcast", { event: "answer" }, async ({ payload }: { payload: unknown }) => {
            if (!shouldHandlePayload(payload) || isTutor || !("sdp" in payload) || !("offerId" in payload)) return;

            try {
              if (payload.offerId !== currentOfferIdRef.current) return;
              if (!isCurrentPeerConnection(pc) || pc.signalingState !== "have-local-offer") return;
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              currentOfferIdRef.current = null;
              await drainRemoteIceCandidates();
            } catch (e) {
              console.error("Student failed to handle answer:", e);
            }
          })
          .on("broadcast", { event: "ice-candidate" }, async ({ payload }: { payload: unknown }) => {
            if (!shouldHandlePayload(payload) || !("candidate" in payload)) return;

            try {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                remoteCandidatesBufferRef.current.push(payload.candidate);
              }
            } catch (e) {
              console.error("Error adding remote ICE candidate:", e);
            }
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              channelReadyRef.current = true;
              await flushLocalIceCandidates();
              sendReady();
              readyIntervalRef.current = setInterval(sendReady, 1000);
            }
          });

      } catch (err: unknown) {
        console.error("Failed to initialize WebRTC:", err);
        if (active) {
          onFailed?.("No pudimos preparar la sala en este navegador. Podés seguir por chat o recargar la página.");
        }
      }
    }

    initMediaAndRTC();

    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (readyIntervalRef.current) clearInterval(readyIntervalRef.current);
      channelReadyRef.current = false;

      // Stop tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => {
          track.onunmute = null;
          track.onended = null;
        });
      }

      // Close peer connection
      if (pcRef.current) {
        pcRef.current.close();
      }

      // Unsubscribe from channel
      if (channelRef.current) {
        unsubscribeRealtimeChannel(channelRef.current);
      }
    };
  }, [roomId, isTutor, currentUserId]);

  function handleFailedConnection() {
    onFailed?.("No pudimos conectar audio/video en esta red. Podés seguir por chat o reintentar.");
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
    remoteHasAudio,
    remoteHasVideo,
    connectionState,
    mediaMode,
    mediaWarning,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  };
}
