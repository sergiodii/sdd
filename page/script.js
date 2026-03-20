document.addEventListener('DOMContentLoaded', () => {

    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('nav-open');
            toggle.classList.toggle('active');
        });

        links.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                links.classList.remove('nav-open');
                toggle.classList.remove('active');
            });
        });
    }

    // Close mobile nav on scroll
    window.addEventListener('scroll', () => {
        if (links && links.classList.contains('nav-open')) {
            links.classList.remove('nav-open');
            toggle.classList.remove('active');
        }
    }, { passive: true });

    // Close mobile nav on outside click
    document.addEventListener('click', (e) => {
        if (links && links.classList.contains('nav-open') &&
            !links.contains(e.target) && !toggle.contains(e.target)) {
            links.classList.remove('nav-open');
            toggle.classList.remove('active');
        }
    });

    // Scroll-triggered animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(
        '.paradigm-card, .problem-card, .principle-card, .skill-card, ' +
        '.workflow-step, .role-card, .stat-card, .annotation, .gs-step, ' +
        '.spec-window, .key-insight, .skills-portable, .comparison-table-wrapper, .section-image'
    );

    animatedElements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${i % 6 * 0.08}s, transform 0.6s ease ${i % 6 * 0.08}s`;
        fadeObserver.observe(el);
    });

    // Flow step sequential animation
    const flowSteps = document.querySelectorAll('.flow-step');
    const flowArrows = document.querySelectorAll('.flow-arrow');

    [...flowSteps, ...flowArrows].forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`;
    });

    const flowObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                [...flowSteps, ...flowArrows].forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
                flowObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const flowDiagram = document.querySelector('.flow-diagram');
    if (flowDiagram) flowObserver.observe(flowDiagram);

    // Stat number counter animation
    const statNumbers = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent.trim();
                const match = text.match(/^(\d+)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = text.replace(match[1], '');
                    let current = 0;
                    const duration = 1500;
                    const step = target / (duration / 16);
                    const counter = () => {
                        current += step;
                        if (current >= target) {
                            el.textContent = target + suffix;
                        } else {
                            el.textContent = Math.floor(current) + suffix;
                            requestAnimationFrame(counter);
                        }
                    };
                    counter();
                }
                statObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));

    // Navbar background on scroll
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.borderBottomColor = 'rgba(99, 102, 241, 0.15)';
        } else {
            nav.style.borderBottomColor = 'var(--border)';
        }
    }, { passive: true });

    // Active nav link highlight
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 200;
            if (scrollY >= top) current = section.getAttribute('id');
        });
        navLinks.forEach(a => {
            a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--primary-light)' : '';
        });
    }, { passive: true });
});

// Dynamic styles
const style = document.createElement('style');
style.textContent = `
    .visible { opacity: 1 !important; transform: translateY(0) !important; }

    .nav-open {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0; right: 0;
        background: rgba(10, 10, 15, 0.98);
        backdrop-filter: blur(20px);
        padding: 24px 20px;
        border-bottom: 1px solid var(--border);
        gap: 4px;
        animation: slideDown 0.3s ease;
    }
    .nav-open a {
        padding: 12px 16px !important;
        border-radius: 8px;
        font-size: 1rem !important;
        transition: background 0.2s;
    }
    .nav-open a:hover, .nav-open a:active {
        background: rgba(99, 102, 241, 0.1);
    }
    .nav-open .nav-cta {
        margin-top: 8px;
        text-align: center;
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .nav-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .nav-toggle.active span:nth-child(2) { opacity: 0; }
    .nav-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
`;
document.head.appendChild(style);
