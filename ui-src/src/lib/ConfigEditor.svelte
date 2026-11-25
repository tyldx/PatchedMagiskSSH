<script lang="ts">
    import { api, apiWithStdin } from "./ksu";
    import { onMount } from "svelte";
    import { _ } from "svelte-i18n";
    import { Button, Card, Icon, snackbar } from "m3-svelte";
    import iconSave from "@ktibow/iconset-material-symbols/save-outline-rounded";

    let configContent = $state("");
    let isSaving = $state(false);
    let isLoading = $state(true);

    async function loadConfig() {
        isLoading = true;
        try {
            const res = await api("read_config");
            const outer = JSON.parse(res.stdout);
            const b64 = outer.stdout || "";
            if (b64.trim()) {
                configContent = decodeURIComponent(escape(atob(b64.trim())));
            } else {
                configContent = "";
            }
        } catch (e) {
            console.error("[Config] Load failed", e);
            configContent = "";
        } finally {
            isLoading = false;
        }
    }

    async function saveConfig() {
        isSaving = true;
        try {
            await apiWithStdin("write_config", configContent);
            snackbar($_("app.config.save_success"));
        } catch (e: any) {
            snackbar($_("app.config.save_failed") + ": " + e.message, {}, true);
        } finally {
            isSaving = false;
        }
    }

    onMount(loadConfig);
</script>

<Card variant="filled">
    <div class="flex items-center justify-between mb-4">
        <h2 class="m3-font-title-large font-mono">{$_("app.config.title")}</h2>
        <Button
            variant="filled"
            iconType="left"
            onclick={saveConfig}
            disabled={isSaving || isLoading}
        >
            <Icon icon={iconSave} />
            {isSaving ? $_("app.config.btn_saving") : $_("app.config.btn_save")}
        </Button>
    </div>

    {#if isLoading}
        <div class="w-full h-[60dvh] rounded-xl bg-surface animate-pulse"></div>
    {:else}
        <textarea
            bind:value={configContent}
            class="block w-full h-[60dvh] p-4 font-mono text-sm leading-6 rounded-xl bg-surface text-on-surface outline outline-1 outline-outline-variant focus:outline-2 focus:outline-primary resize-y overflow-x-auto"
            spellcheck="false"
            wrap="off"
        ></textarea>
    {/if}
</Card>
