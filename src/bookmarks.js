

var allATag=[]
var allATag_first=[]
var list=document.getElementById('serach-list')
var input=document.getElementById('input')
var cont=document.getElementById('cont')

var seachStr=false
var up_down_y=0


input.oninput=function (){
    seach(this.value.trim())
}
input.onblur=function (){
    this.focus()
}



function searchBaiDu(keyword){

    $.get({
        url : 'https://www.baidu.com/sugrec?ie=utf-8&prod=pc&from=pc_web&wd='+keyword,
        dataType : 'json',
    })
    .then(function(data){
        console.log('百度',data.g.map(item=>item.q))
    })
}

function seachBiliBili(keyword){
    
    $.get({
        url : 'https://s.search.bilibili.com/main/suggest?main_ver=v1&term='+keyword,
        dataType : 'json',
    })
    .then(function(data){
        console.log('bilibili',data.result.tag.map(item=>item.value))
    })
}

function searchTaoBao(keyword) {
    $.get({
        url : 'https://suggest.taobao.com/sug?code=utf-8&q='+keyword,
        dataType : 'json',
    })
    .then(function(data){
        console.log('淘宝',data.result.map(item=>item[0]))
    })
}

function searchZhiHu(keyword){

    $.get('https://www.zhihu.com/api/v4/search/suggest?q='+keyword)
    .then(function(data){
        console.log('知乎',data.suggest.map(item=>item.query))
    })
}


function filterBookmarks(bookmarks){
    bookmarks.forEach((bookmarkGroup)=>{
        bookmarkGroup.children = bookmarkGroup.children.map(({ id, title, url })=>{
            return { id, title, url }
        })
    })
}

function init(bookmarks){

    document.querySelector('#cont').innerHTML = bookmarks.map((bookmarkGroup)=>{
        return `
            <div class="bookmark-group" class>
                <span class="bookmark-group-title">${bookmarkGroup.title}</span>
                <div class="bookmark-group-list">
                    ${
                        bookmarkGroup.children.map((bookmark)=>{

                            
                            var htmlCode = `
                                <a class="bookmark" data-id="${bookmark.id}" data-first="${first}" href="${bookmark.url}" title="${bookmark.url}">
                                    <img class="bookmark-favicon" src="chrome://favicon/${bookmark.url}">
                                    <span class="bookmark-title">${bookmark.title}</span>
                                </a>
                            `
                            var first = getFirst(bookmark.title)
                            allATag_first.push(first)
                            allATag.push(htmlCode)

                            return htmlCode
                        }).join('')
                    }
                </div>
            </div>
        `
    }).join('')

    document.querySelector('.bookmark').classList.add('checked')
    document.querySelector('.bookmark-group').classList.add('checked')

    document.addEventListener('click', function(e){
        if(e.target.tagName=='A'){
            e.preventDefault()

            checkedBookmark(e.target)
            location.replace(e.target.href)
        }
    })
    run()
}


console.log(chrome.bookmarks)

chrome.bookmarks.getTree(function(bookmarkArray){

    chrome.bookmarks.getTree((bookmarkArray)=>{
        var defaultBookmarks = bookmarkArray[0].children[0].children
        var bookmarks = defaultBookmarks.filter((bookmarkItem)=>bookmarkItem.children)
        var otherBookmarks = defaultBookmarks.filter((bookmarkItem)=>!bookmarkItem.children)

        bookmarks.unshift({
            children : otherBookmarks,
            title : '书签栏',
            id : null,
        })

        filterBookmarks(bookmarks)
        init(bookmarks)
    })
})

function seach(str){
    input.className=str?'':'noValue'
    seachStr=str
    list.innerHTML=''
    if(!str){
        return
    }

    var re=str.split('')
    if(str.length==1){
        re=new RegExp(str,'i')
    }
    else{
        re=new RegExp(`${re.shift()}\\w*${re.join('+\\w*')}+\\w*`,'i')
    }

    var arr=[]
    var strArr=[]
    allATag_first.forEach(function(data,i){
        if(re.test(data)){
            strArr.push([data,i])
        }
    })
    

    sort(str,strArr).forEach(function(data){
        arr.push(allATag[data[1]])
    })

    seachInternet(str)

    if(parseInt(seachStr)==seachStr && parseInt(seachStr)>9){
        arr.unshift('<a class="bookmark" href="http://localhost:'+seachStr+'"><span>localhost:'+seachStr+'</span></a>')
    }


    arr.push('<a class="bookmark" href="https://www.baidu.com/s?ie=UTF-8&wd='+seachStr+'"><span>百度搜索 : '+seachStr+'</span></a>')
    arr.push('<a class="bookmark" href="https://cn.bing.com/search?q='+seachStr+'"><span>必应搜索 : '+seachStr+'</span></a>')
    arr.push('<a class="bookmark" href="https://s.taobao.com/search?q='+seachStr+'"><span>淘宝搜索 : '+seachStr+'</span></a>')
    arr.push('<a class="bookmark" href="https://www.zhihu.com/search?type=content&q='+seachStr+'"><span>知乎搜索 : '+seachStr+'</span></a>')
    arr.push('<a class="bookmark" href="https://search.bilibili.com/all?from_source=banner_search&keyword='+seachStr+'"><span>bili搜索 : '+seachStr+'</span></a>')

    
    list.innerHTML=arr.join('')
    
    if(arr.length)
    list.children[0].classList.add('checked')

    up_down_y=0    
}

