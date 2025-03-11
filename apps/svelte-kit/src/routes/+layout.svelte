<script lang="ts">
  import { mountVercelToolbar } from "@vercel/toolbar/vite";
  import { onMount } from "svelte";
  import Cookies from "js-cookie";
  import Footer from "./Footer.svelte";

  let { children } = $props();

  interface ToolbarMessage {
    type: string;
    payload: string;
  }

  // ONLY for dev purposes (don't expose localhost in prod)
  let validOrigins = [
    "https://preview.tc-vercel.dev",
    "http://localhost:3000",
    "https://www.tc-vercel.dev",
  ];

  const handleMessage = (event: MessageEvent) => {
    if (typeof window !== "undefined") {
      // Ensure the message is from the parent domain
      if (!validOrigins.includes(event.origin)) return;

      const message = event.data as ToolbarMessage;
      if (message.payload === "null") {
        console.log("Clearing Flag Cookies (Svelte)");
        // Remove the cookie
        Cookies.remove("vercel-flag-overrides");
      } else {
        // Set the cookie
        Cookies.set("vercel-flag-overrides", message.payload);
        console.log("Setting Flag Cookies (Svelte)", { path: "/" });
      }
      console.log(
        "validOrigins[validOrigins.indexOf(event.origin)]",
        validOrigins[validOrigins.indexOf(event.origin)]
      );
      window.parent.postMessage(
        {
          type: "IFRAME_MESSAGE",
          payload: `Cookies updated: ${message.payload}`,
        },
        validOrigins[validOrigins.indexOf(event.origin)]
      );
      console.log('Sending:message.payload', message.payload)
    }
  };

  // This always shows the toolbar in production. In your project, you probably
  // want to show it only under certain conditions.
  onMount(() => {
    console.log('Mounting main Layout')
    mountVercelToolbar();
    setTimeout(() => {
      if (typeof window !== "undefined") {
        console.log("Mounting Listener!!");
        window.addEventListener("message", handleMessage);
      }
    }, 1000);
  });
</script>

<main>
  {@render children?.()}
</main>
<Footer />

<style>
  :global(html, body) {
    height: 100%;
  }

  :global(body) {
    --fg: black;
    --bg: rgb(250, 250, 250);
    --svelte: #ff3e00;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background: var(--bg);
    color: var(--fg);
    overflow: hidden;
  }

  main {
    margin: 0 auto;
    max-width: 60rem;
    padding: 2rem;
  }

  @media (prefers-color-scheme: dark) {
    :global(body) {
      --fg: white;
      --bg: black;
    }
  }
</style>
