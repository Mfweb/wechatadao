var WxParse = require('../../wxParse/wxParse.js');
var AdaoAPI = require('../../API/adao.js');
var page = 1;//当前页数
var page_id = 0;//串ID
var page_in = -1;//输入要跳转的页面
var last_length = 0;
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
var sys_height = 0;//系统屏幕尺寸
var sys_width  = 0;
var post_run = false;//防止重复拉取
var LongTapID = "";//长按选择的ID
var lont_tap_lock = false;

function GetQuoteBody(all_kid,that)
{
  //console.log(all_kid);
  for(let i=0;i<all_kid.length;i++)
  {
    AdaoAPI.api_request(
      "",
      appInstance.globalData.get_thread_url + "&id=" + all_kid[i],
      {},
      function(res,that){
        //console.log(res);
        var q_list = that.data.q_list;
        if(res.data=="thread不存在")
        {
          var temp = {id:"ID不存在"};
          q_list.push(temp);
        }
        else
        {
          res.data.html = WxParse.wxParse('item', 'html', res.data.content, that,null);
          if(res.data.img != "")
          {
            res.data.img = res.data.img + res.data.ext;
            res.data.thumburl = appInstance.globalData.thumb_img_url;
          }
          q_list.push(res.data);
        }
        that.setData({q_list:q_list});
      },
      function(res){
        console.log("error");
      },
      null,that);
  }
}
//引用串高亮
function GetQuote(kid)
{
  var te = /((&gt;){2}|(>){2})(No\.){0,3}\d{1,11}/g;//正则表达式匹配出所有引用串号，支持>>No.123123和>>123123 两种引用格式
  var te2 = /\d{1,11}/g;
  var out_data = {html:null,all_kid:[]};
  
  var all_find = kid.match(te);
  if(all_find!=null && all_find!=false && all_find.length>0)
  {
    out_data.html = kid.replace(te,'<view class="bequote">$&</view>');
    for(let i = 0;i< all_find.length;i++)
    {
      let temp_find = all_find[i].match(te2);
      if(temp_find!=null && temp_find!=false && temp_find.length>0)
      {
        out_data.all_kid.push(temp_find[0]);
      }
    }
  }
  else
  {
    out_data.html = kid;
  }
  //console.log(out_data);
  return out_data;
}
//获取回复
function GetList(that)
{
  //console.log("start");
  if(post_run)return;
  post_run = true;
  if(page != 1)
    that.setData({bot_text:that.data.bot_text + ",Loading..."});
  else
    that.setData({bot_text:"Loading..."});
  AdaoAPI.api_request(
    "",
    appInstance.globalData.thread_url,
    {id : page_id,page : page},
    function(res){//success
      var list = that.data.list;
      if(list.length == 0)//第一页 添加正文内容
      {
        var temp_fid = GetQuote(res.data.content);

        var header = {
          'id':res.data.id,
          'now':res.data.now,
          'userid':res.data.userid,
          'name':res.data.name,
          'email':res.data.email,
          'title':res.data.title,
          'html':WxParse.wxParse('item', 'html', temp_fid.html, that,null),
          'content':temp_fid.html,
          'all_kid':temp_fid.all_kid,
          'admin':res.data.admin,
          'replyCount':res.data.replyCount,
          'sage':res.data.sage,
          'admin':res.data.admin,
          'img_height':0,
          'img_width':0
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
        len = res.data.replys.length - last_length;
      else
        len = res.data.replys.length;
      
      if(len > 0)//本次拉取的数量大于0就push
      {
        list[0].replyCount = res.data.replyCount;
        for(let i =last_length; i < res.data.replys.length; i++)
        {
          if(res.data.replys[i].img != "")
          {
            res.data.replys[i].img = res.data.replys[i].img + res.data.replys[i].ext;
            res.data.replys[i].thumburl = appInstance.globalData.thumb_img_url;
          }
          let temp_html = GetQuote(res.data.replys[i].content);
          res.data.replys[i].content = temp_html.html;//正则高亮所有引用串号
          res.data.replys[i].all_kid = temp_html.all_kid;
          res.data.replys[i].html = WxParse.wxParse('item', 'html', res.data.replys[i].content, that,null);
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
      }
      //console.log(list.length);
      that.setData({bot_text:(list.length-1) + "/" + list[0].replyCount});
    },
    function(res){//fail
      that.setData({bot_text:"error"});
        wx.showToast({
          title: '加载失败',
          icon: 'success',
          duration: 500
        });
    },
    function(){//finish
      pw_run = false;
      post_run = false;
    }
  );
}

Page({
 data:
 {
  list:[],
  scrollTop : 0,
  scrollHeight:0,
  bot_text:"",
  modalFlag:true,//显示跳转页面
  default_page:1,//跳转页面默认值
  ShowMenu:true,
  open:false,
  q_list:[]
 },
 
  onLoad:function(e)
  {
    var res = wx.getSystemInfoSync();
    sys_width  = res.windowWidth;
    sys_height = res.windowHeight;
    page_id = e.id;
    page = 1;
    last_length = 0;
    var that = this;
    GetList(that);
  },

  onShow:function()
  {

  },

  bind_view_tap: function(e)//点击查看引用串内容
  {
    //console.log(e.currentTarget.id);
    if(lont_tap_lock)return;
    var all_kid = this.data.list[e.currentTarget.id].all_kid;
    if(all_kid!=null && all_kid.length>0)
    {
      this.setData({q_list:[]});
      var that = this;
      GetQuoteBody(all_kid,that);
      this.setData({open:true});
    }
  },
  bind_view_long_tap:function(e)//长按
  {
    lont_tap_lock = true;//防止长按抬起时触发tap导致打开查看引用串窗口
    LongTapID = this.data.list[e.currentTarget.id].id;
    this.setData({ShowMenu:false});
  },
  MenuChange:function(e)//关闭下部菜单
  {
    this.setData({ShowMenu:true});
    lont_tap_lock=false;//解除tap锁
  },
  th_reply:function(e)//引用指定No.
  {
    wx.navigateTo({url: '../new/new?mode=2&revid=' + page_id + "&rev_text=>>No." + LongTapID + "\n"});
    LongTapID = "";
    this.setData({ShowMenu:true});
    lont_tap_lock=false;//解除tap锁
  },
  add_reply_list:function(e)//添加到引用列表
  {
    if(LongTapID!="")
    {
      var temp = wx.getStorageSync('ReplyIDList');
      temp += ">>No." + LongTapID + "\n";
      wx.setStorageSync('ReplyIDList', temp);
      this.setData({ShowMenu:true});
      lont_tap_lock=false;//解除tap锁
    }
  },
  th_report:function(e)//举报这个回复
  {
    wx.navigateTo({url: '../new/new?mode=3&revid=18&rev_text=>>No.'+LongTapID});
    LongTapID = "";
    this.setData({ShowMenu:true});
    lont_tap_lock=false;//解除tap锁
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
    var img_url;
    if(this.data.open)
      img_url = this.data.q_list[e['currentTarget'].id].img;
    else
      img_url = this.data.list[e['currentTarget'].id].img;
    var pr_imgs = [appInstance.globalData.full_img_url + img_url];
    wx.previewImage({
      current: appInstance.globalData.thumb_img_url + img_url,
      urls:pr_imgs
    })
  },
  bind_pic_load: function(e)//图片载入完成
  {
    var temp_width = 0;
    var temp_height = 0;
    var temp_ratio = 0.0;
    temp_width = sys_width/2;//要缩放到的图片宽度
    temp_ratio = temp_width/e.detail.width;//计算缩放比例
    temp_height = e.detail.height*temp_ratio;//计算缩放后的高度
    this.data.list[e.target.id].img_height = parseInt(temp_height);
    this.data.list[e.target.id].img_width  = parseInt(temp_width);
    this.setData({list:this.data.list});
  },
  tap_nw : function()//回复本串
  {
    var temp = wx.getStorageSync('ReplyIDList');
    if(temp!="")
      wx.setStorageSync('ReplyIDList', "")
    wx.navigateTo({url: '../new/new?mode=2&revid=' + page_id + "&rev_text="+temp});
  },
  tap_report:function()//举报本串
  {
    wx.navigateTo({url: '../new/new?mode=3&revid=18&rev_text=>>No.'+page_id});
  },
  tap_sl: function()
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
  page_input: function(e)//输入要跳转的页面
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
  tap_quote:function(res)
  {
    console.log(res);
  },
  f_touch:function()
  {

  },
  tap_ch:function()
  {
    this.setData({open:false});
  }
})