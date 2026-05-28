"use server";

import { supabase } from "@/lib/supabase";
import { DbDocument } from "@/types/database";

export interface ResourceExtended extends DbDocument {
  category: string;
  categoryColor: string;
  thematicAxis: string;
  authorName: string;
  uploadedDate: string;
  saved: boolean;
  likes: number;
  description: string;
}

const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

let mockResources: ResourceExtended[] = [
  {
    id: "doc-1",
    user_id: "user-matias",
    subject_id: 1,
    topic_id: 10,
    title: "Apunte Resumido - Unidad 3 Teoría SO",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/final-so-2023.pdf",
    uploaded_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    upvotes: 124,
    category: "Sistemas Operativos",
    categoryColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    thematicAxis: "Gestión de Memoria",
    authorName: "Matias G.",
    uploadedDate: "24/05/26",
    likes: 124,
    saved: false,
    description: "Apunte detallado sobre gestión de memoria, procesos, hilos y concurrencia. Incluye ejemplos prácticos y preguntas frecuentes de finales."
  },
  {
    id: "doc-2",
    user_id: "user-ana",
    subject_id: 2,
    topic_id: 20,
    title: "Ejercicios SQL Resueltos (Práctica 1 a 4)",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/ejercicios-sql.pdf",
    uploaded_at: new Date(Date.now() - 12 * 24 * 3600000).toISOString(),
    upvotes: 89,
    category: "Bases de Datos",
    categoryColor: "text-secondary bg-secondary/10 border-secondary/20",
    thematicAxis: "Consultas SQL",
    authorName: "Ana P.",
    uploadedDate: "15/05/26",
    likes: 89,
    saved: true,
    description: "Resolución paso a paso de las guías prácticas. Consultas simples, joins complejos, subconsultas y optimización."
  },
  {
    id: "doc-3",
    user_id: "user-catedra",
    subject_id: 3,
    topic_id: 30,
    title: "Introducción a Haskell y Funcional",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/haskell-intro.pdf",
    uploaded_at: new Date(Date.now() - 25 * 24 * 3600000).toISOString(),
    upvotes: 210,
    category: "Paradigmas de Prog.",
    categoryColor: "text-accent bg-accent/10 border-accent/20",
    thematicAxis: "Programación Funcional",
    authorName: "Cátedra",
    uploadedDate: "02/05/26",
    likes: 210,
    saved: false,
    description: "Diapositivas de la cátedra anotadas. Conceptos de inmutabilidad, funciones de orden superior y currying."
  },
  {
    id: "doc-4",
    user_id: "user-lucas-d",
    subject_id: 4,
    topic_id: 40,
    title: "Patrones de Diseño GoF (Cheat Sheet)",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/patrones-gof.pdf",
    uploaded_at: new Date(Date.now() - 36 * 24 * 3600000).toISOString(),
    upvotes: 345,
    category: "Ing. de Software",
    categoryColor: "text-muted-foreground bg-muted border-border",
    thematicAxis: "Patrones de Diseño",
    authorName: "Lucas D.",
    uploadedDate: "20/04/26",
    likes: 345,
    saved: false,
    description: "Guía rápida visual de los 23 patrones de diseño con diagramas UML simplificados y ejemplos de uso en Java."
  },
  {
    id: "doc-5",
    user_id: "user-carla",
    subject_id: 5,
    topic_id: 50,
    title: "Fórmulas y Demostraciones - 2do Parcial",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/formulas-analisis2.pdf",
    uploaded_at: new Date(Date.now() - 38 * 24 * 3600000).toISOString(),
    upvotes: 67,
    category: "Análisis Matemático II",
    categoryColor: "text-secondary bg-secondary/10 border-secondary/20",
    thematicAxis: "Integrales Múltiples",
    authorName: "Carla M.",
    uploadedDate: "18/04/26",
    likes: 67,
    saved: false,
    description: "Compilado de todas las fórmulas de integrales múltiples, teoremas de Green, Stokes y Gauss con demostraciones paso a paso."
  },
  {
    id: "doc-6",
    user_id: "user-franco",
    subject_id: 6,
    topic_id: 60,
    title: "Guía de Árboles y Grafos en C++",
    document_type: "pdf",
    storage_url: "https://supabase.unlarconnect/apuntes/arboles-grafos.pdf",
    uploaded_at: new Date(Date.now() - 46 * 24 * 3600000).toISOString(),
    upvotes: 156,
    category: "Programación II",
    categoryColor: "text-accent bg-accent/10 border-accent/20",
    thematicAxis: "Árboles y Grafos",
    authorName: "Franco L.",
    uploadedDate: "10/04/26",
    likes: 156,
    saved: true,
    description: "Implementaciones de BST, AVL, grafos con listas de adyacencia y algoritmos de búsqueda (DFS, BFS, Dijkstra)."
  }
];

