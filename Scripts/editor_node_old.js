var Node = function (id, positionX, positionY, zindex, color, title, typeName, owner, editedTypeName)
{
    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
    this.origPositionX;
    this.origPositionY;
    this.zindex = zindex;
    this.color = color;
    this.title = title;
    this.type = NodeEditorUtils.FindTypeByName(typeName, owner.typesJson);
    this.typeName = typeName;
    this.owner = owner; // editor
    this.contentItems = [];
    this.selected = false;
    this.group = null;
    this.editedTypeName = editedTypeName;

    var self = this;

    this.GetHtml = function (style)
    {
        style += ";left:" + positionX + "px;top:" + positionY + "px;z-index:" + zindex + ";background-color:" + color;
        var html =
        "<div class='ed_node' id='" + self.id + "' style='" + style + "'>";
        if (typeName == "createNodeType")
        {
            html += "<div class='ed_title'><span class='ed_nodeTitleText'>" + self.title + "</span><div class='ed_nodeButtons'><div class='ed_saveNodeType ed_nodeButton'>Uložit</div><div class='ed_renameNode ed_nodeButton'>Přejmenovat</div><div class='ed_cancelNodeType ed_nodeButton'>Zrušit</div></div></div>"
        }
        else
        {
            html += "<div class='ed_title'><span class='ed_nodeTitleText'>" + self.title + "</span><div class='ed_nodeButtons'><div class='ed_renameNode ed_nodeButton'>Přejmenovat</div><div class='ed_deleteNode ed_nodeButton'>Smazat</div></div><div class='ed_selectGroup'>" + GroupsHtml() + "</div></div>"
        }
        html += "<div class='ed_content'>";

        if (typeName == "createNodeType")
        {
            var html1 = "";
            var html2 = "";
            var html3 = "";
            for (var i = 0; i < self.contentItems.length; i++)
            {
                if (self.contentItems[i].type == "input") html1 += self.contentItems[i].GetHtml();
                if (self.contentItems[i].type == "content") html2 += self.contentItems[i].GetHtml();
                if (self.contentItems[i].type == "output") html3 += self.contentItems[i].GetHtml();
            }
            html += "<div class='ed_createNodeTypeContentItem'>Vstupy<button class='ed_addButton ed_input' data-add-type='input'>+</button>" + html1 + "</div>"
                 + "<div class='ed_createNodeTypeContentItem'>Obsah<button class='ed_addButton ed_input' data-add-type='content'>+</button>" + html2 + "</div>"
                 + "<div class='ed_createNodeTypeContentItem'>Výstupy<button class='ed_addButton ed_input' data-add-type='output'>+</button>" + html3 + "</div>";

        }
        else
        {
            for (var i = 0; i < self.contentItems.length; i++)
            {
                html += self.contentItems[i].GetHtml();
            }
        }

        html += "</div>" +
            "</div>";
        return html;
    };

    this.GetElement = function () { return $("#" + self.id); };

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

    this.MoveTo = function (posX, posY, hidden, animate, callback)
    {
        var element = self.GetElement();

        self.positionX = posX;
        self.positionY = posY;
        if (!hidden)
        {
            element.css("opacity", 0);
            self.Show();
        }
        if (animate)
        {
            element.animate({ "left": self.positionX, "top": self.positionY, "opacity": (hidden ? 0 : 1) }, function ()
            {
                if (typeof (callback) == "function") callback();
            });
        }
        else
        {
            element.css("left", self.positionX).css("top", self.positionY);
            if (typeof (callback) == "function") callback();
        }
        if (hidden) self.Hide();
    };

    this.SaveOriginalPosition = function ()
    {
        self.origPositionX = self.positionX;
        self.origPositionY = self.positionY;
    };

    // naplnit vstupy, výstupy a obsahy do pole contentItems
    (function ()
    {
        if (typeName == "createNodeType" && !self.editedTypeName) return;

        var content = (!self.editedTypeName ? self.type : NodeEditorUtils.FindTypeByName(self.editedTypeName, owner.typesJson));
        if (!content) { alert("typ " + typeName + " neexistuje"); return; }

        if (content.inputItem)
        {
            for (var i = 0; i < content.inputItem.length; i++)
            {
                var inputItemId = "ed_input_" + content.inputItem[i].name + "_" + self.id + "_" + i;
                var item = new ContentItem(inputItemId, content.inputItem[i].name, 'input', content.inputItem[i].dataType, content.inputItem[i].func, self);
                self.contentItems.push(item);
            }
        }
        if (content.contentItem)
        {
            for (var i = 0; i < content.contentItem.length; i++)
            {
                var contentItemId = "ed_content_" + content.contentItem[i].name + "_" + self.id + "_" + i;
                var item = new ContentItem(contentItemId, content.contentItem[i].name, 'content', content.contentItem[i].dataType, content.contentItem[i].func, self);
                self.contentItems.push(item);
            }
        }
        if (content.outputItem)
        {
            for (var i = 0; i < content.outputItem.length; i++)
            {
                var outputItemId = "ed_output_" + content.outputItem[i].name + "_" + self.id + "_" + i;
                var item = new ContentItem(outputItemId, content.outputItem[i].name, 'output', content.outputItem[i].dataType, content.outputItem[i].func, self);
                self.contentItems.push(item);
            }
        }
    })();

    this.AnimateIn = function (callback)
    {
        $(".ed_connector", "#" + self.id).hide();
        $("#" + self.id).slideDown(function ()
        {
            $(".ed_connector", "#" + self.id).show();
            $(".ed_nodeButtons", "#" + self.id).animate({ top: "-20" });
            $(".ed_connectorLeft", "#" + self.id).animate({ left: "-20" });
            $(".ed_connectorRight", "#" + self.id).animate({ right: "-20" }, function ()
            {
                if (typeof (callback) == "function") callback();
            });
        });
    }

    this.AnimateOut = function (callback)
    {
        $(".ed_connectorLeft", "#" + self.id).animate({ left: "0" });
        $(".ed_connectorRight", "#" + self.id).animate({ right: "0" });
        $(".ed_nodeButtons", "#" + self.id).animate({ top: "0" }, function ()
        {
            $(".ed_connector", "#" + self.id).hide();
            $("#" + id).slideUp(function ()
            {
                if (typeof (callback) == "function") callback();
            });
        });
    }

    this.Select = function ()
    {
        self.selected = true;
        $("#" + self.id).addClass("ed_nodeSelected");
        $("#" + self.id).css("z-index", 9999);
    }

    this.Unselect = function ()
    {
        self.selected = false;
        $("#" + self.id).removeClass("ed_nodeSelected");
        $("#" + self.id).css("z-index", self.zindex);
    }

    this.RefreshValues = function ()
    {
        for (var i = 0; i < self.contentItems.length; i++)
        {
            self.contentItems[i].RefreshValue();
        }
    }

    this.GetValuesToSave = function ()
    {
        var ret = [];
        for (var i = 0; i < self.contentItems.length; i++)
        {
            if (self.contentItems[i].type == "content")
            {
                ret.push({ name: self.contentItems[i].name, value: self.contentItems[i].value });
            }

        }
        return ret;
    }

    this.SetValues = function (values)
    {
        for (var i = 0; i < values.length; i++)
        {
            for (var j = 0; j < self.contentItems.length; j++)
            {
                if (values[i].name == self.contentItems[j].name)
                {
                    self.contentItems[j].SetValue(values[i].value);
                }
            }
        }
    }

    var GroupsHtml = function ()
    {
        var html = "<select " + (owner.groups.length == 0 ? "style='display:none'" : "") + " class='ed_selectGroupInput'><option value='-' " + (self.group == null ? "selected='selected'" : "") + ">-</option>";
        for (var i = 0; i < owner.groups.length; i++)
        {
            html += "<option value='" + owner.groups[i].name + "' " + (self.group != null && self.group.name == owner.groups[i].name ? "selected='selected'" : "") + ">" + owner.groups[i].name + "</option>";
        }
        html += "</select>";
        return html;
    }

    this.UpdateGroup = function ()
    {
        $(".ed_selectGroup").html(GroupsHtml());
    }

    this.AddGroup = function (gr)
    {
        if (typeof (gr) == "undefined")
        {
            if (self.group != null) self.group.RemoveNode(self);
            self.group = null;
        }
        else
        {
            if (self.group != null) self.group.RemoveNode(self);
            self.group = gr;
            gr.AddNode(self);
        }
    }

    this.Hide = function () { $("#" + self.id).fadeOut() };
    this.Show = function () { $("#" + self.id).fadeIn() };

    this.HasConnectionOutsideGroup = function ()
    {
        if (!self.group) return false;
        else
        {
            for (var index in self.contentItems)
            {
                if (!!self.contentItems[index].connectedContentItem)
                {
                    if (!self.contentItems[index].connectedContentItem.owner.group || self.contentItems[index].connectedContentItem.owner.group.name != self.group.name) return true;
                }
            }
            return false;
        }
    }
}