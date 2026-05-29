import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import LogoSwitcher from "@/components/ui/LogoSwitcher";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const montserrat = Montserrat({
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
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var attrName = 'bis_skin_checked';
                  var clean = function(root) {
                    if (!root || root.nodeType !== 1) return;
                    if (root.hasAttribute && root.hasAttribute(attrName)) {
                      root.removeAttribute(attrName);
                    }
                    if (root.querySelectorAll) {
                      root.querySelectorAll('[' + attrName + ']').forEach(function(node) {
                        node.removeAttribute(attrName);
                      });
                    }
                  };

                  clean(document.documentElement);

                  var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      if (mutation.type === 'attributes') {
                        clean(mutation.target);
                      } else {
                        mutation.addedNodes.forEach(clean);
                      }
                    });
                  });

                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: [attrName]
                  });

                  window.addEventListener('load', function() {
                    window.setTimeout(function() {
                      observer.disconnect();
                      clean(document.documentElement);
                    }, 3000);
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased custom-scrollbar" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <LogoSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
