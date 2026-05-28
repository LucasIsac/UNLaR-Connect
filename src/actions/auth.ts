"use server";

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getSafeRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

/**
 * Log in a user using email and password.
 */
export async function loginAction(data: { email: string; password: string; next?: string }) {
  const redirectPath = getSafeRedirectPath(data.next);

  try {
    const supabase = createServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Localize common auth errors
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return { 
          success: false, 
          error: "Che, las credenciales no son correctas. Verificá tu email y clave." 
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
  } catch (err) {
    console.error(err);
    return { success: false, error: "Hubo un drama al iniciar sesión. Intentalo de nuevo." };
  }

  redirect(redirectPath);
}

/**
 * Register a new user using email, password, first name, and last name.
 */
export async function registerAction(data: { 
  name: string; 
  lastName: string; 
  email: string; 
  password: string; 
}) {
  try {
    const supabase = createServerClient();
    
    // Sign up using Supabase Auth
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.name,
          last_name: data.lastName,
          name: `${data.name} ${data.lastName}`,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already exists")) {
        return { 
          success: false, 
          error: "Este correo electrónico ya está registrado. Probá iniciando sesión." 
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Tuvimos un problema al registrar tu cuenta." };
  }
}

/**
 * Log out the current user.
 */
export async function signOutAction() {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "No se pudo cerrar la sesión." };
  }
}

/**
 * Soft delete the currently logged-in user account.
 */
export async function softDeleteAccountAction() {
  try {
    const supabase = createServerClient();
    
    // 1. Get active authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Che, no estás autenticado." };
    }

    // 2. Set deleted_at timestamp in public.users
    const { error } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw error;

    // 3. Clear session cookie by signing out
    await supabase.auth.signOut();
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error soft deleting account:", err);
    return { success: false, error: "Tuvimos un drama al intentar dar de baja tu cuenta." };
  }
}

/**
 * Reactivate a soft-deleted user account.
 */
export async function reactivateAccountAction() {
  try {
    const supabase = createServerClient();
    
    // 1. Get active authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Che, no estás autenticado." };
    }

    // 2. Set deleted_at back to NULL in public.users
    const { error } = await supabase
      .from("users")
      .update({ deleted_at: null })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error reactivating account:", err);
    return { success: false, error: "No pudimos reactivar tu cuenta. Intentalo de nuevo." };
  }
}

