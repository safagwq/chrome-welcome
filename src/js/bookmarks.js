

var allATag=[]
var allATag_first=[]

var appid = '20190531000303602';
var key = 'dzl5JVPHX73VZziwMWik';

var list=document.getElementById('serach-list')
var input=document.getElementById('input')
var cont=document.getElementById('cont')

var bookmarkChecked={
    x : 0,
    y : 0
}

var serachListChecked={
    x : 0,
    y : 0
}

var seachInternetMaps=[
     {
        name : '百度',
        url : 'http://www.baidu.com/sugrec?ie=utf-8&prod=pc&from=pc_web&wd=',
        serachUrl : 'http://www.baidu.com/s?ie=UTF-8&wd=',
        filter : (data)=>{
            if(!data.g){
                return false
            }
            return data.g.map(item=>item.q)
        },
    },

    {
        name : '知乎',
        url : 'http://www.zhihu.com/api/v4/search/suggest?q=',
        serachUrl : 'http://www.zhihu.com/search?type=content&q=',
        filter : (data)=>{
            if(!data.suggest){
                return false
            }
            return data.suggest.map(item=>item.query)
        },
    },

    {
        name : 'B站',
        url : 'http://s.search.bilibili.com/main/suggest?main_ver=v1&term=',
        serachUrl : 'http://search.bilibili.com/all?from_source=banner_search&keyword=',
        filter : (data)=>{
            if(!data.result.tag){
                return false
            }
            return data.result.tag.map(item=>item.value)
        },
    },

    {
        name : '淘宝',
        url : 'http://suggest.taobao.com/sug?code=utf-8&q=',
        serachUrl : 'http://s.taobao.com/search?q=',
        filter : (data)=>{
            if(!data.result){
                return false
            }
            return data.result.map(item=>item[0])
        },
    },
]

var seachStr=''

var tabs
var seachTabs

var moveCmdMap={
    39:[1,0],
    37:[-1,0],
    38:[0,-1],
    40:[0,1]
}

var keyCmds={
    69 : (e,a)=>{
        if(e.metaKey || e.ctrlKey ){
            open('chrome://bookmarks/')
        }
    },
    //  ctrl+del , 删除书签
    46 : (e,a)=>{
        keyCmds[8](e,a)
    },
    8 : (e,a)=>{
        if(e.metaKey || e.ctrlKey){
            if(confirm('确认删除该书签 ? \n《'+a.innerText+'》\n'+a.href)){
                chrome.bookmarks.remove(a.dataset.id, function(){
                    a.style.display='none'
                })
            }
        }
    },
    13 : (e,a)=>{
        opeingAnimation(a)
        if(e.metaKey || e.ctrlKey){
            open(a.href , '_blank')
        }
        else{
            open(a.href)
        }
    },
    32 : (e,a)=>{
        opeingAnimation(a)
        open(a.href,'_blank')
    }

}

var urlCommands={
    'copy' : (data)=>{
        var _value = $('#input').val()
        $('#input').val(data)[0].select()
        document.execCommand("Copy")
        $('#input').val(_value)
    }
}

chrome.bookmarks.getTree((bookmarkArray)=>{
    var defaultBookmarks = bookmarkArray[0].children[0].children
    var bookmarks = defaultBookmarks.filter((bookmarkItem)=>bookmarkItem.children)
    var otherBookmarks = defaultBookmarks.filter((bookmarkItem)=>!bookmarkItem.children)

    bookmarks.unshift({
        children : otherBookmarks,
        title : '书签栏',
        id : null,
    })

    var _bookmarks=[]
    bookmarks.forEach(function(bookmarkGroup){
        if(bookmarkGroup.children.length<=20){
            _bookmarks.push(bookmarkGroup)
        }
        else{
            for(;bookmarkGroup.children.length>20;){
                _bookmarks.push({
                    children : bookmarkGroup.children.splice(0,20),
                    title : bookmarkGroup.title,
                    id : null,
                })
            }

            if(bookmarkGroup.children.length){
                _bookmarks.push(bookmarkGroup)
            }
        }
    })

    bookmarks = _bookmarks

    bookmarks.forEach((bookmarkGroup)=>{
        bookmarkGroup.children = bookmarkGroup.children.map(({ id, title, url })=>{
            var first = getFirst(title).toLocaleLowerCase()
            var bookmarkData = { id, title, first, url }

            allATag.push(Bookmark(bookmarkData))
            allATag_first.push(first)
            return bookmarkData
        })
    })

    allATag_first = allATag_first.map((first,index)=>{
        return { first , index }
    })

    init(bookmarks)
})



