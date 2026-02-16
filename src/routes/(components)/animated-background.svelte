<script lang="ts">
  import { gsap } from "gsap/dist/gsap";
  import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

  function initParallaxBlobs(node: HTMLElement) {
    gsap.registerPlugin(ScrollTrigger);

    const blobs = node.querySelectorAll(".blob");
    const particles = node.querySelectorAll(".particle");
    const rings = node.querySelectorAll(".deco-ring");

    // Create parallax effect for blobs - they move at different speeds
    blobs.forEach((blob, index) => {
      const speed = 0.3 + index * 0.15;
      const direction = index % 2 === 0 ? 1 : -1;

      gsap.to(blob, {
        yPercent: speed * 100,
        xPercent: direction * speed * 30,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });
    });

    // Create parallax effect for particles - faster movement for depth
    particles.forEach((particle, index) => {
      const speed = 0.5 + index * 0.1;
      const direction = index % 2 === 0 ? -1 : 1;

      gsap.to(particle, {
        yPercent: speed * 150,
        xPercent: direction * speed * 20,
        scale: 1 + index * 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 2,
        },
      });
    });

    // Animate deco-rings with rotation on scroll
    rings.forEach((ring, index) => {
      const direction = index % 2 === 0 ? 1 : -1;

      gsap.to(ring, {
        rotation: direction * 180,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 3,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }
</script>

<!-- Animated background blobs with scroll parallax -->
<div
  class="pointer-events-none fixed inset-0 overflow-hidden"
  aria-hidden="true"
  {@attach initParallaxBlobs}
>
  <!-- Gradient mesh overlay -->
  <div class="gradient-mesh"></div>

  <!-- Main blobs -->
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>
  <div class="blob blob-4"></div>

  <!-- Decorative rings -->
  <div class="deco-ring deco-ring-1"></div>
  <div class="deco-ring deco-ring-2"></div>
  <div class="deco-ring deco-ring-3"></div>

  <!-- Floating particles -->
  <div class="particle particle-1"></div>
  <div class="particle particle-2"></div>
  <div class="particle particle-3"></div>
  <div class="particle particle-4"></div>
  <div class="particle particle-5"></div>
  <div class="particle particle-6"></div>
  <div class="particle particle-7"></div>
  <div class="particle particle-8"></div>

  <!-- Grid lines -->
  <div class="grid-overlay"></div>

  <!-- Noise texture -->
  <div class="noise-overlay"></div>
</div>

<style>
  /* Gradient mesh background */
  .gradient-mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        ellipse 80% 50% at 20% 40%,
        color-mix(in oklch, var(--primary) 8%, transparent),
        transparent
      ),
      radial-gradient(
        ellipse 60% 40% at 80% 20%,
        color-mix(in oklch, var(--primary) 6%, transparent),
        transparent
      ),
      radial-gradient(
        ellipse 50% 60% at 60% 80%,
        color-mix(in oklch, var(--primary) 5%, transparent),
        transparent
      );
    animation: mesh-shift 30s ease-in-out infinite;
  }

  @keyframes mesh-shift {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Animated background blobs */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.7;
    animation: blob-float 20s ease-in-out infinite;
    will-change: transform;
  }

  .blob-1 {
    top: -100px;
    right: -100px;
    width: 400px;
    height: 400px;
    background: color-mix(in oklch, var(--primary) 20%, transparent);
  }

  .blob-2 {
    top: 50%;
    left: -150px;
    width: 500px;
    height: 500px;
    background: color-mix(in oklch, var(--primary) 15%, transparent);
    animation-delay: -7s;
  }

  .blob-3 {
    bottom: -100px;
    right: 20%;
    width: 350px;
    height: 350px;
    background: color-mix(in oklch, var(--primary) 18%, transparent);
    animation-delay: -14s;
  }

  .blob-4 {
    top: 30%;
    right: 30%;
    width: 300px;
    height: 300px;
    background: color-mix(in oklch, var(--primary) 12%, transparent);
    animation-delay: -10s;
    animation-duration: 25s;
  }

  @keyframes blob-float {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(40px, -40px) scale(1.1);
    }
    50% {
      transform: translate(-30px, 30px) scale(0.95);
    }
    75% {
      transform: translate(30px, 20px) scale(1.05);
    }
  }

  /* Decorative rings */
  .deco-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid color-mix(in oklch, var(--primary) 15%, transparent);
    will-change: transform;
  }

  .deco-ring-1 {
    top: 10%;
    right: 10%;
    width: 300px;
    height: 300px;
    animation: deco-ring-pulse 15s ease-in-out infinite;
  }

  .deco-ring-2 {
    bottom: 20%;
    left: 5%;
    width: 400px;
    height: 400px;
    animation: deco-ring-pulse 20s ease-in-out infinite reverse;
  }

  .deco-ring-3 {
    top: 60%;
    right: 25%;
    width: 200px;
    height: 200px;
    animation: deco-ring-pulse 12s ease-in-out infinite;
    animation-delay: -5s;
  }

  @keyframes deco-ring-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.6;
    }
  }

  /* Floating particles */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: color-mix(in oklch, var(--primary) 50%, transparent);
    animation: particle-float 8s ease-in-out infinite;
    will-change: transform;
  }

  .particle-1 {
    top: 15%;
    left: 10%;
    width: 8px;
    height: 8px;
  }

  .particle-2 {
    top: 25%;
    right: 15%;
    width: 12px;
    height: 12px;
    animation-delay: -2s;
    animation-duration: 10s;
  }

  .particle-3 {
    top: 60%;
    left: 20%;
    width: 6px;
    height: 6px;
    animation-delay: -4s;
    animation-duration: 7s;
  }

  .particle-4 {
    top: 40%;
    right: 25%;
    width: 10px;
    height: 10px;
    animation-delay: -1s;
    animation-duration: 9s;
  }

  .particle-5 {
    bottom: 20%;
    left: 30%;
    width: 8px;
    height: 8px;
    animation-delay: -3s;
    animation-duration: 11s;
  }

  .particle-6 {
    top: 75%;
    right: 40%;
    width: 5px;
    height: 5px;
    animation-delay: -6s;
    animation-duration: 8s;
  }

  .particle-7 {
    top: 35%;
    left: 45%;
    width: 7px;
    height: 7px;
    animation-delay: -5s;
    animation-duration: 12s;
  }

  .particle-8 {
    bottom: 35%;
    right: 10%;
    width: 9px;
    height: 9px;
    animation-delay: -7s;
    animation-duration: 9s;
  }

  @keyframes particle-float {
    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-30px) scale(1.2);
      opacity: 0.8;
    }
  }

  /* Grid overlay */
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(
        to right,
        color-mix(in oklch, var(--primary) 3%, transparent) 1px,
        transparent 1px
      ),
      linear-gradient(
        to bottom,
        color-mix(in oklch, var(--primary) 3%, transparent) 1px,
        transparent 1px
      );
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
    opacity: 0.5;
  }

  /* Noise texture overlay */
  .noise-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }
</style>
