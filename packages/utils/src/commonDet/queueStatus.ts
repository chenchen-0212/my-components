/** BullMQ 任务状态 → { code: 排序码, tag: 中文文案 } */
export const queueStatusMap = {
  waiting: { code: 0, tag: '等待中 ' },
  active: { code: 1, tag: '处理中' },
  completed: { code: 2, tag: '已完成' },
  failed: { code: 3, tag: '失败' },
  delayed: { code: 4, tag: '延迟' },
  paused: { code: 5, tag: '暂停' },
  stalled: { code: 6, tag: '卡住' },
  unknown: { code: 7, tag: '未知' },
} as const

export type QueueStatus = keyof typeof queueStatusMap

/** 接口返回的 state 是 string，用它取文案；未收录的状态回退到「未知」 */
export const getQueueStatusText = (state: Number) => {
  const obj =Object.entries(queueStatusMap).find(([, { code }])=>{
    return code === state
  })
  if(obj){
    return obj[1]?.tag
  }else{
    return queueStatusMap.unknown.tag
  }
}

// console.log(getQueueStatusText(1))
