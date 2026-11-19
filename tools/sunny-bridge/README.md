# Sunny con IA (Azure OpenAI) · Study Island

Sunny funciona en dos modos:

- **Con IA (Azure OpenAI, modelo gpt-4.1-mini):** conversación libre, como una llamada, en Study Island y en el English Lab (botón ☀️ *Talk with Sunny*, niveles A1 a C1). Cada estudiante usa su **código personal** (HADASH- y 6 números al azar), que también abre Study Island, el English Lab y la Biblioteca.
- **Gratis (práctica guiada):** preguntas por nivel con el micrófono de Chrome. No necesita código.

Si la IA falla, se acaba el crédito o el código no es válido, Study Island pasa sola al modo gratis.

## Cómo está montado

- **Cerebro:** Microsoft Foundry (ai.azure.com), recurso `mercedes-moronta22-1910-resource`, despliegue `gpt-4.1-mini`.
- **Puente:** Cloudflare Worker `hadash-sunny` → https://hadash-sunny.dream-inenglish25.workers.dev/ (código en `worker.js`).
- **Página:** `study-island/sunny.js` tiene la dirección del puente.

Ajustes en Cloudflare (Worker → Settings):
- `AZURE_KEY` (Secret): la API key de Foundry. Nunca va en la página web.
- `STUDENT_CODES` (Secret): códigos de los estudiantes separados por coma. Cada uno queda amarrado al primer equipo donde se usa.
- `TEACHER_CODES` (Secret): código(s) de la maestra. Funcionan en cualquier equipo y abren la página de la maestra.
- `CLASS_CODE` (Secret): la llave interna de Study Island. Nadie la escribe; el puente la entrega cuando el código es válido.
- `DEVICES` (KV namespace `hadash-devices`, en Bindings): recuerda qué equipo tiene cada código.

## Estudiantes
- **Página de la maestra:** https://hadashacademy.github.io/maestra/ → ves qué códigos están en uso y con **Liberar** sueltas el código de un estudiante que cambió de equipo.
- **Desactivar a uno:** edita `STUDENT_CODES`, borra su código y su coma → Deploy.
- **Agregar uno:** agrega `,HADASH-` y 6 números nuevos al final → Deploy. (Para que también abra la Biblioteca hay que volver a generar `biblioteca/keys.json`.)
- El English Lab, Study Island y la Biblioteca piden el código una sola vez por equipo; después abren directo.

## Costo
Con `gpt-4.1-mini`, una conversación de unos 20 turnos cuesta alrededor de 1 a 2 centavos de dólar. Pon un presupuesto en el portal de Azure (Cost Management → Budgets).
