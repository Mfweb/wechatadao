var WxParse = require('../../wxParse/wxParse.js');
var AdaoAPI = require('../../API/adao.js');
var page = 1;//当前页数
var forum_id = 0;//串ID
var forum_input = -1;//输入要跳转的页面
var last_length = 0;
var appInstance = getApp();
var pw_run = false;//防止下拉刷新清空列表的时候触发上拉加载
var post_run = false;//防止重复拉取
var LongTapID = "";//长按选择的ID
var lont_tap_lock = false;
var isfeed = false;
var isfeeding = false;
var image_list = [];//图片列表
var po_id = "";
var mainListQuery = null;

/* 取消订阅 */
function DelFeed(fid, that) {
  if (isfeeding) return;
  isfeeding = true;
  if (appInstance.globalData.userinfo.user_openid == null) {
    appInstance.showError('获取openid失败');
    return;
  }
  AdaoAPI.api_request(
    "",
    appInstance.globalData.url.host + appInstance.globalData.url.del_feed_url + "&uuid=" + appInstance.globalData.userinfo.user_openid + "&tid=" + fid,
    null,
    function (res, that) {//success
      if (res.data == "取消订阅成功!") {
        appInstance.showError('取消订阅成功');
        appInstance.get_feed();
        that.setData({ staricon: "../../icons/star.png" });
        isfeed = false;
      }
      else {
        appInstance.showError('取消订阅失败！');
      }
    },
    function (res, that) {//fail
      console.log("fail" + res);
    },
    function () { isfeeding = false; },
    that);
}
/* 添加订阅 */
function AddFeed(fid, that) {
  if (isfeeding) return;
  isfeeding = true;
  if (appInstance.globalData.userinfo.user_openid == null) {
    appInstance.showError('获取openid失败');
    return;
  }
  AdaoAPI.api_request(
    wx.getStorageSync('Cookie_Enable'),
    appInstance.globalData.url.host + appInstance.globalData.url.add_feed_url + "&uuid=" + appInstance.globalData.userinfo.user_openid + "&tid=" + fid,
    null,
    function (res, that) {//success
      if (res.data == "订阅大成功→_→") {
        appInstance.showError('订阅大成功');
        appInstance.get_feed();
        that.setData({ staricon: "../../icons/star2.png" });
        isfeed = true;
      }
      else {
        appInstance.showError('订阅大失败');
      }
    },
    function (res, that) {//fail
      console.log(res);
    },
    function () { isfeeding = false; },
    that);
}

