var WxParse = require('../../wxParse/wxParse.js');
var page = 1;
var page_id = 0;
var last_length = 0;
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
//获取数据
var GetList = function(that)
{
  that.setData({hidden:false});
  console.log("start");
  wx.request(
  {
    url:appInstance.globalData.thread_url,
    data:
    {
      id : page_id,
      page : page
    },
    header:
    {
      'User-Agent' : 'HavfunClient-WeChatAPP',
      'content-type' : 'application/json',
      'X-Requested-With':'XMLHttpRequest'
    },

    success:function(res)
    {
      var list = that.data.list;
      if(page ==1 && list.length == 0)//第一页 添加正文内容
      {
        var header = {
          'id':res.data.id,
          'now':res.data.now,
          'userid':res.data.userid,
          'name':res.data.name,
          'email':res.data.email,
          'title':res.data.title,
          'html':WxParse.wxParse('item', 'html', res.data.content, that,5),
          'admin':res.data.admin,
          'replyCount':res.data.replyCount,
          'sage':res.data.sage,
          'admin':res.data.admin
          };
          if(res.data.img!="")
          {
            header.img = res.data.img + res.data.ext;
            header.thumburl = appInstance.globalData.thumb_img_url;
          }
          else
          {
            header.img = "";
            header.thumburl= "";
          }
          list.push(header);
          wx.setNavigationBarTitle({//设置标题
            title: list[0].title,
            success: function(res) {}
          });
      }
      var len = 0;
      if(last_length > 0)
      {
        len = res.data.replys.length - last_length;
      }
      else
      {
        len = res.data.replys.length;
      }
      if(len > 0)//本次拉取的数量大于0就push
      {
        for(let i =last_length; i < res.data.replys.length; i++)
        {
          if(res.data.replys[i].img != "")
          {
            res.data.replys[i].img = res.data.replys[i].img + res.data.replys[i].ext;
            res.data.replys[i].thumburl = appInstance.globalData.thumb_img_url;
          }
            
          res.data.replys[i].html = WxParse.wxParse('item', 'html', res.data.replys[i].content, that,5);
          list.push(res.data.replys[i]);
        }
        that.setData({list : list});

        //console.log(res.data.replys.length + "  " + list.length + "  " +page);
        if(res.data.replys.length == 19)//本页已经完
        {
          page ++;
          last_length = 0;
        }
        else//本页还没满，下次要再拉取
        {
          last_length = res.data.replys.length;
        }
      }
      else//本次没有拉取到
      {
        if(page == 1)
        {
          that.setData({list : list});
        }
        wx.showToast({
          title: '没有更多了',
          icon: 'success',
          duration: 500
        });
      }
      //console.log(list.length);
      that.setData({hidden:true});
    },
    fail:function()
    {
      that.setData({hidden:true});
        wx.showToast({
          title: '加载失败',
          icon: 'success',
          duration: 500
        });
    },
    complete:function()
    {
      pw_run = false;
    }
  });
}

Page({
 data:
 {
  hidden:true,
  list:[],
  scrollTop : 0,
  scrollHeight:0
 },
 
  onLoad:function(e)
  {
    page_id = e.id;
    page = 1;
    last_length = 0;
    var that = this;
    GetList(that);
  },

  onShow:function()
  {

  },

  bind_view_tap: function(e)
  {

  },

  onPullDownRefresh: function()//下拉刷新
  {
    pw_run = true;
    page = 1;
    last_length = 0;
    this.setData(
    {
      list : [],
      scrollTop : 0
    });
    var that = this;
    GetList(that);
    wx.stopPullDownRefresh();
  },

  onReachBottom: function ()//上拉加载更多
  {
    if(pw_run)return;
    var that = this;
    GetList(that);
  },
  bind_pic_tap: function(e)//单击图片
  {
    var pr_imgs = [appInstance.globalData.full_img_url + e['currentTarget'].id];
    wx.previewImage({
      current: appInstance.globalData.thumb_img_url + e['currentTarget'].id,
      urls:pr_imgs
    })
  },
  tap_nw : function()//回复本串
  {
    wx.navigateTo({url: '../new/new?mode=2&revid=' + page_id});
  }
})