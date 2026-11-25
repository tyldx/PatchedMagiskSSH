<script lang="ts">
  import Dashboard from "./lib/Dashboard.svelte";
  import ConfigEditor from "./lib/ConfigEditor.svelte";
  import KeyManager from "./lib/KeyManager.svelte";
  import LogViewer from "./lib/LogViewer.svelte";
  import { _, isLoading, locale } from "svelte-i18n";
  import { debugEnabled, toggleDebug } from "./lib/ksu";
  import {
    Button,
    Icon,
    LoadingIndicator,
    NavCMLX,
    NavCMLXItem,
    Snackbar,
  } from "m3-svelte";
  import iconTerminal from "@ktibow/iconset-material-symbols/terminal-rounded";
  import iconBug from "@ktibow/iconset-material-symbols/bug-report-rounded";
  import iconBugOutline from "@ktibow/iconset-material-symbols/bug-report-outline-rounded";
  import iconDark from "@ktibow/iconset-material-symbols/dark-mode-outline-rounded";
  import iconLight from "@ktibow/iconset-material-symbols/light-mode-outline-rounded";
  import iconTranslate from "@ktibow/iconset-material-symbols/translate-rounded";
  import iconHome from "@ktibow/iconset-material-symbols/home-rounded";
  import iconHomeOutline from "@ktibow/iconset-material-symbols/home-outline-rounded";
  import iconTune from "@ktibow/iconset-material-symbols/tune-rounded";
  import iconKey from "@ktibow/iconset-material-symbols/key-rounded";
  import iconKeyOutline from "@ktibow/iconset-material-symbols/key-outline-rounded";
  import iconLog from "@ktibow/iconset-material-symbols/receipt-long-rounded";
  import iconLogOutline from "@ktibow/iconset-material-symbols/receipt-long-outline-rounded";

  type Page = "status" | "config" | "keys" | "logs";

  const pages = [
    { id: "status", icon: iconHomeOutline, iconSelected: iconHome },
    { id: "config", icon: iconTune, iconSelected: iconTune },
    { id: "keys", icon: iconKeyOutline, iconSelected: iconKey },
    { id: "logs", icon: iconLogOutline, iconSelected: iconLog },
  ] as const;

  let page = $state<Page>("status");

  let isZh = $derived(($locale ?? "").startsWith("zh"));

  function toggleLanguage() {
    locale.set(isZh ? "en" : "zh");
  }

  const stored = localStorage.getItem("theme");
  let isDark = $state(
    stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  $effect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center bg-surface">
    <LoadingIndicator aria-label="Loading" />
  </div>
{:else}
  <div class="min-h-screen bg-surface text-on-surface pb-24">
    <header
      class="sticky top-0 z-10 bg-surface flex items-center gap-3 h-16 px-4"
    >
      <div
        class="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center"
      >
        <Icon icon={iconTerminal} size={24} />
      </div>
      <h1 class="m3-font-title-large flex-1 truncate">{$_("app.title")}</h1>

      <Button
        variant={$debugEnabled ? "tonal" : "text"}
        iconType="full"
        onclick={toggleDebug}
        title={$debugEnabled
          ? $_("app.header.debug_on")
          : $_("app.header.debug_off")}
      >
        <Icon icon={$debugEnabled ? iconBug : iconBugOutline} />
      </Button>
      <Button
        variant="text"
        iconType="full"
        onclick={() => (isDark = !isDark)}
        title={isDark ? $_("app.header.to_light") : $_("app.header.to_dark")}
      >
        <Icon icon={isDark ? iconLight : iconDark} />
      </Button>
      <Button
        variant="text"
        iconType="full"
        onclick={toggleLanguage}
        title={$_("app.header.language")}
      >
        <Icon icon={iconTranslate} />
      </Button>
    </header>

    <main class="max-w-2xl mx-auto px-4 pt-2">
      {#if page === "status"}
        <Dashboard />
      {:else if page === "config"}
        <ConfigEditor />
      {:else if page === "keys"}
        <KeyManager />
      {:else}
        <LogViewer />
      {/if}
    </main>

    <nav class="fixed bottom-0 inset-x-0 z-10">
      <NavCMLX variant="compact">
        {#each pages as p}
          <NavCMLXItem
            variant="compact"
            icon={page === p.id ? p.iconSelected : p.icon}
            text={$_(`app.nav.${p.id}`)}
            selected={page === p.id}
            onclick={() => (page = p.id)}
          />
        {/each}
      </NavCMLX>
    </nav>

    <Snackbar />
  </div>
{/if}