/**
 * Fetch all resources/documents
 */
export async function fetchResources(): Promise<ResourceExtended[]> {
  // Artificial delay to show off the beautiful skeleton loader
  await new Promise(resolve => setTimeout(resolve, 800));

  const USE_REAL_DATABASE = false;
  if (USE_REAL_DATABASE) {
    try {
      // Real database query:
      // const { data } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
    } catch (error) {
      console.error(error);
    }
  }

  return mockResources;
}

/**
 * Upload resource document metadata entry
 */
export async function uploadResource(
  title: string,
  category: string,
  thematicAxis: string,
  type: string
): Promise<{ success: boolean; data?: ResourceExtended; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!title.trim()) {
      return { success: false, error: "El título del apunte es obligatorio." };
    }

    let catColor = "text-accent bg-accent/10 border-accent/20";
    if (category === "Sistemas Operativos") {
      catColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
    } else if (category === "Bases de Datos") {
      catColor = "text-secondary bg-secondary/10 border-secondary/20";
    }

    const newDoc: ResourceExtended = {
      id: `doc-${Date.now()}`,
      user_id: MOCK_USER_ID,
      title: title.trim(),
      document_type: "pdf",
      storage_url: `https://supabase.unlarconnect/apuntes/${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      uploaded_at: new Date().toISOString(),
      upvotes: 1,
      category,
      categoryColor: catColor,
      thematicAxis,
      authorName: "Tu Perfil",
      uploadedDate: "Hoy",
      likes: 1,
      saved: false,
      description: `Material sobre ${thematicAxis} (${type}). Aportado voluntariamente por la comunidad de la carrera.`
    };

    mockResources = [newDoc, ...mockResources];

    // Supabase equivalent insert queries:
    // await supabase.from('documents').insert(newDoc);

    return { success: true, data: newDoc };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Hubo un problema al registrar tu apunte." };
  }
}

/**
 * Favorite or save a resource
 */
export async function toggleSaveResource(
  resourceId: string
): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const docIndex = mockResources.findIndex(r => r.id === resourceId);
    if (docIndex === -1) {
      return { success: false, error: "Apunte no encontrado." };
    }

    mockResources[docIndex].saved = !mockResources[docIndex].saved;

    // Supabase equivalent query:
    // if (mockResources[docIndex].saved) {
    //   await supabase.from('saved_documents').insert({ user_id: MOCK_USER_ID, document_id: resourceId });
    // } else {
    //   await supabase.from('saved_documents').delete().eq('user_id', MOCK_USER_ID).eq('document_id', resourceId);
    // }

    return { success: true, saved: mockResources[docIndex].saved };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar el estado de guardado." };
  }
}

/**
 * Cast vote/like on resource card
 */
export async function castResourceVote(
  resourceId: string
): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const docIndex = mockResources.findIndex(r => r.id === resourceId);
    if (docIndex === -1) {
      return { success: false, error: "Apunte no encontrado." };
    }

    mockResources[docIndex].likes += 1;
    mockResources[docIndex].upvotes += 1;

    // Supabase update:
    // await supabase.from('documents').update({ upvotes: mockResources[docIndex].upvotes }).eq('id', resourceId);

    return { success: true, likes: mockResources[docIndex].likes };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo registrar tu me gusta." };
  }
}
