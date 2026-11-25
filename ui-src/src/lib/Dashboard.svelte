<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "./ksu";
    import { _ } from "svelte-i18n";
    import { Button, Card, Icon, Switch } from "m3-svelte";
    import iconPlay from "@ktibow/iconset-material-symbols/play-arrow-rounded";
    import iconStop from "@ktibow/iconset-material-symbols/stop-rounded";

    let status = $state("");
    let isRunning = $state(false);
    let pid = $state("");
    let port = $state("");
    let ip = $state("");
    let isToggling = $state(false);

    // 新增状态：设置
    let autostart = $state(false);
    let keepData = $state(true);
    let isSavingSettings = $state(false);

    async function toggleSetting(type: "autostart" | "keepData") {
        if (isSavingSettings) return;
        isSavingSettings = true;
        try {
            if (type === "autostart") autostart = !autostart;
            if (type === "keepData") keepData = !keepData;
            await api("set_settings", String(autostart), String(keepData));
        } finally {
            isSavingSettings = false;
        }
    }

    async function checkStatus() {
        status = $_("app.status.checking");
        try {
            const res = await api("status");
            // res.stdout 是 "{"errno":0,"stdout":"{\"running\":...}","stderr":""}"
            const outer = JSON.parse(res.stdout);
            const data = JSON.parse(outer.stdout);
            isRunning = data.running;
            pid = data.pid || "";
            port = data.port || "22";
            status = isRunning
                ? $_("app.status.running")
                : $_("app.status.stopped");
        } catch (e) {
            console.error("[Status] Check failed:", e);
            status = $_("app.status.stopped");
            isRunning = false;
        }
    }

    async function toggleService() {
        isToggling = true;
        status = $_("app.status.toggling");
        try {
            if (isRunning) {
                await api("stop");
            } else {
                await api("start");
            }
        } finally {
            isToggling = false;
        }
        await checkStatus();
    }

    onMount(() => {
        checkStatus();
        api("get_ip")
            .then((res) => {
                const outer = JSON.parse(res.stdout);
                ip = outer.stdout.trim();
            })
            .catch(() => {});

        // 获取设置
        api("get_settings")
            .then((res) => {
                try {
                    const outer = JSON.parse(res.stdout);
                    // 业务 JSON 还在 stdout 里
                    const data = JSON.parse(outer.stdout);
                    autostart = data.autostart ?? false;
                    keepData = data.keep_data ?? true;
                } catch (e) {
                    console.error("[Settings] Parse error:", e, res.stdout);
                }
            })
            .catch((err) => {
                console.error("[Settings] Fetch error:", err);
            });
    });
</script>

<Card variant="filled">
    <h2 class="m3-font-title-large mb-4">{$_("app.status.title")}</h2>

    <div class="rounded-2xl bg-surface p-4 space-y-2">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div
                    class="w-3 h-3 rounded-full flex-shrink-0 {isRunning
                        ? 'bg-primary'
                        : 'bg-error'}"
                ></div>
                <span class="m3-font-title-medium">{status}</span>
            </div>

            <Button
                variant={isRunning ? "tonal" : "filled"}
                iconType="full"
                onclick={toggleService}
                disabled={isToggling}
                title={isRunning
                    ? $_("app.status.btn_stop")
                    : $_("app.status.btn_start")}
            >
                <Icon icon={isRunning ? iconStop : iconPlay} />
            </Button>
        </div>

        {#if ip || (isRunning && pid)}
            <div class="pl-6 flex flex-col gap-0.5 m3-font-body-small text-on-surface-variant">
                {#if ip}
                    <span>IP: {ip}</span>
                {/if}
                {#if isRunning && pid}
                    <span>PID: {pid}</span>
                    <span>Port: {port}</span>
                {/if}
            </div>
        {/if}
    </div>

    <div class="mt-4 pt-4 border-t border-outline-variant space-y-4">
        <h3 class="m3-font-title-small text-primary">
            {$_("app.status.settings")}
        </h3>

        <label class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-0.5">
                <span class="m3-font-body-large">{$_("app.status.autostart")}</span>
                <span class="m3-font-body-medium text-on-surface-variant"
                    >{$_("app.status.autostart_desc")}</span
                >
            </div>
            <Switch
                checked={autostart}
                disabled={isSavingSettings}
                onchange={() => toggleSetting("autostart")}
            />
        </label>

        <label class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-0.5">
                <span class="m3-font-body-large">{$_("app.status.keep_data")}</span>
                <span class="m3-font-body-medium text-on-surface-variant"
                    >{$_("app.status.keep_data_desc")}</span
                >
            </div>
            <Switch
                checked={keepData}
                disabled={isSavingSettings}
                onchange={() => toggleSetting("keepData")}
            />
        </label>
    </div>
</Card>
