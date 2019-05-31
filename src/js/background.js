chrome.webRequest.onHeadersReceived.addListener(responseListener, { urls: ['*://*/*'] }, ['blocking', 'responseHeaders'])

var urls=[
    'http://www.baidu.com/sugrec',
    'http://www.zhihu.com/api/v4/search/suggest',
    'http://s.search.bilibili.com/main/suggest',
    'http://suggest.taobao.com/sug',
]

chrome.storage.sync.get('background', function(result) {
    urls.push(result.background)
})

chrome.commands.getAll(function (...params) {
    console.log(params)
})

chrome.commands.onCommand.addListener(function(command) {
    console.log(command)
    if(command=='open-safa-home'){
        chrome.tabs.create({
            url : 'chromeIndex.html',
        })
    }
})


function responseListener(res) {

    if( urls.some((url)=>res.url.includes(url)) ){

        res.responseHeaders.push({
            name : 'Access-Control-Allow-Origin',
            value : '*'
        })
    }

    return {
        responseHeaders : res.responseHeaders
    }
};
