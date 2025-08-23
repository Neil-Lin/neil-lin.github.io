// plugins/hydration-debug.client.ts
export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp();
  const app = nuxtApp.vueApp;
  app.config.warnHandler = (msg, instance, trace) => {
    if (typeof msg === "string" && msg.includes("Hydration")) {
      const file = (instance as any)?.type?.__file || "(no file)";
      console.warn(
        "[Hydration warn]",
        msg,
        "\ncomponent:",
        file,
        "\ntrace:",
        trace,
      );
    }
  };
});
