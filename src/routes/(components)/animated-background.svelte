<script lang="ts">
</script>

<!-- Animated background blobs -->
<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="blob blob-3"></div>
</div>

<!-- Floating particles -->
<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
  <div class="particle particle-1"></div>
  <div class="particle particle-2"></div>
  <div class="particle particle-3"></div>
  <div class="particle particle-4"></div>
  <div class="particle particle-5"></div>
</div>

<style>
  /* Animated background blobs */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.7;
    animation: blob-float 20s ease-in-out infinite;
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

  /* Floating particles */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: color-mix(in oklch, var(--primary) 50%, transparent);
    animation: particle-float 8s ease-in-out infinite;
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
</style>
