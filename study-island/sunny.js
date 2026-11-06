/* Study Island settings.
   SUNNY_URL: address of the Hadash Sunny bridge (Cloudflare Worker, see tools/sunny-bridge/worker.js).
   With an address, Sunny talks with artificial intelligence (OpenAI). If the AI fails or the
   balance runs out, Sunny switches by herself to the free guided-practice mode.
   Leave it empty ('') to use only the free guided-practice mode. */
window.SUNNY_URL = '';
