// ==UserScript==
// @name         JavDB添加跳转在线观看网站
// @version      0.1
// @description  在影片详情页显示跳转到在线观看网站的按钮，并检查对应是否存在资源，如果对应网站上存在该资源则为绿色，否则显示红色，顺便检测有无中文字幕。
// @match        https://javdb.com/*
// @include      /^https:\/\/(\w*\.)?javdb(\d)*\.com.*$/
// @connect      bestjavporn.com
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdn.bootcss.com/qs/6.7.0/qs.min.js
// @namespace http://tampermonkey.net/
// ==/UserScript==

// 网站数组
let site = [
    {
        id: 1,
        name: 'BestJavPorn',
        hostname: 'BestJavPorn.com',
        url: 'https://www2.bestjavporn.com/search/(code)/',
        search: 'search',
        domQuery: {linkQuery: 'article.thumb-block>a', titleQuery: 'article.thumb-block>a'},
    },
    {
        id: 2,
        name: 'JAVGIGA',
        hostname: 'javgiga.com',
        url: 'https://javgiga.com/?s=(code)',
        search: 'search',
        domQuery: {linkQuery: 'article.thumb-block>a', titleQuery: 'article.thumb-block>a'},
    },
    {
        id: 3,
        name: 'JAVTRUST',
        hostname: 'javtrust.com',
        url: 'https://javtrust.com/search/movie/(code).html',
        search: 'javtrust',
        domQuery: {linkQuery: 'article.thumb-block>a', titleQuery: 'article.thumb-block>a'},
    },
    {
        id: 5,
        name: 'JAVHUB',
        hostname: 'javhub.net',
        url: 'https://javhub.net/search/(code)',
        search: 'search',
        domQuery: {linkQuery: 'div.card>div>a', titleQuery: 'div.card>div>a'},
    },
];

// 添加css样式
function addStyle() {
    GM_addStyle('.provide-sub::after {  position:absolute;  content:"字幕";  padding: 1px;  top:-5px;  left:-2px;  line-height:1;  color:white;  background: green;}');
}

// 查询是否字幕
function querySub(dom, button) {
    let queryString = '';
    if (this.domQuery != null) {
        queryString = this.domQuery.subQuery === undefined ? this.domQuery.titleQuery : this.domQuery.subQuery;
        if (dom.querySelector(queryString).innerText.includes('字幕') || dom.querySelector(queryString).innerText.includes('subtitle')) {
            button.classList.add('provide-sub');
        }

    }
}

// 获取网站信息
function getWebsite(site) {
    // 获取番号
    let videoCode = document.querySelector('[data-clipboard-text]').attributes[2].value;

    if (videoCode.includes('FC2')) {
        videoCode = videoCode.replace('FC2-', '');
    }

    let xhrResult = '';
    let siteUrl = site.url.replace('(code)', videoCode);

    const buttonG = document.createElement('a');
    document.querySelectorAll('.panel-block div.buttons')[1].appendChild(buttonG);
    buttonG.classList.add('button', 'is-info', 'is-outlined', 'button-g');
    buttonG.innerHTML = site.name;
    buttonG.setAttribute('target', '_blank');
    buttonG.href = siteUrl;

    function setbuttonGColor(color) {
        buttonG.style.color = color;
        buttonG.style.borderColor = color;
    }

    (function xhr() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: siteUrl,
            onload: function (result) {
                xhrResult = result.status;
                console.log(`---${site.name} onload,${xhrResult},-${siteUrl}`);
                let domNew = new DOMParser().parseFromString(result.responseText, 'text/html');

                if (site.search === 'search') {
                    let linkElement = domNew.querySelectorAll(site.domQuery.linkQuery)[0];
                    let titleElement = domNew.querySelectorAll(site.domQuery.titleQuery)[0];

                    if (linkElement !== undefined || titleElement.outerHTML.includes(videoCode)) {
                        buttonG.href = linkElement.href.replace(linkElement.hostname, site.hostname);
                    } else {
                        console.log('404');
                        xhrResult = 404;
                    }
                } else if (site.search === 'javtrust') {
                    const path = domNew.getElementsByTagName('meta')[3].getAttribute('content')
                    if (path.includes('/movie/watch/')) {
                        buttonG.href = path
                    } else {
                        xhrResult = 404;
                    }
                }
                xhrResult === 404 ? setbuttonGColor('red') : setbuttonGColor('green');

                if (xhrResult !== 404) {
                    querySub.call(site, domNew, buttonG);
                }
            },
            onerror: function (result) {
                console.log(`---${site.hostname} onerror`, xhrResult);
                console.log(result);
                setbuttonGColor('red');
            },
        });
    })();
}

// 主函数
function vPage() {
    site.forEach((item) => {
        getWebsite(item);
    });
}

// 当前路径
let curLocation = location.pathname;
if (document.querySelector('.tabs.is-boxed')) {
    console.log('mainPage');
} else if (curLocation.includes('/v/') && document.querySelector('h2')) {
    vPage();
    addStyle();
}
