<template>
  <div>
    <el-input v-model="input"></el-input>
    <el-button type="primary" :loading="status==1" @click="add">添加任务</el-button>
    <el-tag>{{getQueueStatusText(status)}}</el-tag>
    <el-tag v-if="result">{{result}}</el-tag>
  </div>
</template>

<script setup lang="ts">
definePage({
  meta: { title: '队列', order: 9 },
})

import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { queueStatusMap, getQueueStatusText } from '@mc-ui/utils'

const input = ref<string>('')
const result = ref<string>('')
const jobId = ref<number>()

const status = ref<number>(0)

const StatusMap = queueStatusMap

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
      status.value = StatusMap.active.code
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
          status.value = StatusMap.completed.code
          result.value = data?.result?.echo
        }else if(data.state == 'failed'){
          clearInterval(timer)
          status.value = StatusMap.failed.code
          result.value = data?.result?.echo
        }
      })
  }, 1000)
}

watch(jobId,(newval) => {
  console.log(newval)
  status.value = StatusMap.active.code
  if (newval) {
    pollFetch(newval)
  }
})
</script>

<style lang="less">

</style>
