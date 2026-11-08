/* Study Island settings.
   SUNNY_URL: address of the Hadash Sunny bridge (Cloudflare Worker, see tools/sunny-bridge/worker.js).
   With an address, Sunny talks with artificial intelligence (Azure OpenAI). Each student needs a personal Sunny code. If the AI fails or the
   balance runs out, Sunny switches by herself to the free guided-practice mode.
   Leave it empty ('') to use only the free guided-practice mode. */
window.SUNNY_URL = 'https://hadash-sunny.dream-inenglish25.workers.dev/';
