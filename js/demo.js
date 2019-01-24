/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2019, Codrops
 * http://www.codrops.com
 */
{
    // Some help functions.
    const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);
    const lineEq = (y2, y1, x2, x1, currentVal) => {
        let m = (y2 - y1) / (x2 - x1); 
        let b = y1 - m * x1;
        return m * currentVal + b;
    };
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const body = document.body;
    const bodyColor = getComputedStyle(body).getPropertyValue('--color-bg').trim() || 'white';
    const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
        if (!e) e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) 	{
            posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
        }
        return { x : posx, y : posy }
    }

    // Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    // Recalculate window sizes on resize.
    window.addEventListener('resize', calcWinsize);

    // Custom mouse cursor.
    class CursorFx {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.dot = this.DOM.el.querySelector('.cursor__inner--dot');
            this.DOM.circle = this.DOM.el.querySelector('.cursor__inner--circle');
            this.bounds = {dot: this.DOM.dot.getBoundingClientRect(), circle: this.DOM.circle.getBoundingClientRect()};
            this.scale = 1;
            this.opacity = 1;
            this.mousePos = {x:0, y:0};
            this.lastMousePos = {dot: {x:0, y:0}, circle: {x:0, y:0}};
            this.lastScale = 1;
            this.lastOpacity = 1;
            
            this.initEvents();
            requestAnimationFrame(() => this.render());
        }
        initEvents() {
            window.addEventListener('mousemove', ev => this.mousePos = getMousePos(ev));
        }
        render() {
            this.lastMousePos.dot.x = lerp(this.lastMousePos.dot.x, this.mousePos.x - this.bounds.dot.width/2, 1);
            this.lastMousePos.dot.y = lerp(this.lastMousePos.dot.y, this.mousePos.y - this.bounds.dot.height/2, 1);
            this.lastMousePos.circle.x = lerp(this.lastMousePos.circle.x, this.mousePos.x - this.bounds.circle.width/2, 0.15);
            this.lastMousePos.circle.y = lerp(this.lastMousePos.circle.y, this.mousePos.y - this.bounds.circle.height/2, 0.15);
            this.lastScale = lerp(this.lastScale, this.scale, 0.15);
            this.lastOpacity = lerp(this.lastOpacity, this.opacity, 0.1);
            this.DOM.dot.style.transform = `translateX(${(this.lastMousePos.dot.x)}px) translateY(${this.lastMousePos.dot.y}px)`;
            this.DOM.circle.style.transform = `translateX(${(this.lastMousePos.circle.x)}px) translateY(${this.lastMousePos.circle.y}px) scale(${this.lastScale})`;
            this.DOM.circle.style.opacity = this.lastOpacity
            requestAnimationFrame(() => this.render());
        }
        enter() {
            cursor.scale = 2.7;
        }
        leave() {
            cursor.scale = 1;
        }
        click() {
            this.lastScale = 1;
            this.lastOpacity = 0;
        }
    }
    
    // Tilt effect used for the main slide's image and title.
    class TiltFx {
        constructor(el, options) {
            this.DOM = {el: el};
            this.options = {
                valuesFromTo: [-50,50],
                lerpFactorOuter: 0.25,
                lerpFactor: pos => 0.05*Math.pow(2,pos)
            };
            Object.assign(this.options, options);
            this.DOM.moving = [...this.DOM.el.children];
            this.movingTotal = this.DOM.moving.length;
            this.mousePos = { x : winsize.width/2, y : winsize.height/2 };
            this.translations = [...new Array(this.movingTotal)].map(() => ({x:0, y:0}));
            this.initEvents();
        }
        initEvents() {
            window.addEventListener('mousemove', ev => this.mousePos = getMousePos(ev));
        }
        render() {
            for (let i = 0; i <= this.movingTotal - 1; ++i) {
                let lerpFactor = i < this.movingTotal - 1 ? this.options.lerpFactor(i) : this.options.lerpFactorOuter;
                this.translations[i].x = lerp(this.translations[i].x, lineEq(this.options.valuesFromTo[1],this.options.valuesFromTo[0], winsize.width, 0, this.mousePos.x), lerpFactor);
                this.translations[i].y = lerp(this.translations[i].y, lineEq(this.options.valuesFromTo[1],this.options.valuesFromTo[0], winsize.height, 0, this.mousePos.y), lerpFactor);
                this.DOM.moving[i].style.transform = `translateX(${(this.translations[i].x)}px) translateY(${this.translations[i].y}px)`;
            }
            this.requestId = requestAnimationFrame(() => this.render());
        }
        start() {
            if ( !this.requestId ) {
                this.requestId = window.requestAnimationFrame(() => this.render());
            }
        }
        stop() {
            if ( this.requestId ) {
                window.cancelAnimationFrame(this.requestId);
                this.requestId = undefined;

                for (let i = 0; i <= this.movingTotal - 1; ++i) {
                    this.translations[i].x = 0;
                    this.translations[i].y = 0;
                    this.DOM.moving[i].style.transform = `translateX(0px) translateY(0px)`;
                }
            }
        }
    }

    class Figure {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.img = this.DOM.el.querySelector('.slide__figure-img');
            this.DOM.slideEl = this.DOM.img;
            // We will add a tilt effect for the main figure. For this we will create clones of the main image that will move together 
            // with the main image when the user moves the mouse.
            if ( this.DOM.el.classList.contains('slide__figure--main') ) {
                this.isMain = true;
                // Number of total images (main image + clones).
                this.totalTiltImgs = 2;
                this.DOM.inner = document.createElement('div');
                this.DOM.slideEl = this.DOM.inner;
                this.DOM.inner.className = 'slide__figure-inner';
                this.DOM.el.appendChild(this.DOM.inner);
                this.DOM.inner.appendChild(this.DOM.img);
                for (let i = 0; i <= this.totalTiltImgs; ++i) {
                    this.DOM.inner.appendChild(this.DOM.img.cloneNode(true));
                }
                // Initialize the tilt effect.
                this.tilt = new TiltFx(this.DOM.inner, {
                    valuesFromTo: [20,-20],
                    lerpFactorOuter: 0.1,
                    lerpFactor: pos => 0.02*pos+0.02
                });
            }
        }
    }

    class Slide {
        constructor(el) {
            this.DOM = {el: el};
            this.figures = [];
            [...this.DOM.el.querySelectorAll('.slide__figure')].forEach(figure => this.figures.push(new Figure(figure)));
            this.figuresTotal = this.figures.length;
            this.DOM.title = this.DOM.el.querySelector('.slide__title');
            this.DOM.content = this.DOM.el.querySelector('.slide__content');
            this.contentcolor = this.DOM.el.dataset.contentcolor;
            this.onClickBackFromContentFn = () => {
                slideshow.hideContent();
            };
            this.DOM.backFromContentCtrl = this.DOM.el.querySelector('.slide__back');
            this.DOM.backFromContentCtrl.addEventListener('click', this.onClickBackFromContentFn);
            // We will add a tilt effect for the title. For this we will create clones of the title that will move 
            // when the user moves the mouse.
            // Number of total title elements;
            this.totalTiltText = 3;
            this.DOM.innerTitleTmp = document.createElement('span');
            this.DOM.innerTitleTmp.className = 'slide__title-inner';
            this.DOM.innerTitleTmp.innerHTML = this.DOM.title.innerHTML;
            this.DOM.title.innerHTML = '';
            for (let i = 0; i <= this.totalTiltText-1; ++i) {
                this.DOM.title.appendChild(this.DOM.innerTitleTmp.cloneNode(true));
            }
            this.DOM.innerTitle = [...this.DOM.title.querySelectorAll('.slide__title-inner')];
            // Split the title inner elements into spans using charmingjs.
            this.DOM.innerTitle.forEach((inner) => charming(inner));
            this.innerTitleTotal = this.DOM.innerTitle.length;
            // Letters of the main one (the top most inner title).
            this.innerTitleMainLetters = [...this.DOM.innerTitle[this.innerTitleTotal-1].querySelectorAll('span')];
            // total letters.
            this.titleLettersTotal = this.innerTitleMainLetters.length;
            // Initialize the tilt effect for the title.
            this.textTilt = new TiltFx(this.DOM.title);
            this.DOM.text = this.DOM.el.querySelector('.slide__text');
            this.DOM.showContentCtrl = this.DOM.text.querySelector('.slide__text-link');
            this.onClickShowContentFn = (ev) => {
                ev.preventDefault();
                slideshow.showContent();
            };
            this.DOM.showContentCtrl.addEventListener('click', this.onClickShowContentFn);
        }
        setCurrent() {
            this.toggleCurrent(true);
        }
        unsetCurrent() {
            this.toggleCurrent(false);
        }
        toggleCurrent(isCurrent) {
            this.DOM.el.classList[isCurrent ? 'add' : 'remove']('slide--current');
            // Start/Stop the images tilt effect (initialized on the main figure).
            this.figures.find(figure => figure.isMain).tilt[isCurrent ? 'start' : 'stop']();
            // Start/Stop the title tilt effect.
            this.textTilt[isCurrent ? 'start' : 'stop']();
        }
    }

    class Slideshow {
        constructor(el) {
            this.DOM = {el: el};
            this.slides = [];
            [...this.DOM.el.querySelectorAll('.slide')].forEach(slide => this.slides.push(new Slide(slide)));
            this.slidesTotal = this.slides.length;
            this.current = 0;
            this.slides[this.current].setCurrent();

            this.animationSettings = {
                duration: 0.8,
                ease: Quint.easeOut,
                staggerFactor: 0.13
            };
        }
        navigate(dir) {
            if ( this.isAnimating || this.isContentOpen ) {
                return;
            }
            this.isAnimating = true;
            this.dir = dir;

            const oldcurrent = this.current;
            // Update current.
            this.current = this.dir === 'right' ? this.current < this.slidesTotal - 1 ? this.current + 1 : 0 :
                                            this.current > 0 ? this.current - 1 : this.slidesTotal - 1;

            const currentSlide = this.slides[oldcurrent];
            const upcomingSlide = this.slides[this.current];
            this.toggleSlides(currentSlide, upcomingSlide);
        }
        showContent() {
            this.toggleContent('show');
        }
        hideContent() {
            this.toggleContent('hide');
        }
        toggleContent(action) {
            if ( this.isAnimating ) {
                return false;
            }
            this.isAnimating = true;
            
            const currentSlide = this.slides[this.current];

            if ( action === 'show' ) {
                this.isContentOpen = true;
                this.nav.hideNavigationCtrls();
                this.dir = 'up';
            }

            this.tl = new TimelineMax({
                onComplete: () => {
                    if ( action === 'hide' ) {
                        this.isContentOpen = false;
                        this.nav.showNavigationCtrls();
                    }
                    this.isAnimating = false;
                }
            }).add('begin');

            const times = {};
            times.switchtime = action === 'show' ? 
                Number(this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1) + this.animationSettings.duration) :
                Number(Math.max(0.05 + 0.04*(currentSlide.titleLettersTotal-1),this.animationSettings.duration));

            const onSwitchCallback = () => {
                currentSlide.DOM.el.classList[action === 'show' ? 'add' : 'remove']('slide--open')
                if ( action === 'hide' ) {
                    this.dir = 'down';
                }
            };
            this.tl.addCallback(onSwitchCallback, times.switchtime);
            
            this.tl.to(body, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                backgroundColor: action === 'show' ? currentSlide.contentcolor : bodyColor
            }, 'begin+=' + times.switchtime);

            const currentSlideFigures = this.dir === 'down' ? 
                currentSlide.figures.sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort) : 
                currentSlide.figures.slice().sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort).reverse();
            
            const figureMain = currentSlideFigures.find(figure => figure.isMain);
            const extraInnerTitleElems = currentSlide.DOM.innerTitle.filter((_,pos) => pos < currentSlide.innerTitleTotal - 1);

            times.slideFigures = action === 'show' ? 
                pos => pos*this.animationSettings.staggerFactor : 
                pos => Number(times.switchtime + pos*this.animationSettings.staggerFactor);

            currentSlideFigures.forEach((figure, pos) => {
                this.tl
                .to(figure.DOM.el, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    y: action === 'show' ? this.dir === 'up' ? '-101%' : '101%' : '0%',
                }, 'begin+=' + times.slideFigures(pos))
                .to(figure.DOM.slideEl, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    startAt: action === 'show' ? {transformOrigin: '50% 0%'} : {},
                    y: action === 'show' ? this.dir === 'up' ? '101%' : '-101%' : '0%',
                }, 'begin+=' + times.slideFigures(pos));
            });

            times.texts = action === 'show' ? 
                        this.animationSettings.duration*this.animationSettings.staggerFactor : 
                        Number(times.switchtime + this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1));
            times.textsExtraTitles = action === 'show' ? times.texts : Number(0.05 + 0.04*(currentSlide.titleLettersTotal-1) + times.texts);

            this.tl.to(currentSlide.DOM.text, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                opacity: action === 'show' ? 0 : 1
            }, 'begin+=' + times.texts);

            this.tl.staggerTo(shuffleArray(currentSlide.innerTitleMainLetters), 0.05, { 
                ease: this.animationSettings.ease,
                opacity: action === 'show' ? 0 : 1
            }, 0.04, 'begin+=' + times.texts);

            extraInnerTitleElems.forEach(inner => {
                this.tl.to(inner, 0.1, {
                    ease: this.animationSettings.ease,
                    opacity: action === 'show' ? 0 : 1
                }, 'begin+=' + times.textsExtraTitles);
            });

            times.content = action === 'show' ? Number(this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1) + this.animationSettings.duration) : 0;
            times.contentExtraTitles = action === 'show' ? Number(0.05 + 0.04*(currentSlide.titleLettersTotal-1) + times.content) : times.content;
            // Content comes/goes now..
            this.tl
            .to(figureMain.DOM.el, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                y: action === 'show' ? '0%' : this.dir === 'up' ? '-101%' : '101%'
            }, 'begin+=' + times.content)
            .to(figureMain.DOM.slideEl, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                y: action === 'show' ? '0%' : this.dir === 'up' ? '101%' : '-101%',
            }, 'begin+=' + times.content)
            .to(currentSlide.DOM.content, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                opacity: action === 'show' ? 1 : 0,
                startAt: action === 'show' ? {y: '5%'} : {},
                y: action === 'show' ? '0%' : '5%'
            }, 'begin+=' + times.content)
            .to(currentSlide.DOM.backFromContentCtrl, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                opacity: action === 'show' ? 1 : 0
            }, 'begin+=' + times.content)
            .staggerTo(shuffleArray(currentSlide.innerTitleMainLetters), 0.05, { 
                ease: this.animationSettings.ease,
                opacity: action === 'show' ? 1 : 0
            }, 0.04, 'begin+=' + times.content);

            extraInnerTitleElems.forEach(inner => {
                this.tl.to(inner, 0.1, {
                    ease: this.animationSettings.ease,
                    opacity: action === 'show' ? 1 : 0
                }, 'begin+=' + times.contentExtraTitles);
            });
        }
        toggleSlides(currentSlide, upcomingSlide) {
            this.tl = new TimelineMax({
                onStart: () => {
                    currentSlide.DOM.el.style.zIndex = 100;
                    upcomingSlide.DOM.el.style.zIndex = 101;
                },
				onComplete: () => this.isAnimating = false
            }).add('begin');

            const onCompleteCurrentCallback = () => currentSlide.unsetCurrent();
            this.tl.addCallback(onCompleteCurrentCallback, this.animationSettings.duration + this.animationSettings.staggerFactor*(this.slidesTotal-1));

            const onStartUpcomingCallback = () => {
                upcomingSlide.figures.forEach((figure) => {
                    TweenMax.set(figure.DOM.slideEl, {
                        x: this.dir === 'right' ? '-101%' : '101%'
                    });
                });
                TweenMax.set(upcomingSlide.DOM.text, {opacity: 0}); 
                upcomingSlide.DOM.innerTitle.forEach((inner, pos) => {
                    if ( pos === upcomingSlide.innerTitleTotal - 1 ) {
                        TweenMax.set([...inner.querySelectorAll('span')], {opacity: 0});
                    }
                    else {
                        TweenMax.set(inner, {opacity: 0});
                    }
                });
                upcomingSlide.setCurrent();
            };
            this.tl.addCallback(onStartUpcomingCallback, this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1));
            
            const currentSlideFigures = this.dir === 'right' ? 
                currentSlide.figures.sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort) : 
                currentSlide.figures.slice().sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort).reverse();

            currentSlideFigures.forEach((figure, pos) => {
                this.tl
                .to(figure.DOM.el, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    x: this.dir === 'right' ? '-101%' : '101%'
                }, 'begin+=' + pos*this.animationSettings.staggerFactor)
                .to(figure.DOM.slideEl, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    startAt: {transformOrigin: '0% 50%'},
                    x: this.dir === 'right' ? '101%' : '-101%'
                }, 'begin+=' + pos*this.animationSettings.staggerFactor);
            });

            this.tl.to(currentSlide.DOM.text, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                opacity: 0
            }, 'begin+=' + this.animationSettings.duration*this.animationSettings.staggerFactor);

            this.tl.staggerTo(shuffleArray(currentSlide.innerTitleMainLetters), 0.05, { 
                ease: this.animationSettings.ease,
                opacity: 0
            }, 0.04, 'begin+=' + this.animationSettings.duration*this.animationSettings.staggerFactor);

            currentSlide.DOM.innerTitle.filter((_,pos) => pos < currentSlide.innerTitleTotal - 1).forEach(inner => {
                this.tl.to(inner, 0.1, {
                    ease: this.animationSettings.ease,
                    opacity: 0
                }, 'begin+=' + this.animationSettings.duration*this.animationSettings.staggerFactor);
            });
            
            const upcomingSlideFigures = this.dir === 'right' ? 
                upcomingSlide.figures.sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort) : 
                upcomingSlide.figures.slice().sort((a,b) => a.DOM.el.dataset.sort-b.DOM.el.dataset.sort).reverse();

            upcomingSlideFigures.forEach((figure, pos) => {
                this.tl
                .to(figure.DOM.el, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    startAt: {x: this.dir === 'right' ? '101%' : '-101%'},
                    x: '0%'
                }, 'begin+=' + Number(this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1) + pos*this.animationSettings.staggerFactor))
                .to(figure.DOM.slideEl, this.animationSettings.duration, { 
                    ease: this.animationSettings.ease,
                    x: '0%'
                }, 'begin+=' + Number(this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1) + pos*this.animationSettings.staggerFactor));
            });

            this.tl.to(upcomingSlide.DOM.text, this.animationSettings.duration, { 
                ease: this.animationSettings.ease,
                opacity: 1
            }, 'begin+=' + this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1));

            this.tl.staggerTo(shuffleArray(upcomingSlide.innerTitleMainLetters), 0.05, { 
                ease: this.animationSettings.ease,
                opacity: 1
            }, 0.04, 'begin+=' + this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1));
            
            upcomingSlide.DOM.innerTitle.filter((_,pos) => pos < upcomingSlide.innerTitleTotal - 1).forEach(inner => {
                this.tl.to(inner, 0.5, {
                    ease: this.animationSettings.ease,
                    opacity: 1
                }, 'begin+=' + Number(0.05 + 0.04*(upcomingSlide.titleLettersTotal-1) + this.animationSettings.staggerFactor*(currentSlide.figuresTotal-1)));
            });
        }
    }

    // The navigation control.
    class Navigation {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.counter = this.DOM.el.querySelector('.nav__counter');
            this.DOM.counterCurrent = this.DOM.counter.firstElementChild;
            this.DOM.counterTotal = this.DOM.counter.lastElementChild;
            this.DOM.navPrevCtrl = this.DOM.el.querySelector('.nav__arrow--prev');
            this.DOM.navNextCtrl = this.DOM.el.querySelector('.nav__arrow--next');

            this.DOM.counterTotal.innerHTML = slideshow.slidesTotal;
            this.updateCounter();
            
            this.initEvents();
        }
        initEvents() {
            this.navigate = (dir) => {
                slideshow.navigate(dir);
                this.updateCounter();
            };
            this.onNavPrevClickHandler = () => this.navigate('left');
            this.onNavNextClickHandler = () => this.navigate('right');
            this.DOM.navPrevCtrl.addEventListener('click', this.onNavPrevClickHandler);
            this.DOM.navNextCtrl.addEventListener('click', this.onNavNextClickHandler);
        }
        updateCounter() {
            this.DOM.counterCurrent.innerHTML = slideshow.current + 1;
        }
        hideNavigationCtrls() {
            this.toggleNavigationCtrls('hide');
        }
        showNavigationCtrls() {
            this.toggleNavigationCtrls('show');
        }
        toggleNavigationCtrls(action) {
            this.DOM.navPrevCtrl.style.opacity = action === 'show' ? 1 : 0;
            this.DOM.navNextCtrl.style.opacity = action === 'show' ? 1 : 0;
        }
    }

    const cursor = new CursorFx(document.querySelector('.cursor'));
    const slideshow = new Slideshow(document.querySelector('.slideshow'));
    const nav = new Navigation(document.querySelector('.nav'));
    slideshow.nav = nav;

    // Custom cursor chnages state when hovering on elements with 'data-hover'.
    [...document.querySelectorAll('[data-hover]')].forEach((link) => {
        link.addEventListener('mouseenter', () => cursor.enter() );
        link.addEventListener('mouseleave', () => cursor.leave() );
        link.addEventListener('click', () => cursor.click() );
    });

    // Preload all the images in the page.
    imagesLoaded(document.querySelectorAll('.slide__figure-img'), {background: true}, () => body.classList.remove('loading'));
}
