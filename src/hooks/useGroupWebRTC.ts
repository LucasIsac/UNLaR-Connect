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

type SignalEvent = "participant-ready" | "media-state" | "offer" | "answer" | "ice-candidate";

interface BaseSignalPayload {
  roomId: string;
  senderId: string;
  targetId?: string;
}

interface MediaStateData {
  hasAudioTrack: boolean;
  hasVideoTrack: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface ReadySignalPayload extends BaseSignalPayload, MediaStateData {
  readyAt: string;
  needsNegotiation?: boolean;
}

interface MediaStateSignalPayload extends BaseSignalPayload, MediaStateData {
  sentAt: string;
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

type SignalPayload = ReadySignalPayload | MediaStateSignalPayload | SessionSignalPayload | IceSignalPayload;
type LocalMediaKind = "audio" | "video";
type CachedAnswerPayload = SessionSignalPayload;

interface SyncLocalTracksOptions {
  forceRenegotiate?: boolean;
}

export interface RemoteMediaState {
  stream: MediaStream | null;
  hasAudio: boolean;
  hasVideo: boolean;
  audioEnabled: boolean | null;
  videoEnabled: boolean | null;
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

function isSessionSignalPayload(payload: SignalPayload): payload is SessionSignalPayload {
  return (
    "sdp" in payload &&
    "offerId" in payload &&
    typeof payload.offerId === "string" &&
    payload.offerId.trim().length > 0
  );
}

function shouldCreateOffer(localUserId: string, remoteUserId: string) {
  return localUserId.localeCompare(remoteUserId) < 0;
}

function getBlankRemoteMediaState(): RemoteMediaState {
  return {
    stream: null,
    hasAudio: false,
    hasVideo: false,
    audioEnabled: null,
    videoEnabled: null,
    connectionState: "new",
  };
}

function getSignalingState(pc: RTCPeerConnection): RTCSignalingState {
  return pc.signalingState;
}

function getTrackDebug(track: MediaStreamTrack | null | undefined) {
  if (!track) return null;

  return {
    kind: track.kind,
    id: track.id,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
  };
}

function getStreamDebug(stream: MediaStream | null | undefined) {
  if (!stream) {
    return {
      audio: [],
      video: [],
      trackCount: 0,
    };
  }

  return {
    audio: stream.getAudioTracks().map(getTrackDebug),
    video: stream.getVideoTracks().map(getTrackDebug),
    trackCount: stream.getTracks().length,
  };
}

function getTransceiverDebug(transceiver: RTCRtpTransceiver, index: number) {
  return {
    index,
    mid: transceiver.mid,
    direction: transceiver.direction,
    currentDirection: transceiver.currentDirection,
    senderTrack: getTrackDebug(transceiver.sender.track),
    receiverTrack: getTrackDebug(transceiver.receiver.track),
  };
}

function getPeerConnectionDebug(pc: RTCPeerConnection) {
  return {
    connectionState: pc.connectionState,
    iceConnectionState: pc.iceConnectionState,
    iceGatheringState: pc.iceGatheringState,
    signalingState: pc.signalingState,
    localDescriptionType: pc.localDescription?.type ?? null,
    remoteDescriptionType: pc.remoteDescription?.type ?? null,
    transceivers: pc.getTransceivers().map(getTransceiverDebug),
  };
}

function getIceCandidateDebug(candidate: RTCIceCandidateInit) {
  const candidateLine = candidate.candidate ?? "";
  const match = candidateLine.match(/\styp\s(\S+)/);

  return {
    hasCandidate: candidateLine.length > 0,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    candidateType: match?.[1] ?? null,
  };
}

function getSignalDebugMeta(event: SignalEvent, payload: SignalPayload) {
  const meta: Record<string, unknown> = {
    event,
    roomId: payload.roomId,
    senderId: payload.senderId,
    targetId: payload.targetId ?? null,
  };

  if ("offerId" in payload) {
    meta.offerId = payload.offerId || "(empty)";
  }

  if ("sdp" in payload) {
    meta.sdpType = payload.sdp.type ?? null;
  }

  if ("candidate" in payload) {
    meta.candidate = getIceCandidateDebug(payload.candidate);
  }

  if ("hasAudioTrack" in payload && "hasVideoTrack" in payload) {
    meta.media = {
      hasAudioTrack: payload.hasAudioTrack,
      hasVideoTrack: payload.hasVideoTrack,
      audioEnabled: payload.audioEnabled,
      videoEnabled: payload.videoEnabled,
    };
  }

  if ("needsNegotiation" in payload) {
    meta.needsNegotiation = payload.needsNegotiation ?? false;
  }

  return meta;
}

function logWebRTCDebug(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.log(`[WebRTC Debug] ${message}`, meta);
    return;
  }

  console.log(`[WebRTC Debug] ${message}`);
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
  const applyingRemoteAnswerRef = useRef<Set<string>>(new Set());
  const needsNegotiationRef = useRef<Set<string>>(new Set());
  const cachedAnswersRef = useRef<Map<string, CachedAnswerPayload>>(new Map());
  const lastOfferRebroadcastAtRef = useRef<Map<string, number>>(new Map());
  const negotiationRetryRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const negotiationAttemptsRef = useRef<Map<string, number>>(new Map());
  const negotiatePeerRef = useRef<(peerId: string) => void>(() => undefined);
  const readyRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const readyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const signalingQueueRef = useRef<Map<string, Promise<unknown>>>(new Map());

