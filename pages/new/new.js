var AdaoAPI = require('../../API/adao.js');
var re_mode = 0;
var resto_id = 0;
var appInstance = getApp();
var user_cookie = '';//回复or发送使用的cookie
var all_text = "";
/* 获取本地已启用的的Cookie */
function location_get_cookie()
{
    return wx.getStorageSync('Cookie_Enable');
}
/* 从服务器获取Cookie */
function adao_get_cookie()
{
    var temp_cookie = '0';
    wx.request({
    url:appInstance.globalData.url.get_cookie_url,
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

/*发送完成CallBack*/
function callback_success(res)
{
  if(res.data.info == (re_mode==1?"发帖成功":"回复成功"))
  {
    wx.navigateBack({delta: 1});
  }
  else
  {
    console.log(res);
    wx.showToast({
      title: res.data.info,
      image: '../../icons/alert.png',
      duration: 2000
    });
  }
}
/*发送失败CallBack*/
function callback_fail(res)
{
  wx.showToast({
    title: '发送失败',
    image: '../../icons/alert.png',
    duration: 2000
  });
  console.log(res);
}
/*调用完成CallBack*/
function callback_finish(fdata)
{
  fdata.setData({UploadDisable:false,hidden:true});
}

/*发送or回复*/
function A_Send(that,resto,content,file=null,water="true")
{
  if(user_cookie == 'null')
  {
    wx.showToast({
      title: '没有cookie..',
      image: '../../icons/alert.png',
      duration: 1500
    });
    return;
  }
  /*else if(user_cookie == 'error')
  {
    wx.showToast({
      title: '没有开饼干..',
      image: '../../icons/alert.png',
      duration: 1500
    });
    return;
  }*/
  that.setData({UploadDisable:true,hidden:false});
  var post_url = appInstance.globalData.url.host + (re_mode==1?appInstance.globalData.url.new_thread_url:appInstance.globalData.url.new_reply_url);
  if(file==null)//无图
  {
    AdaoAPI.api_request(user_cookie,post_url,
    {
      resto:re_mode==1?null:resto,
      fid:re_mode==2?null:resto,
      name:'',
      email:'',
      title:'',
      content:content,
      water:"true",
      image:''
    },callback_success,callback_fail,callback_finish,that);
  }
  else //有图
  {
    AdaoAPI.api_uploadfile(user_cookie,post_url,
    {
      resto:re_mode==1?null:resto,
      fid:re_mode==2?null:resto,
      name:"",
      email:"",
      title:"",
      content:content,
      water:water
    },file,callback_success,callback_fail,callback_finish,that);
  }
}

Page({
    data:{
      txt_focus:false,
      txt_value:"",
      select_image:"",
      select_image_hid:true,
      watermark:"false",
      hidden:true,
      UploadDisable:false,
      bq_item:["颜",
        "|∀ﾟ", "(´ﾟДﾟ`)", "(;´Д`)", "(｀･ω･)", "(=ﾟωﾟ)=", 
        "| ω・´)", "|-` )", "|д` )", "|ー` )", "|∀` )", 
        "(つд⊂)", "(ﾟДﾟ≡ﾟДﾟ)", "(＾o＾)ﾉ", "(|||ﾟДﾟ)", "( ﾟ∀ﾟ)",
         "( ´∀`)", "(*´∀`)", "(*ﾟ∇ﾟ)", "(*ﾟーﾟ)", "(　ﾟ 3ﾟ)", 
         "( ´ー`)", "( ・_ゝ・)", "( ´_ゝ`)", "(*´д`)", "(・ー・)", 
         "(・∀・)", "(ゝ∀･)", "(〃∀〃)", "(*ﾟ∀ﾟ*)", "( ﾟ∀。)", 
         "( `д´)", "(`ε´ )", "(`ヮ´ )", "σ`∀´)", " ﾟ∀ﾟ)σ",
         "ﾟ ∀ﾟ)ノ", "(╬ﾟдﾟ)", "(|||ﾟдﾟ)", "( ﾟдﾟ)", "Σ( ﾟдﾟ)",
         "( ;ﾟдﾟ)", "( ;´д`)", "(　д ) ﾟ ﾟ", "( ☉д⊙)", "(((　ﾟдﾟ)))", 
         "( ` ・´)", "( ´д`)", "( -д-)", "(>д<)", "･ﾟ( ﾉд`ﾟ)", 
         "( TдT)", "(￣∇￣)", "(￣3￣)", "(￣ｰ￣)", "(￣ . ￣)", 
         "(￣皿￣)", "(￣艸￣)", "(￣︿￣)", "(￣︶￣)", "ヾ(´ωﾟ｀)", 
         "(*´ω`*)", "(・ω・)", "( ´・ω)", "(｀・ω)", "(´・ω・`)", 
         "(`・ω・´)", "( `_っ´)", "( `ー´)", "( ´_っ`)", "( ´ρ`)", 
         "( ﾟωﾟ)", "(oﾟωﾟo)", "(　^ω^)", "(｡◕∀◕｡)", "/( ◕‿‿◕ )\\", 
         "ヾ(´ε`ヾ)", "(ノﾟ∀ﾟ)ノ", "(σﾟдﾟ)σ", "(σﾟ∀ﾟ)σ", "|дﾟ )", 
         "┃電柱┃", "ﾟ(つд`ﾟ)", "ﾟÅﾟ )　", "⊂彡☆))д`)", "⊂彡☆))д´)", 
         "⊂彡☆))∀`)", "(´∀((☆ミつ"],
         bq_index:0,
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
        all_text = this.data.txt_value;
        if(e.mode==3)e.mode=1;
        resto_id = e.revid;
        re_mode  = e.mode;
    },
    onShow:function()
    {
      this.setData({txt_focus:true});
      var temp = location_get_cookie();
      if (temp == '' || temp == '0')
        user_cookie = 'null';
      else
        user_cookie = temp;
      //console.log(temp);
      /*if(temp == '' || temp == '0')//本地cookie获取失败，从服务器获取
      {
        user_cookie = 'null';
        adao_get_cookie();
      }
      else
      {
        user_cookie = temp;
      }*/
    },
    cl_tp:function()//清空输入和图片
    {
      this.setData({
        txt_value:"",
        txt_focus:true,
        select_image:"",
        select_image_hid:true
        });
    },
    pc_tp:function()//选择图片
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
    bindPickerChange:function(res)//选择了颜文字
    {
      all_text += this.data.bq_item[res.detail.value];

      this.setData({bq_index:res.detail.value,txt_value:all_text,txt_focus:true});
    },
    onCancel:function()
    {
      wx.navigateBack({delta: 1});
    },
    form_submit:function(res)
    {
      var that = this;
      var s_file = res.detail.value.pic;
      if(s_file=="")s_file = null;
      A_Send(that,resto_id,res.detail.value.text,s_file,res.detail.value.watermark);
    },
    text_input:function(res)
    {
      all_text = res.detail.value;
    }
})