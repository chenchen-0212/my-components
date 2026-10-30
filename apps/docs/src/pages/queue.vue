<template>
  <div>
    <input v-model="input"></input>
    <button @click="add">添加任务</button>
    <div>{{StatusMap[status]}}</div>
    <div>{{result}}</div>
  </div>
</template>

<script setup lang="ts">
definePage({
  meta: { title: '队列', order: 9 },
})

const StatusMap = {
  0: '等待中',
  1: '处理中',
  2: '完成',
}

import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const input = ref<string>('')
const result = ref<string>('')
const jobId = ref<number>()

const status = ref<0 | 1 | 2>(0)

const add = () => {
  console.log(input.value)
  result.value = ''
  fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.value,
    }),
  }).then(res => res.json())
    .then(data => {
      console.log(data)
      if(data?.statusCode==400){
        ElMessage(data?.message)
        return
      }
      jobId.value = data.id
      status.value = 0 
    })
  input.value = ''
}

const pollFetch = (id: number) => {
  const timer = setInterval(() => {
    fetch(`/api/jobs/${id}`,
      {
        method: 'GET',
      }
    )
      .then(res => res.json())
      .then(data => {
        console.log(data)
        if (data.state == 'completed') {
          clearInterval(timer)
          status.value = 2
          result.value = data?.result?.echo
        }
      })
  }, 1000)
}

watch(jobId,(newval) => {
  console.log(newval)
  status.value = 1
  if (newval) {
    pollFetch(newval)
  }
})
</script>

<style lang="less">

</style>