function seachInternet(str){
    clearTimeout(seachInternet.timeout)

    seachInternet.timeout = setTimeout(function(){
        searchBaiDu(str)
        searchTaoBao(str)
        searchZhiHu(str)
        seachBiliBili(str)
    },300)
}




function sort(str,arr){
    var c=[]
    var d=[]

    arr.forEach(function(data){
        for(var i=0;i<str.length;i++){
            if(str[i]!=data[0][i]){
                break
            }
        }
        c.push([data,str==data[0]?i+1:i])
    })
    
    c.sort(function (a,b){
        var e=b[1][0]-a[1][0]
        return e?e:a[0][0].length-b[0][0].length
    })

    c.forEach(function(data){
        d.push(data[0])
    })
    
    return d
}

function getFirst(str){
    var arr=[]
    str.split('').forEach(function(data){
        arr.push(PinYin.getFirstLetter(data))
    })

    return arr.join('')
}


function checkedBookmark(a){

    document.querySelectorAll('#cont .bookmark.checked').forEach(a=>a.classList.remove('checked'))
    a.classList.add('checked')

    document.querySelectorAll('#cont .bookmark-group.checked').forEach(group=>group.classList.remove('checked'))
    a.parentElement.parentElement.classList.add('checked')

}

function run(){
    var move={
        39:[1,0],
        37:[-1,0],
        38:[0,-1],
        40:[0,1]
    }
    
    var tabs=$('#cont>*')
    var focusX=0
    var focusY=0

    window.onfocus=function (){
        window.onfocus=null
        moveFocus([0,0])
    }
    
    function up_down(e,cmd){
        cmd=cmd?cmd[1]:0
        var children=list.children
        var a=children[up_down_y]
        if(e.keyCode==13){
            document.title=`打开 ${a.innerText}`
            open(a.href)
            return
        }

        if(e.keyCode==27){
            input.value=''
            seach('')
        }

        if(!cmd){
            return
        }
        
        up_down_y+=cmd

        document.querySelector('#serach-list>a.checked').classList.remove('checked')

        if(up_down_y>children.length-1){
            up_down_y=0
        }
        else if(up_down_y<0){
            up_down_y=children.length-1
        }

        children[up_down_y].classList.add('checked')
    }

    document.onkeydown=function (e){

        var cmd=move[e.keyCode]
        if(seachStr){
            up_down(e,cmd)
            return
        }

        if(e.keyCode==9){
            cmd=[e.shiftKey?-1:1,0]
        }

        var a=$('#cont .bookmark.checked')[0]

        if((e.keyCode==69) && (e.metaKey || e.ctrlKey )){
            open('chrome://bookmarks/')
            return 
        }

        if( (e.keyCode==8 || e.keyCode==46) && (e.metaKey || e.ctrlKey ) ){

            if(confirm('确认删除该书签 ? \n《'+a.innerText+'》')){
                chrome.bookmarks.remove(a.dataset.id, function(){
                    a.style.display='none'
                })
            }

            return
        }

        if(e.keyCode==13){
            document.title=`打开 ${a.innerText}`
            open(a.href)
        }

        if(e.keyCode==32){
            open(a.href,'_blank')
        }

        if(cmd){
            e.preventDefault()
            moveFocus(cmd)
        }
    }
    
    function open(href,target){
        if(href.indexOf('chrome://')==0 || target=='_blank'){
            chrome.tabs.create({
                url:href
            })
            return
        }

        location.replace(href)
    }

    function moveFocus(cmd){
        focusX+=cmd[0]
        focusY+=cmd[1]

        if(focusX>=tabs.length){
            focusX=0
        }

        if(focusX<0){
            focusX=tabs.length-1
        }

        console.log(tabs.length , focusX)
        if(tabs.length - focusX >= 3){
            cont.style.transform=`translateX(${ -200*focusX }px)`
        }
        
        
        var y=tabs[focusX]

        if(y.nodeName=='A'){
            checkedBookmark(y)
            return
        }

        y=y.querySelectorAll('a')

        if(focusY>=y.length){
            if(cmd[1]==0){
                checkedBookmark(y[y.length-1])
                return
            }
            else{
                focusY=0
            }
        }

        if(focusY<0){
            focusY=y.length-1
        }
        
        checkedBookmark(y[focusY])
    }
}