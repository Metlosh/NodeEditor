function NodeEditorUtils() { }

NodeEditorUtils.GetE = function(elementId)
{
    return document.getElementById(elementId)
}

NodeEditorUtils.ControlNumber = function(e)
{

    var keynum;

    if (window.event)
    {
        keynum = window.event.keyCode;
    } else if (e.which)
    {
        keynum = e.which;
    }

    return (((keynum >= 48) && (keynum <= 57)) || (keynum == 8 || keynum == 13) || keynum === undefined);
}

NodeEditorUtils.ControlDecimalNumber = function(e)
{
    var keynum;

    if (window.event)
    {
        keynum = window.event.keyCode;
    } else if (e.which)
    {
        keynum = e.which;
    }
    if ((NodeEditorUtils.GetSRC(e).value.indexOf(',') > -1 || NodeEditorUtils.GetSRC(e).value.indexOf('.') > -1) && (keynum == 44 || keynum == 46))
    {
        return false;
    }

    return (((keynum >= 48) && (keynum <= 57)) || (keynum == 8 || keynum == 13) || (keynum == 44 || keynum == 46) || keynum === undefined);
}

NodeEditorUtils.GetRandomColor = function ()
{
    var colors = ["#CB99C9", "#C23B22", "#FFD1DC", "#DEA5A4", "#AEC9CF", "#77DD77", "#CFCFC4", "#B39EB5", "#FFB347", "#B19CD9", "#FF6961", "#03C03C", "#FDFD96", "#836953", "#779ECB", "#966FD6"];
    return colors[Math.floor(Math.random() * colors.length)];
}

NodeEditorUtils.ParseType = function (type)
{
    if (type.indexOf("(") > -1)
    {
        var str = type.substring(type.indexOf("(") + 1, type.indexOf(")")).replace(/ /g, "");
        var ret = [];
        var item = "";
        for (var i = 0; i < str.length; i++)
        {
            if (str[i] != ",") item += str[i];
            if (str[i] == "," || i >= str.length - 1)
            {
                ret.push(item);
                item = "";
            }
        }
        return ret;
    }
}

NodeEditorUtils.FindTypeByName = function (name, typesJson)
{
    for (var i = 0; i < typesJson.nodeType.length; i++)
    {
        if (typesJson.nodeType[i].name == name) return typesJson.nodeType[i];
    }
}

NodeEditorUtils.GetNodeById = function (id, nodes)
{
    for (var i = 0; i < nodes.length; i++)
    {
        if (nodes[i].id == id) return nodes[i];
    }
}

NodeEditorUtils.GetContentItemById = function (id, nodes)
{
    for (var i = 0; i < nodes.length; i++)
    {
        if (id.indexOf(nodes[i].id) > -1)
        {
            for (var j = 0; j < nodes[i].contentItems.length; j++)
            {
                if (nodes[i].contentItems[j].id == id)
                {
                    return nodes[i].contentItems[j];
                }
            }
        }
    }
}

NodeEditorUtils.GetGroupByName = function(name, groups)
{
    for(index in groups)
    {
        if(groups[index].name == name) return groups[index];
    }
}

NodeEditorUtils.GetSRC = function(e)
{
    return (window.event) ? window.event.srcElement : e.target;
}

NodeEditorUtils.ReplaceUglyChars = function(str)
{
    var str=str.toLowerCase();
    str = str.replace(new RegExp(/\s/g),"_");
    str = str.replace(new RegExp(/[àáâãäå]/g),"a");
    str = str.replace(new RegExp(/æ/g),"ae");
    str = str.replace(new RegExp(/[çč]/g),"c");
    str = str.replace(new RegExp(/[ď]/g),"d");
    str = str.replace(new RegExp(/[èéêëě]/g),"e");
    str = str.replace(new RegExp(/[ìíîï]/g),"i");
    str = str.replace(new RegExp(/[ñň]/g),"n"); 
    str = str.replace(new RegExp(/[òóôõö]/g),"o");
    str = str.replace(new RegExp(/œ/g),"oe");
    str = str.replace(new RegExp(/[ř]/g),"r");
    str = str.replace(new RegExp(/[š]/g),"s");
    str = str.replace(new RegExp(/[ť]/g),"s");
    str = str.replace(new RegExp(/[ùúûü]/g),"u");
    str = str.replace(new RegExp(/[ýÿ]/g),"y");
    str = str.replace(new RegExp(/[ž]/g),"z");
    str = str.replace(new RegExp(/[\W]/g),"");
    return str;
}

NodeEditorUtils.Guid = function (length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

NodeEditorUtils.GenerateSVG = function ()
{
    var ellipsesCount = 10 + Math.random() * 20;
    var svg = "<svg id='ed_svg' style='overflow: hidden; position: relative; top: 10px; opacity: 0.4' xmlns='http://www.w3.org/2000/svg' width='100%' version='1.1' height='100%'>" +
                "<desc>Created with Raphaël 2.0.1</desc><defs></defs><rect style='' stroke='none' fill='#a9c03f' ry='0' rx='0' r='0' height='100%' width='100%' y='0' x='0'></rect>";
    for (var i = 0; i < ellipsesCount; i++)
    {
        var rotation = Math.random() * 20;
        var opacity = Math.random();
        svg += "<ellipse opacity='" + opacity + "' stroke-width='13' style='opacity: 0.83;' transform='rotate(" + rotation + ")' stroke='#a9c03f' fill='#dcdb5f' ry='" + Math.random() * 200 + "' rx='" + Math.random() * 200 + "' cy='" + Math.random() * 100 + "%' cx='" + Math.random() * 100 + "%'></ellipse>";
    }

    svg += "</svg>";
    return svg;
}








