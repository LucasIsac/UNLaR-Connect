import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNLaR Connect - Banco de Recursos, Tutorías y Foros con Inteligencia Artificial",
  description: "La plataforma monolítica premium de UNLaR para conectar estudiantes, coordinar tutorías P2P, foros dinámicos y chatbot con asistencia RAG de PDFs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased custom-scrollbar">
        {children}
      </body>
    </html>
  );
}
