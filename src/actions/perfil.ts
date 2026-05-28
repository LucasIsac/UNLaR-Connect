"use server";

import { supabase } from "@/lib/supabase";
import { 
  DbUser, 
  DbTutorAvailability, 
  DbSubject, 
  DbCareer 
} from "@/types/database";

// Cast supabase to any to prevent compiler errors for undefined database clients during development
const db = supabase as any;

export interface UserProfileExtended extends DbUser {
  careerName?: string;
  isTutorActive: boolean; // Virtual field determining if tutor status is enabled
}

// ==========================================
// 🗄️ PERSISTENT MOCK STATE FOR DEVELOPMENT
// Matches the structure and points of Alejandro Garcia
// ==========================================

const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

let mockUser: DbUser = {
  id: MOCK_USER_ID,
  role_id: 2, // 2 = Estudiante, 3 = Tutor/Estudiante
  career_id: 1, // Ing. en Sistemas de Información
  name: "Alejandro",
  last_name: "Garcia",
  email: "ale.garcia@unlar.edu.ar",
  is_unlar_member: true,
  points: 2450,
  tutor_rating: 4.8,
  total_reviews: 15,
  created_at: new Date().toISOString()
};

let mockTutorActive = true;

const MOCK_CAREERS: DbCareer[] = [
  { id: 1, name: "Ingeniería en Sistemas de Información", plan_study: "2015" },
  { id: 2, name: "Licenciatura en Ciencias de la Computación", plan_study: "2020" },
  { id: 3, name: "Tecnicatura en Informática", plan_study: "2018" }
];

const MOCK_SUBJECTS: DbSubject[] = [
  { id: 1, name: "Análisis Matemático I", year: 1 },
  { id: 2, name: "Análisis Matemático II", year: 2 },
  { id: 3, name: "Programación I", year: 1 },
  { id: 4, name: "Programación II", year: 2 },
  { id: 5, name: "Paradigmas de Programación", year: 3 },
  { id: 6, name: "Sistemas Operativos", year: 3 },
  { id: 7, name: "Bases de Datos", year: 3 },
  { id: 8, name: "Álgebra", year: 1 },
  { id: 9, name: "Física I", year: 1 },
  { id: 10, name: "Ingeniería de Software", year: 4 }
];

// Active subjects Alejandro is teaching
let mockTutorSubjects: number[] = [2, 4]; // Análisis Matemático II and Programación II

// Weekly schedule availability
let mockAvailability: DbTutorAvailability[] = [
  {
    id: 1,
    tutor_id: MOCK_USER_ID,
    day_of_week: 1, // Lunes
    start_time: "18:30",
    end_time: "20:00"
  },
  {
    id: 2,
    tutor_id: MOCK_USER_ID,
    day_of_week: 3, // Miércoles
    start_time: "16:00",
    end_time: "18:00"
  }
];

// ==========================================
// 🚀 SERVER ACTIONS (SUPABASE READY)
// ==========================================

/**
 * Fetch complete profile detail for the current student
 */
export async function fetchUserProfile(): Promise<UserProfileExtended> {
  // Artificial delay to exhibit our modern skeleton UI
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false; // Set to true to switch to live Supabase db
  if (USE_REAL_DATABASE) {
    try {
      const authUserResponse = await db.auth.getUser();
      const authUser = authUserResponse?.data?.user;

      if (authUser) {
        // Fetch user matching architecture users schema
        const { data: dbUserData, error: userError } = await db
          .from("users")
          .select("*, careers(name)")
          .eq("id", authUser.id)
          .single();

        if (!userError && dbUserData) {
          // Check if user has tutor subjects or availability
          const { count: hasSubjects } = await db
            .from("tutor_subjects")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", authUser.id);

          return {
            ...dbUserData,
            careerName: dbUserData.careers?.name,
            isTutorActive: (hasSubjects || 0) > 0 || dbUserData.role_id === 3
          };
        }
      }
    } catch (err) {
      console.error("Error fetching profile from Supabase:", err);
    }
  }

  // Fallback to local mock state
  const career = MOCK_CAREERS.find(c => c.id === mockUser.career_id);
  return {
    ...mockUser,
    careerName: career ? career.name : "Ingeniería en Sistemas de Información",
    isTutorActive: mockTutorActive
  };
}

/**
 * Update general student info
 */
