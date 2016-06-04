var Group = function (name, owner)
{
    var self = this;

    this.name = name;
    this.nodes = [];
    this.minimized = false;
    this.owner = owner;
    this.positionX;
    this.positionY;
    this.selected = false;
    this.color;

    this.contentItems = [];


    this.SelectNodes = function ()
    {
        for (var index in self.nodes)
        {
            self.nodes[index].Select();
        }
    }

    this.UnselectNodes = function ()
    {
        for (var index in self.nodes)
        {
            self.nodes[index].Unselect();
        }
    }

    this.AddNode = function (node)
    {
        self.nodes.push(node);
    }

    this.RemoveNode = function (node)
    {
        for (var index in self.nodes)
        {
            if (node.id == self.nodes[index].id)
            {
                self.nodes.splice(index, 1);
            }
        }
    }

    this.Move = function (diffX, diffY)
    {
        diffX /= owner.zoom;
        diffY /= owner.zoom;
        var element = self.GetElement();
        self.positionX += diffX;
        self.positionY += diffY;
        element.css("left", self.positionX + "px");
        element.css("top", self.positionY + "px");
    };

    this.Minimize = function (callback)
    {
        self.minimized = true;
        if (self.nodes.length > 0)
        {
            var posXSum = 0;
            var posYSum = 0;
            for (var index in self.nodes)
            {
                posXSum += self.nodes[index].positionX;
                posYSum += self.nodes[index].positionY;
            }
            self.positionX = posXSum / self.nodes.length;
            self.positionY = posYSum / self.nodes.length;
            for (index in self.nodes)
            {
                self.nodes[index].SaveOriginalPosition();
                self.nodes[index].MoveTo(self.positionX, self.positionY, true, true);
            }
            self.nodes[0].GetElement().before(self.GetHtml("display:none"));
            self.AnimateIn(callback);
        }
    }

    this.Maximize = function (callback)
    {
        self.minimized = false;
        if (self.nodes.length > 0)
        {
            for (var index in self.nodes)
            {
                var editedNode = self.nodes[index];
                editedNode.MoveTo(self.positionX, self.positionY, false);
                editedNode.MoveTo(editedNode.origPositionX, editedNode.origPositionY, false, true, callback);
            }
            self.AnimateOut(function () { self.GetElement().remove(); });
        }
    }

    this.AnimateIn = function (callback)
    {
        var element = self.GetElement();
        element.fadeIn(function ()
        {
            $(".ed_connectorLeft", element).animate({ left: "-20" });
            $(".ed_connectorRight", element).animate({ right: "-20" });
            $(".ed_groupButtons", element).animate({ top: "-20" }, function ()
            {
                if (typeof (callback) == "function") callback();
            });
        });
    }

    this.AnimateOut = function (callback)
    {
        var element = self.GetElement();
        $(".ed_connectorLeft", element).animate({ left: "0" });
        $(".ed_connectorRight", element).animate({ right: "0" });
        $(".ed_groupButtons", element).animate({ top: "0" }, function ()
        {
            $(element).fadeOut(function ()
            {
                if (typeof (callback) == "function") callback();
            });
        });
    }

    this.GetHtml = function (style)
    {
        if (!self.color) self.color = NodeEditorUtils.GetRandomColor();
        var style = ";left:" + self.positionX + "px;top:" + self.positionY + "px;background-color:" + self.color + ";" + style;
        var html = "<div id='ed_group_" + self.name + "' class='ed_group' style='" + style + "' data-name='" + self.name + "'>";
        html += "<div class='ed_title'><span class='ed_groupTitleText'>" + self.name + "</span><div class='ed_groupButtons'><div class='ed_deleteGroup ed_groupButton'>Smazat</div><div class='ed_maximizeGroup ed_groupButton'>Rozbalit</div></div></div>"
        for (var index in self.nodes)
        {
            var outcons = self.nodes[index].GetConnectionOutsideGroup()
            if (outcons.length > 0)
            {
                var newContentItem = new ContentItem(self.nodes[index].id + "_groupConnector", self.nodes[index].title, "group", null, null, self);
                for (var i = 0; i < outcons.length; i++)
                {
                    newContentItem.Connect(outcons[i]);
                }
                self.contentItems[self.nodes[index].id] = newContentItem;
                html += newContentItem.GetHtml();
            }
            else html += "<div class='ed_groupName'>" + self.nodes[index].title + "</div>";
        }
        html += "</div>";
        return html;
    }

    this.GetElement = function () { return $("#ed_group_" + self.name); }

    this.Select = function ()
    {
        var element = self.GetElement();
        self.selected = true;
        element.addClass("ed_groupSelected");
        element.css("z-index", 9999);
    }

    this.Unselect = function ()
    {
        var element = self.GetElement();
        self.selected = false;
        $(element).removeClass("ed_groupSelected");
        $(element).css("z-index", self.zindex);
    }
}

