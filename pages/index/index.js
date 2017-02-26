var WxParse   = require('../../wxParse/wxParse.js');
var AdaoAPI   = require('../../API/adao.js');
var page      = 1;//当前在多少页
var page_id   = -1;//板块号
var page_in   = 1;//输入的页数
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
var sys_height = 0;//屏幕尺寸
var sys_width  = 0;
var post_run = false;//防止重复请求

/*修改标题为当前板块*/
function GetTitle(that)
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
/*获取板块内串*/
function GetList(that)
{
  if(post_run || page_id==-1)return;
  post_run = true;
  that.setData({bot_text:"正在加载.."});
  AdaoAPI.api_request(
    "",
    appInstance.globalData.show_forum_url,
    {id : page_id,page : page},
    function(res){//success
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
          res.data[i].html = WxParse.wxParse('item', 'html', res.data[i].content, that,null);
          res.data[i].img_height = 0;
          res.data[i].img_width = 0;
          list.push(res.data[i]);
        }
        that.setData({list : list});
        page ++;
      }
      that.setData({bot_text:list.length+",上拉继续加载.."});
    },
    function(res){//fail
      wx.showToast({
        title: '加载失败',
        icon: 'success',
        duration: 1500
      })
    },
    function(){//finish
      pw_run = false;
      post_run = false;
    }
  );
}

/*获得板块列表*/
function GetFList(that)
{
  AdaoAPI.api_request(
    "",
    appInstance.globalData.get_forum_url,
    null,
    function(res){//success
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
    function(res){//fail
      wx.showToast({
        title: '板块列表加载失败',
        icon: 'success',
        duration: 500
      })
    },null
  );
}

/*获得首页图片*/
function GetMainPicture(that)
{
  AdaoAPI.api_request(
    "",
    appInstance.globalData.top_image_url,
    null,
    function(res){//success
      if(res.data!="error")
        that.setData({f_image:res.data});
    },
    function(res){//fail

    },null
  );
}

/*重新拉取*/
function refGet(that)
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
    GetMainPicture(that);
    GetFList(that);
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
  bind_pic_load: function(e)//图片加载完成
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
  },
  f_touch:function()
{
  console.log(1);
}
})