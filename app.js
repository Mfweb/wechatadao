//app.js
App({
  globalData:{
    thumb_img_url :"http://cdn.ovear.info:9009/thumb/",//缩略图
    full_img_url  :"http://cdn.ovear.info:9009/image/",//原图
    show_forum_url:"https://h.nimingban.com/Api/showf?appid=wechatapp",//获得板块内串
    get_forum_url :"https://h.nimingban.com/Api/getForumList?appid=wechatapp",//获得板块列表
    thread_url    :"https://h.nimingban.com/Api/thread?appid=wechatapp",//获得串回复列表
    new_thread_url:"https://h.nimingban.com/Home/Forum/doPostThread.html?appid=wechatapp",//发送新串
    new_reply_url :"https://h.nimingban.com/Home/Forum/doReplyThread.html?appid=wechatapp",//发送新回复
    get_thread_url:"https://h.nimingban.com/Api/ref?appid=wechatapp",//获得串内容
    top_image_url :"https://mfweb.top/adao/getpicture.php",//首页大图
    get_cookie_url:"https://mfweb.top/adao/getcookie.php"//小程序不支持获取Cookie 暂时从服务器端拿
  }
})