//先当做主串拉取 如果失败就当做回复拉取
function GetQuoteOne(kindex, that, mode = 0) {
  var lthat = { that: that, kindex: kindex };
  if (mode == 0) {
    AdaoAPI.api_request(
      wx.getStorageSync('Cookie_Enable'),
      appInstance.globalData.url.host + appInstance.globalData.url.thread_url,
      { id: that.data.q_list[kindex].id, page: 1 },
      function (res, that) {//success
        if (res.data == "该主题不存在")//不是主串 拉取串内容
          GetQuoteOne(that.kindex, that.that, 1);
        else {
          var q_list = that.that.data.q_list;
          res.data.content = WxParse.wxParse('item', 'html', res.data.content, that, null).nodes;
          res.data.sid = res.data.id;
          if (res.data.img != "") {
            res.data.img = res.data.img + res.data.ext;
            res.data.thumburl = res.data.ext == ".gif" ? appInstance.globalData.url.full_img_url : appInstance.globalData.url.thumb_img_url;
          }
          var html_h = "<font class='";

          if (res.data.admin == 1)
            html_h += "xuankuhongming";
          if (res.data.userid == po_id)
            html_h += " po";
          html_h += "'>"
          html_h += res.data.userid + "</font>";
          res.data.userid = WxParse.wxParse('item', 'html', html_h, that, null).nodes;

          q_list[that.kindex] = res.data;
          that.that.setData({ q_list: q_list });
        }
      },
      function (res) {//fail
        console.log("error");
      },
      null, lthat);
  }
  else {
    AdaoAPI.api_request(
      wx.getStorageSync('Cookie_Enable'),
      appInstance.globalData.url.host + appInstance.globalData.url.get_thread_url + "&id=" + that.data.q_list[kindex].id,
      {},
      function (res, that) {//success
        //console.log(res);
        var q_list = that.that.data.q_list;
        if (res.data == "thread不存在") {
          var temp = { id: "ID不存在" };
          q_list[that.kindex] = temp;
        }
        else {
          res.data.content = WxParse.wxParse('item', 'html', res.data.content, that, null).nodes;
          if (res.data.img != "") {
            res.data.img = res.data.img + res.data.ext;
            res.data.thumburl = appInstance.globalData.url.thumb_img_url;
          }
          var html_h = "<font class='";

          if (res.data.admin == 1)
            html_h += "xuankuhongming";
          if (res.data.userid == po_id)
            html_h += " po";
          html_h += "'>"
          html_h += res.data.userid + "</font>";
          res.data.userid = WxParse.wxParse('item', 'html', html_h, that, null).nodes;

          q_list[that.kindex] = res.data;
        }
        that.that.setData({ q_list: q_list });
      },
      function (res) {//fail
        console.log("error");
      },
      null, lthat);
  }
}
//获取引用串 
function GetQuoteBody(all_kid, that, mode = 1) {
  //console.log(all_kid);
  var temp_q_list = [];
  for (let i = 0; i < all_kid.length; i++) {
    var temp = { id: all_kid[i] };
    temp_q_list.push(temp);
    // GetQuoteOne(i,that);
  }
  that.setData({ q_list: temp_q_list });
  for (let i = 0; i < all_kid.length; i++) {
    GetQuoteOne(i, that);//拉取内容
  }
}
//引用串高亮
function GetQuote(kid) {
  var te = /((&gt;){2}|(>){2})(No\.){0,3}\d{1,11}/g;//正则表达式匹配出所有引用串号，支持>>No.123123和>>123123 两种引用格式
  //var te_addr = /h.nimingban.com\/t\/\d{1,11}/g;
  var te2 = /\d{1,11}/g;
  var out_data = { html: null, all_kid: [] };
  var all_find = kid.match(te);
  if (all_find != null && all_find != false && all_find.length > 0) {
    out_data.html = kid.replace(te, '<view class="bequote">$&</view><view class="be_br"></view>');
    for (let i = 0; i < all_find.length; i++) {
      let temp_find = all_find[i].match(te2);
      if (temp_find != null && temp_find != false && temp_find.length > 0) {
        out_data.all_kid.push(temp_find[0]);
      }
    }
  }
  else {
    out_data.html = kid;
  }
  //console.log(out_data);
  return out_data;
}
//获取回复
function GetList(that) {
  //console.log("start");
  if (post_run) return;
  post_run = true;
  if (page != 1)
    that.setData({ bot_text: that.data.bot_text + ",Loading..." });
  else
    that.setData({ bot_text: "Loading..." });
  AdaoAPI.api_request(
    wx.getStorageSync('Cookie_Enable'),
    appInstance.globalData.url.host + appInstance.globalData.url.thread_url,
    { id: forum_id, page: page },
    function (res, that) {//success
      if (res.data == "该主题不存在") {
        that.setData({ bot_text: "该主题不存在" });
        return;
      }
      var list = that.data.list;
      if (list.length == 0)//第一页 添加正文内容
      {
        var temp_fid = GetQuote(res.data.content);

        var header = {
          'id': res.data.id,
          'now': res.data.now,
          'userid': res.data.userid,
          'name': res.data.name,
          'email': res.data.email,
          'title': res.data.title,
          'content': WxParse.wxParse('item', 'html', temp_fid.html, that, null).nodes,
          'all_kid': temp_fid.all_kid,
          'admin': res.data.admin,
          'replyCount': res.data.replyCount,
          'sage': res.data.sage,
          'admin': res.data.admin,
          'img_height': 0,
          'img_width': 0
        };
        po_id = res.data.userid;

        var html_h = "<font class='";

        if (res.data.admin == 1)
          html_h += "xuankuhongming";
        if (res.data.userid == po_id)
          html_h += " po";
        html_h += "'>"
        html_h += res.data.userid + "</font>";
        header.userid = WxParse.wxParse('item', 'html', html_h, that, null).nodes;

        if (res.data.img != "") {
          header.img = res.data.img + res.data.ext;
          header.thumburl = res.data.ext == ".gif" ? appInstance.globalData.url.full_img_url : appInstance.globalData.url.thumb_img_url;
          header.img_load_success = false;
          image_list.push(appInstance.globalData.url.full_img_url + res.data.img + res.data.ext);
        }
        else {
          header.img = "";
          header.thumburl = "";
        }
        list.push(header);
        wx.setNavigationBarTitle({//设置标题
          title: list[0].title,
          success: function (res) { }
        });
      }

      var len = 0;
      if (last_length > 0)
        len = res.data.replys.length - last_length;
      else
        len = res.data.replys.length;
      if (len > 0)//本次拉取的数量大于0就push
      {
        list[0].replyCount = res.data.replyCount;
        for (let i = last_length; i < res.data.replys.length; i++) {
          if (res.data.replys[i].img != "") {
            res.data.replys[i].img = res.data.replys[i].img + res.data.replys[i].ext;
            res.data.replys[i].thumburl = res.data.replys[i].ext == ".gif" ? appInstance.globalData.url.full_img_url : appInstance.globalData.url.thumb_img_url;
            image_list.push(appInstance.globalData.url.full_img_url + res.data.replys[i].img);
          }
          let temp_html = GetQuote(res.data.replys[i].content);
          res.data.replys[i].content = temp_html.html;//正则高亮所有引用串号
          res.data.replys[i].all_kid = temp_html.all_kid;
          res.data.replys[i].content = WxParse.wxParse('item', 'html', res.data.replys[i].content, that, null).nodes;
          res.data.replys[i].img_height = 0;
          res.data.replys[i].img_width = 0;
          res.data.replys[i].img_load_success = false;

          var html_h = "<font class='";

          if (res.data.replys[i].admin == 1)
            html_h += "xuankuhongming";
          if (res.data.replys[i].userid == po_id)
            html_h += " po";
          html_h += "'>"
          html_h += res.data.replys[i].userid + "</font>";
          res.data.replys[i].userid = WxParse.wxParse('item', 'html', html_h, that, null).nodes;

          list.push(res.data.replys[i]);
        }
        that.setData({ list: list });

        //console.log(res.data.replys.length + "  " + list.length + "  " +page);
        if (res.data.replys.length >= 19)//本页已经完
        {
          page++;
          last_length = 0;
        }
        else//本页还没满，下次要再拉取
        {
          if (res.data.replys[0].id == 9999999)
            last_length = res.data.replys.length - 1;
          else
            last_length = res.data.replys.length + 1;
        }
      }
      else//本次没有拉取到
      {
        if (page == 1) {
          that.setData({ list: list });
        }
      }
      //console.log(list.length);
      that.setData({ bot_text: (list.length - 1) + "/" + list[0].replyCount });
    },
    function (res, that) {//fail
      that.setData({ bot_text: "error" });
      appInstance.showError('加载失败');
      that.setData({ bot_text: "加载失败" });
    },
    function () {//finish
      pw_run = false;
      post_run = false;
      wx.stopPullDownRefresh();
    }, that);
}

