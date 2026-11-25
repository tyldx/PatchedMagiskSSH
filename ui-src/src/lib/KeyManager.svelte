<script lang="ts">
    import { api, apiWithStdin } from "./ksu";
    import { _ } from "svelte-i18n";
    import {
        Button,
        Card,
        Icon,
        ListItem,
        Tabs,
        TextFieldOutlined,
        snackbar,
    } from "m3-svelte";
    import iconKey from "@ktibow/iconset-material-symbols/key-outline-rounded";
    import iconCopy from "@ktibow/iconset-material-symbols/content-copy-outline-rounded";
    import iconDelete from "@ktibow/iconset-material-symbols/delete-outline-rounded";
    import iconAdd from "@ktibow/iconset-material-symbols/add-rounded";
    import iconPerson from "@ktibow/iconset-material-symbols/person-outline-rounded";
    import iconGroup from "@ktibow/iconset-material-symbols/group-outline-rounded";

    type User = "root" | "shell";

    let activeUser = $state<User>("root");
    let keysByUser = $state<Record<User, string[]>>({ root: [], shell: [] });
    let newKey = $state("");
    let isAdding = $state(false);
    let isLoading = $state(false);

    const users = [
        { name: "root", value: "root", icon: iconPerson },
        { name: "shell", value: "shell", icon: iconGroup },
    ];

    // Reactive: current user's key list
    let keys = $derived(keysByUser[activeUser]);

    async function loadKeys(user: User) {
        isLoading = true;
        try {
            const res = await api("read_keys", user);
            const outer = JSON.parse(res.stdout);
            const rawKeys = outer.stdout || "";
            keysByUser[user] = rawKeys.trim()
                ? rawKeys
                      .trim()
                      .split("\n")
                      .filter((k: string) => k.trim() !== "")
                : [];
        } catch (e) {
            console.error("[Keys] Load failed", e);
            keysByUser[user] = [];
        } finally {
            isLoading = false;
        }
    }

    $effect(() => {
        if (keysByUser[activeUser].length === 0) loadKeys(activeUser);
    });

    async function addKey() {
        if (!newKey.trim()) return;
        isAdding = true;
        try {
            await apiWithStdin(`add_key ${activeUser}`, newKey.trim());
            keysByUser[activeUser] = [...keysByUser[activeUser], newKey.trim()];
            newKey = "";
        } finally {
            isAdding = false;
        }
    }

    async function deleteKey(index: number) {
        const lineNum = index + 1;
        await api("delete_key", lineNum.toString(), activeUser);
        keysByUser[activeUser] = keysByUser[activeUser].filter(
            (_, i) => i !== index,
        );
    }

    async function copyKey(key: string) {
        try {
            await navigator.clipboard.writeText(key);
            snackbar($_("app.auth.copied"));
        } catch (e) {
            console.error("Failed to copy", e);
        }
    }

    function parseKey(key: string) {
        const parts = key.trim().split(/\s+/);
        if (parts.length >= 3) {
            return { type: parts[0], comment: parts.slice(2).join(" ") };
        } else if (parts.length === 2) {
            return { type: parts[0], comment: "..." + parts[1].slice(-12) };
        }
        return { type: "Unknown", comment: "..." };
    }
</script>

<Card variant="filled">
    <h2 class="m3-font-title-large mb-4">{$_("app.auth.title")}</h2>

    <div class="-mx-4 mb-4">
        <Tabs secondary items={users} bind:tab={activeUser} />
    </div>

    <div class="rounded-xl bg-surface overflow-hidden mb-4 min-h-14">
        {#if isLoading}
            <div class="h-18 animate-pulse"></div>
        {:else if keys.length === 0}
            <p class="m3-font-body-medium text-on-surface-variant px-4 py-4">
                {$_("app.auth.empty")}
            </p>
        {:else}
            {#each keys as key, index}
                {@const parsed = parseKey(key)}
                <ListItem headline={parsed.comment} supporting={parsed.type}>
                    {#snippet leading()}
                        <Icon icon={iconKey} size={24} />
                    {/snippet}
                    {#snippet trailing()}
                        <div class="flex">
                            <Button
                                variant="text"
                                iconType="full"
                                title={$_("app.auth.copy")}
                                onclick={() => copyKey(key)}
                            >
                                <Icon icon={iconCopy} />
                            </Button>
                            <Button
                                variant="text"
                                iconType="full"
                                title={$_("app.auth.btn_delete")}
                                onclick={() => deleteKey(index)}
                            >
                                <Icon icon={iconDelete} />
                            </Button>
                        </div>
                    {/snippet}
                </ListItem>
            {/each}
        {/if}
    </div>

    <div class="flex flex-col gap-3">
        <TextFieldOutlined
            label={$_("app.auth.input_placeholder")}
            bind:value={newKey}
            enter={addKey}
        />
        <div class="flex justify-end">
            <Button
                variant="filled"
                iconType="left"
                onclick={addKey}
                disabled={isAdding || !newKey.trim()}
            >
                <Icon icon={iconAdd} />
                {isAdding ? $_("app.auth.btn_adding") : $_("app.auth.btn_add")}
            </Button>
        </div>
    </div>
</Card>
