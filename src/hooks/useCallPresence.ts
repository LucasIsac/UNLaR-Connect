"use client";

import { useEffect, useState } from "react";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";


export interface PresenceUser {
  userId: string;
  name: string;
  last_name: string;
  avatar_url: string | null;
  roleId: number;
  available: boolean;
  onlineAt: string;
}

export function useCallPresence(userId?: string, userMetadata?: any) {
  const [onlineTutors, setOnlineTutors] = useState<Record<string, PresenceUser>>({});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const supabase = createBrowserClient();

  const metaName = userMetadata?.name;
  const metaLastName = userMetadata?.last_name;
  const metaAvatarUrl = userMetadata?.avatar_url;
  const metaRoleId = userMetadata?.role_id;

  useEffect(() => {
    if (!userId) return;

    // A single channel for live tutor matching presence
    const channel = supabase.channel("consultas_express_presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const handleSync = () => {
      const state = channel.presenceState();
      const tutors: Record<string, PresenceUser> = {};

      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        presences.forEach((presence) => {
          if (presence.roleId === 3 && presence.available) {
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
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track initial state
          await channel.track({
            userId,
            name: metaName || "Usuario",
            last_name: metaLastName || "",
            avatar_url: metaAvatarUrl || null,
            roleId: metaRoleId ?? 2,
            available: isAvailable,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [userId, isAvailable, metaName, metaLastName, metaAvatarUrl, metaRoleId]);

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
