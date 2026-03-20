<template>
  <AnimationContainer title="记忆系统演进" @restart="handleRestart">
    <template #default="{ isVisible }">
      <div :key="key" class="memory-system" :class="{ active: isVisible && !isRestarting }">
        <!-- 短期记忆区 -->
        <div class="memory-box short-term">
          <div class="box-label">短期记忆</div>
          <div class="memory-items">
            <div class="memory-item item-1">消息 1</div>
            <div class="memory-item item-2">消息 2</div>
            <div class="memory-item item-3">消息 3</div>
          </div>
          <div class="capacity">容量: 3-5 条</div>
        </div>

        <!-- 转移箭头 -->
        <div class="transfer-arrow">
          <div class="arrow-line"></div>
          <div class="arrow-head"></div>
          <div class="arrow-label">巩固</div>
        </div>

        <!-- 长期记忆区 -->
        <div class="memory-box long-term">
          <div class="box-label">长期记忆</div>
          <div class="memory-items">
            <div class="stored-item item-1">消息 1</div>
            <div class="stored-item item-2">消息 2</div>
            <div class="stored-item item-3">消息 3</div>
          </div>
          <div class="capacity">容量: 无限</div>
        </div>

        <!-- 移动的记忆项 -->
        <div class="moving-item moving-1">
          <span>消息 1</span>
        </div>
        <div class="moving-item moving-2">
          <span>消息 2</span>
        </div>
        <div class="moving-item moving-3">
          <span>消息 3</span>
        </div>
      </div>
    </template>
  </AnimationContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AnimationContainer from '../core/AnimationContainer.vue'

const key = ref(0)
const isRestarting = ref(false)

function handleRestart() {
  isRestarting.value = true
  key.value++
  setTimeout(() => {
    isRestarting.value = false
  }, 50)
}
</script>

<style scoped>
.memory-system {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  min-height: 400px;
  position: relative;
}

.memory-box {
  flex: 0 0 200px;
  height: 280px;
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  opacity: 0;
  transform: scale(0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.memory-system.active .memory-box {
  animation: boxAppear 0.6s ease forwards;
}

.memory-box.short-term {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
  border: 3px solid #ffc107;
}

.memory-box.long-term {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
  border: 3px solid #3b82f6;
  animation-delay: 0.3s;
}

.box-label {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
  color: var(--vp-c-text-1);
}

.memory-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.memory-item,
.stored-item {
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  border: 2px solid transparent;
  opacity: 0;
  transform: translateY(10px);
}

.memory-system.active .memory-item {
  animation: itemFadeIn 0.4s ease forwards;
}

.memory-system.active .memory-item.item-1 {
  animation-delay: 0.8s;
}

.memory-system.active .memory-item.item-2 {
  animation-delay: 1.2s;
}

.memory-system.active .memory-item.item-3 {
  animation-delay: 1.6s;
}

.memory-system.active .stored-item {
  animation: itemFadeIn 0.4s ease forwards;
}

.memory-system.active .stored-item.item-1 {
  animation-delay: 3.5s;
}

.memory-system.active .stored-item.item-2 {
  animation-delay: 5s;
}

.memory-system.active .stored-item.item-3 {
  animation-delay: 6.5s;
}

.capacity {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.transfer-arrow {
  flex: 1;
  position: relative;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-line {
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  position: relative;
  opacity: 0;
}

.memory-system.active .arrow-line {
  animation: arrowGrow 0.8s ease 0.6s forwards;
}

.arrow-head {
  position: absolute;
  right: -2px;
  width: 0;
  height: 0;
  border-left: 20px solid #3b82f6;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  opacity: 0;
}

.memory-system.active .arrow-head {
  animation: arrowHeadAppear 0.3s ease 1.4s forwards;
}

.arrow-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
  opacity: 0;
}

.memory-system.active .arrow-label {
  animation: labelFadeIn 0.4s ease 1.2s forwards;
}

.moving-item {
  position: absolute;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  opacity: 0;
  pointer-events: none;
}

.moving-item span {
  display: block;
}

.memory-system.active .moving-1 {
  animation: moveToLongTerm 1.5s ease 2s forwards;
  top: 140px;
  left: 240px;
}

.memory-system.active .moving-2 {
  animation: moveToLongTerm 1.5s ease 3.5s forwards;
  top: 200px;
  left: 240px;
}

.memory-system.active .moving-3 {
  animation: moveToLongTerm 1.5s ease 5s forwards;
  top: 260px;
  left: 240px;
}

@keyframes boxAppear {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes itemFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes arrowGrow {
  from {
    opacity: 0;
    transform: scaleX(0);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes arrowHeadAppear {
  to {
    opacity: 1;
  }
}

@keyframes labelFadeIn {
  to {
    opacity: 1;
  }
}

@keyframes moveToLongTerm {
  0% {
    opacity: 0;
    transform: translateX(0) scale(0.8);
  }
  10% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  90% {
    opacity: 1;
    transform: translateX(320px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(320px) scale(0.8);
  }
}

@media (max-width: 768px) {
  .memory-system {
    flex-direction: column;
    gap: 3rem;
  }

  .memory-box {
    flex: none;
    width: 100%;
    max-width: 300px;
  }

  .transfer-arrow {
    width: 60px;
    height: 100px;
    transform: rotate(90deg);
  }

  .moving-item {
    display: none;
  }
}
</style>
