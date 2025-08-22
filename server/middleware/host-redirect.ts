export default defineEventHandler((event) => {
  const host = getRequestHeader(event, "host") || "";
  if (host.endsWith("netlify.app")) {
    return sendRedirect(event, `https://neillin.com${event.path}`, 301);
  }
});
