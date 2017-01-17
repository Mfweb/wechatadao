var WxParse = require('../../wxParse/wxParse.js');
var url = "https://h.nimingban.com/Api/showf";
var furl = "https://h.nimingban.com/Api/getForumList";
var page = 1;//当前在多少页
var page_id = -1;//板块号
var page_in = 1;//输入的页数


//修改标题为当前板块
var GetTitle = function(that)
{
  
  //console.log(that.data.flist);
  //console.log(page_id);
  //console.log(that.data.flist.length);

  for(let i = 0;i < that.data.flist.length;i++)
  {
    for(let j = 0;j < that.data.flist[i].forums.length;j++)
    {
      
      if(that.data.flist[i].forums[j].id == page_id)
      {
        var title_temp = that.data.flist[i].forums[j].name;
        //console.log(title_temp);
        wx.setNavigationBarTitle({
          title: title_temp,
          success: function(res) {}
        });
        return title_temp;
      }
    }
  }
}
//获取板块内串
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
      var appInstance = getApp();
      //console.log(res);
      var list = that.data.list;
      if(res.data.length > 0)
      {
        for(let i = 0; i < res.data.length; i++)
        {
          if(res.data[i].img != "")
          {
            res.data[i].img = res.data[i].img + res.data[i].ext;
            res.data[i].thumburl = appInstance.globalData.thumb_img_url;
          }
          res.data[i].html = WxParse.wxParse('item', 'html', res.data[i].content, that,5);
          list.push(res.data[i]);
        }
        that.setData({list : list});
        page ++;
      }

      that.setData({hidden:true});
      /*wx.showToast({
        title: '加载成功',
        icon: 'success',
        duration: 500
      })*/
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


//获取板块列表
var GetFList = function(that)
{
  that.setData({hidden:false});
  wx.request(
  {
    url:furl,
    data:{},
    header:
    {
      //'User-Agent' : 'HavfunClient-WeChatAPP',//好像不允许修改
      'content-type' : 'application/json'
    },

    success:function(res)
    {
      //console.log(res);
      var appInstance = getApp();
      var list_temp = [];//板块列表

      if(res.data.length > 0)
      {
        for(let i = 0; i < res.data.length; i++)
        {
          list_temp.push(res.data[i]);
        }
        that.setData({flist : list_temp});
      }
      that.setData({hidden:true,f_image:"http://cover.acfunwiki.org/cover.php"});
      /*wx.showToast({
        title: '板块列表加载成功',
        icon: 'success',
        duration: 500
      })*/
    },

    fail:function()
    {
      that.setData({hidden:true});
        wx.showToast({
          title: '板块列表加载失败',
          icon: 'success',
          duration: 500
        })
    }
  });
}

var refGet = function(that)
{
  page = 1;
  that.data.list.splice(0,that.data.list.length);
  that.setData(
  {
    list : [],
    scrollTop : 0
  });
  GetList(that);
  return GetTitle(that);
}

Page(
{
  data:
  {
    hidden:true,//显示隐藏正在加载
    list:[],//主列表
    flist:[],//板块列表
    open : false,//显示板块列表
    modalFlag:true,//显示跳转页面
    f_image:""//首页图片
  },
  
  onLoad:function()
  {
    var that = this;
    GetFList(that);
    var select_n = wx.getStorageSync('SelectForumName');
    if(select_n != "")
      wx.setNavigationBarTitle({
        title: select_n,
        success: function(res) {
          // success
        }
      });
    var select_f = wx.getStorageSync('SelectForumID');
    if(select_f != "")
      page_id = select_f;
    else
      return;
    GetList(that);
  },

  onShow:function(e)
  {
    if(page_id==-1)//如果没有保存板块，就打开选择栏
      this.setData({open : true});
    else
    {
      var that = this;
      GetTitle(that);
    }
  },

  bind_view_tap: function(e)//单击
  {
    if(e.target.id!="")return;
    //console.log(e);//currentTarget
    wx.navigateTo({url: '../p/p?id=' + e['currentTarget'].id});
  },

  bind_pic_tap: function(e)//单击图片
  {
    var appInstance = getApp();
    var pr_imgs = [appInstance.globalData.full_img_url + e['currentTarget'].id];
    wx.previewImage({
      current: appInstance.globalData.thumb_img_url + e['currentTarget'].id,
      urls:pr_imgs
    })
  },
  
  onPullDownRefresh: function()//下拉刷新
  {
    var that = this;
    refGet(that);
    wx.stopPullDownRefresh()
  },

  onReachBottom: function ()//上拉加载更多
  {
    var that = this;
    GetList(that);
  },
  
  tap_ch: function(e)//显示 隐藏板块选择侧边栏
  {  
    if(this.data.open)
    {  
        this.setData({open : false});  
    }
    else
    {  
        this.setData({open : true});  
    }  
  },

  tap_sl: function(e)//跳转到某一页
  {
    page_in = -1;
    this.setData({modalFlag:false});
  },
  modalOk: function(e)//设置好了跳转到某一页回来
  {  
    this.setData({modalFlag:true});
    //console.log(page_in);
    if(page_in<=0)
    {
      wx.showModal(
        {
          title:"输入有误！",
          content:"页码应当大于0",
          showCancel:false
        }
      );
    }
    else
    {
      page = page_in;
      var that = this;
      this.data.list.splice(0,this.data.list.length);
      this.setData(
      {
        list : [],
        scrollTop : 0
      });
      GetList(that);
    }
  },
  modalCancel: function(e)//点击了取消
  {  
    this.setData({modalFlag:true});
  },
  page_input: function(e)
  {
    var temp = parseInt(e['detail'].value);
    if(e['detail'].value!="")
    {
      if(isNaN(temp))temp=1;
      page_in = temp;
      return parseInt(page_in);
    }
    else
      page_in = -1;
  },

  bind_fview_tap: function(e)//选择某个版块
  {
    var that = this;
    //console.log(e);
    wx.setStorageSync('SelectForumID', e['currentTarget'].id);
    page_id = e['currentTarget'].id;
    var bk_name = refGet(that);
    wx.setStorageSync('SelectForumName', bk_name);
    this.setData({open : false});
  },

  tap_nw : function()//发新串
  {
    this.setData({NewmodalFlag:false,new_text_focus:true});
  }
})