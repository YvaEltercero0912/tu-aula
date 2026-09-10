# Tu Aula

Plataforma mobile-first para profesores y familias.

## Incluye

- Registro/login de Profesor y Padre/Tutor
- Cursos y alumnos
- Creación/vinculación automática de tutores
- Asistencia: presente, ausente y tarde
- Justificaciones
- Calificaciones y promedios
- Contraseña temporal para tutores
- Comunicados a un curso completo o a un tutor específico
- Centro de notificaciones internas
- Web Push para faltas, notas, justificaciones y comunicados
- Manifest y Service Worker para instalar Tu Aula como web app

## Instalar

```bash
npm install
npm run dev
```

`web-push` se instala como dependencia del proyecto.

## Push real en celulares

La app genera y conserva automáticamente en MongoDB un par de claves VAPID la primera vez que se activa Web Push. No hace falta crear claves manualmente.

Web Push requiere un contexto seguro HTTPS. `localhost` sirve para pruebas de escritorio, pero una URL local del tipo `http://192.168.x.x:3000` no puede activar Push API en el teléfono. Para probar push real en celular, publicá el proyecto en Vercel o en otro dominio HTTPS.

En iPhone/iPad, agregá Tu Aula a la pantalla de inicio y abrila desde ese icono antes de activar notificaciones.

## Probar Comunicados

Profesor:

1. Entrar en **Avisos / Comunicados**.
2. Elegir todo un curso o un tutor.
3. Escribir título y mensaje.
4. Enviar.

Padre/Tutor:

1. Recibe el comunicado en **Comunicados**.
2. También recibe una notificación interna.
3. Si activó Web Push en un dominio HTTPS, recibe el aviso aunque Tu Aula esté cerrada.


## Nuevos módulos
- Agenda escolar y tareas con avisos push a familias.
- Boletín digital por período calculado desde las calificaciones.
- Importación masiva de alumnos/tutores/cursos desde Excel.

Para la importación Excel ejecutar `npm install` para instalar `xlsx`.
