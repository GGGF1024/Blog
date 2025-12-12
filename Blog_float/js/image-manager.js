/**
 * 智能图片管理器 - 解决加载超时和白色方框问题
 */

class ImageManager {
    constructor() {
        this.containers = [];
        this.maxRetries = 3;
        this.timeout = 10000; // 10秒超时
        this.concurrentLimit = 3; // 同时加载的最大图片数
        this.loadingQueue = [];
        this.currentLoadings = 0;
        
        this.stats = {
            total: 0,
            loaded: 0,
            failed: 0,
            retries: 0
        };
        
        this.init();
    }

    init() {
        // 收集所有图片容器
        this.containers = Array.from(document.querySelectorAll('.image-wrapper[data-src]'));
        this.stats.total = this.containers.length;
        
        console.log(`找到 ${this.stats.total} 张需要加载的图片`);
        
        // 立即加载首屏图片
        this.loadCriticalImages();
        
        // 设置懒加载
        this.setupLazyLoading();
        
        // 显示加载统计
        this.displayStats();
    }

    loadCriticalImages() {
        // 预加载关键图片（头像、LOGO）
        const criticalUrls = [
            'img/头像.jpg',
            'img/LOGO.png'
        ];
        
        criticalUrls.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = () => console.log(`关键图片加载完成: ${url}`);
            img.onerror = () => console.warn(`关键图片加载失败: ${url}`);
        });
        
        // 立即加载前3张可见图片
        const viewportHeight = window.innerHeight;
        this.containers.slice(0, 3).forEach((container, index) => {
            if (index < 3) {
                setTimeout(() => {
                    this.loadImage(container, 0);
                }, index * 300); // 错开加载时间
            }
        });
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const container = entry.target;
                        this.addToQueue(container);
                        this.observer.unobserve(container);
                    }
                });
            }, {
                rootMargin: '200px 0px',
                threshold: 0.01
            });
            
            this.containers.forEach(container => {
                this.observer.observe(container);
            });
        } else {
            // 回退方案：滚动加载
            this.setupScrollLoading();
        }
    }

    addToQueue(container) {
        this.loadingQueue.push(container);
        this.processQueue();
    }

    processQueue() {
        while (this.currentLoadings < this.concurrentLimit && this.loadingQueue.length > 0) {
            const container = this.loadingQueue.shift();
            this.currentLoadings++;
            this.loadImage(container, 0);
        }
    }

    loadImage(container, retryCount) {
        const src = container.dataset.src;
        if (!src) return;
        
        // 检查是否已加载
        if (container.dataset.loaded === 'success') {
            this.currentLoadings--;
            this.processQueue();
            return;
        }
        
        // 显示加载状态
        this.showLoadingState(container);
        
        // 创建图片对象
        const img = new Image();
        img.src = src;
        
        // 设置超时
        const timeoutId = setTimeout(() => {
            this.handleImageTimeout(container, img, retryCount);
        }, this.timeout);
        
        img.onload = () => {
            clearTimeout(timeoutId);
            this.handleImageLoad(container, img);
        };
        
        img.onerror = () => {
            clearTimeout(timeoutId);
            this.handleImageError(container, retryCount);
        };
    }

    showLoadingState(container) {
    // 确保容器有正确的类名
    container.className = 'image-wrapper loading';
    container.dataset.loading = 'true';
    delete container.dataset.loaded;
    
    // 确保加载动画可见
    const loadingEl = container.querySelector('.image-loading');
    const placeholderEl = container.querySelector('.image-placeholder');
    
    if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.style.opacity = '1';
    }
    if (placeholderEl) {
        placeholderEl.style.display = 'block';
        placeholderEl.style.opacity = '1';
    }
    
    // 隐藏图片和错误状态
    const imgEl = container.querySelector('.lazy-image');
    const errorEl = container.querySelector('.image-error');
    
    if (imgEl) {
        imgEl.style.display = 'none';
        imgEl.classList.remove('loaded', 'error');
    }
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

    handleImageLoad(container, img) {
    // 图片加载成功
    container.dataset.loaded = 'success';
    delete container.dataset.loading;
    
    // 获取或创建图片元素
    let lazyImg = container.querySelector('.lazy-image');
    if (!lazyImg) {
        lazyImg = document.createElement('img');
        lazyImg.className = 'lazy-image';
        lazyImg.alt = '图片';
        container.appendChild(lazyImg);
    }
    
    // 设置图片源
    lazyImg.src = img.src;
    
    // 显示图片，隐藏加载状态
    setTimeout(() => {
        container.className = 'image-wrapper loaded';
        lazyImg.classList.add('loaded');
        lazyImg.style.display = 'block';
        
        const loadingEl = container.querySelector('.image-loading');
        const placeholderEl = container.querySelector('.image-placeholder');
        if (loadingEl) loadingEl.style.display = 'none';
        if (placeholderEl) placeholderEl.style.display = 'none';
        
        console.log(`图片加载成功: ${img.src}`);
    }, 50);
    
    // 更新统计
    this.stats.loaded++;
    this.currentLoadings--;
    this.processQueue();
    this.updateStats();
}

    handleImageError(container, retryCount) {
        console.warn(`图片加载失败: ${container.dataset.src}, 重试次数: ${retryCount}`);
        
        this.stats.failed++;
        this.stats.retries++;
        
        if (retryCount < this.maxRetries) {
            // 重试
            setTimeout(() => {
                console.log(`重试加载: ${container.dataset.src}, 第${retryCount + 1}次`);
                this.loadImage(container, retryCount + 1);
            }, 1000 * (retryCount + 1)); // 延迟重试
        } else {
            // 超过重试次数，显示错误状态
            this.showErrorState(container);
            this.currentLoadings--;
            this.processQueue();
        }
        
        this.updateStats();
    }

    handleImageTimeout(container, img, retryCount) {
        console.warn(`图片加载超时: ${container.dataset.src}`);
        
        // 中断当前加载
        img.src = '';
        
        if (retryCount < this.maxRetries) {
            // 使用备选方案重试
            this.retryWithFallback(container, retryCount);
        } else {
            this.showErrorState(container);
            this.currentLoadings--;
            this.processQueue();
        }
        
        this.updateStats();
    }

    retryWithFallback(container, retryCount) {
        const originalSrc = container.dataset.src;
        
        // 尝试使用不同的加载策略
        setTimeout(() => {
            if (retryCount === 1) {
                // 第二次重试：降低图片质量
                this.loadWithQualityReduction(container, originalSrc);
            } else if (retryCount === 2) {
                // 第三次重试：使用base64占位图
                this.loadWithPlaceholder(container);
            }
        }, 2000);
    }

    loadWithQualityReduction(container, src) {
        // 如果是本地图片，可以尝试压缩版本
        const compressedSrc = src.replace('/camera/', '/camera/compressed/');
        
        const img = new Image();
        img.src = compressedSrc;
        
        img.onload = () => {
            container.dataset.loaded = 'compressed';
            this.handleImageLoad(container, img);
        };
        
        img.onerror = () => {
            // 如果压缩版也失败，尝试原图
            const originalImg = new Image();
            originalImg.src = src;
            originalImg.onload = () => this.handleImageLoad(container, originalImg);
            originalImg.onerror = () => this.showErrorState(container);
        };
    }

    loadWithPlaceholder(container) {
        // 生成SVG占位图
        const width = container.offsetWidth || 400;
        const height = container.offsetHeight || 300;
        
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" 
                      text-anchor="middle" dy=".3em">图片加载中</text>
            </svg>
        `;
        
        const svgBlob = new Blob([svg], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.src = url;
        
        img.onload = () => {
            container.dataset.loaded = 'placeholder';
            this.handleImageLoad(container, img);
            URL.revokeObjectURL(url);
        };
    }

    showErrorState(container) {
        const src = container.dataset.src;
        
        container.innerHTML = `
            <div class="image-error">
                <div class="image-error-icon">📷</div>
                <div>图片加载失败</div>
                <button class="image-retry-btn" onclick="imageManager.retryImage(this)">重新加载</button>
            </div>
        `;
        
        // 保存原始src到按钮，方便重试
        container.querySelector('.image-retry-btn').dataset.src = src;
        container.querySelector('.image-retry-btn').dataset.containerId = Array.from(this.containers).indexOf(container);
        
        console.error(`最终加载失败: ${src}`);
    }

    retryImage(button) {
        const src = button.dataset.src;
        const containerIndex = button.dataset.containerId;
        
        if (containerIndex && this.containers[containerIndex]) {
            const container = this.containers[containerIndex];
            container.dataset.src = src;
            this.loadImage(container, 0);
        }
    }

    setupScrollLoading() {
        let ticking = false;
        
        const checkVisibility = () => {
            const scrollTop = window.scrollY || window.pageYOffset;
            const windowHeight = window.innerHeight;
            const loadArea = windowHeight * 2;
            
            this.containers.forEach(container => {
                if (!container.dataset.loaded && !container.dataset.loading) {
                    const rect = container.getBoundingClientRect();
                    const containerTop = rect.top + scrollTop;
                    
                    if (containerTop < scrollTop + loadArea) {
                        container.dataset.loading = 'true';
                        this.addToQueue(container);
                    }
                }
            });
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // 初始检查
        setTimeout(checkVisibility, 100);
    }

    displayStats() {
        // 在页面右上角显示加载统计
        const statsEl = document.createElement('div');
        statsEl.id = 'image-stats';
        statsEl.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            display: none;
        `;
        
        document.body.appendChild(statsEl);
        
        // 按F12显示统计
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                statsEl.style.display = statsEl.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    updateStats() {
        const statsEl = document.getElementById('image-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>总计: ${this.stats.total}</div>
                <div>已加载: ${this.stats.loaded}</div>
                <div>失败: ${this.stats.failed}</div>
                <div>重试: ${this.stats.retries}</div>
                <div>进度: ${Math.round((this.stats.loaded / this.stats.total) * 100)}%</div>
            `;
        }
    }
}

// 初始化图片管理器
let imageManager;

document.addEventListener('DOMContentLoaded', () => {
    // 添加页面加载进度
    addLoadingProgress();
    
    // 延迟初始化，确保页面渲染完成
    setTimeout(() => {
        imageManager = new ImageManager();
        window.imageManager = imageManager; // 暴露给全局，方便调试
    }, 100);
});

// 添加加载进度条
function addLoadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.id = 'global-loading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #4CAF50, #2196F3);
        z-index: 9999;
        transition: width 0.3s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(progressBar);
    
    // 模拟初始加载进度
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 85) {
            clearInterval(interval);
            progress = 85;
        }
        progressBar.style.width = progress + '%';
    }, 200);
    
    // 页面完全加载后完成进度
    window.addEventListener('load', () => {
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.remove(), 300);
        }, 500);
    });
    
    // 监听图片加载进度
    document.addEventListener('imageLoadProgress', (e) => {
        const detail = e.detail;
        if (detail.total && detail.loaded) {
            const percentage = 85 + (detail.loaded / detail.total) * 15;
            progressBar.style.width = Math.min(percentage, 99) + '%';
        }
    });
}

// 全局错误处理
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.warn('图片加载全局错误:', e.target.src);
        e.preventDefault(); // 阻止默认错误处理
    }
}, true);

// 离线检测
window.addEventListener('offline', () => {
    console.warn('网络已断开，暂停图片加载');
    if (imageManager) {
        imageManager.concurrentLimit = 0; // 暂停新加载
    }
});

window.addEventListener('online', () => {
    console.log('网络已恢复，恢复图片加载');
    if (imageManager) {
        imageManager.concurrentLimit = 3;
        imageManager.processQueue();
    }
});
