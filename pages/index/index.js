var WxParse   = require('../../wxParse/wxParse.js');
var page      = 1;//当前在多少页
var page_id   = -1;//板块号
var page_in   = 1;//输入的页数
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
var sys_height = 0;
var sys_width  = 0;
var post_run = false;
//修改标题为当前板块
var GetTitle = function(that)
{
  for(let i = 0;i < that.data.flist.length;i++)
  {
    for(let j = 0;j < that.data.flist[i].forums.length;j++)
    {
      if(that.data.flist[i].forums[j].id == page_id)
      {
        var title_temp = that.data.flist[i].forums[j].name;
        wx.setNavigationBarTitle({title: title_temp});
        return title_temp;
      }
    }
  }
}
//获取板块内串
var GetList = function(that)
{
  if(post_run)return;
  post_run = true;
  that.setData({bot_text:"正在加载.."});
  wx.request(
  {
    url:appInstance.globalData.show_forum_url,
    data:
    {
      id : page_id,
      page : page
    },
    header:
    {
      'User-Agent' : 'HavfunClient-WeChatAPP',//好像不允许修改(仿真工具不可以 真机可以)
      'content-type' : 'multipart/form-data',
      'X-Requested-With':'XMLHttpRequest'
    },

    success:function(res)
    {
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
          res.data[i].img_height = 0;
          res.data[i].img_width = 0;
          list.push(res.data[i]);
        }
        that.setData({list : list});
        page ++;
      }
      that.setData({bot_text:list.length+",上拉继续加载.."});
    },

    fail:function()
    {
        wx.showToast({
          title: '加载失败',
          icon: 'success',
          duration: 1500
        })
    },
    complete:function()
    {
      pw_run = false;
      post_run = false;
    }
  });
}


//获取板块列表
var GetFList = function(that)
{
  wx.request(
  {
    url:appInstance.globalData.get_forum_url,
    data:{},
    header:
    {
      'User-Agent' : 'HavfunClient-WeChatAPP',
      'content-type' : 'application/json',
      'X-Requested-With':'XMLHttpRequest'
    },

    success:function(res)
    {
      var list_temp = [];//板块列表
      if(res.data.length > 0)
      {
        for(let i = 0; i < res.data.length; i++)
        {
          let temp = res.data[i].forums;
          for(let j=0;j<temp.length;j++)
          {
            temp[j].showNameHtml = temp[j].showName;
            temp[j].showName = WxParse.wxParse('item', 'html', temp[j].showName, that,5);
          }
          res.data[i].forums = temp;
          list_temp.push(res.data[i]);
        }
        that.setData({flist : list_temp});
      }
    },

    fail:function()
    {
        wx.showToast({
          title: '板块列表加载失败',
          icon: 'success',
          duration: 500
        })
    }
  });
}

var GetMainPicture = function(that)
{
  wx.request({
    url: 'https://mfweb.top/adao/getpicture.php',
    data: {},
    method: 'GET',
    success: function(res)
    {
      if(res.data!="error")
      {
        that.setData({f_image:res.data});
      }
    },
    fail: function() {
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
    list:[],//主列表
    flist:[],//板块列表
    open : false,//显示板块列表
    modalFlag:true,//显示跳转页面
    default_page:1,//跳转页面默认值
    f_image:"",//首页图片
    bot_text:"",
  },
  
  onLoad:function()
  {
    var res = wx.getSystemInfoSync();
    sys_width  = res.windowWidth;
    sys_height = res.windowHeight;
    var that = this;
    GetFList(that);
    GetMainPicture(that);
    var select_n = wx.getStorageSync('SelectForumName');
    if(select_n != "")
      wx.setNavigationBarTitle({title: select_n});
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
    wx.navigateTo({url: '../p/p?id=' + e['currentTarget'].id});
  },

  bind_pic_tap: function(e)//单击图片
  {

    var pr_imgs = [appInstance.globalData.full_img_url + this.data.list[e['currentTarget'].id].img];
    wx.previewImage({
      current: appInstance.globalData.thumb_img_url + this.data.list[e['currentTarget'].id].img,
      urls:pr_imgs
    })
  },
  bind_pic_load: function(e)
  {
    var list = this.data.list;
    var temp_width = 0;
    var temp_height = 0;
    var temp_ratio = 0.0;
    temp_width = sys_width/2;//要缩放到的图片宽度
    temp_ratio = temp_width/e.detail.width;//计算缩放比例
    temp_height = e.detail.height*temp_ratio;//计算缩放后的高度
    list[e.target.id].img_height = parseInt(temp_height);
    list[e.target.id].img_width  = parseInt(temp_width);
    this.setData({list:list});
    //console.log(list[e.target.id].img_height + "  " + list[e.target.id].img_width);
    //detail
    //console.log(e);
    //this.setData({list[e.detail.id].img_height:e.detail.height});
  },
  onPullDownRefresh: function()//下拉刷新
  {
    pw_run = true;
    var that = this;
    refGet(that);
    wx.stopPullDownRefresh()
  },

  onReachBottom: function ()//上拉加载更多
  {
    if(pw_run)return;
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
    page_in = 1;
    this.setData({modalFlag:false,default_page:1});
  },
  modalOk: function(e)//设置好了跳转到某一页回来
  {  
    this.setData({modalFlag:true});
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
    wx.setStorageSync('SelectForumID', e['currentTarget'].id);
    page_id = e['currentTarget'].id;
    var bk_name = refGet(that);
    wx.setStorageSync('SelectForumName', bk_name);
    this.setData({open : false});
  },

  tap_nw : function()//发新串
  {
    wx.navigateTo({url: '../new/new?mode=1&revid=' + page_id});
  },
  tap_ma: function()
  {
    wx.navigateTo({url: '../cookie_manager/cookie_manager'});
  },
  max_picture : function(res)
  {
    var pr_imgs = [res.currentTarget.id];
    wx.previewImage({
      current: res.currentTarget.id,
      urls:pr_imgs
    })
  }
})