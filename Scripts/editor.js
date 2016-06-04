var NodeEditor = function ()
{
    this.typesJson; // stazeny json obsahujici typy uzlů
    this.settings; // nastaveni
    this.zoom = 1; // priblizeni
    this.context; // kontext canvasu
    var canvas; // js objekt canvasu
    var editor; // js objekt hlavniho divu editoru
    var menu; // js objekt pravého menu
    var svg; // js objekt svg pozadi
    var nodeConnections = []; // pole obsahujici vsechna zobrazena spojeni mezi uzly
    var nodes = [];
    this.groups = [];
    var selectedNodes = []; // objekt vybranych nodu
    var selectedGroups = []; // objekt vybranych skupin
    var elementToConnect; // objekt typu contentItem vstupu nebo vystupu, ktery se chystam s necim spojit
    var elementToConnect2; // objekt typu contentItem vstupu nebo vystupu, ktery se chystam spojit s objektem vyse
    var nodeToAddType; // typ uzlu k přidání
    var oldCoords; // stare souradnice mysi z minuleho volani mousemove pri pretahovani
    var self = this;
    var mousePressed = false;
    var mouseDragged = false;
    var menuPressed = false;
    var menuDragged = false;
    var selectionRect = null;
    var origDocWidth = 0;
    var origDocHeight = 0;
    var origWinWidth = 0;
    var origWinHeight = 0;

    var editorElement = null;
    var editorOffset = null;

    this.Create = function (editor_settings)
    {
        // KONTROLA ZAVISLOSTI
        if (typeof ($) == 'undefined')
        {
            alert("Chybí JQuery.");
            return false;
        }
        if (typeof (NodeEditorData) == 'undefined')
        {
            alert("Chybí soubor editor_data.js");
            return false;
        }
        if (typeof (NodeEditorUtils) == 'undefined')
        {
            alert("Chybí soubor editor_utils.js");
        }
        if (typeof (Node) == 'undefined')
        {
            alert("Chybí soubor editor_node.js");
        }
        if (typeof (ContentItem) == 'undefined')
        {
            alert("Chybí soubor editor_node_contentItem.js");
        }
        if (typeof (Connection) == 'undefined')
        {
            alert("Chybí soubor editor_node_connection.js");
        }
        if (typeof (Group) == "undefined")
        {
            alert("Chybí soubor editor_node_group.js");
        }
        if (typeof (saveAs) == 'undefined')
        {
            alert("Chybí soubor editor_file_saver.js");
        }
        if (typeof (JSONfn) == 'undefined')
        {
            alert("Chybí soubor jsonfn.js");
        }
        self.settings = editor_settings;

        // VYTVORENI EDITORU A NAHRANI DAT
        self.typesJson = NodeEditorData.predefinedTypesJson
        var backgroundSvg = NodeEditorUtils.GenerateSVG();
        $("#" + self.settings.elemid).append("<div id='ed_mainContainer'>" + backgroundSvg + "<div id='ed_editor'></div><div id='ed_menu'></div><canvas id='ed_canvas'></canvas></div>");

        canvas = NodeEditorUtils.GetE("ed_canvas");
        container = NodeEditorUtils.GetE(self.settings.elemid);
        editor = NodeEditorUtils.GetE("ed_editor");
        svg = NodeEditorUtils.GetE("ed_svg");
        self.editorOffset = $(container).offset();
        menu = NodeEditorUtils.GetE("ed_menu");
        self.context = canvas.getContext("2d");
        DetectDocumentSizeChange();

        FillMenu(); // NAPLNIT MENU
        PrepareNodeRefreshing(); // PREPOCITAVANI HODNOT UZLU
        PrepareMenu(); // FUNKCE MENU
        PrepareNodeSelecting(); // PRETAHOVANI UZLU
        PrepareGroupSelecting(); // PRETAHOVANI SKUPIN
        PrepareConnectionSelecting(); // VYBIRANI SPOJENI
        PrepareNodeConnecting(); // SPOJOVANI UZLU
        PrepareZoomFunction(); // FUNKCE ZOOM

    }

    this.GetElement = function ()
    {
        if (!editorElement) editorElement = $("#" + self.settings.elemid);
        return editorElement;
    }

    var PrepareNodeSelecting = function ()
    {
        // VYBIRANI A PRETAHOVANI UZLU
        $(document).on('mousedown', '.ed_node .ed_title .ed_nodeButtons', function (event) { event.stopPropagation() });
        $(document).on('mousedown', '.ed_node .ed_title', function (event)
        {
            var selNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            if (!event.ctrlKey && !selNode.selected) ClearSelected();
            AddToSelected(selNode);
        });
        $(document).on('mouseup', '.ed_node .ed_title', function (event)
        {
            var selNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            if (!event.ctrlKey && !mouseDragged) ClearSelected();
            mouseDragged = false;
            AddToSelected(selNode);
            mousePressed = false;
            oldCoords = null;
            selectionRect = null;
            $(container).removeClass("ed_unselectable");
            event.stopPropagation();
        });
        $(document).on('mousemove', '.ed_node .ed_title', function (event)
        {
            if (selectionRect == null)
            {
                if (mousePressed)
                {
                    mouseDragged = true;
                    if (oldCoords)
                    {
                        var diffX = event.pageX - oldCoords[0];
                        var diffY = event.pageY - oldCoords[1];
                        for (var i = 0; i < selectedNodes.length; i++)
                        {
                            selectedNodes[i].Move(diffX, diffY);
                        }
                    }
                    oldCoords = [event.pageX, event.pageY];
                    RedrawConnections();
                }
                event.stopPropagation();
            }
        });
        $(document).on('mousemove', function (event)
        {
            if (mousePressed)
            {
                mouseDragged = true;
                RedrawConnections();
                if (selectionRect != null)
                {
                    DrawRectangle(selectionRect[0], selectionRect[1], event.pageX - $("#" + self.settings.elemid).offset().left - selectionRect[0], event.pageY - $("#" + self.settings.elemid).offset().top - selectionRect[1]);
                    selectionRect[2] = event.pageX - selectionRect[0] - $("#" + self.settings.elemid).offset().left;
                    selectionRect[3] = event.pageY - selectionRect[1] - $("#" + self.settings.elemid).offset().top;
                    SelectNodesInRect();
                    SelectGroupsInRect();
                    SelectConnectionsInRect(event);
                }
                else selectionRect = [event.pageX - $("#" + self.settings.elemid).offset().left, event.pageY - $("#" + self.settings.elemid).offset().top];
            }
        });
        $(document).on('mousedown', function () { mousePressed = true; $(container).addClass("ed_unselectable"); });
        $(document).on('mouseup', function ()
        {
            if (selectionRect == null) ClearSelected();
            oldCoords = null;
            selectionRect = null;
            $(container).removeClass("ed_unselectable");
            mousePressed = false;
        });
    }

    var PrepareGroupSelecting = function ()
    {
        // VYBIRANI A PRETAHOVANI SKUPIN
        $(document).on('mousedown', '.ed_group .ed_title .ed_groupButtons', function (event) { event.stopPropagation() });
        $(document).on('mousedown', '.ed_group .ed_title', function (event)
        {
            var selGroup = NodeEditorUtils.GetGroupByName($(this).parents(".ed_group").attr("data-name"), self.groups);
            if (!event.ctrlKey && !selGroup.selected) ClearSelected();
            AddToSelectedGroups(selGroup);
        });
        $(document).on('mouseup', '.ed_group .ed_title', function (event)
        {
            var selGroup = NodeEditorUtils.GetGroupByName($(this).parents(".ed_group").attr("data-name"), self.groups);
            if (!event.ctrlKey && !mouseDragged) ClearSelected();
            mouseDragged = false;
            AddToSelectedGroups(selGroup);
            mousePressed = false;
            oldCoords = null;
            selectionRect = null;
            $(container).removeClass("ed_unselectable");
            event.stopPropagation();
        });
        $(document).on('mousemove', '.ed_group .ed_title', function (event)
        {
            if (selectionRect == null)
            {
                if (mousePressed)
                {
                    mouseDragged = true;
                    if (oldCoords)
                    {
                        var diffX = event.pageX - oldCoords[0];
                        var diffY = event.pageY - oldCoords[1];
                        for (var i = 0; i < selectedGroups.length; i++)
                        {
                            selectedGroups[i].Move(diffX, diffY);
                        }
                    }
                    oldCoords = [event.pageX, event.pageY];
                    RedrawConnections();
                }
                event.stopPropagation();
            }
        });
    }

    var PrepareConnectionSelecting = function ()
    {
        $(document).on("mousedown", function (event)
        {
            for (var i = 0; i < nodeConnections.length; i++)
            {
                var selected = false;
                for (var j = -5 / self.zoom; j < 5 / self.zoom; j++)
                {
                    if (typeof (Path2D) != "undefined" && self.context.isPointInPath(nodeConnections[i].path, event.pageX - $("#" + self.settings.elemid).offset().left, event.pageY - $("#" + self.settings.elemid).offset().top + j))
                    {
                        nodeConnections[i].selected = true;
                        selected = true;
                    }
                }
                if (!selected && !event.ctrlKey && !mouseDragged) nodeConnections[i].selected = false;
            }
            mouseDragged = false;
            RedrawConnections();
        });

        $(document).keyup(function (event)
        {
            if (event.keyCode == 46)
            {
                for (var i = 0; i < nodeConnections.length; i++)
                {
                    if (nodeConnections[i].selected) { UnregisterNodeConnection(nodeConnections[i].contentItemInput); i--; }
                }
                for (var i = 0; i < nodes.length; i++)
                {
                    if (nodes[i].selected) { DropNode(nodes[i].id); i-- }
                }
                for (var i = 0; i < self.groups.length; i++)
                {
                    if (self.groups[i].selected) { DropGroupNode(self.groups[i].name); }
                }
                RedrawConnections();
            }
        });
    }

    var PrepareNodeConnecting = function ()
    {
        $(document).on('mouseenter', '.ed_connector', function ()
        {
            var el = NodeEditorUtils.GetContentItemById($(this).parents(".ed_connectorContainer").attr("id"), nodes);

            if (elementToConnect)
            {
                elementToConnect2 = el;

                if ((elementToConnect.type == "output" && elementToConnect2.type == "input")
                        ||
                    (elementToConnect.type == "input" && elementToConnect2.type == "output"))
                {
                    $(this).addClass("ed_active");
                }
                else elementToConnect2 = null;

            }
            else $(this).addClass("ed_active");

        });
        $(document).on('mouseleave', '.ed_connector', function ()
        {
            if (!elementToConnect || elementToConnect.id != $(this).parents(".ed_connectorContainer").attr("id")) $(this).removeClass("ed_active");
            elementToConnect2 = null;
        });

        $(document).on('mousedown', '.ed_connector', function ()
        {
            var el = NodeEditorUtils.GetContentItemById($(this).parents(".ed_connectorContainer").attr("id"), nodes);
            if (typeof (el) != "undefined" && (el.connections.length == 0 || el.type == "output"))
            {
                $(container).addClass("ed_unselectable");
                elementToConnect = el;
            }
        });
        $(document).on('mousemove', function (event)
        {
            if (elementToConnect)
            {
                RedrawConnections();
                new Connection(elementToConnect, null, self).DrawTemp(event.pageX, event.pageY);
            }
        });
        $(document).on("mouseup", function (event)
        {
            if (elementToConnect && elementToConnect2)
            {
                RegisterNodeConnection(elementToConnect, elementToConnect2);
            }

            mouseDragged = false;
            $(".ed_connector").removeClass("ed_active");
            RedrawConnections();
            elementToConnect = null;
            $(container).removeClass("ed_unselectable");
        });
    }

    var FillMenu = function ()
    {
        var html = "<div id='ed_menu1'><div class='ed_menuTab'><div class='ed_tabTitle'>Uzel</div><div class='ed_menuItems'>";
        for (var i = 0; i < self.typesJson.nodeType.length; i++)
        {
            html += "<div class='ed_menuItem ed_menuNodeType' data-name='" + self.typesJson.nodeType[i].name + "'>" + self.typesJson.nodeType[i].name + (self.settings.mode == "developer" ? "<div class='ed_deleteNodeType'></div><div class='ed_editNodeType'></div>" : "") + "</div>";
        }
        if (self.settings.mode == "developer") html += "<div class='ed_menuItemCreate' id='ed_menu_createNodeType'>vytvořit...</div>";
        html += "</div></div></div>";

        html += "<div class='ed_menu2'><div class='ed_menuTab'><div class='ed_tabTitle'>Skupina</div>" +
                "<div class='ed_menuItems'>" +
                "<div class='ed_menuItem ed_addGroup'>přidat...<div class='ed_addGroupDialog'><table><tr><td>název:</td><td><input type='text' id='ed_addGroupName'/></td><td><button class='ed_addGroupConfirm'>přidat</button></td></tr></table></div></div>" +
                "</div></div></div>";

        html += "<div id='ed_menu3'><div class='ed_menuTab'><div class='ed_tabTitle'>Soubor</div>" +
                "<div class='ed_menuItems'>" +
                "<div class='ed_menuItem ed_new'>nový...</div>" +
                "<div class='ed_menuItem ed_load'>otevřít...</div>" +
                "<div class='ed_menuItem ed_save'>uložit...</div><input type='file' id='loadFile' style='display:none'/>" +
                "</div></div></div>";

        $(menu).html(html);
    }

    var PrepareMenu = function ()
    {
        PrepareMenuAddNodes(); // první záložka - přidání nového node
        PrepareMenuCreateNodeType(); // první záložky, vytváření nového typu nodu
        PrepareNodeButtons(); // tlačítka na vrchu nodu (smazat, přejmenovat, zrušit, uložit...)
        PrepareMenuFile(); // druhá záložka - menu soubor
        PrepareMenuGroups(); // třetí záložka - menu skupiny
        PrepareGroupButtons(); // tlačítka na vrchu skupiny (smazat, rozbalit)

        $(".ed_tabTitle").click(function ()
        {
            if ($(this).siblings(".ed_menuItems").css("display") == "none") $(this).siblings(".ed_menuItems").slideDown();
            else $(this).siblings(".ed_menuItems").slideUp();
        });
    }

    var PrepareMenuAddNodes = function ()
    {
        $(document).on("mousedown", ".ed_menuNodeType", function (event)
        {
            nodeToAddType = $(this).attr("data-name");
            $(editor).addClass("ed_crosshair");
            menuPressed = true;
            event.stopPropagation();
        });
        $(document).mousemove(function () { menuDragged = menuPressed; $(container).addClass("ed_unselectable"); });

        $(document).mousedown(function (event) // zrušení přidání na pravé tlačítko
        {
            if (event.which == 3)
            {
                nodeToAddType = null;
                $(editor).removeClass("ed_crosshair");
            }
        });
        document.onkeydown = function (evt) // zrušení přidání na stisk esc
        {
            evt = evt || window.event;
            if (evt.which == 27)
            {
                nodeToAddType = null;
                $(editor).removeClass("ed_crosshair");
            }
        };
        $(document).mouseup(function (event)
        {
            if (nodeToAddType)
            {
                var parentOffset = $("#" + self.settings.elemid).offset();
                if (!menuDragged)
                {
                    event.pageX = 200;
                    event.pageY = 100;
                }
                var newNode = new Node("ed_newNode_" + NodeEditorUtils.Guid(10), event.pageX / self.zoom - parentOffset.left, event.pageY / self.zoom - parentOffset.top, 200, NodeEditorUtils.FindTypeByName(nodeToAddType, self.typesJson).color, nodeToAddType, nodeToAddType, self);
                nodes.push(newNode);
                $(editor).append(newNode.GetHtml("display:none"));
                RecountCssByZoom();
                newNode.AnimateIn();
                nodeToAddType = null;
                $(editor).removeClass("ed_crosshair");
            }
            menuPressed = false;
            menuDragged = false;
            $(container).removeClass("ed_unselectable");
        });
    }

    var PrepareMenuCreateNodeType = function ()
    {
        $("#ed_menu_createNodeType").click(function ()
        {
            var newNode = new Node("ed_newNode_createNodeType", 150, 150, 200, NodeEditorUtils.GetRandomColor(), "nový", "createNodeType", self);
            nodes.push(newNode);
            $(editor).append(newNode.GetHtml("display:none"));
            newNode.AnimateIn();
        });
        $(document).on("click", ".ed_addButton", function ()
        {
            $(".ed_addDialog").remove();
            $(".ed_editDialog").remove();
            $(this).parent().append("<div class='ed_addDialog' data-add-type='" + $(this).attr("data-add-type") + "'><table class='ed_table'><tr><td>Název:</td><td><input class='ed_newContentItemName' type='text'></td><tr/><tr><td>Datový&nbsp;typ:</td><td><select class='ed_newContentItemDataType'><option>int</option><option>float</option><option>boolean</option><option>string</option><option>select</option><option>radio</option><option>image</option><option>color</option></select></td><tr/><tr><td><div class='ed_dataTypeValues'>Hodnoty:</div></td><td><div class='ed_dataTypeValues'><input class='edDataTypeValuesInput' type='text' value='1,2,3'/></div></td></tr>" + ($(this).attr("data-add-type") == "output" ? "<tr><td>Funkce:</td><td>function(args){ <textarea class='edFunctionInput'/> }</td></tr> " : "") + "<tr><td><button class='ed_addConfirm'>Přidat</button></td></tr></table></div>");
            $(".ed_addDialog").css("left", $(this).parent().width() + 20).animate({ width: "show" });
        });
        $(document).on("click", ".ed_editContentItemButton", function ()
        {
            $(".ed_addDialog").remove();
            $(".ed_editDialog").remove();
            var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            var editedContentItem = NodeEditorUtils.GetContentItemById($(this).parents(".ed_contentItem").attr("id"), [editedNode]);
            $(this).parent().append("<div class='ed_editDialog' data-add-type='" + editedContentItem.type + "'>" +
                                        "<table class='ed_table'>" +
                                            "<tr><td>Název:</td><td><input class='ed_newContentItemName' type='text' value='" + editedContentItem.name + "'/></td><tr/>" +
                                            "<tr><td>Datový&nbsp;typ:</td><td><select class='ed_newContentItemDataType'><option>int</option><option>float</option><option>boolean</option><option>string</option><option>select</option><option>radio</option><option>image</option><option>color</option></select></td><tr/>" +
                                            "<tr><td><div class='ed_dataTypeValues'>Hodnoty:</div></td><td><div class='ed_dataTypeValues'><input class='edDataTypeValuesInput' type='text' value='1,2,3'/></div></td></tr>" +
                                            (editedContentItem.type == "output" ? "<tr><td>Funkce:</td><td>function(args){ <textarea class='edFunctionInput'>" + editedContentItem.func.toString().replace(/(^.*?\{|\}$)/g, "").trim() + "</textarea> }</td></tr> " : "") +
                                            "<tr><td><button class='ed_editConfirm'>Upravit</button></td></tr>" +
                                        "</table>" +
                                     "</div>");
            $(".ed_newContentItemDataType", ".ed_editDialog").val(editedContentItem.dataType);
            $(".edDataTypeValuesInput", ".ed_editDialog").val(editedContentItem.dataType.substring(editedContentItem.dataType.indexOf("(") + 1, editedContentItem.dataType.indexOf(")")).replace(/ /g, ""));
            $(".ed_editDialog").css("left", $(this).parent().width() + 20).animate({ width: "show" });
        });
        $(document).on("click", ".ed_editDeleteContentItemButton", function ()
        {
            var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            var contentItemToDelete = NodeEditorUtils.GetContentItemById($(this).parents(".ed_contentItem").attr("id"), [editedNode]);
            for (var index in editedNode.contentItems)
            {
                if (editedNode.contentItems[index].id == contentItemToDelete.id) editedNode.contentItems.splice(index, 1);
            }
            contentItemToDelete.GetElement().slideUp(function () { $(this).remove(); })
        });
        $(document).on("change", ".ed_newContentItemDataType", function ()
        {
            if ($(this).val() == "select" || $(this).val() == "radio")
            {
                $(".ed_dataTypeValues").slideDown();
            }
            else
            {
                $(".ed_dataTypeValues").slideUp();
            }
        });
        $(document).on("click", ".ed_addConfirm", function ()
        {
            var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            var existsName = false;
            for (var i = 0; i < editedNode.contentItems.length; i++)
            {
                if (editedNode.contentItems[i].name == NodeEditorUtils.ReplaceUglyChars($(".ed_newContentItemName", ".ed_addDialog").val()))
                {
                    existsName = true;
                    break;
                }
            }
            if ($(".ed_newContentItemName", ".ed_addDialog").val() == "") alert("Doplňte jméno");
            else if (existsName) alert("Zadané jméno už existuje");
            else
            {
                var name = NodeEditorUtils.ReplaceUglyChars($(".ed_newContentItemName", ".ed_addDialog").val());
                var type = $(this).parents(".ed_addDialog").attr("data-add-type");
                var dataType = $(".ed_newContentItemDataType", ".ed_addDialog").val();
                if (dataType == "select" || dataType == "radio") dataType += "(" + $(".edDataTypeValuesInput").val() + ")";
                var itemId = "ed_" + type + "_" + name + "_" + editedNode.id;
                var func = (type == "output" ? eval("(function() { return function(args){" + $(".edFunctionInput").val() + "}})();") : undefined);
                var item = new ContentItem(itemId, name, type, dataType, func, editedNode);
                editedNode.contentItems.push(item);
                $(this).parents(".ed_createNodeTypeContentItem").append(item.GetHtml("display:none"));
                $(".ed_addDialog").animate({ width: "hide" }, function () { $(".ed_addDialog").remove(); });
                $("#" + item.id).slideDown();
            }
        });
        $(document).on("click", ".ed_editConfirm", function ()
        {
            var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            var editedContentItem = NodeEditorUtils.GetContentItemById($(this).parents(".ed_contentItem").attr("id"), [editedNode]);
            var existsName = false;
            var nameChanged = editedContentItem.name != NodeEditorUtils.ReplaceUglyChars($(".ed_newContentItemName", ".ed_editDialog").val());
            if (nameChanged)
            {
                for (var i = 0; i < editedNode.contentItems.length; i++)
                {
                    if (editedNode.contentItems[i].name == NodeEditorUtils.ReplaceUglyChars($(".ed_newContentItemName", ".ed_editDialog").val()))
                    {
                        existsName = true;
                        break;
                    }
                }
            }
            if ($(".ed_newContentItemName", ".ed_addDialog").val() == "") alert("Doplňte jméno");
            else if (existsName) alert("Zadané jméno už existuje");
            else
            {
                var name = NodeEditorUtils.ReplaceUglyChars($(".ed_newContentItemName", ".ed_editDialog").val());
                var type = $(this).parents(".ed_editDialog").attr("data-add-type");
                var dataType = $(".ed_newContentItemDataType", ".ed_editDialog").val();
                if (dataType == "select" || dataType == "radio") dataType += "(" + $(".edDataTypeValuesInput").val() + ")";
                var func = (type == "output" ? eval("(function() { return function(args){" + $(".edFunctionInput").val() + "}})();") : undefined);

                editedContentItem.name = name;
                editedContentItem.type = type;
                editedContentItem.dataType = dataType;
                editedContentItem.func = func;

                $(".ed_contentItemTitleText", editedContentItem.GetElement()).html(name);
                $(".ed_editDialog").animate({ width: "hide" }, function () { $(".ed_editDialog").remove(); });
            }
        });
        $(document).on("mouseup", ".ed_editNodeType", function (event)
        {
            var editedType = NodeEditorUtils.FindTypeByName($(this).parents(".ed_menuNodeType").attr("data-name"), self.typesJson);
            var editedNode = new Node("ed_newNode_createNodeType", 150, 150, 200, editedType.color, editedType.name, "createNodeType", self, editedType.name);
            nodes.push(editedNode);
            $(editor).append(editedNode.GetHtml("display:none"));
            editedNode.AnimateIn();
            event.stopPropagation();
        });
        $(document).on("mousedown", ".ed_editNodeType", function (event) { event.stopPropagation(); });
        $(document).on("mouseup", ".ed_deleteNodeType", function (event)
        {
            DropNodeType($(this).parents(".ed_menuNodeType").attr("data-name"));
            event.stopPropagation();
        });
        $(document).on("mousedown", ".ed_deleteNodeType", function (event) { event.stopPropagation(); });
    }

    var PrepareMenuGroups = function ()
    {
        $(document).on("click", ".ed_addGroup", function (event)
        {
            $("#ed_addGroupName").val("");
            $(".ed_addGroupDialog").css("left", $(this).parent().width() + 10).animate({ width: "show" });
            $("#ed_addGroupName").focus();
        });
        $(document).on("click", ".ed_addGroupConfirm", function (event)
        {
            var name = NodeEditorUtils.ReplaceUglyChars($("#ed_addGroupName").val().trim());
            var groupExists = false;
            for (var index in self.groups)
            {
                if (self.groups[index].name == name)
                {
                    groupExists = true;
                    break;
                }
            }
            if (name.length == 0) alert("Doplňte jméno skupiny.");
            else if (groupExists) alert("Název skupiny už existuje.")
            else
            {
                self.groups.push(new Group(name, self));
                for (var index in nodes)
                {
                    nodes[index].UpdateGroup();
                }
                $(".ed_addGroup").before("<div style='display:none' class='ed_menuItem ed_menuGroup' data-name='" + name + "'>" + name + "<div class='ed_groupDelete'></div><div class='ed_groupMinimize'></div><div class='ed_groupSet'></div></div>");
                $(".ed_menuGroup").slideDown();
                $(".ed_addGroupDialog").animate({ width: 0 }, function () { $(".ed_addGroupDialog").hide().css("width", "auto") });
            }
            event.stopPropagation();
        });
        $(document).on("click", ".ed_menuGroup", function (event)
        {
            if (!event.ctrlKey)
            {
                for (var index in self.groups)
                {
                    self.groups[index].UnselectNodes();
                }
                selectedNodes = [];
            }
            var selectedGroup = NodeEditorUtils.GetGroupByName($(this).attr("data-name"), self.groups);
            if (selectedGroup.minimized)
            {
                AddToSelectedGroups(selectedGroup);
            }
            else
            {
                for (var index in selectedGroup.nodes) AddToSelected(selectedGroup.nodes[index]);
            }
            event.stopPropagation();
        });
        $(document).on("click", ".ed_groupMinimize", function (event)
        {
            var groupToMinimize = NodeEditorUtils.GetGroupByName($(this).parents(".ed_menuGroup").attr("data-name"), self.groups);
            groupToMinimize.Minimize(function () { RedrawConnections(); });
            ClearSelected();
            RedrawConnections();
            $(this).removeClass("ed_groupMinimize").addClass("ed_groupMaximize");
            event.stopPropagation();
        });
        $(document).on("click", ".ed_groupMaximize", function ()
        {
            NodeEditorUtils.GetGroupByName($(this).parents(".ed_menuGroup").attr("data-name"), self.groups).Maximize(function () { RedrawConnections(); });
            $(this).removeClass("ed_groupMaximize").addClass("ed_groupMinimize");
        });
        $(document).on("click", ".ed_groupDelete", function ()
        {
            DropGroup($(this).parents(".ed_menuGroup").attr("data-name"));
        });
        $(document).on("mousedown", ".ed_groupSet", function (event)
        {
            var groupToAdd = NodeEditorUtils.GetGroupByName($(this).parents(".ed_menuGroup").attr("data-name"), self.groups);
            for (var i = 0; i < selectedNodes.length; i++)
            {
                selectedNodes[i].AddGroup(groupToAdd);
                selectedNodes[i].UpdateGroup();
            }
            event.stopPropagation();
        });
    }

    var PrepareGroupButtons = function ()
    {
        $(document).on("click", ".ed_maximizeGroup", function ()
        {
            var groupToMaximize = NodeEditorUtils.GetGroupByName($(this).parents(".ed_group").attr("data-name"), self.groups);
            groupToMaximize.Maximize(function () { RedrawConnections(); });
            $(".ed_groupMaximize", ".ed_menuGroup[data-name='" + groupToMaximize.name + "']").removeClass("ed_groupMaximize").addClass("ed_groupMinimize");
        });
        $(document).on("click", ".ed_deleteGroup", function ()
        {
            DropGroupNode($(this).parents(".ed_group").attr("data-name"));
        });
    }

    var PrepareNodeButtons = function ()
    {
        $(document).on("click", ".ed_saveNodeType", function ()
        {
            var newCustomNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);

            var inputItems = [];
            var contentItems = [];
            var outputItems = [];

            if (!newCustomNode.editedTypeName || newCustomNode.editedTypeName != newCustomNode.title)
            {
                for (var index in self.typesJson.nodeType)
                {
                    if (newCustomNode.title == self.typesJson.nodeType[index].name)
                    {
                        alert("Typ se zadaným jménem už existuje.");
                        return;
                    }
                }
            }

            for (var i = 0; i < newCustomNode.contentItems.length; i++)
            {
                if (newCustomNode.contentItems[i].type == "input") inputItems.push({ name: newCustomNode.contentItems[i].name, dataType: newCustomNode.contentItems[i].dataType });
                else if (newCustomNode.contentItems[i].type == "content") contentItems.push({ name: newCustomNode.contentItems[i].name, dataType: newCustomNode.contentItems[i].dataType });
                else if (newCustomNode.contentItems[i].type == "output") outputItems.push({ name: newCustomNode.contentItems[i].name, dataType: newCustomNode.contentItems[i].dataType, func: newCustomNode.contentItems[i].func });
            }

            if (!newCustomNode.editedTypeName)
            {
                self.typesJson.nodeType.push(
                {
                    name: newCustomNode.title,
                    color: newCustomNode.color,
                    inputItem: inputItems,
                    contentItem: contentItems,
                    outputItem: outputItems
                });
                $("#ed_menu_createNodeType").before("<div style='display: none' class='ed_menuItem ed_menuNodeType' data-name='" + newCustomNode.title + "'>" + newCustomNode.title + "<div class='ed_deleteNodeType'></div><div class='ed_editNodeType'></div></div>");
                $(".ed_menuItem").slideDown();
            }
            else
            {
                for (var index in self.typesJson.nodeType)
                {
                    if (self.typesJson.nodeType[index].name == newCustomNode.editedTypeName)
                    {
                        self.typesJson.nodeType[index].name = newCustomNode.title,
                        self.typesJson.nodeType[index].color = newCustomNode.color,
                        self.typesJson.nodeType[index].inputItem = inputItems,
                        self.typesJson.nodeType[index].contentItem = contentItems,
                        self.typesJson.nodeType[index].outputItem = outputItems
                        break;
                    }
                }
                RedrawMenuTypes();
            }
            DropNode(newCustomNode.id);
        });
        $(document).on("click", ".ed_cancelNodeType", function ()
        {
            DropNode($(this).parents(".ed_node").attr("id"));
        });
        $(document).on("click", ".ed_renameNode", function ()
        {
            parentNode = $(this).parents(".ed_node");
            var name = $(".ed_nodeTitleText", parentNode).html();
            $(".ed_nodeTitleText", parentNode).remove();
            $(".ed_title", parentNode).append("<input type='text' class='ed_renameNodeText' value='" + name + "'/>");
            $(".ed_renameNodeText", parentNode).focus().select();
        });
        $(document).on("focusout", ".ed_renameNodeText", function ()
        {
            if ($(this).val().trim().length > 0)
            {
                var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
                editedNode.title = NodeEditorUtils.ReplaceUglyChars($(this).val());
                $(".ed_nodeTitleText", $(this).parents(".ed_title")).remove();
                $(this).parents(".ed_title").append("<span class='ed_nodeTitleText'>" + editedNode.title + "</span>");
                try { $(this).remove(); } catch (err) { }
            }
        });
        $(document).on("keyup", ".ed_renameNodeText", function (e)
        {
            if (e.which == 13)
            {
                var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
                editedNode.title = NodeEditorUtils.ReplaceUglyChars($(this).val());
                $(".ed_nodeTitleText", $(this).parents(".ed_title")).remove();
                $(this).parents(".ed_title").append("<span class='ed_nodeTitleText'>" + editedNode.title + "</span>");
                try { $(this).remove(); } catch (err) { }
            }
            e.stopPropagation();
        });
        $(document).on("click", ".ed_deleteNode", function (event)
        {
            var nodeToDelete = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            DropNode(nodeToDelete.id);
        });
        $(document).on("change", ".ed_selectGroupInput", function ()
        {
            var editedNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            var groupToAdd = NodeEditorUtils.GetGroupByName($(this).val(), self.groups);
            editedNode.AddGroup(groupToAdd);
        });
    }

    var DropNode = function (id)
    {
        var nodeToDrop = NodeEditorUtils.GetNodeById(id, nodes);
        nodeToDrop.Unselect();

        $(nodeToDrop.contentItems).each(function ()
        {
            if (this.type == "input") UnregisterNodeConnection(this);
            else
            {
                while (this.connections.length > 0)
                {
                    UnregisterNodeConnection(this.connections[0].contentItemInput);
                }
            }
        });
        nodeToDrop.AnimateOut(function () { $("#" + id).remove() });

        for (var i = 0; i < nodes.length; i++)
        {
            if (nodes[i].id == id)
            {
                nodes.splice(i, 1);
            }
        }
        RedrawConnections();
    }

    var DropGroupNode = function (name)
    {
        var groupToDrop = NodeEditorUtils.GetGroupByName(name, self.groups);
        if (groupToDrop.nodes.length > 0 && confirm("Tato akce smaže všechny uzly ve skupině (" + groupToDrop.nodes.length + ")! Pokračovat?"))
        {
            for (var index in groupToDrop.nodes)
            {
                DropNode(groupToDrop.nodes[index].id);
            }
            groupToDrop.AnimateOut(function () { groupToDrop.GetElement().remove(); });
        }
    }

    var DropGroup = function (name)
    {
        var groupToDrop = NodeEditorUtils.GetGroupByName(name, self.groups);
        if (groupToDrop.nodes.length == 0 || confirm("Tato akce smaže všechny uzly ve skupině (" + groupToDrop.nodes.length + ")! Pokračovat?"))
        {
            for (var index in groupToDrop.nodes)
            {
                DropNode(groupToDrop.nodes[index].id);
            }
            for (var index in self.groups)
            {
                if (self.groups[index].name == name) self.groups.splice(index, 1);
            }
            for (var index in nodes)
            {
                nodes[index].UpdateGroup();
            }
            groupToDrop.AnimateOut(function () { groupToDrop.GetElement().remove(); });
            $(".ed_menuGroup[data-name='" + name + "']").slideUp(function () { $(this).remove(); });
        }
    }

    var DropNodeType = function (name)
    {
        var nodesToDelete = []
        for (var index in nodes)
        {
            if (!!nodes[index].type && nodes[index].type.name == name) { nodesToDelete.push(nodes[index]); }
        }
        var msg = "Opravdu chcete smazat typ '" + name + "'?";
        if (nodesToDelete.length > 0) msg += " Touto akcí dojde ke smazání všech uzlů tohoto typu (" + nodesToDelete.length + ")";
        if (confirm(msg))
        {
            for (var index in nodesToDelete)
            {
                DropNode(nodesToDelete[index].id);
            }
            for (var index in self.typesJson.nodeType)
            {
                if (self.typesJson.nodeType[index].name == name)
                {
                    self.typesJson.nodeType.splice(index, 1);
                }
            }
            $(".ed_menuNodeType[data-name='" + name + "']").slideUp(function () { $(this).remove(); });
        }
    }

    var PrepareMenuFile = function ()
    {
        $("#loadFile").change(function (event)
        {
            var file = event.target.files[0];

            var r = new FileReader();
            var ret = "";
            r.onload = function (e)
            {
                var json = JSONfn.parse(e.target.result);
                self.typesJson = json.types;
                for (var i = 0; i < json.groups.length; i++)
                {
                    var newGroup = NodeEditorUtils.GetGroupByName(json.groups[i].name, self.groups);
                    if (!newGroup)
                    {
                        newGroup = new Group(json.groups[i].name, self);
                        self.groups.push(newGroup);
                        $(".ed_addGroup").before("<div class='ed_menuItem ed_menuGroup' data-name='" + newGroup.name + "'>" + newGroup.name + "<div class='ed_groupDelete'></div><div class='" + (json.groups[i].minimized ? "ed_groupMaximize" : "ed_groupMinimize") + "'></div><div class='ed_groupSet'></div></div>");
                    }
                    newGroup.minimized = json.groups[i].minimized;
                }
                for (var i = 0; i < json.nodes.length; i++)
                {
                    var newNode = new Node(json.nodes[i].id, json.nodes[i].positionX, json.nodes[i].positionY, json.nodes[i].zindex, json.nodes[i].color, json.nodes[i].title, json.nodes[i].type, self);
                    newNode.SetValues(json.nodes[i].values);
                    if (!!json.nodes[i].groupname)
                    {
                        newNode.AddGroup(NodeEditorUtils.GetGroupByName(json.nodes[i].groupname, self.groups));
                    }
                    nodes.push(newNode);
                }

                RedrawMenuTypes();
                RedrawNodes(true, function ()
                {
                    for (var i = 0; i < json.connections.length; i++)
                    {
                        RegisterNodeConnection(NodeEditorUtils.GetContentItemById(json.connections[i].outputItemId, nodes), NodeEditorUtils.GetContentItemById(json.connections[i].inputItemId, nodes), self);
                    }
                    RedrawConnections();
                });
            }
            r.readAsText(file);

        });
        $("#ed_menu3").on("click", ".ed_menuItem", function ()
        {
            if ($(this).hasClass("ed_load"))
            {
                $("#loadFile").click();
            }
            else if ($(this).hasClass("ed_new"))
            {
                if (confirm("Neuložené změny budou ztraceny. Pokračovat?"))
                {
                    self.typesJson = NodeEditorData.predefinedTypesJson;
                    nodes = [];
                    nodeConnections = [];
                    RedrawMenuTypes();
                    RedrawNodes(true, function () { RedrawConnections(); });
                }
            }
            else if ($(this).hasClass("ed_save"))
            {
                var nodesToSave = [];
                for (var i = 0; i < nodes.length; i++)
                {
                    if (!!nodes[i].type) nodesToSave.push({ id: nodes[i].id, positionX: nodes[i].positionX, positionY: nodes[i].positionY, zindex: nodes[i].zindex, color: nodes[i].color, title: nodes[i].title, type: nodes[i].type.name, values: nodes[i].GetValuesToSave(), groupname: (!nodes[i].group ? null : nodes[i].group.name) });
                }

                var connectionsToSave = [];
                for (var i = 0; i < nodeConnections.length; i++)
                {
                    connectionsToSave.push({ outputItemId: nodeConnections[i].contentItemOutput.id, inputItemId: nodeConnections[i].contentItemInput.id });
                }

                var groupsToSave = [];
                for (var i = 0; i < self.groups.length; i++)
                {
                    groupsToSave.push({ name: self.groups[i].name, minimized: self.groups[i].minimized })
                }

                var jsonToSave = JSONfn.stringify({ nodes: nodesToSave, connections: connectionsToSave, types: self.typesJson, groups: groupsToSave });

                var blob = new Blob([jsonToSave], { type: "text/plain;charset=utf-8" });
                saveAs(blob, "myConfig.json");
            }
        });
    }

    var PrepareNodeRefreshing = function ()
    {
        $(document).on("mouseup keyup", ".ed_node", function ()
        {
            NodeEditorUtils.GetNodeById($(this).attr("id"), nodes).RefreshValues();
            RedrawConnections();
        });
        $(document).on("change", ".ed_contentItemInput", function ()
        {
            NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes).RefreshValues();
            RedrawConnections();
        });
        $(document).on("colorChanged", ".ed_colorpicker", function ()
        {
            NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes).RefreshValues();
            RedrawConnections();
        });
        $(document).on("colorChanged", ".ed_colorpicker2", function ()
        {
            
            var creationNode = NodeEditorUtils.GetNodeById($(this).parents(".ed_node").attr("id"), nodes);
            creationNode.color = $(".ed_colorpicker2").val();
            $("#ed_newNode_createNodeType").css("background-color", creationNode.color);
            RedrawConnections();
        });
    }

    var PrepareZoomFunction = function ()
    {
        //Firefox
        $("#" + self.settings.elemid).bind('DOMMouseScroll', function (e)
        {
            if (e.originalEvent.detail > 0)
            {
                if (self.zoom < 1) self.zoom += 0.1;
            }
            else
            {
                if (self.zoom > 0.5) self.zoom -= 0.1;
            }
            RecountCssByZoom();
            RedrawConnections();
            return false;
        });

        //IE, Opera, Safari
        $("#" + self.settings.elemid).bind('mousewheel', function (e)
        {
            if (e.originalEvent.wheelDelta < 0)
            {
                if (self.zoom < 1) self.zoom += 0.1;
            }
            else
            {
                if (self.zoom > 0.5) self.zoom -= 0.1;
            }
            RecountCssByZoom();
            RedrawConnections();
            return false;
        });
    }



    var RegisterNodeConnection = function (outputItem, inputItem)
    {
        if (outputItem.type == "input")
        {
            inputItem = [outputItem, outputItem = inputItem][0];
        }
        for (var i = 0; i < nodeConnections.length; i++)
        {
            if (nodeConnections[i].contentItemOutput.id == outputItem.id && nodeConnections[i].contentItemInput.id == inputItem.id) return;
        }
        // kontrola datovéhp typu
        if (!ControlDataType(inputItem, outputItem))
        {
            alert("Nelze připojit výstup typu \"" + outputItem.dataType + "\" na vstup typu \"" + inputItem.dataType + "\"");
            return;
        }
        // detekce cyklu
        if (!ControlCyclicConnection(inputItem, outputItem, inputItem))
        {
            alert("Detekován cyklus!");
            return;
        }
        var newConnection = new Connection(outputItem, inputItem, self)
        inputItem.Connect(newConnection);
        outputItem.Connect(newConnection);
        nodeConnections.push(newConnection);
    }

    var ControlCyclicConnection = function (inputItem, outputItem, actualItem)
    {
        if (actualItem != null)
        {
            for (var i = 0; i < actualItem.owner.contentItems.length; i++)
            {
                if (actualItem.owner.contentItems[i].type == "output")
                {
                    if (actualItem.owner.contentItems[i].id == outputItem.id) { return false; }
                    for (var j = 0; j < actualItem.owner.contentItems[i].connections.length; j++)
                    {
                        if (actualItem.owner.contentItems[i].connections[j].contentItemOutput.id == outputItem.id) return false;
                        else if (!ControlCyclicConnection(inputItem, outputItem, actualItem.owner.contentItems[i].connections[j].contentItemInput)) return false;
                    }
                }
            }
        }
        return true;
    }

    var ControlDataType = function (inputItem, outputItem)
    {
        if ((inputItem.dataType == "int" && (outputItem.dataType == "int" || outputItem.dataType == "boolean")) ||
           (inputItem.dataType == "float" && (outputItem.datatype == "float" || outputItem.dataType == "int" || outputItem.dataType == "boolean")) ||
           (inputItem.datatype == "boolean" && outputItem.dataType == "boolean") ||
           (inputItem.dataType == "string") ||
           (inputItem.dataType == "image" && outputItem.dataType == "image") ||
           (inputItem.dataType == "color" && outputItem.dataType == "color")) return true;
        else return false;
    }

    var UnregisterNodeConnection = function (inputItem)
    {
        for (var i = 0; i < nodeConnections.length; i++)
        {
            if (nodeConnections[i].contentItemInput.id == inputItem.id)
            {
                var outputItem = NodeEditorUtils.GetContentItemById(nodeConnections[i].contentItemOutput.id, nodes);
                inputItem.Disconnect(outputItem);
                outputItem.Disconnect(inputItem);
                nodeConnections.splice(i, 1);
                return;
            }
        }
    }

    var RedrawConnections = function ()
    {
        ClearCanvas();

        for (var i = 0; i < nodeConnections.length; i++)
        {
            nodeConnections[i].Draw();
        }
    }
    var RedrawNodes = function (animate, callback)
    {
        $(".ed_node").remove();
        for (var i = 0; i < nodes.length; i++)
        {
            $(editor).append(nodes[i].GetHtml("display:none"));
            if (animate) nodes[i].AnimateIn(i == nodes.length - 1 ? callback : null);
        }
        if ((!animate || nodes.length == 0) && typeof (callback) == "function") callback();
    }
    var RedrawMenuTypes = function ()
    {
        $(".ed_menuNodeType").remove();
        for (var i = 0; i < self.typesJson.nodeType.length; i++)
        {
            $("#ed_menu_createNodeType").before("<div class='ed_menuItem ed_menuNodeType' data-name='" + self.typesJson.nodeType[i].name + "'>" + self.typesJson.nodeType[i].name + "<div class='ed_deleteNodeType'></div><div class='ed_editNodeType'></div></div>");
        }
    }
    var FitCanvasOnScreen = function ()
    {
        var width = $(document).width() - 20;
        var height = $(document).height() - $(canvas).offset().top - 20;
        $(canvas).css("heigth", height + "px");
        $(canvas).css("width", width + "px");
        $(canvas).attr("width", width);
        $(canvas).attr("height", height);
        $(editor).css("height", (height / self.zoom) + "px");
        $(editor).css("width", (width / self.zoom) + "px");
        $(svg).attr("width", width);
        $(svg).attr("height", height);
    }

    var ClearCanvas = function ()
    {
        self.context.clearRect(0, 0, $(canvas).width(), $(canvas).height());
    }

    var ClearSelected = function ()
    {
        for (var i = 0; i < selectedNodes.length; i++)
        {
            selectedNodes[i].Unselect();
        }
        for (var i = 0; i < selectedGroups.length; i++)
        {
            selectedGroups[i].Unselect();
        }
        selectedNodes = [];
        selectedGroups = [];
    }

    var AddToSelected = function (nodeToAdd)
    {
        for (var i = 0; i < selectedNodes.length; i++)
        {
            if (selectedNodes[i].id == nodeToAdd.id) return;
        }
        selectedNodes.push(nodeToAdd);
        nodeToAdd.Select();
    }

    var AddToSelectedGroups = function (groupToAdd)
    {
        for (var i = 0; i < selectedGroups.length; i++)
        {
            if (selectedGroups[i].name == groupToAdd.name) return;
        }
        selectedGroups.push(groupToAdd);
        groupToAdd.Select();
    }

    var RemoveFromSelected = function (nodeToRemove)
    {
        for (var i = 0; i < selectedNodes.length; i++)
        {
            nodeToRemove.Unselect();
            if (selectedNodes[i].id == nodeToRemove.id)
            {
                selectedNodes.splice(i, 1);
            }
        }
    }

    var RemoveFromSelectedGroups = function (groupToRemove)
    {
        for (var i = 0; i < selectedGroups.length; i++)
        {
            groupToRemove.Unselect();
            if (selectedGroups[i].name == groupToRemove.name)
            {
                selectedGroups.splice(i, 1);
            }
        }
    }

    var DrawRectangle = function (x, y, width, height)
    {
        self.context.beginPath();
        self.context.lineWidth = "2";
        self.context.strokeStyle = "blue";
        self.context.rect(x, y, width, height);
        self.context.stroke();
    }

    var SelectNodesInRect = function ()
    {
        for (var i = 0; i < nodes.length; i++)
        {
            if (!nodes[i].group || !nodes[i].group.minimized)
            {
                var element = nodes[i].GetElement();
                var left1 = $(element).offset().left;
                var right1 = $(element).offset().left + $(element).width();
                var top1 = $(element).offset().top - $("#" + self.settings.elemid).offset().top;
                var bottom1 = $(element).offset().top + $(element).height() - $("#" + self.settings.elemid).offset().top;
                var left2 = (selectionRect[2] > 0 ? selectionRect[0] : selectionRect[0] + selectionRect[2]);
                var right2 = (selectionRect[2] > 0 ? selectionRect[0] + selectionRect[2] : selectionRect[0]);
                var top2 = (selectionRect[3] > 0 ? selectionRect[1] : selectionRect[1] + selectionRect[3]);
                var bottom2 = (selectionRect[3] > 0 ? selectionRect[1] + selectionRect[3] : selectionRect[1]);

                if (!(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2)) AddToSelected(nodes[i]);
                else RemoveFromSelected(nodes[i]);
            }
        }
    }

    var SelectGroupsInRect = function ()
    {
        for (var i = 0; i < self.groups.length; i++)
        {
            if (self.groups[i].minimized && self.groups[i].GetElement().size > 0)
            {
                var element = self.groups[i].GetElement();
                var left1 = $(element).offset().left;
                var right1 = $(element).offset().left + $(element).width();
                var top1 = $(element).offset().top - $("#" + self.settings.elemid).offset().top; ;
                var bottom1 = $(element).offset().top + $(element).height() - $("#" + self.settings.elemid).offset().top; ;
                var left2 = (selectionRect[2] > 0 ? selectionRect[0] : selectionRect[0] + selectionRect[2]);
                var right2 = (selectionRect[2] > 0 ? selectionRect[0] + selectionRect[2] : selectionRect[0]);
                var top2 = (selectionRect[3] > 0 ? selectionRect[1] : selectionRect[1] + selectionRect[3]);
                var bottom2 = (selectionRect[3] > 0 ? selectionRect[1] + selectionRect[3] : selectionRect[1]);

                if (!(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2)) AddToSelectedGroups(self.groups[i]);
                else RemoveFromSelectedGroups(self.groups[i]);
            }
        }
    }

    var SelectConnectionsInRect = function (event)
    {
        for (var i = 0; i < nodeConnections.length; i++)
        {
            var left = (selectionRect[2] > 0 ? selectionRect[0] : selectionRect[0] + selectionRect[2]);
            var right = (selectionRect[2] > 0 ? selectionRect[0] + selectionRect[2] : selectionRect[0]);
            var top = (selectionRect[3] > 0 ? selectionRect[1] : selectionRect[1] + selectionRect[3]);
            var bottom = (selectionRect[3] > 0 ? selectionRect[1] + selectionRect[3] : selectionRect[1]);
            var selected = false;

            for (var index in nodeConnections[i].pointsOnCurve)
            {
                var point1 = nodeConnections[i].pointsOnCurve[index];
                if (point1.x > left && point1.x < right && point1.y > top && point1.y < bottom) selected = true;
            }
            if (selected) nodeConnections[i].selected = true;
            else nodeConnections[i].selected = false;
        }
    }

    var RecountCssByZoom = function ()
    {
        $(canvas).css("background-size", (20 * self.zoom) + "px");
        $(editor).css("transform", "scale(" + self.zoom + ")");
    }



    var DetectDocumentSizeChange = function ()
    {
        if ($(document).width() != origDocWidth || $(document).height() != origDocHeight || $(window).width() != origWinWidth || $(window).height() != origWinHeight)
        {
            FitCanvasOnScreen();
            origDocWidth = $(document).width();
            origDocHeight = $(document).height();
            origWinWidth = $(window).width();
            origWinHeight = $(window).height();
            RedrawConnections();
        }
        window.setTimeout(function () { DetectDocumentSizeChange(); }, 500);
    }

    this.PrepExperiment = function (count)
    {


        var newGroup = new Group("a", self);
        self.groups.push(newGroup);
        $(".ed_addGroup").before("<div class='ed_menuItem ed_menuGroup' data-name='" + newGroup.name + "'>" + newGroup.name + "<div class='ed_groupDelete'></div><div class='ed_groupMinimize'></div><div class='ed_groupSet'></div></div>");
        var newGroup = new Group("b", self);
        self.groups.push(newGroup);
        $(".ed_addGroup").before("<div class='ed_menuItem ed_menuGroup' data-name='" + newGroup.name + "'>" + newGroup.name + "<div class='ed_groupDelete'></div><div class='ed_groupMinimize'></div><div class='ed_groupSet'></div></div>");

        for (var i = 0; i < count; i++)
        {
            var guid = NodeEditorUtils.Guid(10);
            var newNode;
            if (i == 0) newNode = new Node(guid, Math.random() * 1000, Math.random() * 800, 200, NodeEditorUtils.GetRandomColor(), guid, "test_2", self);
            else newNode = new Node(guid, Math.random() * 1000, Math.random() * 800, 200, NodeEditorUtils.GetRandomColor(), guid, "test_1", self);
            if (Math.random() > 0.5) newNode.AddGroup(NodeEditorUtils.GetGroupByName("a", self.groups));
            else newNode.AddGroup(NodeEditorUtils.GetGroupByName("b", self.groups));
            nodes.push(newNode);
        }

        RedrawMenuTypes();
        RedrawNodes(true, function ()
        {
            for (var i = 1; i < nodes.length; i++)
            {
                RegisterNodeConnection(NodeEditorUtils.GetContentItemById("ed_output_vystup_1_" + nodes[i - 1].id + "_0", nodes), NodeEditorUtils.GetContentItemById("ed_input_vstup_1_" + nodes[i].id + "_0", nodes));
            }
            RedrawConnections();
        });

        //        for (var i = 0; i < json.connections.length; i++)
        //        {
        //            RegisterNodeConnection(NodeEditorUtils.GetContentItemById(json.connections[i].outputItemId, nodes), NodeEditorUtils.GetContentItemById(json.connections[i].inputItemId, nodes), self);
        //        }
    }

    this.Experiment = function (count)
    {
        var t1 = new Date().getTime();
        for (var i = 0; i < count; i++)
        {
            RedrawConnections();
        }
        var t2 = new Date().getTime();
        $("#debugLog").append("<br/>experiment time: " + (t2 - t1) + "</br>1 cycle average: " + (t2 - t1) / count);
    }

    this.DebugAction = function ()
    {
        console.log(nodeConnections);
    }
}