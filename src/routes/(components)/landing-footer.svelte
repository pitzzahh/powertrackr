<script module lang="ts">
  interface LandingFooterProps {
    user: App.Locals["user"];
  }
</script>

<script lang="ts">
  import { gsap } from "gsap";
  import Logo from "$/components/logo.svelte";
  import { site } from "$/site";
  import { ChartLine, Users, Shield, Download, InvoiceIcon } from "$lib/assets/icons";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";

  let { user }: LandingFooterProps = $props();

  // ─── Canvas grid drawing ───────────────────────────────────────────────────
  function initCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function drawGrid() {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cols = 24;
      const rows = 10;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * cellW;
          const y = r * cellH;

          const wave = Math.sin(t * 0.04 + c * 0.4 + r * 0.6) * 0.5 + 0.5;
          const alpha = wave * 0.35 + 0.05;

          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.fill();

          if (c < cols) {
            const lineAlpha = wave * 0.12 + 0.03;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellW, y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          if (r < rows) {
            const lineAlpha = wave * 0.12 + 0.03;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cellH);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (Math.random() < 0.04) {
        const sx = Math.floor(Math.random() * (cols + 1)) * cellW;
        const sy = Math.floor(Math.random() * (rows + 1)) * cellH;
        const sparkAlpha = 0.6 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${sparkAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      t++;
      animId = requestAnimationFrame(drawGrid);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();
    drawGrid();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }

  // ─── GSAP entrance animations ─────────────────────────────────────────────
  function initAnimations(footer: HTMLElement) {
    gsap.fromTo(
      footer.querySelectorAll(".footer-col"),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.1 }
    );

    gsap.fromTo(
      footer.querySelectorAll(".footer-bottom > *"),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.5 }
    );
  }

  // ─── attach action ─────────────────────────────────────────────────────────
  function footerAttach(footer: HTMLElement) {
    const canvas = footer.querySelector<HTMLCanvasElement>("canvas.grid-canvas")!;
    const cleanupCanvas = initCanvas(canvas);
    initAnimations(footer);
    return { destroy: cleanupCanvas };
  }
</script>

<footer use:footerAttach class="relative z-10 overflow-hidden border-t border-border bg-background">
  <!-- Electric grid canvas background -->
  <canvas class="grid-canvas pointer-events-none absolute inset-0 size-full" aria-hidden="true"
  ></canvas>

  <div class="relative z-10 container mx-auto px-4 py-16">
    <div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
      <!-- Brand Column -->
      <div class="footer-col flex flex-col gap-4">
        <Logo variant="ghost" class="px-0 md:pl-0!" viewTransitionName="logo-footer" />
        <p class="text-sm leading-relaxed text-muted-foreground">
          {site.fullDescription}
        </p>
      </div>

      <!-- Features -->
      <div class="footer-col flex flex-col gap-4">
        <h3 class="text-sm font-semibold">Features</h3>
        <ul class="flex flex-col gap-0">
          {#each [{ Icon: ChartLine, label: "Billing Summaries" }, { Icon: InvoiceIcon, label: "Sub‑Metering & Auto‑Billing" }, { Icon: Users, label: "User Accounts" }, { Icon: Shield, label: "Input Validation" }, { Icon: Download, label: "Import & Export" }] as { Icon, label }}
            <li class="flex h-9 items-center gap-2 text-sm text-muted-foreground">
              <Icon class="size-4 shrink-0" />
              <span>{label}</span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Navigation Links -->
      <div class="footer-col flex flex-col gap-4">
        <h3 class="text-sm font-semibold">Navigation</h3>
        <ul class="flex flex-col gap-0">
          {#each LANDING_NAV_ITEMS as item}
            <li class="flex h-9 items-center">
              <a
                href={item.href}
                onclick={(e) => handleLandingNavClick(e, item.href)}
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Use Cases -->
      <div class="footer-col flex flex-col gap-4">
        <h3 class="text-sm font-semibold">Built For</h3>
        <ul class="flex flex-col gap-0">
          {#each ["Multi-Tenant Buildings", "Homeowners with Rentals", "Property Managers"] as item}
            <li class="flex h-9 items-center text-sm text-muted-foreground">{item}</li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="my-10 border-t border-border"></div>

    <!-- Bottom Row -->
    <div class="footer-bottom flex flex-col items-center justify-between gap-4 md:flex-row">
      <p class="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()}
        <span class="font-medium text-foreground">{site.name}</span>. All rights reserved.
      </p>

      <div class="flex items-center gap-6">
        {#if user}
          <a
            data-sveltekit-reload
            href="/dashboard"
            class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </a>
        {:else}
          <a
            data-sveltekit-reload
            href="/auth?act=login"
            class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </a>
          <a
            data-sveltekit-reload
            href="/auth?act=register"
            class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Get Started
          </a>
        {/if}
      </div>
    </div>
  </div>
</footer>

<style>
  /* GSAP animates these in — start hidden */
  .footer-col,
  .footer-bottom > * {
    opacity: 0;
  }
</style>
