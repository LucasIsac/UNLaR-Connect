"use server";

import { createServerClient } from "@/lib/supabase";
import { DbNotification } from "@/types/database";
import { revalidatePath } from "next/cache";

/**
 * Fetch all notifications for the authenticated user
 */
export async function fetchNotificationsAction(): Promise<DbNotification[]> {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsReadAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return { success: false, error: err instanceof Error ? err.message : "No se pudo marcar la notificación como leída." };
  }
}

/**
 * Mark all notifications for the active user as read
 */
export async function markAllNotificationsAsReadAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No estás autenticado/a." };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    return { success: false, error: err instanceof Error ? err.message : "No se pudieron marcar las notificaciones." };
  }
}
