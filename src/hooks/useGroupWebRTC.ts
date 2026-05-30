"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";
import type { CallRoomParticipantExtended } from "@/actions/consultas";
import type { WebRTCMediaMode } from "@/hooks/useWebRTC";

interface GroupWebRTCOptions {
  roomId: string;
  currentUserId: string;
  participants: CallRoomParticipantExtended[];
  onFailed?: (errorMsg: string) => void;
}

type SignalEvent = "participant-ready" | "offer" | "answer" | "ice-candidate";

interface BaseSignalPayload {
  roomId: string;
  senderId: string;
  targetId?: string;
}

interface ReadySignalPayload extends BaseSignalPayload {
  readyAt: string;
}

interface SessionSignalPayload extends BaseSignalPayload {
  targetId: string;
  offerId: string;
  sdp: RTCSessionDescriptionInit;
}

interface IceSignalPayload extends BaseSignalPayload {
  targetId: string;
  candidate: RTCIceCandidateInit;
}

type SignalPayload = ReadySignalPayload | SessionSignalPayload | IceSignalPayload;
type LocalMediaKind = "audio" | "video";
type CachedAnswerPayload = SessionSignalPayload;

export interface RemoteMediaState {
  stream: MediaStream | null;
  hasAudio: boolean;
  hasVideo: boolean;
  connectionState: RTCPeerConnectionState;
}

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
  return typeof candidate.roomId === "string" && typeof candidate.senderId === "string";
}

function shouldCreateOffer(localUserId: string, remoteUserId: string) {
  return localUserId.localeCompare(remoteUserId) < 0;
}

function getBlankRemoteMediaState(): RemoteMediaState {
  return {
    stream: null,
    hasAudio: false,
    hasVideo: false,
    connectionState: "new",
  };
}

function getSignalingState(pc: RTCPeerConnection): RTCSignalingState {
  return pc.signalingState;
}

