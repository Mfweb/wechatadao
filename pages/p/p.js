var WxParse = require('../../wxParse/wxParse.js');
var url = "https://h.nimingban.com/Api/thread";
var page = 1;
var page_id = 0;

//获取数据
var GetList = function(that)
{
  that.setData({hidden:false});
  wx.request(
  {
    url:url,
    data:
    {
      id : page_id,
      page : page
    },
    header:
    {
      //'User-Agent' : 'HavfunClient-WeChatAPP',//好像不允许修改
      'content-type' : 'application/json'
    },

    success:function(res)
    {
      //console.log(res);
      var appInstance = getApp();
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
          'sage':res.data.sage
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

      if(res.data.replys.length > 0)//本次拉取的数量大于0就push
      {
        for(let i = 0; i < res.data.replys.length; i++)
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
        page ++;
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
        })
      }
      //console.log(list);
      that.setData({hidden:true});
    },
    fail:function()
    {
      that.setData({hidden:true});
        wx.showToast({
          title: '加载失败',
          icon: 'success',
          duration: 500
        })
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
    this.data.list.splice(0,this.data.list.length);
    wx.getSystemInfo(
      {
      success:function(res)
      {
      }
    });
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
    page = 1;
    this.data.list.splice(0,this.data.list.length);
    this.setData(
    {
      list : [],
      scrollTop : 0
    });
    GetList(this)
    wx.stopPullDownRefresh()
  },

  onReachBottom: function ()//上拉加载更多
  {
    var that = this;
    GetList(that);
  },
  bind_pic_tap: function(e)//单击图片
  {
    var appInstance = getApp();
    var pr_imgs = [appInstance.globalData.full_img_url + e['currentTarget'].id];
    wx.previewImage({
      current: appInstance.globalData.thumb_img_url + e['currentTarget'].id,
      urls:pr_imgs
    })
    //console.log(e);//currentTarget
    //console.log(e);
    //wx.navigateTo({url: '../picview/picview?id=' + e['currentTarget'].id});
  },
})