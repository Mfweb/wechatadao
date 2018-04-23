var key_word = null;
var post_run = false;
var appInstance = getApp();
var page = 1;
var AdaoAPI = require('../../API/adao.js');
var WxParse = require('../../wxParse/wxParse.js');
var open_run = false;
var pw_run = false;
/*获取板块内串*/
function GetList(that) {
  if (post_run) return;
  post_run = true;
  that.setData({ bot_text: "正在加载.." });

  var pData = Array();
  pData.pageNo = page;
  pData.q = key_word;

  AdaoAPI.api_request(
    wx.getStorageSync('Cookie_Enable'),
    appInstance.globalData.url.host + appInstance.globalData.url.search_url,
    pData,
    function (res, that) {//success
      if (res.data == "error"){
        appInstance.showError('搜索失败');
        that.setData({ bot_text: "搜索失败" });
        return;
      }
      var list = that.data.list;
      var search_list = res.data.hits.hits;
      if (res.data.hits.total > 0) {
        for (let i = 0; i < search_list.length; i++) {
          if (search_list[i]._source.img != NaN) {
            search_list[i]._source.img = search_list[i]._source.img + search_list[i]._source.ext;
            if (search_list[i]._source.ext == ".gif")
              search_list[i]._source.thumburl = appInstance.globalData.url.full_img_url;
            else
              search_list[i]._source.thumburl = appInstance.globalData.url.thumb_img_url;
          }
          search_list[i]._source.content = WxParse.wxParse('item', 'html', search_list[i]._source.content, that, null).nodes;
          search_list[i]._source.img_height = 0;
          search_list[i]._source.img_width = 0;
          search_list[i]._source.img_load_success = false;
          search_list[i]._source.id = search_list[i]._id;
          if (search_list[i]._source.admin == 1)
            search_list[i]._source.userid = WxParse.wxParse('item', 'html', "<font class='xuankuhongming'>" + search_list[i]._source.userid + "</font>", that, null).nodes;
          else
            search_list[i]._source.userid = WxParse.wxParse('item', 'html', search_list[i]._source.userid, that, null).nodes;
          list.push(search_list[i]._source);
        }
        that.setData({ list: list });
        page++;
        that.setData({ bot_text: list.length + ",上拉继续加载.." });
      }
      else {
        that.setData({ bot_text: "未找到," + res.data.hits });
      }
    },
    function (res, that) {//fail
      appInstance.showError('加载失败');
      that.setData({ bot_text: "加载失败" });
    },
    function () {//finish
      post_run = false;
      pw_run = false;
      wx.stopPullDownRefresh();
    }, that);
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],//主列表
    isloading: false,
    bot_text: '加载中'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.kw,
    });
    key_word = options.kw;
    var that = this;
    GetList(that);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  bind_pic_load: function (e)//图片加载完成
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
    this.setData({ list: this.data.list });
  },
  bind_pic_tap: function (e)//单击图片
  {
    var pr_imgs = [appInstance.globalData.url.full_img_url + this.data.list[e['currentTarget'].id].img];
    wx.previewImage({
      current: appInstance.globalData.url.thumb_img_url + this.data.list[e['currentTarget'].id].img,
      urls: pr_imgs
    })
  },
  bind_view_tap: function (e)//单击
  {
    console.log(e);
    if (open_run) return;
    if (e.target.id != "") return;
    open_run = true;
    this.setData({ isloading: true });
    wx.navigateTo({ url: '../p/p?id=' + e['currentTarget'].id });
    this.setData({ isloading: false });
    open_run = false;
  },
  onReachBottom: function ()//上拉加载更多
  {
    if (pw_run) return;
    var that = this;
    GetList(that);
  },
})