  const queueTask = useCallback((peerId: string, task: () => Promise<unknown>) => {
    const current = signalingQueueRef.current.get(peerId) ?? Promise.resolve();
    const next = current.then(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`[WebRTC Debug] Error in queued task for ${peerId}:`, err);
      }
    });
    signalingQueueRef.current.set(peerId, next);
    return next;
  }, []);

  const sendSignal = useCallback(async (event: SignalEvent, payload: SignalPayload) => {
    const meta = getSignalDebugMeta(event, payload);

    if (!channelRef.current || !channelReadyRef.current) {
      logWebRTCDebug("Signal skipped because channel is not ready", {
        ...meta,
        hasChannel: Boolean(channelRef.current),
        channelReady: channelReadyRef.current,
      });
      return false;
    }

    const result = await channelRef.current.send({
      type: "broadcast",
      event,
      payload,
    });

    if (result !== "ok") {
      logWebRTCDebug("Signal broadcast failed", {
        ...meta,
        result,
      });
      return false;
    }

    if (event === "offer" || event === "answer") {
      logWebRTCDebug("Signal sent", meta);
    }

    return true;
  }, []);

  const getLocalMediaState = useCallback((): MediaStateData => {
    const stream = localStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0] ?? null;
    const videoTrack = stream?.getVideoTracks()[0] ?? null;
    const hasAudioTrack = Boolean(audioTrack && audioTrack.readyState === "live");
    const hasVideoTrack = Boolean(videoTrack && videoTrack.readyState === "live");

    return {
      hasAudioTrack,
      hasVideoTrack,
      audioEnabled: Boolean(hasAudioTrack && audioTrack?.enabled),
      videoEnabled: Boolean(hasVideoTrack && videoTrack?.enabled),
    };
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

  const updateRemoteSignaledMediaState = useCallback(
    (peerId: string, payload: SignalPayload) => {
      if (
        !("audioEnabled" in payload) ||
        !("videoEnabled" in payload) ||
        !("hasAudioTrack" in payload) ||
        !("hasVideoTrack" in payload)
      ) {
        return;
      }

      updateRemoteMediaState(peerId, {
        audioEnabled: payload.hasAudioTrack ? payload.audioEnabled : false,
        videoEnabled: payload.hasVideoTrack ? payload.videoEnabled : false,
      });
    },
    [updateRemoteMediaState]
  );

  const drainIce = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const candidates = pendingIceRef.current.get(peerId) ?? [];
    if (candidates.length === 0) return;

    pendingIceRef.current.set(peerId, []);
    logWebRTCDebug("Draining buffered ICE candidates", {
      peerId,
      candidateCount: candidates.length,
      peerConnection: getPeerConnectionDebug(pc),
    });
    for (const candidate of candidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const scheduleNegotiationRetry = useCallback(
    (peerId: string, delayMs = 700) => {
      if (negotiationRetryRef.current.has(peerId)) {
        logWebRTCDebug("Negotiation retry already scheduled", {
          peerId,
          delayMs,
        });
        return;
      }

      const attempts = negotiationAttemptsRef.current.get(peerId) ?? 0;
      if (attempts >= 8) {
        logWebRTCDebug("Negotiation retry limit reached", {
          peerId,
          attempts,
        });
        return;
      }

      negotiationAttemptsRef.current.set(peerId, attempts + 1);
      logWebRTCDebug("Negotiation retry scheduled", {
        peerId,
        delayMs,
        attempt: attempts + 1,
      });

      const retry = setTimeout(() => {
        negotiationRetryRef.current.delete(peerId);
        if (!activeRef.current || !peerIdsRef.current.includes(peerId)) {
          logWebRTCDebug("Negotiation retry cancelled before running", {
            peerId,
            active: activeRef.current,
            knownPeers: peerIdsRef.current,
          });
          return;
        }

        const pc = peerConnectionsRef.current.get(peerId);
        if (pc && pc.signalingState !== "closed") {
          logWebRTCDebug("Negotiation retry running", {
            peerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
          needsNegotiationRef.current.add(peerId);
          negotiatePeerRef.current(peerId);
          return;
        }

        logWebRTCDebug("Negotiation retry found no open peer connection", {
          peerId,
          hasPeerConnection: Boolean(pc),
          signalingState: pc?.signalingState ?? null,
        });
      }, delayMs);

      negotiationRetryRef.current.set(peerId, retry);
    },
    []
  );

  const createOffer = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      if (!shouldCreateOffer(currentUserId, peerId)) {
        logWebRTCDebug("Offer creation skipped because local user is not deterministic offerer", {
          peerId,
          currentUserId,
        });
        return;
      }

      if (!channelReadyRef.current) {
        console.log(`[WebRTC Debug] Cannot create offer to ${peerId} yet: channel is not ready`);
        logWebRTCDebug("Offer creation deferred until channel is ready", {
          peerId,
          peerConnection: getPeerConnectionDebug(pc),
          localMedia: getStreamDebug(localStreamRef.current),
        });
        needsNegotiationRef.current.add(peerId);
        scheduleNegotiationRetry(peerId);
        return;
      }

      if (makingOfferRef.current.has(peerId) || pc.signalingState !== "stable") {
        console.log(`[WebRTC Debug] Cannot create offer to ${peerId}: offer in progress or signaling state is ${pc.signalingState}`);
        logWebRTCDebug("Offer creation blocked by current negotiation state", {
          peerId,
          makingOffer: makingOfferRef.current.has(peerId),
          currentOfferId: currentOfferIdRef.current.get(peerId) ?? null,
          needsNegotiation: needsNegotiationRef.current.has(peerId),
          peerConnection: getPeerConnectionDebug(pc),
        });

        if (pc.signalingState === "have-local-offer" && pc.localDescription?.type === "offer") {
          const existingOfferId = currentOfferIdRef.current.get(peerId);

          if (!existingOfferId) {
            console.log(`[WebRTC Debug] Local offer for ${peerId} has no tracked offerId. Rolling back before retry.`);
            logWebRTCDebug("Rolling back stale local offer without offerId", {
              peerId,
              peerConnection: getPeerConnectionDebug(pc),
            });
            try {
              await pc.setLocalDescription({ type: "rollback" });
            } catch (error) {
              console.error("[WebRTC Debug] Failed to roll back stale local offer:", error);
            }
          } else {
            const now = Date.now();
            const lastRebroadcastAt = lastOfferRebroadcastAtRef.current.get(peerId) ?? 0;

            if (now - lastRebroadcastAt >= 1500) {
              lastOfferRebroadcastAtRef.current.set(peerId, now);
              console.log(`[WebRTC Debug] Re-broadcasting tracked local SDP offer to ${peerId}`);
              logWebRTCDebug("Rebroadcasting tracked local offer", {
                peerId,
                offerId: existingOfferId,
                peerConnection: getPeerConnectionDebug(pc),
              });
              void sendSignal("offer", {
                roomId,
                senderId: currentUserId,
                targetId: peerId,
                offerId: existingOfferId,
                sdp: pc.localDescription.toJSON(),
              });
            }
          }
        }

        needsNegotiationRef.current.add(peerId);
        scheduleNegotiationRetry(peerId);
        return;
      }

      makingOfferRef.current.add(peerId);
      let offerId: string | null = null;

      try {
        offerId = `${currentUserId}-${peerId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        currentOfferIdRef.current.set(peerId, offerId);
        console.log(`[WebRTC Debug] Creating SDP offer for ${peerId} (Offer ID: ${offerId})`);
        logWebRTCDebug("Creating SDP offer", {
          peerId,
          offerId,
          localMedia: getStreamDebug(localStreamRef.current),
          peerConnection: getPeerConnectionDebug(pc),
        });
        const offer = await pc.createOffer();
        if (!activeRef.current) return;
        if (pc.signalingState !== "stable") {
          logWebRTCDebug("Offer abandoned because signaling state changed before local description", {
            peerId,
            offerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
          if (currentOfferIdRef.current.get(peerId) === offerId) {
            currentOfferIdRef.current.delete(peerId);
          }
          needsNegotiationRef.current.add(peerId);
          scheduleNegotiationRetry(peerId);
          return;
        }
        console.log(`[WebRTC Debug] Setting local description for ${peerId}`);
        await pc.setLocalDescription(offer);
        if (!activeRef.current) return;
        if (getSignalingState(pc) !== "have-local-offer" || !pc.localDescription) {
          logWebRTCDebug("Offer abandoned because local description was not installed as expected", {
            peerId,
            offerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
          if (currentOfferIdRef.current.get(peerId) === offerId) {
            currentOfferIdRef.current.delete(peerId);
          }
          needsNegotiationRef.current.add(peerId);
          scheduleNegotiationRetry(peerId);
          return;
        }

        console.log(`[WebRTC Debug] Broadcasting offer to ${peerId}`);
        const sent = await sendSignal("offer", {
          roomId,
          senderId: currentUserId,
          targetId: peerId,
          offerId,
          sdp: pc.localDescription.toJSON(),
        });

        if (!sent) {
          console.log(`[WebRTC Debug] Failed to send offer signal to ${peerId}. Rolling back.`);
          logWebRTCDebug("Offer signal failed; rolling back", {
            peerId,
            offerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
          needsNegotiationRef.current.add(peerId);
          currentOfferIdRef.current.delete(peerId);
          if (getSignalingState(pc) === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" });
          }
          scheduleNegotiationRetry(peerId);
          return;
        }

        needsNegotiationRef.current.delete(peerId);
        negotiationAttemptsRef.current.delete(peerId);
        logWebRTCDebug("Offer broadcast accepted by signaling channel", {
          peerId,
          offerId,
          peerConnection: getPeerConnectionDebug(pc),
        });
      } catch (error) {
        console.error("[WebRTC Debug] Failed to create group WebRTC offer:", error);
        logWebRTCDebug("Offer creation failed", {
          peerId,
          offerId,
          peerConnection: getPeerConnectionDebug(pc),
        });
        if (offerId && currentOfferIdRef.current.get(peerId) === offerId) {
          currentOfferIdRef.current.delete(peerId);
        }
        needsNegotiationRef.current.add(peerId);
        if (getSignalingState(pc) === "have-local-offer") {
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch (rollbackError) {
            console.error("[WebRTC Debug] Failed to roll back after offer error:", rollbackError);
          }
        }
        scheduleNegotiationRetry(peerId);
      } finally {
        makingOfferRef.current.delete(peerId);
      }
    },
    [currentUserId, roomId, scheduleNegotiationRetry, sendSignal]
  );

  const ensurePeerConnection = useCallback(
    (peerId: string) => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      console.log(`[WebRTC Debug] Creating new RTCPeerConnection for peer ${peerId}`);
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      peerConnectionsRef.current.set(peerId, pc);
      updateRemoteMediaState(peerId, { connectionState: "new" });

      const stream = localStreamRef.current;
      if (stream && stream.getTracks().length > 0) {
        console.log(`[WebRTC Debug] Adding local tracks to peer connection for ${peerId}`);
        logWebRTCDebug("Adding current local tracks to new peer connection", {
          peerId,
          localMedia: getStreamDebug(stream),
        });
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      // ONLY the Offerer should explicitly add recvonly transceivers before offering.
      // The Answerer will automatically create them upon calling setRemoteDescription(offer).
      const shouldOffer = shouldCreateOffer(currentUserId, peerId);
      if (shouldOffer) {
        if (!stream || stream.getAudioTracks().length === 0) {
          console.log(`[WebRTC Debug] Offerer adding explicit recvonly audio transceiver for ${peerId}`);
          pc.addTransceiver("audio", { direction: "recvonly" });
          logWebRTCDebug("Added recvonly audio transceiver for offerer", {
            peerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
        }

        if (!stream || stream.getVideoTracks().length === 0) {
          console.log(`[WebRTC Debug] Offerer adding explicit recvonly video transceiver for ${peerId}`);
          pc.addTransceiver("video", { direction: "recvonly" });
          logWebRTCDebug("Added recvonly video transceiver for offerer", {
            peerId,
            peerConnection: getPeerConnectionDebug(pc),
          });
        }
      }

      pc.ontrack = (event) => {
        console.log(`[WebRTC Debug] Received remote track event from ${peerId}: ${event.track.kind}`);
        logWebRTCDebug("Remote track event received", {
          peerId,
          track: getTrackDebug(event.track),
          streamCount: event.streams.length,
          peerConnection: getPeerConnectionDebug(pc),
        });
        const remoteStream = remoteStreamsRef.current.get(peerId) ?? event.streams[0] ?? new MediaStream();
        if (!remoteStream.getTracks().some((track) => track.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        event.track.onunmute = () => {
          console.log(`[WebRTC Debug] Remote track unmuted from ${peerId}: ${event.track.kind}`);
          logWebRTCDebug("Remote track unmuted", {
            peerId,
            track: getTrackDebug(event.track),
            remoteStream: getStreamDebug(remoteStreamsRef.current.get(peerId)),
          });
          refreshTrackState(peerId);
        };
        event.track.onended = () => {
          console.log(`[WebRTC Debug] Remote track ended from ${peerId}: ${event.track.kind}`);
          logWebRTCDebug("Remote track ended", {
            peerId,
            track: getTrackDebug(event.track),
            remoteStream: getStreamDebug(remoteStreamsRef.current.get(peerId)),
          });
          refreshTrackState(peerId);
        };
        remoteStreamsRef.current.set(peerId, remoteStream);
        refreshTrackState(peerId);
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        console.log(`[WebRTC Debug] Local ICE candidate gathered for peer ${peerId}`);
        void sendSignal("ice-candidate", {
          roomId,
          senderId: currentUserId,
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        }).then((sent) => {
          if (!sent) {
            console.log(`[WebRTC Debug] Failed to broadcast local ICE candidate to ${peerId}. Will trigger retry.`);
            scheduleNegotiationRetry(peerId);
          }
        });
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Debug] RTCPeerConnection connectionState changed for ${peerId} to: ${pc.connectionState}`);
        logWebRTCDebug("Peer connection state changed", {
          peerId,
          peerConnection: getPeerConnectionDebug(pc),
          needsNegotiation: needsNegotiationRef.current.has(peerId),
          currentOfferId: currentOfferIdRef.current.get(peerId) ?? null,
        });
        updateRemoteMediaState(peerId, { connectionState: pc.connectionState });
        if (pc.connectionState === "connected") {
          console.log(`[WebRTC Debug] WebRTC connection established successfully with ${peerId}!`);
          negotiationAttemptsRef.current.delete(peerId);

          // Clear ready retry interval once all active connections are stable/connected
          const states = Array.from(peerConnectionsRef.current.values()).map((c) => c.connectionState);
          if (states.length > 0 && states.every((s) => s === "connected")) {
            console.log("[WebRTC Debug] All active peer connections established. Stopping ready interval.");
            if (readyIntervalRef.current) {
              clearInterval(readyIntervalRef.current);
              readyIntervalRef.current = null;
            }
          }
        }
        if (pc.connectionState === "failed") {
          console.log(`[WebRTC Debug] WebRTC connection FAILED with ${peerId}`);
          onFailedRef.current?.("No pudimos conectar con una de las personas de la sala. Podés seguir por chat o reintentar.");
        }
      };

      pc.onsignalingstatechange = () => {
        console.log(`[WebRTC Debug] RTCPeerConnection signalingState changed for ${peerId} to: ${pc.signalingState}`);
        logWebRTCDebug("Peer signaling state changed", {
          peerId,
          peerConnection: getPeerConnectionDebug(pc),
          needsNegotiation: needsNegotiationRef.current.has(peerId),
          applyingRemoteAnswer: applyingRemoteAnswerRef.current.has(peerId),
          currentOfferId: currentOfferIdRef.current.get(peerId) ?? null,
        });
        if (
          pc.signalingState === "stable" &&
          needsNegotiationRef.current.has(peerId) &&
          shouldCreateOffer(currentUserId, peerId)
        ) {
          console.log(`[WebRTC Debug] Signaling is stable but renegotiation is pending for ${peerId}. Scheduling offer.`);
          scheduleNegotiationRetry(peerId, applyingRemoteAnswerRef.current.has(peerId) ? 150 : 0);
        }
      };

      return pc;
    },
    [createOffer, currentUserId, refreshTrackState, roomId, scheduleNegotiationRetry, sendSignal, updateRemoteMediaState]
  );

  const sendMediaState = useCallback((targetId?: string) => {
    const payload: MediaStateSignalPayload = {
      roomId,
      senderId: currentUserId,
      sentAt: new Date().toISOString(),
      ...getLocalMediaState(),
    };

    if (targetId) {
      payload.targetId = targetId;
    }

    logWebRTCDebug("Sending media-state signal", getSignalDebugMeta("media-state", payload));
    void sendSignal("media-state", payload);
  }, [currentUserId, getLocalMediaState, roomId, sendSignal]);

  const sendReady = useCallback((targetId?: string) => {
    const payload: ReadySignalPayload = {
      roomId,
      senderId: currentUserId,
      readyAt: new Date().toISOString(),
      ...getLocalMediaState(),
      needsNegotiation: targetId ? needsNegotiationRef.current.has(targetId) : (needsNegotiationRef.current.size > 0),
    };

    if (targetId) {
      payload.targetId = targetId;
    }

    logWebRTCDebug("Sending participant-ready signal", getSignalDebugMeta("participant-ready", payload));
    void sendSignal("participant-ready", payload).then((sent) => {
      if (sent || targetId || readyRetryRef.current) return;

      readyRetryRef.current = setTimeout(() => {
        readyRetryRef.current = null;
        if (activeRef.current) sendReady();
      }, 900);
    });
  }, [currentUserId, getLocalMediaState, roomId, sendSignal]);

  const negotiatePeer = useCallback((peerId: string) => {
    if (!localStreamRef.current || !channelReadyRef.current) {
      logWebRTCDebug("Negotiation skipped because media or channel is not ready", {
        peerId,
        hasLocalStream: Boolean(localStreamRef.current),
        channelReady: channelReadyRef.current,
      });
      return;
    }

    const hadPeerConnection = peerConnectionsRef.current.has(peerId);
    const pc = ensurePeerConnection(peerId);
    const shouldOffer = shouldCreateOffer(currentUserId, peerId);
    const needsNegotiation = needsNegotiationRef.current.has(peerId);
    const hasNoRemoteDescription = !pc.remoteDescription;
    logWebRTCDebug("Negotiation decision", {
      peerId,
      hadPeerConnection,
      shouldOffer,
      needsNegotiation,
      hasNoRemoteDescription,
      currentOfferId: currentOfferIdRef.current.get(peerId) ?? null,
      peerConnection: getPeerConnectionDebug(pc),
    });

    if (shouldOffer) {
      if (!hadPeerConnection || needsNegotiation || (pc.signalingState === "stable" && hasNoRemoteDescription)) {
        void createOffer(peerId, pc);
      }
      return;
    }

    if (!hadPeerConnection || needsNegotiation || hasNoRemoteDescription) {
      sendReady(peerId);
      scheduleNegotiationRetry(peerId, 1200);
    }
  }, [createOffer, currentUserId, ensurePeerConnection, scheduleNegotiationRetry, sendReady]);

  useEffect(() => {
    negotiatePeerRef.current = negotiatePeer;
  }, [negotiatePeer]);

  const negotiateKnownPeers = useCallback(() => {
    if (!localStreamRef.current || !channelReadyRef.current) {
      return;
    }

    peerIdsRef.current.forEach((peerId) => {
      negotiatePeer(peerId);
    });

    refreshConnectionSummary();
  }, [negotiatePeer, refreshConnectionSummary]);

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
    async (
      stream: MediaStream,
      limitedKinds?: LocalMediaKind[],
      options: SyncLocalTracksOptions = {}
    ) => {
      const tracks = stream
        .getTracks()
        .filter((track): track is MediaStreamTrack & { kind: LocalMediaKind } => {
          const isSupportedKind = track.kind === "audio" || track.kind === "video";
          return isSupportedKind && (!limitedKinds || limitedKinds.includes(track.kind));
        });

      logWebRTCDebug("Syncing local tracks with peer connections", {
        limitedKinds: limitedKinds ?? null,
        forceRenegotiate: options.forceRenegotiate ?? false,
        localMedia: getStreamDebug(stream),
        trackKinds: tracks.map((track) => track.kind),
        peerIds: Array.from(peerConnectionsRef.current.keys()),
      });

      if (tracks.length === 0) {
        logWebRTCDebug("Local track sync skipped because no supported tracks matched", {
          limitedKinds: limitedKinds ?? null,
          localMedia: getStreamDebug(stream),
        });
        return;
      }

      const peersToRenegotiate = new Map<string, RTCPeerConnection>();

      for (const [peerId, pc] of Array.from(peerConnectionsRef.current.entries())) {
        if (pc.signalingState === "closed") continue;

        for (const track of tracks) {
          logWebRTCDebug("Syncing local track to peer", {
            peerId,
            track: getTrackDebug(track),
            peerConnectionBefore: getPeerConnectionDebug(pc),
          });
          const transceiver = pc
            .getTransceivers()
            .find(
              (candidate: RTCRtpTransceiver) =>
                candidate.sender.track?.kind === track.kind ||
                candidate.receiver.track.kind === track.kind
          );

          if (transceiver) {
            const previousTrack = transceiver.sender.track;
            const isNewSenderTrack =
              !previousTrack ||
              previousTrack.readyState === "ended" ||
              previousTrack.id !== track.id;

            await transceiver.sender.replaceTrack(track);
            if (transceiver.direction === "recvonly" || transceiver.direction === "inactive") {
              transceiver.direction = "sendrecv";
              peersToRenegotiate.set(peerId, pc);
              logWebRTCDebug("Local track replaced recvonly/inactive transceiver", {
                peerId,
                track: getTrackDebug(track),
                previousTrack: getTrackDebug(previousTrack),
                peerConnectionAfter: getPeerConnectionDebug(pc),
              });
              continue;
            }

            if (isNewSenderTrack || options.forceRenegotiate) {
              peersToRenegotiate.set(peerId, pc);
              logWebRTCDebug("Local track replacement marked peer for renegotiation", {
                peerId,
                track: getTrackDebug(track),
                previousTrack: getTrackDebug(previousTrack),
                forceRenegotiate: options.forceRenegotiate ?? false,
                peerConnectionAfter: getPeerConnectionDebug(pc),
              });
            }
            continue;
          }

          pc.addTrack(track, stream);
          peersToRenegotiate.set(peerId, pc);
          logWebRTCDebug("Local track added to peer connection", {
            peerId,
            track: getTrackDebug(track),
            peerConnectionAfter: getPeerConnectionDebug(pc),
          });
        }
      }

      peersToRenegotiate.forEach((pc, peerId) => {
        needsNegotiationRef.current.add(peerId);
        logWebRTCDebug("Peer marked for renegotiation after local track sync", {
          peerId,
          shouldOffer: shouldCreateOffer(currentUserId, peerId),
          peerConnection: getPeerConnectionDebug(pc),
        });

        if (shouldCreateOffer(currentUserId, peerId)) {
          void createOffer(peerId, pc);
          return;
        }

        sendReady(peerId);
        scheduleNegotiationRetry(peerId, 1200);
      });

      sendMediaState();
    },
    [createOffer, currentUserId, scheduleNegotiationRetry, sendMediaState, sendReady]
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
      logWebRTCDebug("Recovered local track installed", {
        kind,
        track: getTrackDebug(track),
        localMedia: getStreamDebug(stream),
      });

      await syncLocalTracksWithPeers(stream, [kind], { forceRenegotiate: true });
    },
    [refreshLocalMediaMode, syncLocalTracksWithPeers]
  );

  const sendReadyRef = useRef(sendReady);
  const sendMediaStateRef = useRef(sendMediaState);
  const negotiateKnownPeersRef = useRef(negotiateKnownPeers);
  const createOfferRef = useRef(createOffer);
  const ensurePeerConnectionRef = useRef(ensurePeerConnection);
  const updateRemoteSignaledMediaStateRef = useRef(updateRemoteSignaledMediaState);
  const drainIceRef = useRef(drainIce);
  const syncLocalTracksWithPeersRef = useRef(syncLocalTracksWithPeers);
  const sendSignalRef = useRef(sendSignal);

  useEffect(() => {
    sendReadyRef.current = sendReady;
    sendMediaStateRef.current = sendMediaState;
    negotiateKnownPeersRef.current = negotiateKnownPeers;
    createOfferRef.current = createOffer;
    ensurePeerConnectionRef.current = ensurePeerConnection;
    updateRemoteSignaledMediaStateRef.current = updateRemoteSignaledMediaState;
    drainIceRef.current = drainIce;
    syncLocalTracksWithPeersRef.current = syncLocalTracksWithPeers;
    sendSignalRef.current = sendSignal;
  });

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
        logWebRTCDebug("Initial media acquired with audio and video", {
          localMedia: getStreamDebug(stream),
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setMediaMode("audio-only");
          setMediaWarning("No pudimos usar tu cámara, pero podés seguir con audio y chat.");
          setIsCameraOff(true);
          logWebRTCDebug("Initial media acquired with audio only", {
            localMedia: getStreamDebug(stream),
          });
        } catch {
          stream = new MediaStream();
          setMediaMode("chat-only");
          setMediaWarning("No pudimos usar tu cámara ni tu micrófono, pero podés seguir por chat.");
          setIsCameraOff(true);
          setIsMuted(true);
          logWebRTCDebug("Initial media unavailable; falling back to chat-only", {
            localMedia: getStreamDebug(stream),
          });
        }
      }

      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      logWebRTCDebug("Initial local stream installed", {
        localMedia: getStreamDebug(stream),
      });
      await syncLocalTracksWithPeersRef.current(stream);
      sendMediaStateRef.current();
      negotiateKnownPeersRef.current();
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
      .on("broadcast", { event: "participant-ready" }, ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload)) return;
        const peerId = payload.senderId;
        void queueTask(peerId, async () => {
          const hadPeerConnection = peerConnectionsRef.current.has(peerId);
          const pc = ensurePeerConnectionRef.current(peerId);
          updateRemoteSignaledMediaStateRef.current(peerId, payload);
          const remoteNeedsNegotiation = typeof payload === "object" && payload !== null && "needsNegotiation" in payload
            ? Boolean((payload as { needsNegotiation?: boolean }).needsNegotiation)
            : false;
          logWebRTCDebug("Participant-ready received", {
            peerId,
            remoteNeedsNegotiation,
            hadPeerConnection,
            localShouldOffer: shouldCreateOffer(currentUserId, peerId),
            payload: getSignalDebugMeta("participant-ready", payload),
            peerConnection: getPeerConnectionDebug(pc),
          });

          if (
            shouldCreateOffer(currentUserId, peerId) &&
            (!hadPeerConnection ||
              needsNegotiationRef.current.has(peerId) ||
              remoteNeedsNegotiation ||
              !pc.remoteDescription)
          ) {
            await createOfferRef.current(peerId, pc);
          }
        });
      })
      .on("broadcast", { event: "media-state" }, ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload)) return;
        logWebRTCDebug("Media-state received", {
          peerId: payload.senderId,
          payload: getSignalDebugMeta("media-state", payload),
        });
        updateRemoteSignaledMediaStateRef.current(payload.senderId, payload);
      })
      .on("broadcast", { event: "offer" }, ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload)) return;
        if (!isSessionSignalPayload(payload)) {
          logWebRTCDebug("Offer ignored because payload is invalid or offerId is empty", {
            payload: isSignalPayload(payload)
              ? {
                  senderId: payload.senderId,
                  targetId: payload.targetId ?? null,
                  roomId: payload.roomId,
                  offerId: "offerId" in payload ? payload.offerId : null,
                }
              : null,
          });
          return;
        }
        const peerId = payload.senderId;
        void queueTask(peerId, async () => {
          const pc = ensurePeerConnectionRef.current(peerId);
          console.log(`[WebRTC Debug] Received offer from ${peerId} (Offer ID: ${payload.offerId})`);
          logWebRTCDebug("Offer received", {
            peerId,
            offerId: payload.offerId,
            payload: getSignalDebugMeta("offer", payload),
            peerConnection: getPeerConnectionDebug(pc),
            cachedAnswer: cachedAnswersRef.current.has(payload.offerId),
          });

          try {
            const cachedAnswer = cachedAnswersRef.current.get(payload.offerId);
            if (cachedAnswer) {
              console.log(`[WebRTC Debug] Sending cached answer for offer ${payload.offerId} to ${peerId}`);
              logWebRTCDebug("Sending cached answer", {
                peerId,
                offerId: payload.offerId,
                peerConnection: getPeerConnectionDebug(pc),
              });
              await sendSignalRef.current("answer", cachedAnswer);
              return;
            }

            if (pc.signalingState !== "stable") {
              console.log(`[WebRTC Debug] Signaling state is not stable (${pc.signalingState}). Ignoring offer from ${peerId}`);
              logWebRTCDebug("Offer ignored because peer connection is not stable", {
                peerId,
                offerId: payload.offerId,
                peerConnection: getPeerConnectionDebug(pc),
              });
              return;
            }
            console.log(`[WebRTC Debug] Setting remote description for ${peerId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            logWebRTCDebug("Remote offer description installed", {
              peerId,
              offerId: payload.offerId,
              peerConnection: getPeerConnectionDebug(pc),
            });
            console.log(`[WebRTC Debug] Creating answer for ${peerId}`);
            const answer = await pc.createAnswer();
            if (!activeRef.current || getSignalingState(pc) !== "have-remote-offer") return;
            console.log(`[WebRTC Debug] Setting local description for ${peerId}`);
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
            console.log(`[WebRTC Debug] Sending answer for offer ${payload.offerId} to ${peerId}`);
            logWebRTCDebug("Answer created and cached", {
              peerId,
              offerId: payload.offerId,
              peerConnection: getPeerConnectionDebug(pc),
            });
            await sendSignalRef.current("answer", answerPayload);
            needsNegotiationRef.current.delete(peerId);
            negotiationAttemptsRef.current.delete(peerId);
            await drainIceRef.current(peerId, pc);
            sendMediaStateRef.current(peerId);
          } catch (error) {
            console.error("[WebRTC Debug] Failed to handle group WebRTC offer:", error);
          }
        });
      })
      .on("broadcast", { event: "answer" }, ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload)) return;
        if (!isSessionSignalPayload(payload)) {
          logWebRTCDebug("Answer ignored because payload is invalid or offerId is empty", {
            payload: isSignalPayload(payload)
              ? {
                  senderId: payload.senderId,
                  targetId: payload.targetId ?? null,
                  roomId: payload.roomId,
                  offerId: "offerId" in payload ? payload.offerId : null,
                }
              : null,
          });
          return;
        }
        const peerId = payload.senderId;
        void queueTask(peerId, async () => {
          console.log(`[WebRTC Debug] Received answer from ${peerId} (Offer ID: ${payload.offerId})`);
          const pc = peerConnectionsRef.current.get(peerId);
          const expectedOfferId = currentOfferIdRef.current.get(peerId);
          if (!pc || payload.offerId !== expectedOfferId) {
            console.log(`[WebRTC Debug] Answer ignored: no matching offer or different offerId for peer ${peerId}`);
            logWebRTCDebug("Answer ignored because offerId does not match current offer", {
              peerId,
              receivedOfferId: payload.offerId,
              expectedOfferId: expectedOfferId ?? null,
              hasPeerConnection: Boolean(pc),
              peerConnection: pc ? getPeerConnectionDebug(pc) : null,
            });
            return;
          }

          try {
            if (pc.signalingState !== "have-local-offer") {
              console.log(`[WebRTC Debug] Signaling state is not have-local-offer (${pc.signalingState}). Ignoring answer from ${peerId}`);
              logWebRTCDebug("Answer ignored because signaling state is not have-local-offer", {
                peerId,
                offerId: payload.offerId,
                peerConnection: getPeerConnectionDebug(pc),
              });
              return;
            }
            console.log(`[WebRTC Debug] Setting remote description for ${peerId}`);
            applyingRemoteAnswerRef.current.add(peerId);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            logWebRTCDebug("Remote answer description installed", {
              peerId,
              offerId: payload.offerId,
              peerConnection: getPeerConnectionDebug(pc),
              needsNegotiation: needsNegotiationRef.current.has(peerId),
            });
            if (currentOfferIdRef.current.get(peerId) === payload.offerId) {
              currentOfferIdRef.current.delete(peerId);
            }
            negotiationAttemptsRef.current.delete(peerId);
            await drainIceRef.current(peerId, pc);
            sendMediaStateRef.current(peerId);

            if (needsNegotiationRef.current.has(peerId) && getSignalingState(pc) === "stable") {
              console.log(`[WebRTC Debug] Re-negotiation needed with peer ${peerId}`);
              logWebRTCDebug("Follow-up renegotiation scheduled after answer", {
                peerId,
                peerConnection: getPeerConnectionDebug(pc),
              });
              scheduleNegotiationRetry(peerId, 150);
            }
          } catch (error) {
            console.error("[WebRTC Debug] Failed to handle group WebRTC answer:", error);
          } finally {
            applyingRemoteAnswerRef.current.delete(peerId);
          }
        });
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }: { payload: unknown }) => {
        if (!shouldHandlePayload(payload) || !("candidate" in payload)) return;
        const peerId = payload.senderId;
        void queueTask(peerId, async () => {
          console.log(`[WebRTC Debug] Received ICE candidate from ${peerId}`);
          const pc = ensurePeerConnectionRef.current(peerId);
          logWebRTCDebug("ICE candidate received", {
            peerId,
            candidate: getIceCandidateDebug(payload.candidate),
            hasRemoteDescription: Boolean(pc.remoteDescription),
            pendingCandidateCount: pendingIceRef.current.get(peerId)?.length ?? 0,
            peerConnection: getPeerConnectionDebug(pc),
          });

          try {
            if (pc.remoteDescription) {
              console.log(`[WebRTC Debug] Adding remote ICE candidate directly for ${peerId}`);
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              logWebRTCDebug("Remote ICE candidate added", {
                peerId,
                candidate: getIceCandidateDebug(payload.candidate),
                peerConnection: getPeerConnectionDebug(pc),
              });
              return;
            }

            console.log(`[WebRTC Debug] Buffering remote ICE candidate for ${peerId}`);
            const pending = pendingIceRef.current.get(peerId) ?? [];
            pending.push(payload.candidate);
            pendingIceRef.current.set(peerId, pending);
            logWebRTCDebug("Remote ICE candidate buffered", {
              peerId,
              candidate: getIceCandidateDebug(payload.candidate),
              pendingCandidateCount: pending.length,
            });
          } catch (error) {
            console.error("[WebRTC Debug] Failed to add group WebRTC ICE candidate:", error);
          }
        });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[WebRTC Debug] Signaling channel SUBSCRIBED for room ${roomId}`);
          channelReadyRef.current = true;
          sendReadyRef.current();
          sendMediaStateRef.current();
          negotiateKnownPeersRef.current();

          if (readyIntervalRef.current) clearInterval(readyIntervalRef.current);
          readyIntervalRef.current = setInterval(() => {
            if (activeRef.current && channelReadyRef.current) {
              const states = Array.from(peerConnectionsRef.current.values()).map((pc) => pc.connectionState);
              const hasNoPeers = peerIdsRef.current.length === 0;
              const allConnected = states.length > 0 && states.every((s) => s === "connected");

              if (allConnected || hasNoPeers) {
                console.log("[WebRTC Debug] All peers connected or no peers in room. Stopping ready interval.");
                if (readyIntervalRef.current) {
                  clearInterval(readyIntervalRef.current);
                  readyIntervalRef.current = null;
                }
              } else {
                console.log("[WebRTC Debug] Retrying ready/media broadcast to ensure sync.");
                sendReadyRef.current();
                sendMediaStateRef.current();
              }
            }
          }, 1500);
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
          console.log(`[WebRTC Debug] Signaling channel connection state: ${status}`);
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
      if (readyRetryRef.current) clearTimeout(readyRetryRef.current);
      if (readyIntervalRef.current) clearInterval(readyIntervalRef.current);
      negotiationRetryRef.current.forEach((retry) => clearTimeout(retry));

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
      applyingRemoteAnswerRef.current.clear();
      needsNegotiationRef.current.clear();
      cachedAnswersRef.current.clear();
      lastOfferRebroadcastAtRef.current.clear();
      negotiationRetryRef.current.clear();
      negotiationAttemptsRef.current.clear();
      readyRetryRef.current = null;

      if (channelRef.current) {
        unsubscribeRealtimeChannel(channelRef.current);
      }
    };
  }, [roomId, currentUserId, supabase]);

  useEffect(() => {
    if (!localStreamRef.current || !channelReadyRef.current) return;

    negotiateKnownPeers();

    peerConnectionsRef.current.forEach((pc, peerId) => {
      if (peerIds.includes(peerId)) return;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
      remoteStreamsRef.current.delete(peerId);
      negotiationAttemptsRef.current.delete(peerId);
      const retry = negotiationRetryRef.current.get(peerId);
      if (retry) clearTimeout(retry);
      negotiationRetryRef.current.delete(peerId);
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
        sendMediaState();
      });
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
    logWebRTCDebug("Local audio track toggled", {
      audioTrack: getTrackDebug(audioTrack),
      localMedia: getStreamDebug(localStreamRef.current),
    });
    sendMediaState();
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState === "ended") {
      void requestLocalTrack("video").then(async (track) => {
        if (!track) return;
        await installRecoveredTrack("video", track);
        setIsCameraOff(false);
        sendMediaState();
      });
      return;
    }

    const wasEnabled = videoTrack.enabled;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
    logWebRTCDebug("Local video track toggled", {
      wasEnabled,
      isEnabled: videoTrack.enabled,
      videoTrack: getTrackDebug(videoTrack),
      localMedia: getStreamDebug(localStreamRef.current),
    });

    if (!wasEnabled && videoTrack.enabled && localStreamRef.current) {
      logWebRTCDebug("Camera re-enabled; forcing video renegotiation with existing peers", {
        peerIds: Array.from(peerConnectionsRef.current.keys()),
      });
      void syncLocalTracksWithPeers(localStreamRef.current, ["video"], { forceRenegotiate: true });
      return;
    }

    sendMediaState();
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
