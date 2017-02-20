var re_mode = 0;
var resto_id = 0;
var appInstance = getApp();
var user_cookie = '';//回复or发送使用的cookie

/* 获取本地已启用的的Cookie */
var location_get_cookie = function()
{
    return wx.getStorageSync('Cookie_Enable');
}
/* 从服务器获取Cookie */
var adao_get_cookie = function()
{
    var temp_cookie = '0';
    wx.request({
    url: 'https://mfweb.top/adao/getcookie.php',
    method: 'GET',
    success: function(res){
        console.log(res);
        if(res.data.status != 'error')
        {
            user_cookie = res.data.cookie;
            wx.setStorageSync('Cookie_Enable', res.data.cookie)
        }
        else
            user_cookie = 'error';
    },
    fail: function() {
        console.log('fail');
        user_cookie = 'error';
    }
    });
    return temp_cookie;
}
/*发送没有图片的回复or新串*/
var SendReplyNoImg = function(that,resto,content)
{
  if(user_cookie == 'null')
  {
    wx.showToast({
      title: '正在获取cookie..',
      icon: 'success',
      duration: 1500
    });
    return;
  }
  else if(user_cookie == 'error')
  {
    wx.showToast({
      title: '没有开饼干..',
      icon: 'success',
      duration: 1500
    });
    return;
  }
  that.setData({UploadDisable:true,hidden:false});
  wx.request({
    url: re_mode==1?appInstance.globalData.new_thread_url:appInstance.globalData.new_reply_url,
    data: {
      resto:re_mode==1?null:resto,
      fid:re_mode==2?null:resto,
      name:'',
      email:'',
      title:'',
      content:content,
      water:"true",
      image:''
    },
    header: {
      'cookie'      :'userhash=' + user_cookie,
      'content-type': 'application/x-www-form-urlencoded',
      'user-angent':'HavfunClient-WeChatApp',
      'X-Requested-With':'XMLHttpRequest'
    },
    method: 'POST',
    success: function(res){
      if(res.data.info == (re_mode==1?"发帖成功":"回复成功"))
      {
        wx.navigateBack({delta: 1});
      }
      else
      {
        console.log(res);
        wx.showToast({
          title: res.data.info,
          icon: 'success',
          duration: 2000
        });
      }
    },
    fail: function() {
      wx.showToast({
          title: '发送失败',
          icon: 'success',
          duration: 2000
        });
      console.log(res);
    },
    complete:function(){
      that.setData({UploadDisable:false,hidden:true});
    }
  });
}
/*发送有图片的回复or新串*/
var SendReply = function(that,resto,content,file,water)
{
  if(user_cookie == 'null')
  {
    wx.showToast({
      title: '正在获取cookie..',
      icon: 'success',
      duration: 1500
    });
    return;
  }
  else if(user_cookie == 'error')
  {
    wx.showToast({
      title: '没有开饼干..',
      icon: 'success',
      duration: 1500
    });
    return;
  }
  that.setData({UploadDisable:true,hidden:false});
  wx.uploadFile({
    url: re_mode==1?'https://h.nimingban.com/Home/Forum/doPostThread.html':'https://h.nimingban.com/Home/Forum/doReplyThread.html?appid=wechatapp',
    filePath:file,
    name:'image',
    header:{
      'cookie'      :'userhash=' + user_cookie,
      'content-type':'application/x-www-form-urlencoded',
      'X-Requested-With':'XMLHttpRequest'
    },
    formData:{
      header:{
      'cookie'      :'userhash=' + user_cookie,
      'content-type':'application/x-www-form-urlencoded'
      },
      resto:re_mode==1?null:resto,
      fid:re_mode==2?null:resto,
      name:"",
      email:"",
      title:"",
      content:content,
      water:water
    },
    success: function(res){
      res.data = JSON.parse(res.data);//uploadFile并没有像request那样自动使用parse
      if(res.data.info == (re_mode==1?"发帖成功":"回复成功"))
      {
        wx.navigateBack({delta: 1});
      }
      else
      {
        wx.showToast({
          title: res.data.info,
          icon: 'success',
          duration: 2000
        });
      }
    },
    fail: function(res) {
        wx.showToast({
          title: '发送失败',
          icon: 'success',
          duration: 2000
        });
      console.log(res);
    },
    complete:function(){
      that.setData({UploadDisable:false,hidden:true});
    }
  })
}


Page({
    data:{
      txt_focus:false,
      txt_value:"",
      select_image:"",
      select_image_hid:true,
      watermark:"false",
      hidden:true,
      UploadDisable:false
    },
    onLoad:function(e)
    {
        if(e.mode==1 || e.mode==3)//发新串或者举报某个串
        {
            if(e.mode == 3)
              wx.setNavigationBarTitle({title: '举报' + e.rev_text});
            else
              wx.setNavigationBarTitle({title: '发新串'});

            if(e.rev_text != "" && e.rev_text != undefined && e.rev_text != null)
              this.setData({txt_value:e.rev_text+"\n理由："});
        }
        else if(e.mode==2)//回复某个串
        {
            wx.setNavigationBarTitle({title: '回复>>No.' + e.revid});
            if(e.rev_text!="" && e.rev_text!=undefined && e.rev_text!=null)
              this.setData({txt_value:e.rev_text});
            //wx.setStorageSync('String', Object/String)
        }
        if(e.mode==3)e.mode=1;
        resto_id = e.revid;
        re_mode  = e.mode;
    },
    onShow:function()
    {
      this.setData({txt_focus:true});
      var temp = location_get_cookie();
      console.log(temp);
      if(temp == '' || temp == '0')//本地cookie获取失败，从服务器获取
      {
        user_cookie = 'null';
        adao_get_cookie();
      }
      else
      {
        user_cookie = temp;
      }
    },
    cl_tp:function()
    {
      this.setData({
        txt_value:"",
        txt_focus:true,
        select_image:"",
        select_image_hid:true
        });
    },
    pc_tp:function()
    {
      var that = this;
      wx.chooseImage({
        count: 1, // 最多可以选择的图片张数
        sizeType: ['compressed'], // original 原图，compressed 压缩图，默认二者都有
        sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
        success: function(res){
          //console.log(res);
          that.setData({
            select_image:res.tempFilePaths[0],
            select_image_hid:false
            });
          wx.showModal({
            title:"水印设置",
            content:"是否添加水印？",
            cancelText:"否",
            confirmText:"是",
            complete:function(res)
            {
              //console.log(res);
              that.setData({watermark:res.confirm});
            }
          });
        },
        fail: function() {
          // fail
        },
        complete: function() {
          // complete
        }
      });
    },
    onSubmit:function(res)
    {
      //console.log(res);
    },
    onCancel:function()
    {
      wx.navigateBack({delta: 1});
    },
    form_submit:function(res)
    {
      this.setData({hidden:false});
      //console.log(res);
      var that = this;
      if(res.detail.value.pic == "")//没有图
      {
        SendReplyNoImg(
          that,
          resto_id,
          res.detail.value.text
        );
      }
      else//有图
      {
        SendReply(
          that,
          resto_id,
          res.detail.value.text,
          res.detail.value.pic,
          res.detail.value.watermark
        );
      }
      //console.log(resto_id);
      this.setData({hidden:true});
    }
})