function init(bookmarks){

    $('#cont').html( bookmarks.map(BookmarkGroup).join('') )

    $('#cont .bookmark').eq(0).addClass('checked')
    $('#cont .bookmark-group').eq(0).addClass('checked')

    input.oninput=function (){
        seach(this.value.trim())
    }
    input.onblur=function (){
        this.focus()
    }

    tabs=$('#cont>*')


    $(document)
    .click((e)=>{
        if(e.target.tagName=='A'){
            e.preventDefault()

            selectBookmark(e.target)
            opeingAnimation(e.target)
            location.replace(e.target.href)
        }
    })
    .keydown((e)=>{
        var moveCmd=moveCmdMap[e.keyCode]
        if(seachStr){
            onkeydownHasValue(e,moveCmd)
        }
        else{
            onkeydown(e,moveCmd)
        }
    })
}

function opeingAnimation(a){
    var rect = a.getBoundingClientRect()
    var _a = $(a).clone().addClass('clone').css({
        top : rect.top,
        left : rect.left,
        height : rect.height,
        width : rect.width,
    })
    $('body').after( _a )

    setTimeout(()=>{
        _a.remove()
    },300)
}

function parseVariableName(str){
    if(!/^[A-Za-z0-9._-]+$/.test(str)){
        return str
    }

    var strArr = []
    var lastStrType=''

    str.split('').forEach((char)=>{
        var charType=getVariableNameCharType(char)
        if(charType=='other'){
            char=' '
        }

        if(charType==lastStrType){
            strArr[strArr.length-1]+=char
        }
        else{
            strArr.push(char)
        }
        lastStrType=charType
    })

    return strArr.join('')
}

function getVariableNameCharType(char){
    if(/[A-Z]/.test(char)){
        return 'capital'
    }
    if(/[a-z]/.test(char)){
        return 'lowercase'
    }
    if(/[0-9]/.test(char)){
        return 'number'
    }
    return 'other'
}


function translationNow(str) {
    str = str.trim()
    var formatStr=parseVariableName(str)

    var salt = (new Date).getTime()
    var str1 = appid + formatStr + salt +key
    var sign = MD5(str1)
    var from = 'auto'
    var to = 'auto'

    $.ajax({
        url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
        type: 'get',
        dataType: 'json',
        data: {
            q : formatStr,
            appid : appid,
            salt : salt,
            from : from,
            to : to,
            sign : sign
        },
        success: function (data) {
            if(data.trans_result){
                var translationValue = $(Bookmark({
                    title : '翻译为 : '+data.trans_result[0].dst,
                    url : 'command://copy/'+encodeURI(data.trans_result[0].dst)
                }))

                translationValue.find('img').remove()
                translationValue.css('white-space','initial')

                $("#serach-list").append( translationValue )
            }
        } 
    })
}

function searchNow(keyword){
    seachInternetMaps.map((seachObj)=>{

        let groupData={
            title : seachObj.name+'搜索',
            children : []
        }

        let group = $(BookmarkGroup(groupData))
        $('#serach-groups').append( group )

        $.get({
            url : seachObj.url+keyword,
            dataType : 'json',
        })
        .then(function(data){
            var linkList=seachObj.filter(data)

            var code = Bookmark({ 
                url : seachObj.serachUrl+keyword , 
                title : '直接搜索 '+ keyword
            })
            if(linkList){
                code += linkList.map((keyword)=>{
                    return { 
                        url : seachObj.serachUrl+keyword , 
                        title : keyword
                    }
                })
                .map(Bookmark).join('')
            }

            group.find('.bookmark-group-list').html(code)

            moveFocus($('#serach-groups .bookmark-group'), serachListChecked , [0,0])
            
        })
    })
}


function onkeydownHasValue(e,moveCmd) {

    var a=$('#serach-groups .bookmark.checked')[0]

    if(e.keyCode==27){
        $('#input').val('')
        seachStr=''
        seach('')
        serachListChecked={
            x : 0,
            y : 0
        }
        return
    }

    // 回车直接打开
    if(e.keyCode==13){
        keyCmds[13](e,a)
        return
    }

    // tab / shift+tab
    if(e.keyCode==9){
        moveCmd=[e.shiftKey?-1:1,0]
    }

    // 移动指令
    if(moveCmd){
        e.preventDefault()
        moveFocus($('#serach-groups .bookmark-group'), serachListChecked ,moveCmd)
    }
}


