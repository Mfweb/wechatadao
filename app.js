//app.js
App({
  globalData:{
    url:{
      host: "http://adnmb1.com",//https://tnmb.org   http://adnmb1.com
      thumb_img_url :"http://nmbimg.fastmirror.org/thumb/",//缩略图
      full_img_url  :"http://nmbimg.fastmirror.org/image/",//原图

      show_forum_url:"/Api/showf?appid=wechatapp",//获得板块内串
      get_forum_url :"/Api/getForumList?appid=wechatapp",//获得板块列表
      thread_url    :"/Api/thread?appid=wechatapp",//获得串回复列表
      get_thread_url:"/Api/ref?appid=wechatapp",//获得串内容
      get_feed_url  :"/Api/feed?appid=wechatapp",//获取所有订阅
      add_feed_url  :"/Api/addFeed?appid=wechatapp",//将串添加到订阅列表
      del_feed_url  :"/Api/delFeed?appid=wechatapp",//删除某个订阅的串

      new_thread_url:"/Home/Forum/doPostThread.html?appid=wechatapp",//发送新串
      new_reply_url :"/Home/Forum/doReplyThread.html?appid=wechatapp",//发送新回复

      top_image_url :"https://mfweb.top/adao/getpicture.php",//首页大图
      get_cookie_url:"https://mfweb.top/adao/getcookie.php",//小程序不支持获取Cookie 暂时从服务器端拿
      get_openid_url:"https://mfweb.top/adao/getopenid.php"//获取用户openid
    },
    userinfo:{//用户标识  用来保存收藏
      user_openid:null,
    },
    sysinfo:{
      sys_height : 0,//屏幕大小
      sys_width : 0,
      mode: 1//1:主岛  2:备胎岛
    }
  },
  onLaunch: function()
  {
    if (this.globalData.sysinfo.mode == 1)
    {
      this.globalData.url.host = "http://adnmb1.com";
      this.globalData.url.thumb_img_url = "http://nmbimg.fastmirror.org/thumb/";
      this.globalData.url.full_img_url = "http://nmbimg.fastmirror.org/image/";
    }
    else if (this.globalData.sysinfo.mode == 2)
    {
      this.globalData.url.host = "https://tnmb.org";
      this.globalData.url.thumb_img_url = "https://tnmbstatic.fastmirror.org/Public/Upload/thumb/";
      this.globalData.url.full_img_url = "https://tnmbstatic.fastmirror.org/Public/Upload/image/";
    }
    var res = wx.getSystemInfoSync();//获取屏幕尺寸
    this.globalData.sysinfo.sys_width  = res.windowWidth;
    this.globalData.sysinfo.sys_height = res.windowHeight;
    this.get_user_openid();
  },
  get_user_openid:function()
  {
    //获取用户openid
    if(this.globalData.userinfo.user_openid!=null)return;
    var t_openid = wx.getStorageSync('user_openid');
    if(t_openid != null && t_openid != undefined && t_openid != "")//从本地缓存中拉取
    {
      this.globalData.userinfo.user_openid = t_openid;
      this.get_feed();
      return;
    }
    //直接拉取
    wx.login({
      success: function(res)
      {
        var my = getApp();
        wx.request({
          url: my.globalData.url.get_openid_url + '?code=' + res.code,
          data: {},
          method: 'GET',
          success: function(res){
            var my = getApp();
            my.globalData.userinfo.user_openid = res.data.openid;
            wx.setStorageSync('user_openid', res.data.openid);
            console.log(my.globalData.userinfo.user_openid);
            my.get_feed();
          },
          fail: function() {
            console.log('fail');
          }
        })
      },
      fail: function()
      {
        console.log("login fail!");
      }
    });
  },
  /*获取订阅串*/
  get_feed:function(page=1,success=null,ndata=null)
  {
    var AdaoAPI = require('API/adao.js');
    if(page==1)wx.setStorageSync('FeedObj', null);
    AdaoAPI.api_request(
      "",
      this.globalData.url.host + this.globalData.url.get_feed_url + "&uuid=" + this.globalData.userinfo.user_openid,
      {page : page},
      function(res,ndata){//success
        console.log(res);
        if(res.data.length == 0)//订阅已经拉取到最后一页了
        {
          if(success!=null)
            success(res.data,ndata,true);
          console.log(wx.getStorageSync('FeedObj'));
        }
        else//还没有拉取完
        {
          var temp_obj = wx.getStorageSync('FeedObj');
          if(temp_obj==null || temp_obj == undefined || temp_obj == "")
            temp_obj = res.data;
          else
            temp_obj = temp_obj.concat(res.data);
          
          wx.setStorageSync('FeedObj', temp_obj);
          page ++;
          var app=getApp();
          app.get_feed(page,success,ndata);
        }
      },
      function(res,ndata){//fail
        if(success!=null)
          success(null,ndata,false);
      },
      function(){//finish
      },ndata);
  },
})