/**
 * 简单高效的图片懒加载
 */

class LazyLoad {
    constructor() {
        this.images = document.querySelectorAll('img.lazy-img');
        this.init();
    }

    init() {
        // 如果浏览器支持 IntersectionObserver（现代浏览器）
        if ('IntersectionObserver' in window) {
            this.initIntersectionObserver();
        } else {
            // 兼容旧浏览器
            this.initScrollListener();
        }
        
        // 预加载首屏图片
        this.loadVisibleImages();
    }

    initIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px', // 提前50px开始加载
            threshold: 0.01
        });

        this.images.forEach(img => observer.observe(img));
    }

    initScrollListener() {
        let ticking = false;
        
        const loadOnScroll = () => {
            this.loadVisibleImages();
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    loadOnScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // 初始检查
        setTimeout(loadOnScroll, 100);
    }

    loadVisibleImages() {
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY || window.pageYOffset;
        
        this.images.forEach(img => {
            if (!img.dataset.src) return;
            
            const rect = img.getBoundingClientRect();
            const imgTop = rect.top + scrollTop;
            const imgBottom = imgTop + rect.height;
            
            // 如果图片在视口内或即将进入视口（上下各加300px缓冲区）
            if (imgTop < scrollTop + windowHeight + 300 && 
                imgBottom > scrollTop - 300) {
                this.loadImage(img);
            }
        });
    }

    loadImage(img) {
        if (!img.dataset.src || img.dataset.loaded === 'true') return;
        
        const src = img.dataset.src;
        img.dataset.loaded = 'true';
        
        // 创建新的 Image 对象预加载
        const imageLoader = new Image();
        imageLoader.src = src;
        
        imageLoader.onload = () => {
            // 替换 src
            img.src = src;
            img.classList.add('loaded');
            
            // 移除 data-src 属性，避免重复加载
            img.removeAttribute('data-src');
            
            // 触发自定义事件（可用于统计）
            this.dispatchImageLoadedEvent(img, src);
        };
        
        imageLoader.onerror = () => {
            console.warn('图片加载失败:', src);
            img.classList.add('error');
            img.alt = '图片加载失败';
        };
    }

    dispatchImageLoadedEvent(img, src) {
        const event = new CustomEvent('lazyloaded', {
            detail: {
                element: img,
                src: src,
                timestamp: Date.now()
            }
        });
        img.dispatchEvent(event);
    }

    // 手动触发加载指定图片（可用于预加载）
    loadSpecificImage(selector) {
        const img = document.querySelector(selector);
        if (img) this.loadImage(img);
    }

    // 销毁监听器
    destroy() {
        this.images = [];
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoad();
    
    // 添加加载进度提示
    addLoadingProgress();
});

/**
 * 添加页面加载进度提示
 */
function addLoadingProgress() {
    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.id = 'page-load-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #4CAF50, #2196F3);
        z-index: 9999;
        transition: width 0.3s ease;
        opacity: 0.8;
    `;
    
    document.body.appendChild(progressBar);
    
    // 模拟加载进度
    let progress = 0;
    const maxProgress = 90; // 最多显示90%，等待用户交互
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > maxProgress) {
            progress = maxProgress;
            clearInterval(interval);
        }
        progressBar.style.width = progress + '%';
    }, 200);
    
    // 页面完全加载后隐藏进度条
    window.addEventListener('load', () => {
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.remove(), 500);
        }, 500);
    });
    
    // 点击页面任意位置快速隐藏进度条
    document.addEventListener('click', () => {
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.opacity = '0';
            setTimeout(() => progressBar.remove(), 300);
        }, 300);
    }, { once: true });
}

/**
 * 预加载关键图片（可选）
 */
function preloadCriticalImages() {
    // 预加载用户头像和Logo
    const criticalImages = [
        'img/头像.jpg',
        'img/LOGO.png'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// 立即预加载关键图片
preloadCriticalImages();