export async function updateUserProfile(
  name: string,
  lastName: string,
  careerId: number,
  avatarUrl?: string
): Promise<{ success: boolean; data?: UserProfileExtended; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!name.trim() || !lastName.trim()) {
      return { success: false, error: "El nombre y apellido no pueden quedar vacíos." };
    }

    const USE_REAL_DATABASE = false;
    if (USE_REAL_DATABASE) {
      try {
        const authUserResponse = await db.auth.getUser();
        const authUser = authUserResponse?.data?.user;

        if (authUser) {
          const { error } = await db
            .from("users")
            .update({
              name: name.trim(),
              last_name: lastName.trim(),
              career_id: careerId
            })
            .eq("id", authUser.id);

          if (error) throw error;

          // Fetch career name and updated details
          const { data: dbUserData, error: getError } = await db
            .from("users")
            .select("*, careers(name)")
            .eq("id", authUser.id)
            .single();

          if (!getError && dbUserData) {
            return {
              success: true,
              data: {
                ...dbUserData,
                careerName: dbUserData.careers?.name,
                isTutorActive: dbUserData.role_id === 3
              }
            };
          }
        }
      } catch (err) {
        console.error("Error updating user profile in Supabase:", err);
        return { success: false, error: "Hubo un error al actualizar los datos en Supabase." };
      }
    }

    // Mutate mock state
    mockUser.name = name.trim();
    mockUser.last_name = lastName.trim();
    mockUser.career_id = careerId;

    const career = MOCK_CAREERS.find(c => c.id === careerId);
    const updated: UserProfileExtended = {
      ...mockUser,
      careerName: career ? career.name : "Ingeniería en Sistemas de Información",
      isTutorActive: mockTutorActive
    };

    return { success: true, data: updated };
  } catch (err) {
    console.error("Error updating profile:", err);
    return { success: false, error: "Tuvimos un drama al guardar tu información personal." };
  }
}

/**
 * Toggle tutor profile condition
 */
export async function toggleTutorStatus(
  active: boolean
): Promise<{ success: boolean; isTutorActive: boolean; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const USE_REAL_DATABASE = false;
    if (USE_REAL_DATABASE) {
      try {
        const authUserResponse = await db.auth.getUser();
        const authUser = authUserResponse?.data?.user;

        if (authUser) {
          const { error } = await db
            .from("users")
            .update({ role_id: active ? 3 : 2 }) // 3 represents Tutor, 2 represents regular student
            .eq("id", authUser.id);

          if (error) throw error;
          
          return { success: true, isTutorActive: active };
        }
      } catch (err) {
        console.error("Error toggling tutor status in Supabase:", err);
        return { success: false, isTutorActive: !active, error: "No se pudo cambiar el estado de tutor en base de datos." };
      }
    }

    // Mutate mock state
    mockTutorActive = active;
    mockUser.role_id = active ? 3 : 2; 

    return { success: true, isTutorActive: active };
  } catch (err) {
    console.error("Error toggling tutor status:", err);
    return { success: false, isTutorActive: !active, error: "No pudimos modificar tu estado de tutor." };
  }
}

/**
 * Fetch subjects student is registered to teach
 */
export async function fetchTutorSubjects(): Promise<DbSubject[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const USE_REAL_DATABASE = false;
  if (USE_REAL_DATABASE) {
    try {
      const authUserResponse = await db.auth.getUser();
      const authUser = authUserResponse?.data?.user;

      if (authUser) {
        const { data } = await db
          .from("tutor_subjects")
          .select("subjects(*)")
          .eq("tutor_id", authUser.id);
        
        if (data) {
          return data.map((item: any) => item.subjects);
        }
      }
    } catch (err) {
      console.error("Error fetching tutor subjects from Supabase:", err);
    }
  }

  // Filter mock subjects matching IDs
  return MOCK_SUBJECTS.filter(s => mockTutorSubjects.includes(s.id));
}

/**
 * Link a new subject for teaching
 */
export async function addTutorSubject(
  subjectId: number
): Promise<{ success: boolean; data?: DbSubject[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const USE_REAL_DATABASE = false;
    if (USE_REAL_DATABASE) {
      try {
        const authUserResponse = await db.auth.getUser();
        const authUser = authUserResponse?.data?.user;

        if (authUser) {
          // Double check if already registered
          const { count } = await db
            .from("tutor_subjects")
            .select("*", { count: "exact", head: true })
            .eq("tutor_id", authUser.id)
            .eq("subject_id", subjectId);

          if ((count || 0) > 0) {
            return { success: false, error: "Ya estás dictando esta materia." };
          }

          const { error } = await db
            .from("tutor_subjects")
            .insert({ tutor_id: authUser.id, subject_id: subjectId });
          
          if (error) throw error;

          // Fetch updated subjects
          const { data } = await db
            .from("tutor_subjects")
            .select("subjects(*)")
            .eq("tutor_id", authUser.id);
          
          if (data) {
            return { success: true, data: data.map((item: any) => item.subjects) };
          }
        }
      } catch (err) {
        console.error("Error adding tutor subject in Supabase:", err);
        return { success: false, error: "Tuvimos un error al insertar la materia en Supabase." };
      }
    }

    // Mock Fallback
    if (mockTutorSubjects.includes(subjectId)) {
      return { success: false, error: "Ya estás dictando esta materia." };
    }

    mockTutorSubjects.push(subjectId);
    const updatedList = MOCK_SUBJECTS.filter(s => mockTutorSubjects.includes(s.id));
    return { success: true, data: updatedList };
  } catch (err) {
    console.error("Error adding tutor subject:", err);
    return { success: false, error: "No se pudo vincular la materia." };
  }
}

