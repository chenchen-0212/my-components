// 模拟把 PDF/Word 读出来并切块后的文本
export const knowledgeBase = [
  "公司员工出差，一线城市住宿标准为每晚 600 元，二线城市为 400 元。",
  "出差打车费实报实销，但单次行程超过 200 元的，必须由部门主管审批。",
  "员工出差每天享有 100 元的餐补，不需要提供发票。",
  "出差期间如需乘坐高铁，原则上只能购买二等座。"
];
// 1. 简易的假向量化（生产环境替换成真实的 API 调用）
// 这里用简单的字符 ASCII 码取模来模拟，目的是让相同的词得出相似的数字特征
export function fakeEmbedding(text: string): number[] {
  const vector = new Array(100).fill(0); // 生成一个 100 维的数组
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    vector[charCode % 100] += 1;
  }
  return vector;
}

// 2. 计算余弦相似度（越接近 1 越相似，越接近 0 越无关）
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
