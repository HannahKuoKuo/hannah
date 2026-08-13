// 頁面滾動時的導覽列動畫
document.addEventListener('DOMContentLoaded', function() {
    // Newsletter 篩選功能
    const filterBtns = document.querySelectorAll('.filter-btn');
    const newsletterItems = document.querySelectorAll('.newsletter-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');

                // 更新按鈕狀態
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // 篩選文章
                newsletterItems.forEach(item => {
                    if (filterValue === 'all') {
                        item.style.display = 'block';
                        setTimeout(() => item.style.opacity = '1', 10);
                    } else {
                        const itemCategory = item.getAttribute('data-category');
                        if (itemCategory === filterValue) {
                            item.style.display = 'block';
                            setTimeout(() => item.style.opacity = '1', 10);
                        } else {
                            item.style.opacity = '0';
                            item.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    // 聯絡表單提交
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('感謝您的訊息！我們將盡快回復您。');
            this.reset();
        });
    }

    // Newsletter 訂閱表單
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            alert(`感謝您訂閱！我們已將確認信件發送至 ${email}`);
            this.reset();
        });
    }

    // Newsletter 首頁訂閱表單
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            alert(`感謝您訂閱！我們已將確認信件發送至 ${email}`);
            this.reset();
        });
    }

    // 平滑捲軸效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 聯絡按鈕功能
    const contactBtns = document.querySelectorAll('.contact-btn');
    contactBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // CTA 按鈕功能
    const ctaBtns = document.querySelectorAll('.hero-buttons .btn');
    ctaBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent.includes('諮詢')) {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (this.textContent.includes('瞭解')) {
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 分頁功能
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            pageButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // 閱讀更多鏈接（可以擴展為點擊後顯示完整文章）
    const readMoreLinks = document.querySelectorAll('.read-more');
    readMoreLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            alert('完整文章功能開發中...\n在實際應用中，這會導向到完整的文章頁面。');
        });
    });
});

// 頁面加載完成後的動畫效果
window.addEventListener('load', function() {
    // 淡入動畫
    document.querySelectorAll('.newsletter-item, .service-card, .project-card').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'all 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 50);
    });
});

// 導覽列激活狀態
window.addEventListener('scroll', function() {
    const navLinks = document.querySelectorAll('.nav-links a');
    let current = '';

    document.querySelectorAll('section[id]').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});
