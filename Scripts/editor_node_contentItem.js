var ContentItem = function (id, name, type, dataType, func, owner)
{
    var self = this;
    this.name = name;
    this.id = id;
    this.type = type;
    this.dataType = dataType;
    this.func = func;
    this.owner = owner;
    this.value;
    this.connections = [];
    this.connectedSide = null;

    var contentItemElement = null;
    var connectorLeftElement = null;
    var connectorRightElement = null;

    this.GetHtml = function (style)
    {
        var html = "";
        if (self.owner.typeName == "createNodeType")
        {
            return "<div style='" + style + "' class='ed_contentItem' id='" + self.id + "'><div class='ed_contentItemTitle' style='background-color:" + owner.color + "'><span class='ed_contentItemTitleText'>" + self.name + "</span>&#160;&#160;<button class='ed_editContentItemButton'>upr.</button><button class='ed_editDeleteContentItemButton'>-</button></div></div>";
        }
        switch (self.type)
        {
            case "content":
                html = "<div style='" + style + "' class='ed_contentItem' id='" + self.id + "'><label for='" + self.id + "'><div class='ed_contentItemTitle'>" + self.name + "</div><div class='ed_contentItemInput'>";
                switch (self.dataType)
                {
                    case "boolean": html += "<input class='ed_contentItemInput' type='checkbox' " + (self.value ? "checked='checked'" : "") + " data-id='" + self.id + "'/>"; break;
                    case "int": html += "<input class='ed_contentItemInput' type='text' onkeypress='return NodeEditorUtils.ControlNumber(event)' value='" + (!self.value ? "" : self.value) + "' data-id='" + self.id + "'/>"; break;
                    case "float": html += "<input class='ed_contentItemInput' type='text' onkeypress='return NodeEditorUtils.ControlDecimalNumber(event)' value='" + (!self.value ? "" : self.value) + "' data-id='" + self.id + "'/>"; break;
                    case "string": html += "<textarea class='ed_contentItemInput' value='" + (!self.value ? "" : self.value) + "' data-id='" + self.id + "'/>"; break;
                    case "color": html += "<input class='ed_contentItemInput ed_colorpicker' value='" + (!self.value ? "" : self.value) + "' data-id='" + self.id + "' value='#000000'/><script>$('.ed_colorpicker', '#" + self.id + "').colorPicker({renderCallback: function(){ $('.ed_colorpicker', '#" + self.id + "').trigger('colorChanged'); }});</script>"; break;
                    case "image": html += "url: <input class='ed_contentItemInput' type='text' value='" + (!self.value ? "" : self.value) + "' data-id='" + self.id + "' />"; break;
                    default:
                        if (self.dataType.indexOf("select") > -1)
                        {
                            var selectItems = NodeEditorUtils.ParseType(self.dataType);
                            html +=
                            "<select class='ed_contentItemInput' data-id='" + self.id + "'>";
                            for (var i = 0; i < selectItems.length; i++)
                            {
                                html += "<option class='ed_contentItemInput' " + (self.value == selectItems[i] ? "selected='selected'" : "") + " value='" + selectItems[i] + "'>" + selectItems[i] + "</option>";
                            }
                            html += "</select>";
                        }
                        else if (self.dataType.indexOf("radio") > -1)
                        {
                            var radioItems = NodeEditorUtils.ParseType(self.dataType);
                            for (var i = 0; i < radioItems.length; i++)
                            {
                                html += "<span>" + radioItems[i] + "</span><input class='ed_contentItemInput' type='radio' " + (self.value == radioItems[i] ? "checked='checked'" : "") + " data-id='" + self.id + "' name='" + self.id + "' value='" + radioItems[i] + "'/>";
                            }
                        }
                        break;
                }
                if ($("#" + self.id).size() > 0) self.value = $(".ed_contentItemInput[data-id='" + self.id + "']").val();
                html += "</div></label></div>";
                break;
            case "input":
                html = "<div style='" + style + "' class='ed_inputItem ed_connectorContainer' id='" + self.id + "'>" + (owner.typeName != "createNodeType" ? "<span class='ed_connector ed_connectorLeft'></span><span class='ed_connector ed_connectorRight'></span>" : "") + "<div class='ed_inputItemTitle' style='background-color:" + owner.color + "'>" + self.name + "</div><div class='ed_display'>" + self.GetDisplayHtml() + "</div></div>";
                break;
            case "output":
                html = "<div style='" + style + "' class='ed_outputItem ed_connectorContainer' id='" + self.id + "'>" + (owner.typeName != "createNodeType" ? "<span class='ed_connector ed_connectorLeft'></span><span class='ed_connector ed_connectorRight'></span>" : "") + "<div class='ed_outputItemTitle' style='background-color:" + owner.color + "'>" + self.name + "</div><div class='ed_display'>" + self.GetDisplayHtml() + "</div></div>";
                break;
            case "group":
                html = "<div style='" + style + "' class='ed_groupItem ed_connectorContainer' id='" + self.id + "'><span class='ed_connector ed_connectorLeft'></span><span class='ed_connector ed_connectorRight'></span><div class='ed_groupItemTitle' style='background-color:" + owner.color + "'>" + self.name + "</div></div>";
                break;
        }
        return html;
    }

    this.GetDisplayHtml = function ()
    {
        var html = ""
        if (!!self.value)
        {
            if (self.dataType == "color")
            {
                html += "<div style='background-color: " + self.value + "'>" + self.value + "</div>";
            }
            else if (self.dataType == "image")
            {
                html += "<a href='" + self.value + "' target='_blank'><img src='" + self.value + "'/></a>";
            }
            else
            {
                html += self.value;
            }
        }

        return html;
    }

    this.RefreshValue = function (initial)
    {
        if (typeof (initial) == "undefined") { initial = self; }
        else if (initial.id == self.id)
        {
            return;
        }
        if (self.type == "input")
        {
            if (self.connections.length > 0) self.value = self.connections[0].contentItemOutput.value;
            else self.value = null;
        }
        else if (self.type == "content" && $("#" + self.id).size() > 0)
        {
            if (self.dataType == "boolean") self.value = $(".ed_contentItemInput[data-id=" + self.id + "]").is(":checked");
            else if (self.dataType == "int") self.value = parseInt($(".ed_contentItemInput[data-id=" + self.id + "]").val());
            else if (self.dataType == "float") self.value = parseFloat($(".ed_contentItemInput[data-id=" + self.id + "]").val());
            else self.value = $(".ed_contentItemInput[data-id=" + self.id + "]").val();
        }
        else if (self.type == "output" && typeof (self.func) != "undefined")
        {
            var arguments = [];
            for (var i = 0; i < owner.contentItems.length; i++)
            {
                arguments[owner.contentItems[i].name] = owner.contentItems[i].value;
            }
            self.value = self.func(arguments);
        }

        $(".ed_display", "#" + self.id).html(self.GetDisplayHtml());

        if (self.type == "output")
        {
            for (var i = 0; i < self.connections.length; i++)
            {
                self.connections[i].contentItemInput.owner.RefreshValues(initial);
            }
        }
    }

    this.SetValue = function (value)
    {
        self.value = value;
        $(".ed_contentItemInput", "#" + self.id).val(value);
    }

    this.GetElement = function ()
    {
        if (!contentItemElement) contentItemElement = $("#" + self.id);
        return contentItemElement;
    }

    this.GetConnectorRight = function ()
    {
        if (connectorRightElement == null || connectorRightElement.size() == 0) connectorRightElement = $(".ed_connectorRight", "#" + self.id);
        return connectorRightElement;
    }

    this.GetConnectorLeft = function ()
    {
        if (connectorLeftElement == null || connectorLeftElement.size() == 0) connectorLeftElement = $(".ed_connectorLeft", "#" + self.id);
        return connectorLeftElement;
    }

    this.CheckConnectedSide = function ()
    {
        var side = null;
        for (var i = 0; i < self.connections.length; i++)
        {
            var newSide = null;
            if (self.type == "input")
            {
                newSide = self.connections[i].inputSide;
            }
            else newSide = self.connections[i].outputSide;

            if ((side == "left" && newSide == "right") || (side == "right" && newSide == "left") || side == "both") side = "both";
            else side = newSide;
        }
        if (side != self.connectedSide)
        {
            if (side == "left")
            {
                self.GetConnectorLeft().show().addClass("ed_connected");
                self.GetConnectorRight().hide();
            }
            else if (side == "right")
            {
                self.GetConnectorLeft().hide();
                self.GetConnectorRight().show().addClass("ed_connected");
            }
            else
            {
                self.GetConnectorLeft().show().addClass("ed_connected");
                self.GetConnectorRight().show().addClass("ed_connected");
            }
            self.connectedSide = side;
        }
    }

    this.Connect = function (connection)
    {
        self.connections.push(connection);
        self.GetConnectorLeft().addClass("ed_connected");
        self.GetConnectorRight().addClass("ed_connected");
        self.RefreshValue();
    }

    this.Disconnect = function (itemToDisconnect)
    {
        for (var i = 0; i < self.connections.length; i++)
        {
            if (itemToDisconnect.id == self.connections[i].contentItemInput.id || itemToDisconnect.id == self.connections[i].contentItemOutput.id)
            {
                self.connections.splice(i, 1);
            }
            itemToDisconnect.RefreshValue();
        }
        self.GetConnectorLeft().show().removeClass("ed_connected ed_activeConnected");
        self.GetConnectorRight().show().removeClass("ed_connected ed_activeConnected");
        self.connectedSide = null;
        self.RefreshValue();
    }
}