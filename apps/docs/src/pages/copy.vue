<script setup>
import { McButton } from '@mc-ui/core'
definePage({
  meta: { title: '复制按钮', order: 2 },
})
</script>

<template>
  <h1>复制按钮</h1>
  <McButton type="primary">主要按钮</McButton>
  <McButton>默认按钮</McButton>
  <McButton disabled>禁用按钮</McButton>
</template>