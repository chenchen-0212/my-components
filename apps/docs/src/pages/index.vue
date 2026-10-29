<script setup>
import { McButton } from '@mc-ui/core'
definePage({
  meta: { title: '总览', order: 0 },
})
</script>

<template>
  <h1>总览页面</h1>
  <McButton type="primary">主要按钮</McButton>
  <McButton>默认按钮</McButton>
  <McButton disabled>禁用按钮</McButton>
</template>