function onkeydown(e,moveCmd){

    var a=$('#cont .bookmark.checked')[0]

    // ctrl + e , 打开书签编辑器
    if(keyCmds[e.keyCode]){
        keyCmds[e.keyCode](e,a)
        return
    }

    // tab / shift+tab
    if(e.keyCode==9){
        moveCmd=[e.shiftKey?-1:1,0]
    }

    // 移动指令
    if(moveCmd){
        e.preventDefault()
        moveFocus(tabs, bookmarkChecked ,moveCmd)
    }
}


function Bookmark(data){
    return `
        <a class="bookmark" data-id="${data.id}" href="${data.url}" title="${data.url}">
            <img class="bookmark-favicon" src="chrome://favicon/${data.url}">
            <span class="bookmark-title">${data.title}</span>
        </a>
    `
}

function BookmarkGroup(bookmarkGroupData){
    return `
        <div class="bookmark-group">
            <span class="bookmark-group-title">${bookmarkGroupData.title}</span>
            <div class="bookmark-group-list">
                ${ bookmarkGroupData.children.map(Bookmark).join('') }
            </div>
        </div>
    `
}

function getSeachList(str) {
    
    var strArr=str.replace(' ','').split('')
    var re=new RegExp(str,'i')

    if(strArr.length>1){
        re=new RegExp(`${ strArr.shift() }[\\w\\W]*${ strArr.join('+[\\w\\W]*') }`,'i')
    }


    var arr=sort(str, allATag_first.filter((item)=> re.test(item.first) ) ).map(item=> allATag[item.index] )

    if(parseInt(seachStr)==seachStr && parseInt(seachStr)>9){
        arr.unshift('<a class="bookmark" href="http://localhost:'+seachStr+'"><span>localhost:'+seachStr+'</span></a>')
    }

    return arr.join('')
}

function seach(str){
    input.className=str?'hasValue':'noValue'
    seachStr=str
    list.innerHTML=''
    if(!str){
        return
    }

    seachInternet(str)

    list.innerHTML=getSeachList(str)

    $('#serach-groups .bookmark-group').eq(0).addClass('checked')
    $('#serach-groups .bookmark').eq(0).addClass('checked')
}

function seachInternet(str){
    clearTimeout(seachInternet.timeout)

    seachInternet.timeout = setTimeout(function(){
        $('#serach-groups .bookmark-group').eq(0).nextAll().remove()
        searchNow(str)
        translationNow(str)
    },300)
}


function sort(str,arr){
    var sortArr = arr.map((item)=>{
        return {
            data : item,
            sortLevel : item.first.indexOf(str)==0 ? 1:0
        }
    })

    sortArr.sort((a,b)=> b.sortLevel - a.sortLevel )
    return sortArr.map((item)=> item.data )
}

function getFirst(str){
    return str.split('').map((data)=> PinYin.getFirstLetter(data) ).join('').replace(/\s/g,'')
}


function selectBookmark(tag){

    $(tag).parent().parent().parent().find('.bookmark').removeClass('checked')
    $(tag).addClass('checked')

    $(tag).parent().parent().parent().find('.bookmark-group').removeClass('checked')
    $(tag).parents('.bookmark-group').addClass('checked')
}



function open(href,target){
    if(href.indexOf('chrome://')==0 || target=='_blank'){
        chrome.tabs.create({
            url:href
        })
        return
    }

    if(href.indexOf('command://')==0){
        href=href.replace(/^command\:\/\//,'')
        var _index = href.indexOf('/')
        var commandName = href.slice(0, _index)
        urlCommands[commandName] && urlCommands[commandName](decodeURI(href.slice(_index+1)))
        return
    }

    location.replace(href)
}

function moveFocus(tabs , checked , moveCmd){
    checked.x+=moveCmd[0]
    checked.y+=moveCmd[1]

    if(checked.x>=tabs.length){
        checked.x=0
    }

    if(checked.x<0){
        checked.x=tabs.length-1
    }

    if(tabs.length - checked.x >= 3){
        tabs.parent().css('transform',`translateX(${ -200*checked.x }px)`)
    }
    
    
    var group=tabs[checked.x]

    var tag=group.querySelectorAll('a')

    if(checked.y>=tag.length){
        if(moveCmd[1]==0){
            selectBookmark(tag[tag.length-1])
            return
        }
        else{
            checked.y=0
        }
    }

    if(checked.y<0){
        checked.y=tag.length-1
    }

    selectBookmark(tag[checked.y])
}