Page({
  data:
  {
    list: [],
    scrollTop: 0,
    scrollHeight: 0,
    bot_text: "",
    modalFlag: true,//显示跳转页面
    default_page: 1,//跳转页面默认值
    ShowMenu: true,
    open: false,
    q_list: [],
    staricon: "../../icons/star.png"
  },

  onLoad: function (e) {
    forum_id = e.id;
    page = 1;
    last_length = 0;
    var that = this;
    if (appInstance.globalData.userinfo.user_openid == null)//获取openid
      appInstance.get_user_openid();
    var all_feed = wx.getStorageSync('FeedObj');
    if (all_feed != null && all_feed != undefined) {
      for (let i = 0; i < all_feed.length; i++) {
        if (all_feed[i].id == forum_id) {
          this.setData({ staricon: "../../icons/star2.png" });
          isfeed = true;
          break;
        }
      }
    }
    wx.startPullDownRefresh({});
  },
  onShow: function () {
    mainListQuery = wx.createSelectorQuery();
    mainListQuery.select('#main_list').boundingClientRect();
  },
  bind_view_tap: function (e)//点击查看引用串内容
  {
    //console.log(e.currentTarget.id);
    if (lont_tap_lock) return;
    var all_kid = this.data.list[e.currentTarget.id].all_kid;
    if (all_kid != null && all_kid.length > 0) {
      this.setData({ q_list: [] });
      var that = this;
      GetQuoteBody(all_kid, that);
      this.setData({ open: true });
    }
  },
  bind_qd_tap: function (e)//打开引用的串
  {
    if (e['currentTarget'].id == "") return;
    wx.navigateTo({ url: '../p/p?id=' + e['currentTarget'].id });
  },
  bind_view_long_tap: function (e)//长按
  {
    lont_tap_lock = true;//防止长按抬起时触发tap导致打开查看引用串窗口
    LongTapID = this.data.list[e.currentTarget.id].id;
    this.setData({ ShowMenu: false });
  },
  MenuChange: function (e)//关闭下部菜单
  {
    this.setData({ ShowMenu: true });
    lont_tap_lock = false;//解除tap锁
  },
  th_reply: function (e)//引用指定No.
  {
    if (LongTapID == "") return;
    wx.navigateTo({ url: '../new/new?mode=2&revid=' + forum_id + "&rev_text=>>No." + LongTapID + "\n" });
    LongTapID = "";
    this.setData({ ShowMenu: true });
    lont_tap_lock = false;//解除tap锁
  },
  add_reply_list: function (e)//添加到引用列表
  {
    if (LongTapID != "") {
      var temp = wx.getStorageSync('ReplyIDList');
      temp += ">>No." + LongTapID + "\n";
      wx.setStorageSync('ReplyIDList', temp);
      this.setData({ ShowMenu: true });
      lont_tap_lock = false;//解除tap锁
    }
  },
  th_report: function (e)//举报这个回复
  {
    wx.navigateTo({ url: '../new/new?mode=3&revid=18&rev_text=>>No.' + LongTapID });
    LongTapID = "";
    this.setData({ ShowMenu: true });
    lont_tap_lock = false;//解除tap锁
  },
  onPullDownRefresh: function ()//下拉刷新
  {
    pw_run = true;
    page = 1;
    last_length = 0;
    this.setData(
      {
        list: [],
        scrollTop: 0
      });
    var that = this;
    GetList(that);
  },

  onReachBottom: function ()//上拉加载更多
  {
    console.log("ReachBottom");
    if (pw_run) return;
    var that = this;
    GetList(that);
  },
  bind_pic_tap: function (e)//单击图片
  {
    var img_url;
    if (this.data.open)
      img_url = this.data.q_list[e['currentTarget'].id].img;
    else
      img_url = this.data.list[e['currentTarget'].id].img;

    wx.previewImage({
      current: appInstance.globalData.url.full_img_url + img_url,
      urls: image_list
    });
  },
  bind_pic_load: function (e)//图片载入完成
  {
    var temp_width = 0;
    var temp_height = 0;
    var temp_ratio = 0.0;
    temp_width = appInstance.globalData.sysinfo.sys_width / 2;//要缩放到的图片宽度
    temp_ratio = temp_width / e.detail.width;//计算缩放比例
    temp_height = e.detail.height * temp_ratio;//计算缩放后的高度
    this.data.list[e.target.id].img_height = parseInt(temp_height);
    this.data.list[e.target.id].img_width = parseInt(temp_width);
    this.data.list[e.target.id].img_load_success = true;
    //console.log(e.target.id + " " + this.data.list[e.target.id].img_height + ":" + this.data.list[e.target.id].img_width);
    this.setData({ list: this.data.list });
  },
  tap_nw: function ()//回复本串
  {
    var temp = wx.getStorageSync('ReplyIDList');
    if (temp != "")
      wx.setStorageSync('ReplyIDList', "")
    wx.navigateTo({ url: '../new/new?mode=2&revid=' + forum_id + "&rev_text=" + temp });
  },
  tap_report: function ()//举报本串
  {
    wx.navigateTo({ url: '../new/new?mode=3&revid=18&rev_text=>>No.' + forum_id });
  },
  tap_sl: function () {
    forum_input = 1;
    this.setData({ modalFlag: false, default_page: 1 });
  },
  modalOk: function (e)//设置好了跳转到某一页回来
  {
    this.setData({ modalFlag: true });
    if (forum_input <= 0) {
      wx.showModal(
        {
          title: "输入有误！",
          content: "页码应当大于0",
          showCancel: false
        }
      );
    }
    else {
      page = forum_input;
      var that = this;
      this.setData(
        {
          list: [],
          scrollTop: 0
        });
      GetList(that);
    }
  },
  modalCancel: function (e)//点击了取消
  {
    this.setData({ modalFlag: true });
  },
  page_input: function (e)//输入要跳转的页面
  {
    var temp = parseInt(e['detail'].value);
    if (e['detail'].value != "") {
      if (isNaN(temp)) temp = 1;
      forum_input = temp;
      return parseInt(forum_input);
    }
    else
      forum_input = -1;
  },
  tap_feed: function ()//收藏
  {
    var that = this;
    if (isfeed)//如果已经订阅了 就取消订阅
      DelFeed(forum_id, that);
    else
      AddFeed(forum_id, that);
  },
  f_touch: function () {

  },
  tap_ch: function () {
    this.setData({ open: false });
  },
  onShareAppMessage: function () {
    return {
      title: "A岛匿名版",
      desc: this.data.list[0].title,
      path: "/pages/p/p?id=" + forum_id
    };
  },
  onPageScroll: function (e) {
    var that = this;
    mainListQuery.exec(function (res) {
      var max_height = res[0].height;
      if (e.scrollTop > (max_height * 0.66) && e.scrollTop < (max_height * 0.7))//大于2/3就加载下一页
      {
        if (pw_run) return;
        GetList(that);
        console.log('ScrollDown');
      }
    })
  }
})