<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { api } from "./ksu";
    import { _ } from "svelte-i18n";
    import { Button, Card, Icon } from "m3-svelte";
    import iconDelete from "@ktibow/iconset-material-symbols/delete-sweep-outline-rounded";

    const POLL_INTERVAL_MS = 3000;
    const MAX_LINES = 200;

    let logs: string[] = $state([]);
    let logsContainer: HTMLElement;
    let autoScroll = $state(true);
    let timer: ReturnType<typeof setInterval> | null = null;
    let nextLine = 1; // 下次从第几行开始读（1-based）

    function appendLines(newLines: string[]) {
        if (newLines.length === 0) return;
        logs = [...logs, ...newLines].slice(-MAX_LINES);
        if (autoScroll && logsContainer) {
            requestAnimationFrame(() => {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            });
        }
    }

    async function poll() {
        try {
            const res = await api("read_log_from", String(nextLine));
            const outer = JSON.parse(res.stdout);
            const b64 = outer.stdout || "";
            if (!b64.trim()) return;

            // 后端返回 base64 编码的 "total\nlog_lines..."
            const raw = decodeURIComponent(escape(atob(b64.trim())));
            const lines = raw.split("\n");

            if (lines.length === 0 || (lines.length === 1 && lines[0] === ""))
                return;

            const total = parseInt(lines[0], 10);
            if (isNaN(total)) return;

            // 文件被清空（clear_log 后 total 归 0），重置偏移
            if (total === 0 || total < nextLine - 1) {
                nextLine = 1;
                logs = []; // 也重置本地日志显示
                return;
            }

            const newLines = lines.slice(1).filter(Boolean);
            nextLine = total + 1;
            appendLines(newLines);
        } catch (e) {
            console.error("[Logs] Poll failed", e);
        }
    }

    function clearLogs() {
        logs = [];
        nextLine = 1;
        api("clear_log");
    }

    onMount(() => {
        poll();
        timer = setInterval(poll, POLL_INTERVAL_MS);
    });

    onDestroy(() => {
        if (timer !== null) clearInterval(timer);
    });

    function handleScroll() {
        if (!logsContainer) return;
        const { scrollTop, scrollHeight, clientHeight } = logsContainer;
        autoScroll = scrollHeight - scrollTop - clientHeight < 10;
    }
</script>

<Card variant="filled">
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
            <h2 class="m3-font-title-large">{$_("app.logs.title")}</h2>
            {#if autoScroll}
                <span class="relative flex size-2">
                    <span
                        class="absolute inline-flex size-full rounded-full bg-primary opacity-75 animate-ping"
                    ></span>
                    <span class="relative inline-flex size-2 rounded-full bg-primary"></span>
                </span>
            {/if}
        </div>
        <Button variant="text" iconType="left" onclick={clearLogs}>
            <Icon icon={iconDelete} />
            {$_("app.logs.btn_clear")}
        </Button>
    </div>

    <div
        bind:this={logsContainer}
        onscroll={handleScroll}
        class="h-[calc(100dvh-15rem)] min-h-64 p-4 overflow-y-auto rounded-xl bg-surface font-mono text-xs leading-5 text-on-surface-variant whitespace-pre-wrap"
    >
        {#if logs.length === 0}
            <p class="italic text-outline">{$_("app.logs.waiting")}</p>
        {:else}
            {#each logs as logRow}
                <div class="break-all">{logRow}</div>
            {/each}
        {/if}
    </div>
</Card>
