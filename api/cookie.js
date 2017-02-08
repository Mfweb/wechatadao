


function location_get_cookie()//获取本地已启用的的Cookie
{
    return wx.getStorageSync('Cookie_Enable');
}

function location_get_cookies()//获取本地所有的的Cookie
{
    var temp;
    temp = wx.getStorageSync('Cookie_All');
    temp = temp.split('|');
    return temp;
}

function get_cookie()
{
    var cookie;
    cookie = location_get_cookie();
    if(cookie == "")
    {
        cookie = adao_get_cookie();
        if(cookie!= "error")
        wx.setStorageSync('Cookie_Enable', cookie)
    }
    return cookie;
}
module.exports = {
  get_cookie: get_cookie,
}
