var WxParse   = require('../../wxParse/wxParse.js');
var AdaoAPI   = require('../../API/adao.js');
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
var post_run = false;//防止重复请求
var page = 1;

function GetSList(that)
{
  var temp_feed = wx.getStorageSync('FeedObj');
  for(let i=0;i<temp_feed.length;i++)
  {
    temp_feed[i].html = WxParse.wxParse('item', 'html', temp_feed[i].content, that,null);
    if(temp_feed[i].img != "" && temp_feed[i].img != undefined)
    {
      temp_feed[i].img = temp_feed[i].img + temp_feed[i].ext;
      temp_feed[i].thumburl = temp_feed[i].ext==".gif"?appInstance.globalData.url.full_img_url:appInstance.globalData.url.thumb_img_url;
    }
  }
  that.setData({list:temp_feed});
}
/*获取订阅串*/
function GetList(that,force=false)
{
  if(force)
  {
    that.setData({list:[]});
    appInstance.get_feed(1,function(res,that,success){
      if(success)
      {
        GetSList(that);
      }
      else
      {
        wx.showToast({
          title: '加载失败',
          icon: 'success',
          duration: 500
        });
        that.setData({bot_text:"加载失败"});
      }
    },that);
  }
  else
  {
    GetSList(that);
  }
}

Page(
{
  data:
  {
    list:[],//主列表
    default_page:1,//跳转页面默认值
    bot_text:"",
    isloading:false,
    ShowMenu:false,
  },
  
  onLoad:function()
  {
    if(appInstance.globalData.userinfo.user_openid == null)//获取openid
      appInstance.get_user_openid();
  },

  onShow:function(e)
  {
    var that = this;
    GetList(that);
  },

  bind_view_tap: function(e)//单击
  {
    if(e.target.id!="")return;
    this.setData({isloading:true});
    wx.navigateTo({url: '../p/p?id=' + e['currentTarget'].id});
    this.setData({isloading:false});
  },

  bind_pic_tap: function(e)//单击图片
  {
    var pr_imgs = [appInstance.globalData.url.full_img_url + this.data.list[e['currentTarget'].id].img];
    wx.previewImage({
      current: appInstance.globalData.url.thumb_img_url + this.data.list[e['currentTarget'].id].img,
      urls:pr_imgs
    })
  },
  bind_pic_load: function(e)//图片加载完成
  {
    var temp_width = 0;
    var temp_height = 0;
    var temp_ratio = 0.0;
    temp_width = appInstance.globalData.sysinfo.sys_width/2;//要缩放到的图片宽度
    temp_ratio = temp_width/e.detail.width;//计算缩放比例
    temp_height = e.detail.height*temp_ratio;//计算缩放后的高度
    this.data.list[e.target.id].img_height = parseInt(temp_height);
    this.data.list[e.target.id].img_width  = parseInt(temp_width);
    this.setData({list:this.data.list});
  },
  onPullDownRefresh: function()//下拉刷新
  {
    var that = this;
    GetList(that,true);
    wx.stopPullDownRefresh()
  },

  onReachBottom: function ()//上拉加载更多
  {

  },
  max_picture : function(res)//查看大图
  {
    var pr_imgs = [res.currentTarget.id];
    wx.previewImage({
      current: res.currentTarget.id,
      urls:pr_imgs
    })
  },
  MenuChange:function(e)//关闭下部菜单
  {
    this.setData({ShowMenu:false});
  },
})