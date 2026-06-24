<script setup>
import { onBeforeUnmount, onMounted } from "vue";

let lastTouchEndAt = 0;

function preventGestureZoom(event) {
  event.preventDefault();
}

function preventDoubleTapZoom(event) {
  const now = Date.now();
  if (now - lastTouchEndAt <= 280) {
    event.preventDefault();
  }
  lastTouchEndAt = now;
}

onMounted(() => {
  if (typeof document === "undefined") return;
  document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
  document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("gesturestart", preventGestureZoom);
  document.removeEventListener("touchend", preventDoubleTapZoom);
});
</script>

<template>
  <slot />
</template>

<style>
page {
  min-height: 100%;
  background: #11110f;
}

html,
body,
page {
  width: 100%;
  min-height: 100%;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}

button,
input,
textarea {
  touch-action: manipulation;
}

input,
textarea {
  font-size: 16px;
}
</style>
