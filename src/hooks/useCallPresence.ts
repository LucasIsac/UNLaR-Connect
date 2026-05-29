"use client";

import { useEffect, useState, useRef } from "react";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  userId: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  roleId: number;
  available: boolean;
  onlineAt: string;
}

export interface CallPresenceMetadata {
  name?: string;
  last_name?: string;
  avatar_url?: string | null;
  role_id?: number;
}

export function useCallPresence(userId?: string, userMetadata?: CallPresenceMetadata) {
  const [onlineTutors, setOnlineTutors] = useState<Record<string, PresenceUser>>({});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const supabase = createBrowserClient();

  const metaName = userMetadata?.name;
  const metaLastName = userMetadata?.last_name;
  const metaAvatarUrl = userMetadata?.avatar_url;
  const metaRoleId = userMetadata?.role_id;

  // Keep latest tracking values in refs so the subscription effect can access them without reconnecting
  const trackingDataRef = useRef({
    userId,
    name: metaName,
    last_name: metaLastName,
    avatar_url: metaAvatarUrl,
    roleId: metaRoleId,
    available: isAvailable,
  });

  useEffect(() => {
    trackingDataRef.current = {
      userId,
      name: metaName,
      last_name: metaLastName,
      avatar_url: metaAvatarUrl,
      roleId: metaRoleId,
      available: isAvailable,
    };
  }, [userId, metaName, metaLastName, metaAvatarUrl, metaRoleId, isAvailable]);

  // Keep a ref to the active channel to allow the secondary tracking effect to interact with it
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsSubscribed(false);
      return;
    }

    // A single channel for live tutor matching presence
    const channel = supabase.channel("consultas_express_presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    const handleSync = () => {
      const state = channel.presenceState();
      const tutors: Record<string, PresenceUser> = {};

      Object.keys(state).forEach((key) => {
        const presences = state[key] as unknown as PresenceUser[];
        presences.forEach((presence) => {
          if ((presence.roleId === 3 || presence.roleId === 1) && presence.available) {
            tutors[presence.userId] = {
              userId: presence.userId,
              name: presence.name || "Tutor",
              last_name: presence.last_name || "",
              avatar_url: presence.avatar_url || null,
              roleId: presence.roleId,
              available: presence.available,
              onlineAt: presence.onlineAt,
            };
          }
        });
      });

      setOnlineTutors(tutors);
    };

    channel
      .on("presence", { event: "sync" }, handleSync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsSubscribed(true);
          // Track initial state using latest ref values
          const data = trackingDataRef.current;
          void channel.track({
            userId: data.userId,
            name: data.name || "Usuario",
            last_name: data.last_name || "",
            avatar_url: data.avatar_url || null,
            roleId: data.roleId ?? 2,
            available: data.available,
            onlineAt: new Date().toISOString(),
          });
        } else {
          setIsSubscribed(false);
        }
      });

    return () => {
      setIsSubscribed(false);
      channelRef.current = null;
      unsubscribeRealtimeChannel(channel);
    };
  }, [userId, supabase]);

  // Track state changes (like availability or metadata changes) without reconnecting!
  useEffect(() => {
    if (isSubscribed && channelRef.current && userId) {
      const data = trackingDataRef.current;
      void channelRef.current.track({
        userId,
        name: data.name || "Usuario",
        last_name: data.last_name || "",
        avatar_url: data.avatar_url || null,
        roleId: data.roleId ?? 2,
        available: data.available,
        onlineAt: new Date().toISOString(),
      });

      // Immediately update local state for responsive UI feedback
      // (the Supabase sync event may not re-fire for the originating client)
      setOnlineTutors((prev) => {
        const updated = { ...prev };
        if (data.available && (data.roleId === 3 || data.roleId === 1)) {
          updated[userId] = {
            userId,
            name: data.name || "Usuario",
            last_name: data.last_name || "",
            avatar_url: data.avatar_url || null,
            roleId: data.roleId ?? 2,
            available: true,
            onlineAt: new Date().toISOString(),
          };
        } else {
          delete updated[userId];
        }
        return updated;
      });
    }
  }, [isSubscribed, userId, isAvailable, metaName, metaLastName, metaAvatarUrl, metaRoleId]);

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`tutor_available_${userId}`);
      if (saved === "true") {
        setIsAvailable(true);
      }
    }
  }, [userId]);

  // Toggle availability status (tutors only)
  const toggleAvailability = (available: boolean) => {
    setIsAvailable(available);
    if (userId) {
      localStorage.setItem(`tutor_available_${userId}`, String(available));
    }
  };

  return {
    onlineTutors,
    isAvailable,
    toggleAvailability,
  };
}
