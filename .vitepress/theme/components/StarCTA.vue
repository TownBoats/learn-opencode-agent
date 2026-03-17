<template>
  <div class="star-cta">
    <div class="star-cta-content">
      <div class="star-cta-text">
        <p class="star-cta-title">如果本章对你有帮助</p>
        <p class="star-cta-desc">给本书仓库点一个 Star，是对作者最直接的支持。</p>
      </div>
      <a
        class="star-cta-btn"
        href="https://github.com/qqzhangyanhua/learn-opencode-agent"
        target="_blank"
        rel="noopener noreferrer"
      >
        Star 支持本书
      </a>
    </div>
  </div>
</template>

<style scoped>
.star-cta {
  margin-top: 48px;
  padding: 24px 28px;
  border: 1px solid var(--vp-c-brand-soft, rgba(13, 148, 136, 0.2));
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.star-cta-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.star-cta-text {
  flex: 1;
  min-width: 200px;
}

.star-cta-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.star-cta-desc {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.star-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #fff !important;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s;
}

.star-cta-btn:hover {
  background: var(--vp-c-brand-2);
  color: #fff !important;
}
</style>