export function useGroupWebRTC({
  roomId,
  currentUserId,
  participants,
  onFailed,
}: GroupWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteMedia, setRemoteMedia] = useState<Record<string, RemoteMediaState>>({});
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaMode, setMediaMode] = useState<WebRTCMediaMode>("chat-only");
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelReadyRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const onFailedRef = useRef(onFailed);
  const peerIdsRef = useRef<string[]>([]);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const currentOfferIdRef = useRef<Map<string, string>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const needsNegotiationRef = useRef<Set<string>>(new Set());
  const cachedAnswersRef = useRef<Map<string, CachedAnswerPayload>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const peerIds = useMemo(
    () =>
      participants
        .filter((participant) => !participant.left_at && participant.user_id !== currentUserId)
        .map((participant) => participant.user_id)
        .sort(),
    [participants, currentUserId]
  );
  peerIdsRef.current = peerIds;

  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  const sendSignal = useCallback(async (event: SignalEvent, payload: SignalPayload) => {
    if (!channelRef.current || !channelReadyRef.current || channelRef.current.state !== "joined") {
      return false;
    }

    const result = await channelRef.current.send({
      type: "broadcast",
      event,
      payload,
    });

    return result === "ok";
  }, []);

  const refreshConnectionSummary = useCallback(() => {
    const states = Array.from(peerConnectionsRef.current.values()).map((pc) => pc.connectionState);

    if (states.length === 0) {
      setConnectionState("new");
      return;
    }

    if (states.some((state) => state === "failed")) {
      setConnectionState("failed");
      return;
    }

    if (states.every((state) => state === "connected")) {
      setConnectionState("connected");
      return;
    }

    if (states.some((state) => state === "connecting" || state === "new")) {
      setConnectionState("connecting");
      return;
    }

    setConnectionState(states[0]);
  }, []);

  const updateRemoteMediaState = useCallback(
    (peerId: string, partial: Partial<RemoteMediaState>) => {
      setRemoteMedia((prev) => {
        const current = prev[peerId] ?? getBlankRemoteMediaState();
        return {
          ...prev,
          [peerId]: {
            ...current,
            ...partial,
          },
        };
      });
      refreshConnectionSummary();
    },
    [refreshConnectionSummary]
  );

  const refreshTrackState = useCallback(
    (peerId: string) => {
      const stream = remoteStreamsRef.current.get(peerId) ?? null;
      updateRemoteMediaState(peerId, {
        stream,
        hasAudio: Boolean(stream?.getAudioTracks().some((track) => track.readyState === "live")),
        hasVideo: Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live")),
      });
    },
    [updateRemoteMediaState]
  );

  const drainIce = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const candidates = pendingIceRef.current.get(peerId) ?? [];
    if (candidates.length === 0) return;

    pendingIceRef.current.set(peerId, []);
    for (const candidate of candidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createOffer = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      if (!shouldCreateOffer(currentUserId, peerId)) return;

      if (!channelReadyRef.current || channelRef.current?.state !== "joined") {
        needsNegotiationRef.current.add(peerId);
        return;
      }

      if (makingOfferRef.current.has(peerId) || pc.signalingState !== "stable") {
        needsNegotiationRef.current.add(peerId);
        return;
      }

      makingOfferRef.current.add(peerId);

      try {
        const offerId = `${currentUserId}-${peerId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        currentOfferIdRef.current.set(peerId, offerId);
        const offer = await pc.createOffer();
        if (!activeRef.current || pc.signalingState !== "stable") return;
        await pc.setLocalDescription(offer);
        if (!activeRef.current || getSignalingState(pc) !== "have-local-offer" || !pc.localDescription) return;

        const sent = await sendSignal("offer", {
          roomId,
          senderId: currentUserId,
          targetId: peerId,
          offerId,
          sdp: pc.localDescription.toJSON(),
        });

        if (!sent) {
          needsNegotiationRef.current.add(peerId);
          currentOfferIdRef.current.delete(peerId);
          if (getSignalingState(pc) === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" });
          }
          return;
        }

        needsNegotiationRef.current.delete(peerId);
      } catch (error) {
        console.error("Failed to create group WebRTC offer:", error);
      } finally {
        makingOfferRef.current.delete(peerId);
      }
    },
    [currentUserId, roomId, sendSignal]
  );

  const ensurePeerConnection = useCallback(
    (peerId: string) => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      peerConnectionsRef.current.set(peerId, pc);
      updateRemoteMediaState(peerId, { connectionState: "new" });

      const stream = localStreamRef.current;
      if (stream && stream.getTracks().length > 0) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      if (!stream || stream.getAudioTracks().length === 0) {
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

      if (!stream || stream.getVideoTracks().length === 0) {
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      pc.ontrack = (event) => {
        const remoteStream = remoteStreamsRef.current.get(peerId) ?? event.streams[0] ?? new MediaStream();
        if (!remoteStream.getTracks().some((track) => track.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        event.track.onunmute = () => refreshTrackState(peerId);
        event.track.onended = () => refreshTrackState(peerId);
        remoteStreamsRef.current.set(peerId, remoteStream);
        refreshTrackState(peerId);
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void sendSignal("ice-candidate", {
          roomId,
          senderId: currentUserId,
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.onconnectionstatechange = () => {
        updateRemoteMediaState(peerId, { connectionState: pc.connectionState });
        if (pc.connectionState === "failed") {
          onFailedRef.current?.("No pudimos conectar con una de las personas de la sala. Podés seguir por chat o reintentar.");
        }
      };

      pc.onsignalingstatechange = () => {
        if (
          pc.signalingState === "stable" &&
          needsNegotiationRef.current.has(peerId) &&
          shouldCreateOffer(currentUserId, peerId)
        ) {
          void createOffer(peerId, pc);
        }
      };

      return pc;
    },
    [createOffer, currentUserId, refreshTrackState, roomId, sendSignal, updateRemoteMediaState]
  );

  const sendReady = useCallback((targetId?: string) => {
    const payload: ReadySignalPayload = {
      roomId,
      senderId: currentUserId,
      readyAt: new Date().toISOString(),
    };

    if (targetId) {
      payload.targetId = targetId;
    }

    void sendSignal("participant-ready", payload);
  }, [currentUserId, roomId, sendSignal]);

  const negotiateKnownPeers = useCallback(() => {
    if (!localStreamRef.current || !channelReadyRef.current || channelRef.current?.state !== "joined") {
      return;
    }

    peerIdsRef.current.forEach((peerId) => {
      const hadPeerConnection = peerConnectionsRef.current.has(peerId);
      const pc = ensurePeerConnection(peerId);
      const shouldOffer = shouldCreateOffer(currentUserId, peerId);
      const needsNegotiation = needsNegotiationRef.current.has(peerId);
      const hasNoRemoteDescription = !pc.remoteDescription;

      if (shouldOffer) {
        if (!hadPeerConnection || needsNegotiation || (pc.signalingState === "stable" && hasNoRemoteDescription)) {
          void createOffer(peerId, pc);
        }
        return;
      }

      if (!hadPeerConnection || needsNegotiation || hasNoRemoteDescription) {
        sendReady(peerId);
      }
    });

    refreshConnectionSummary();
  }, [createOffer, currentUserId, ensurePeerConnection, refreshConnectionSummary, sendReady]);

  const refreshLocalMediaMode = useCallback((stream: MediaStream) => {
    const hasLiveAudio = stream.getAudioTracks().some((track) => track.readyState === "live");
    const hasLiveVideo = stream.getVideoTracks().some((track) => track.readyState === "live");

    if (hasLiveAudio && hasLiveVideo) {
      setMediaMode("video-audio");
      return;
    }

    if (hasLiveAudio) {
      setMediaMode("audio-only");
      return;
    }

    setMediaMode("chat-only");
  }, []);

  const syncLocalTracksWithPeers = useCallback(
    async (stream: MediaStream, limitedKinds?: LocalMediaKind[]) => {
      const tracks = stream
        .getTracks()
        .filter((track): track is MediaStreamTrack & { kind: LocalMediaKind } => {
          const isSupportedKind = track.kind === "audio" || track.kind === "video";
          return isSupportedKind && (!limitedKinds || limitedKinds.includes(track.kind));
        });

      if (tracks.length === 0) return;

      const peersToRenegotiate = new Map<string, RTCPeerConnection>();

      for (const [peerId, pc] of Array.from(peerConnectionsRef.current.entries())) {
        if (pc.signalingState === "closed") continue;

        for (const track of tracks) {
          const transceiver = pc
            .getTransceivers()
            .find(
              (candidate: RTCRtpTransceiver) =>
                candidate.sender.track?.kind === track.kind ||
                candidate.receiver.track.kind === track.kind
            );

          if (transceiver) {
            await transceiver.sender.replaceTrack(track);
            if (transceiver.direction === "recvonly" || transceiver.direction === "inactive") {
              transceiver.direction = "sendrecv";
              peersToRenegotiate.set(peerId, pc);
            }
            continue;
          }

          pc.addTrack(track, stream);
          peersToRenegotiate.set(peerId, pc);
        }
      }

      peersToRenegotiate.forEach((pc, peerId) => {
        if (shouldCreateOffer(currentUserId, peerId)) {
          void createOffer(peerId, pc);
          return;
        }

        needsNegotiationRef.current.add(peerId);
        sendReady(peerId);
      });
    },
    [createOffer, currentUserId, sendReady]
  );

  const requestLocalTrack = useCallback(async (kind: LocalMediaKind) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "video"
          ? {
              video: { width: 640, height: 480, facingMode: "user" },
              audio: false,
            }
          : {
              video: false,
              audio: true,
            }
      );

      const [track] = kind === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
      if (!track) {
        stream.getTracks().forEach((unusedTrack) => unusedTrack.stop());
        throw new Error(`No ${kind} track returned by getUserMedia`);
      }

      return track;
    } catch {
      if (kind === "video") {
        setIsCameraOff(true);
        setMediaWarning("No pudimos activar tu cámara. Revisá los permisos del navegador e intentá de nuevo.");
        return null;
      }

      setIsMuted(true);
      setMediaWarning("No pudimos activar tu micrófono. Revisá los permisos del navegador e intentá de nuevo.");
      return null;
    }
  }, []);

  const installRecoveredTrack = useCallback(
    async (kind: LocalMediaKind, track: MediaStreamTrack) => {
      const stream = localStreamRef.current ?? new MediaStream();

      stream
        .getTracks()
        .filter((existingTrack) => existingTrack.kind === kind)
        .forEach((existingTrack) => {
          stream.removeTrack(existingTrack);
          if (existingTrack.readyState === "live") {
            existingTrack.stop();
          }
        });

      track.enabled = true;
      stream.addTrack(track);
      localStreamRef.current = stream;
      setLocalStream(new MediaStream(stream.getTracks()));
      refreshLocalMediaMode(stream);
      setMediaWarning(null);

      await syncLocalTracksWithPeers(stream, [kind]);
    },
    [refreshLocalMediaMode, syncLocalTracksWithPeers]
  );

  useEffect(() => {
    activeRef.current = true;

    async function initMedia() {
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

      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      await syncLocalTracksWithPeers(stream);
      negotiateKnownPeers();
    }

    void initMedia();

    const channel = supabase.channel(`group_call_signaling_${roomId}`);
    channelRef.current = channel;

    const shouldHandlePayload = (payload: unknown): payload is SignalPayload => {
      if (!isSignalPayload(payload)) return false;
      if (payload.roomId !== roomId || payload.senderId === currentUserId) return false;
      if (payload.targetId && payload.targetId !== currentUserId) return false;
      return true;
    };

    channel
      .on("broadcast", { event: "participant-ready" }, async ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload)) return;
        const peerId = payload.senderId;
        const hadPeerConnection = peerConnectionsRef.current.has(peerId);
        const pc = ensurePeerConnection(peerId);

        if (
          shouldCreateOffer(currentUserId, peerId) &&
          (!hadPeerConnection || needsNegotiationRef.current.has(peerId) || !pc.remoteDescription)
        ) {
          await createOffer(peerId, pc);
        }
      })
      .on("broadcast", { event: "offer" }, async ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload) || !("sdp" in payload) || !("offerId" in payload)) return;

        const peerId = payload.senderId;
        const pc = ensurePeerConnection(peerId);

        try {
          const cachedAnswer = cachedAnswersRef.current.get(payload.offerId);
          if (cachedAnswer) {
            await sendSignal("answer", cachedAnswer);
            return;
          }

          if (pc.signalingState !== "stable") return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          if (!activeRef.current || getSignalingState(pc) !== "have-remote-offer") return;
          await pc.setLocalDescription(answer);
          if (!activeRef.current || pc.signalingState !== "stable" || !pc.localDescription) return;

          const answerPayload: CachedAnswerPayload = {
            roomId,
            senderId: currentUserId,
            targetId: peerId,
            offerId: payload.offerId,
            sdp: pc.localDescription.toJSON(),
          };

          cachedAnswersRef.current.set(payload.offerId, answerPayload);
          await sendSignal("answer", answerPayload);
          await drainIce(peerId, pc);
        } catch (error) {
          console.error("Failed to handle group WebRTC offer:", error);
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload) || !("sdp" in payload) || !("offerId" in payload)) return;

        const peerId = payload.senderId;
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc || payload.offerId !== currentOfferIdRef.current.get(peerId)) return;

        try {
          if (pc.signalingState !== "have-local-offer") return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          currentOfferIdRef.current.delete(peerId);
          await drainIce(peerId, pc);

          if (needsNegotiationRef.current.has(peerId) && getSignalingState(pc) === "stable") {
            void createOffer(peerId, pc);
          }
        } catch (error) {
          console.error("Failed to handle group WebRTC answer:", error);
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload) || !("candidate" in payload)) return;

        const peerId = payload.senderId;
        const pc = ensurePeerConnection(peerId);

        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            return;
          }

          const pending = pendingIceRef.current.get(peerId) ?? [];
          pending.push(payload.candidate);
          pendingIceRef.current.set(peerId, pending);
        } catch (error) {
          console.error("Failed to add group WebRTC ICE candidate:", error);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelReadyRef.current = true;
          sendReady();
          negotiateKnownPeers();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
          channelReadyRef.current = false;
        }
      });

    timeoutRef.current = setTimeout(() => {
      const hasPeers = peerConnectionsRef.current.size > 0;
      const hasConnection = Array.from(peerConnectionsRef.current.values()).some(
        (pc) => pc.connectionState === "connected"
      );

      if (hasPeers && !hasConnection) {
        onFailedRef.current?.("No pudimos conectar audio/video en esta red. Podés seguir por chat o reintentar.");
      }
    }, 18000);

    return () => {
      activeRef.current = false;
      channelReadyRef.current = false;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          track.onunmute = null;
          track.onended = null;
        });
      });
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      pendingIceRef.current.clear();
      currentOfferIdRef.current.clear();
      makingOfferRef.current.clear();
      needsNegotiationRef.current.clear();
      cachedAnswersRef.current.clear();

      if (channelRef.current) {
        unsubscribeRealtimeChannel(channelRef.current);
      }
    };
  }, [
    createOffer,
    currentUserId,
    drainIce,
    ensurePeerConnection,
    roomId,
    negotiateKnownPeers,
    sendReady,
    sendSignal,
    supabase,
    syncLocalTracksWithPeers,
  ]);

  useEffect(() => {
    if (!localStreamRef.current || !channelReadyRef.current) return;

    negotiateKnownPeers();

    peerConnectionsRef.current.forEach((pc, peerId) => {
      if (peerIds.includes(peerId)) return;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
      remoteStreamsRef.current.delete(peerId);
      setRemoteMedia((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    sendReady();
    refreshConnectionSummary();
  }, [negotiateKnownPeers, peerIds, refreshConnectionSummary, sendReady]);

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack || audioTrack.readyState === "ended") {
      void requestLocalTrack("audio").then(async (track) => {
        if (!track) return;
        await installRecoveredTrack("audio", track);
        setIsMuted(false);
      });
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState === "ended") {
      void requestLocalTrack("video").then(async (track) => {
        if (!track) return;
        await installRecoveredTrack("video", track);
        setIsCameraOff(false);
      });
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  };

  return {
    localStream,
    remoteMedia,
    connectionState,
    mediaMode,
    mediaWarning,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  };
}
