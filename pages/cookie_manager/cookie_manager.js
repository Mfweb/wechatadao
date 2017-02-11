var save_cookies = function(list)
{
    var out_text = "";
    for(let i=0;i<list.length;i++)
    {
        if(list[i]!==null && list[i]!==undefined && list[i]!=='' && list[i]!=='null')
            out_text = out_text + "|" + list[i];
    }
    wx.setStorageSync("Cookie_All", out_text);
}

var load_cookies = function(that)
{
    var list = [];
    var enable_ck = wx.getStorageSync('Cookie_Enable');
    var temp = wx.getStorageSync('Cookie_All');
    if(enable_ck=="")enable_ck = "null";
    list.push(enable_ck);
    temp = temp.split('|');
    console.log(enable_ck);
    console.log(temp)
    if(temp.length > 0)
    {
        for(let i=0;i<temp.length;i++)
        {
            if(temp[i]!==null && temp[i]!==undefined && temp[i]!=='' && temp[i]!=='null')
                list.push(temp[i]);
        }
    }
    that.setData({cookie_list:list});
}

Page(
{
    data:{
        cookie_list:[]
    },
    onLoad:function()
    {
        load_cookies(this);
    },
    disable_cookie:function(e)//取消当前使用饼干的激活状态
    {
        var list = this.data.cookie_list;
        wx.setStorageSync('Cookie_Enable', "")
        list.push(list[0]);
        list[0] = "";
        save_cookies(list);
        load_cookies(this);
    },
    enable_cookie:function(e)//将某个饼干激活
    {
        var list = this.data.cookie_list;
        wx.setStorageSync('Cookie_Enable', list[e.currentTarget.id]);
        list[e.currentTarget.id] = "";
        save_cookies(list);
        load_cookies(this);
    },
    delete_cookie:function(e)//删除某个饼干
    {
        if(e.currentTarget.id==0)
        {
            wx.setStorageSync('Cookie_Enable', "");
        }
        else
        {
            var list = this.data.cookie_list;
            list[e.currentTarget.id] = "";
            list[0] = "";
            save_cookies(list);
        }
        load_cookies(this);
    }
})