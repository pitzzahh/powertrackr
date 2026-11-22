<script lang="ts" module>
  import { formatNumber } from "#lib/utils/format.js";

  // Worked example, computed the same way the app does: rate = bill ÷ total kWh,
  // each sub-meter pays (current − previous) × rate, the main meter pays the rest.
  const BILL = 7344;
  const TOTAL_KWH = 612;
  const RATE = Number((BILL / TOTAL_KWH).toFixed(2));

  const SUB_METERS = [
    { name: "Unit 1A", previous: 10482, current: 10696 },
    { name: "Unit 1B", previous: 8830, current: 9017 },
    { name: "Unit 2A", previous: 4410, current: 4506 },
  ].map((m) => ({ ...m, kWh: m.current - m.previous, owes: (m.current - m.previous) * RATE }));

  const SUB_KWH = SUB_METERS.reduce((sum, m) => sum + m.kWh, 0);
  const SUB_OWES = SUB_METERS.reduce((sum, m) => sum + m.owes, 0);
  const MAIN = { kWh: TOTAL_KWH - SUB_KWH, owes: BILL - SUB_OWES };

  const peso = (n: number) => formatNumber(n);
  const num = (n: number) => formatNumber(n, { style: "decimal" });
</script>

<script lang="ts">
  let { class: className = "" }: { class?: string } = $props();
</script>

<figure class="rounded-lg border bg-card text-sm {className}">
  <figcaption class="flex items-baseline justify-between gap-4 border-b px-5 py-4">
    <span class="font-medium">October bill, 3-unit building</span>
    <span class="text-muted-foreground">Example</span>
  </figcaption>

  <div class="overflow-x-auto">
    <table class="w-full tabular-nums">
      <thead class="text-left text-xs text-muted-foreground">
        <tr>
          <th class="px-5 py-3 font-normal">Meter</th>
          <th class="hidden px-3 py-3 text-right font-normal sm:table-cell">Previous</th>
          <th class="px-3 py-3 text-right font-normal">Current</th>
          <th class="px-3 py-3 text-right font-normal">kWh</th>
          <th class="px-5 py-3 text-right font-normal">Owes</th>
        </tr>
      </thead>
      <tbody>
        {#each SUB_METERS as m (m.name)}
          <tr class="border-t">
            <td class="px-5 py-3 whitespace-nowrap">{m.name}</td>
            <td class="hidden px-3 py-3 text-right text-muted-foreground sm:table-cell">
              {num(m.previous)}
            </td>
            <td class="px-3 py-3 text-right text-muted-foreground">{num(m.current)}</td>
            <td class="px-3 py-3 text-right">{m.kWh}</td>
            <td class="px-5 py-3 text-right font-medium">{peso(m.owes)}</td>
          </tr>
        {/each}
        <tr class="border-t">
          <td class="px-5 py-3 whitespace-nowrap">Main meter</td>
          <td class="hidden sm:table-cell"></td>
          <td class="px-3 py-3 text-right text-muted-foreground">remainder</td>
          <td class="px-3 py-3 text-right">{MAIN.kWh}</td>
          <td class="px-5 py-3 text-right font-medium">{peso(MAIN.owes)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t bg-muted px-5 py-4 tabular-nums">
    <span class="text-muted-foreground">{peso(BILL)} ÷ {TOTAL_KWH} kWh =</span>
    <strong class="rounded-sm bg-highlight px-1.5 py-0.5 font-semibold text-highlight-foreground">
      {peso(RATE)} per kWh
    </strong>
  </p>
</figure>
