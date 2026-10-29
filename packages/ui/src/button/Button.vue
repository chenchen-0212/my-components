<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 视觉类型 */
    type?: 'default' | 'primary'
    /** 原生 button 的 type，避免与视觉类型 type 重名导致无法提交表单 */
    nativeType?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    type: 'default',
    nativeType: 'button',
    disabled: false,
  }
)
</script>

<template>
  <button
    :type="nativeType"
    :disabled="disabled"
    :class="['mc-button', `mc-button--${type}`]"
  >
    <slot />
  </button>
</template>

<style>
.mc-button {
  /* 用局部变量承接配色，后续接主题系统只需覆盖变量 */
  --mc-button-bg: #fff;
  --mc-button-border: #dcdfe6;
  --mc-button-color: #303133;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 8px 16px;
  border: 1px solid var(--mc-button-border);
  border-radius: 8px;
  background: var(--mc-button-bg);
  color: var(--mc-button-color);
  font: inherit; /* 不继承会让按钮字号与正文不一致 */
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.mc-button--primary {
  --mc-button-bg: #2563eb; /* 白字对比度 5.2:1，满足 WCAG AA */
  --mc-button-border: #2563eb;
  --mc-button-color: #fff;
}

.mc-button:not(:disabled):hover {
  --mc-button-border: #2563eb;
}

.mc-button--primary:not(:disabled):hover {
  --mc-button-bg: #1d4ed8;
  --mc-button-border: #1d4ed8;
}

.mc-button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.mc-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .mc-button {
    transition: none;
  }
}
</style>