/**
 * Remove a subject from tutor subjects
 */
export async function removeTutorSubject(
  subjectId: number
): Promise<{ success: boolean; data?: DbSubject[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const USE_REAL_DATABASE = false;
    if (USE_REAL_DATABASE) {
      try {
        const authUserResponse = await db.auth.getUser();
        const authUser = authUserResponse?.data?.user;

        if (authUser) {
          const { error } = await db
            .from("tutor_subjects")
            .delete()
            .eq("tutor_id", authUser.id)
            .eq("subject_id", subjectId);
          
          if (error) throw error;

          // Fetch updated list
          const { data } = await db
            .from("tutor_subjects")
            .select("subjects(*)")
            .eq("tutor_id", authUser.id);
          
          if (data) {
            return { success: true, data: data.map((item: any) => item.subjects) };
          }
        }
      } catch (err) {
        console.error("Error removing tutor subject in Supabase:", err);
        return { success: false, error: "No se pudo remover la materia de Supabase." };
      }
    }

    // Mock fallback
    mockTutorSubjects = mockTutorSubjects.filter(id => id !== subjectId);
    const updatedList = MOCK_SUBJECTS.filter(s => mockTutorSubjects.includes(s.id));
    return { success: true, data: updatedList };
  } catch (err) {
    console.error("Error removing tutor subject:", err);
    return { success: false, error: "No se pudo desvincular la materia." };
  }
}

/**
 * Fetch tutor schedule availability
 */
export async function fetchTutorAvailability(): Promise<DbTutorAvailability[]> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const USE_REAL_DATABASE = false;
  if (USE_REAL_DATABASE) {
    try {
      const authUserResponse = await db.auth.getUser();
      const authUser = authUserResponse?.data?.user;

      if (authUser) {
        const { data } = await db
          .from("tutor_availability")
          .select("*")
          .eq("tutor_id", authUser.id)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true });
        
        if (data) return data;
      }
    } catch (err) {
      console.error("Error fetching availability from Supabase:", err);
    }
  }

  return mockAvailability;
}

/**
 * Register availability schedule slots
 */
export async function saveTutorAvailability(
  availabilityList: DbTutorAvailability[]
): Promise<{ success: boolean; data?: DbTutorAvailability[]; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));

    const USE_REAL_DATABASE = false;
    if (USE_REAL_DATABASE) {
      try {
        const authUserResponse = await db.auth.getUser();
        const authUser = authUserResponse?.data?.user;

        if (authUser) {
          // Clear all previous slots
          const { error: deleteError } = await db
            .from("tutor_availability")
            .delete()
            .eq("tutor_id", authUser.id);
          
          if (deleteError) throw deleteError;

          // Insert new slots if list is not empty
          if (availabilityList.length > 0) {
            const insertData = availabilityList.map(slot => ({
              tutor_id: authUser.id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time
            }));
            const { error: insertError } = await db
              .from("tutor_availability")
              .insert(insertData);
            if (insertError) throw insertError;
          }

          // Fetch updated schedule slots
          const { data } = await db
            .from("tutor_availability")
            .select("*")
            .eq("tutor_id", authUser.id)
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true });
          
          if (data) return { success: true, data };
        }
      } catch (err) {
        console.error("Error saving availability in Supabase:", err);
        return { success: false, error: "No se pudo guardar la agenda de disponibilidad en Supabase." };
      }
    }

    // Map availability to mock storage
    mockAvailability = availabilityList.map((slot, index) => ({
      id: slot.id || index + 1,
      tutor_id: MOCK_USER_ID,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    }));

    return { success: true, data: mockAvailability };
  } catch (err) {
    console.error("Error saving availability:", err);
    return { success: false, error: "No se pudo guardar la agenda de horarios." };
  }
}

/**
 * Fetch official list of careers for dropdown selection
 */
export async function fetchCareers(): Promise<DbCareer[]> {
  return MOCK_CAREERS;
}

/**
 * Fetch all official college subjects
 */
export async function fetchSubjects(): Promise<DbSubject[]> {
  return MOCK_SUBJECTS;
}
