# Guía de Pruebas en Producción — Consultas Express 🚀

Esta guía es para que **dos testers** puedan probar la funcionalidad de videollamadas 1-on-1 (**Consultas Express**) en vivo.

---

## 🛠️ Requisitos Previos

1. **Dos dispositivos o navegadores distintos** (por ejemplo, uno en Chrome y otro en Safari/Firefox, o dos computadoras/celulares separados).
2. **Dos cuentas de usuario registradas**:
   - **Usuario A (El Tutor)**: Debe tener asignado el rol de Tutor en la base de datos (con permisos para enseñar).
   - **Usuario B (El Estudiante)**: Puede ser cualquier cuenta con rol de estudiante.
3. **Cámara y micrófono habilitados** en ambos dispositivos.
4. **Conectividad**: Preferentemente usen datos móviles o redes hogareñas. Eviten Wi-Fi corporativos o universitarios muy estrictos que bloqueen el tráfico P2P directo si no hay un servidor TURN configurado.

---

## 👣 Paso a Paso del Flujo de Pruebas

### Paso 1: Preparación del Tutor (Usuario A)
1. Iniciá sesión con la cuenta de **Tutor**.
2. Dirigite a la sección **Consultas Express** en la barra lateral (o navegá a `/tutorias`).
3. En el panel superior derecho, vas a ver el interruptor **"Tu disponibilidad"**.
4. Activá el switch para cambiar tu estado a **"Estoy disponible"** (se pondrá en color verde).
5. Quedate en esa pestaña esperando el llamado.

### Paso 2: Búsqueda del Estudiante (Usuario B)
1. Iniciá sesión en el otro dispositivo con la cuenta de **Estudiante**.
2. Dirigite a la sección **Consultas Express** (`/tutorias`).
3. En la lista de **"Tutores Activos en Línea"**, deberías ver la tarjeta del **Usuario A** con su reputación, foto y materias que enseña.
4. *(Opcional)* Usá el filtro de materias en la barra superior para buscar la materia del tutor.

### Paso 3: El Llamado (Usuario B 📞 Usuario A)
1. El **Estudiante** hace clic en el botón **"Pedir ayuda en vivo"** en la tarjeta del tutor.
2. Al estudiante se le abrirá una pantalla de carga que dice: *"Esperando que el tutor acepte la consulta..."*
3. Al **Tutor** le aparecerá instantáneamente en la pantalla un banner animado con sonido y vibración que dice: **"¡Consulta entrante! [Nombre del estudiante] necesita una mano en [Materia]"**.

### Paso 4: Aceptar la Consulta (Usuario A)
1. El **Tutor** hace clic en el botón verde con el icono de check (**Aceptar**) en el banner flotante.
2. Inmediatamente, la plataforma redireccionará de manera automática a ambos usuarios a la sala de videollamada en `/tutorias/sala/[roomId]`.

### Paso 5: Dentro de la Sala de Consulta (Ambos)
Una vez adentro, verifiquen las siguientes interacciones:
- **Video y Audio**: Deberían ver la transmisión de la cámara de su compañero en pantalla grande, y su propia miniatura flotando arriba a la derecha.
- **Controles Inferiores**:
  - Prueben silenciar el micrófono (icono de Mic).
  - Prueben apagar la cámara (icono de Video).
  - Prueben ocultar/mostrar el panel lateral de chat.
- **Chat en Vivo**: Abran la pestaña **"Chat"** en la derecha, envíen mensajes de texto y verifiquen que aparezcan al instante en ambas pantallas.
- **Apuntes Contextuales**: Cambien a la pestaña **"Apuntes"** en el panel lateral. Deberían ver la lista de PDFs subidos para esa materia y poder descargarlos directamente desde la llamada.

### Paso 6: Finalizar la Consulta
1. Cualquiera de los dos usuarios puede hacer clic en el botón rojo de **Colgar** en la barra de controles inferior.
2. Ambos serán desconectados de la transmisión P2P y redirigidos automáticamente de vuelta al panel principal de `/tutorias`.
3. Verifiquen en el panel derecho de `/tutorias` que la consulta ahora figure registrada en el **"Historial de consultas"** con estado **"Terminada"**.

---

## ⚠️ ¿Qué hacer si no se conecta el video? (Resolución de Problemas)

Debido a que las conexiones directas WebRTC (Peer-to-Peer) dependen de que los enrutadores permitan tráfico directo:
- **Si se queda en "Estableciendo conexión..." por más de 15 segundos**: El sistema activará el fallback de contingencia mostrando un banner rojo: *"No pudimos conectar el video en esta red. Podés seguir por chat o reintentar."*
- **Solución rápida**: 
  - Desconecten uno de los dispositivos del Wi-Fi de la facultad o red restringida y conéctenlo a **datos móviles (4G/5G)**, o compartan internet desde el celular. Las redes móviles casi nunca tienen restricciones NAT estrictas y la llamada conectará al toque.
  - El chat interno y los apuntes seguirán funcionando perfectamente como vía de comunicación alternativa.
