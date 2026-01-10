<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";

  let { syncing, lastSyncTime } = $state({
    syncing: false,
    lastSyncTime: "",
  });

  async function handleSync() {
    if (syncing) return;

    syncing = true;

    try {
      const response = await fetch("/api/db-sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        lastSyncTime = new Date().toLocaleString();
        toast.success("Database synced successfully");
      } else {
        toast.error(data.error || "Failed to sync database");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync database");
    } finally {
      syncing = false;
    }
  }

  async function checkSyncStatus() {
    try {
      const response = await fetch("/api/db-sync");
      const data = await response.json();

      if (response.ok) {
        console.log("Sync status:", data);
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  }

  $effect(() => {
    checkSyncStatus();
  });
</script>

<div class="flex items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
  <div class="flex-1">
    <h3 class="text-sm font-medium">Database Sync</h3>
    <p class="text-xs text-muted-foreground">
      {#if lastSyncTime}
        Last synced: {lastSyncTime}
      {:else}
        Automatic sync every 60 seconds
      {/if}
    </p>
  </div>

  <Button onclick={handleSync} disabled={syncing} variant="outline" size="sm" class="min-w-25">
    {#if syncing}
      <span class="animate-spin">⟳</span>
      <span class="ml-2">Syncing...</span>
    {:else}
      Sync Now
    {/if}
  </Button>
</div>
