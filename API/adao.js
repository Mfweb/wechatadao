//请求api
//userid:饼干
//url:请求地址
//data:请求数据(post)
//handle_success:请求成功回调
//handle_fail:请求失败回调
//handle_finish:失败和成功函数执行完成后回调
//f_data:附加数据
function api_request(userid,url,data,handle_success,handle_fail,handle_finish,f_data=null)
{
    wx.request(
    {
        url:url,
        data:data==null?{}:data,
        header:
        {
            'content-type'      : 'application/x-www-form-urlencoded',
//            'User-Agent'        : 'HavfunClient-WeChatAPP',
            'X-Requested-With'  : 'XMLHttpRequest',
            'cookie'            : 'userhash=' + userid
        },
        method:'POST',
        success:function(res)
        {
            handle_success(res,f_data);
            if(handle_finish!=null)
                handle_finish(f_data);
        },

        fail:function(res)
        {
            handle_fail(res,f_data);
            if(handle_finish!=null)
                handle_finish(f_data);
        }
    });
}
//上传图片
//userid:饼干
//url:请求地址
//data:请求数据(post)
//imgfile:图片文件路径
//handle_success:请求成功回调
//handle_fail:请求失败回调
//handle_finish:失败和成功函数执行完成后回调
//f_data:附加数据
function api_uploadfile(userid,url,data,imgfile,handle_success,handle_fail,handle_finish,f_data=null)
{
    wx.uploadFile({
    url: url,
    filePath:imgfile,
    name:'image',
    header:{
        'cookie'            : 'userhash=' + userid,
        'content-type'      : 'application/x-www-form-urlencoded',
//        'User-Agent'        : 'HavfunClient-WeChatAPP',
        'X-Requested-With'  : 'XMLHttpRequest'
    },
    formData:data==null?{}:data,
    success: function(res)
    {
        res.data = JSON.parse(res.data);//uploadFile并没有像request那样自动使用parse
        handle_success(res,f_data);
        if(handle_finish!=null)
            handle_finish(f_data);
    },
    fail: function(res)
    {
        handle_fail(res,f_data);
        if(handle_finish!=null)
            handle_finish(f_data);
    }
  });
}

module.exports = {
  api_request: api_request,
  api_uploadfile:api_uploadfile
}
