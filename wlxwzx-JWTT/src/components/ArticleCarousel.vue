<template>
  <div class="article-carousel">
    <div class="carousel-container">
      <div class="carousel-header">
        <span class="carousel-title">最新文章</span>
        <div class="carousel-indicator">
          <span>{{ currentIndex + 1 }} / {{ articles.length }}</span>
        </div>
      </div>
      
      <div class="carousel-content" v-if="articles.length > 0">
        <div class="article-item" 
             v-for="(article, index) in articles" 
             :key="article.id"
             :class="{ active: index === currentIndex }"
             @click="selectArticle(article)"
             :style="{ zIndex: index === currentIndex ? 1 : 0 }">
          <span class="article-title">{{ article.title || '无标题' }}</span>
        </div>
      </div>
      
      <div class="carousel-empty" v-else>
        <span>暂无最新文章</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { getHistory } from '../utils/new-api-client'
import { ensureLogin } from '../utils/cloudbase.js'

export default {
  name: 'ArticleCarousel',
  emits: ['article-selected'],
  setup(props, { emit }) {
    // 响应式数据
    const articles = ref([])
    const currentIndex = ref(0)
    let intervalId = null
    
    // 获取最新文章
    const fetchLatestArticles = async () => {
      try {
        // 确保用户已登录
        await ensureLogin()
        
        // 获取历史记录，限制为5条，状态为成功的文章
        const response = await getHistory(5, 0)
        
        if (response.success && response.data.records) {
          // 过滤出状态为成功且包含标题的文章
          articles.value = response.data.records.filter(article => 
            article.status === 'success' && article.title
          )
          
          // 如果没有符合条件的文章，则显示所有有标题的文章
          if (articles.value.length === 0) {
            articles.value = response.data.records.filter(article => article.title)
          }
          
          // 如果仍然没有文章，添加一些示例数据用于测试
          if (articles.value.length === 0) {
            articles.value = [
              { id: '1', title: '示例文章1：人工智能的未来发展趋势', url: 'https://example.com/article1' },
              { id: '2', title: '示例文章2：云计算在企业中的应用', url: 'https://example.com/article2' },
              { id: '3', title: '示例文章3：前端开发的最佳实践', url: 'https://example.com/article3' },
              { id: '4', title: '示例文章4：数据安全与隐私保护', url: 'https://example.com/article4' },
              { id: '5', title: '示例文章5：区块链技术的实际应用场景', url: 'https://example.com/article5' }
            ]
          }
          
          // 重置当前索引
          currentIndex.value = 0
        }
      } catch (error) {
        console.error('获取最新文章失败:', error)
        // 如果是认证错误，不显示错误信息，只记录到控制台
        if (error.message && error.message.includes('auth')) {
          console.log('用户未登录，无法获取最新文章')
          // 添加示例数据用于测试
          articles.value = [
            { id: '1', title: '示例文章1：人工智能的未来发展趋势', url: 'https://example.com/article1' },
            { id: '2', title: '示例文章2：云计算在企业中的应用', url: 'https://example.com/article2' },
            { id: '3', title: '示例文章3：前端开发的最佳实践', url: 'https://example.com/article3' },
            { id: '4', title: '示例文章4：数据安全与隐私保护', url: 'https://example.com/article4' },
            { id: '5', title: '示例文章5：区块链技术的实际应用场景', url: 'https://example.com/article5' }
          ]
          currentIndex.value = 0
        } else {
          console.error('获取最新文章时发生错误:', error)
        }
      }
    }
    
    // 开始轮播
    const startCarousel = () => {
      // 清除现有定时器
      if (intervalId) {
        clearInterval(intervalId)
      }
      
      // 设置新的定时器，每6秒切换一次
      intervalId = setInterval(() => {
        if (articles.value.length > 0) {
          currentIndex.value = (currentIndex.value + 1) % articles.value.length
        }
      }, 6000)
    }
    
    // 选择文章
    const selectArticle = (article) => {
      // 触发事件，将文章URL传递给父组件
      emit('article-selected', article.url)
    }
    
    // 组件挂载时获取数据并开始轮播
    onMounted(() => {
      fetchLatestArticles()
      startCarousel()
    })
    
    // 组件卸载时清除定时器
    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })
    
    return {
      articles,
      currentIndex,
      selectArticle
    }
  }
}
</script>

<style scoped>
.article-carousel {
  width: 100%;
  margin: 16px 0;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-carousel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.carousel-container {
  padding: 12px 16px;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.carousel-title {
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
  display: flex;
  align-items: center;
}

.carousel-title::before {
  content: "📰";
  margin-right: 6px;
}

.carousel-indicator {
  font-size: 12px;
  color: #666;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.carousel-content {
  height: 40px;
  position: relative;
  overflow: hidden;
}

.article-item {
  position: absolute;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  cursor: pointer;
  padding: 8px 0;
  pointer-events: none; /* 默认不可点击 */
}

.article-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.article-item.active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto; /* 只有当前显示的文章项可点击 */
}

.article-title {
  font-size: 14px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  font-weight: 500;
  transition: color 0.2s ease;
}

.article-item:hover .article-title {
  color: #4f46e5;
}

.carousel-empty {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
</style>