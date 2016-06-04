var Connection = function (contentItemOutput, contentItemInput, owner)
{
    this.contentItemOutput = contentItemOutput;
    this.contentItemInput = contentItemInput;
    this.path;
    this.owner = owner;
    this.selected;

    this.startPoint;
    this.endPoint;
    this.controlPoint1;
    this.controlPoint2;

    this.pointsOnCurve = [];

    var self = this;

    this.Draw = function ()
    {
        if (!!contentItemOutput.owner.group && !!contentItemInput.owner.group && contentItemOutput.owner.group.minimized && contentItemInput.owner.group.name == contentItemOutput.owner.group.name)
        {
            return;
        }
        owner.context.lineWidth = 2;
        if (self.selected) owner.context.strokeStyle = "red";
        else owner.context.strokeStyle = "black";

        var outputObject;
        var inputObject;

        if (!!contentItemOutput.owner.group && contentItemOutput.owner.group.minimized) { outputObject = contentItemOutput.owner.group.contentItems[contentItemOutput.owner.id]; }
        else outputObject = contentItemOutput;
        if (!!contentItemInput.owner.group && contentItemInput.owner.group.minimized) { inputObject = contentItemInput.owner.group.contentItems[contentItemInput.owner.id]; }
        else inputObject = contentItemInput;


        var left1 = outputObject.owner.GetElement().offset().left;
        var right1 = outputObject.owner.GetElement().offset().left + (outputObject.owner.GetElement().width() * owner.zoom);
        var left2 = inputObject.owner.GetElement().offset().left;
        var right2 = inputObject.owner.GetElement().offset().left + (inputObject.owner.GetElement().width() * owner.zoom);

        var conR;
        var conL;

        if (right1 < left2 || right2 < left1)
        {
            if (right2 < left1)
            {
                conL = $(".ed_connectorRight", "#" + inputObject.id).show();
                conR = $(".ed_connectorLeft", "#" + outputObject.id).show();
                $(".ed_connectorLeft", "#" + inputObject.id).hide();
                $(".ed_connectorRight", "#" + outputObject.id).hide();

            }
            else
            {
                conL = $(".ed_connectorRight", "#" + outputObject.id).show();
                conR = $(".ed_connectorLeft", "#" + inputObject.id).show();
                $(".ed_connectorRight", "#" + inputObject.id).hide();
                $(".ed_connectorLeft", "#" + outputObject.id).hide();
            }

            self.path = SetPointsNormal(
            conL.offset().left - $("#" + owner.settings.elemid).offset().left,
            conL.offset().top - $("#" + owner.settings.elemid).offset().top + ((conL.height() / 2) * owner.zoom),
            conR.offset().left - $("#" + owner.settings.elemid).offset().left,
            conR.offset().top - $("#" + owner.settings.elemid).offset().top + ((conR.height() / 2) * owner.zoom)
            )
        }
        else
        {
            if (((left1 + right1) / 2) > ((left2 + right2) / 2))
            {
                conL = $(".ed_connectorLeft", "#" + inputObject.id).show();
                conR = $(".ed_connectorLeft", "#" + outputObject.id).show();
                $(".ed_connectorRight", "#" + inputObject.id).hide();
                $(".ed_connectorRight", "#" + outputObject.id).hide();

                self.path = SetPointsLeft(
                conL.offset().left - $("#" + owner.settings.elemid).offset().left,
                conL.offset().top - $("#" + owner.settings.elemid).offset().top + ((conL.height() / 2) * owner.zoom),
                conR.offset().left - $("#" + owner.settings.elemid).offset().left,
                conR.offset().top - $("#" + owner.settings.elemid).offset().top + ((conR.height() / 2) * owner.zoom)
                )
            }
            else
            {
                conL = $(".ed_connectorRight", "#" + inputObject.id).show();
                conR = $(".ed_connectorRight", "#" + outputObject.id).show();
                $(".ed_connectorLeft", "#" + inputObject.id).hide();
                $(".ed_connectorLeft", "#" + outputObject.id).hide();

                self.path = SetPointsRight(
                conL.offset().left - $("#" + owner.settings.elemid).offset().left,
                conL.offset().top - $("#" + owner.settings.elemid).offset().top + ((conL.height() / 2) * owner.zoom),
                conR.offset().left - $("#" + owner.settings.elemid).offset().left,
                conR.offset().top - $("#" + owner.settings.elemid).offset().top + ((conR.height() / 2) * owner.zoom)
                )
            }
        }

        DrawBezier();

        $(".ed_connector", "#" + outputObject.id).addClass("ed_connected");
        $(".ed_connector", "#" + inputObject.id).addClass("ed_connected");
    }

    this.DrawTemp = function (mouseX, mouseY)
    {
        owner.context.lineWidth = 2;
        owner.context.strokeStyle = "blue";

        var outputElem = $("#" + contentItemOutput.id);
        var left1 = outputElem.offset().left;
        var right1 = outputElem.offset().left + (outputElem.width() * owner.zoom);

        if (right1 < mouseX || mouseX < left1)
        {
            var conR;
            var conL;

            if (mouseX < left1)
            {
                conR = $(".ed_connectorLeft", outputElem);
                SetPointsNormal(
                    conR.offset().left - $("#" + owner.settings.elemid).offset().left,
                    conR.offset().top - $("#" + owner.settings.elemid).offset().top + ((conR.height() / 2) * owner.zoom),
                    mouseX - $("#" + owner.settings.elemid).offset().left,
                    mouseY - $("#" + owner.settings.elemid).offset().top
                );
            }
            else
            {
                conL = $(".ed_connectorRight", outputElem);
                SetPointsNormal(
                    mouseX - $("#" + owner.settings.elemid).offset().left,
                    mouseY - $("#" + owner.settings.elemid).offset().top,
                    conL.offset().left - $("#" + owner.settings.elemid).offset().left,
                    conL.offset().top - $("#" + owner.settings.elemid).offset().top + ((conL.height() / 2) * owner.zoom)
                );
            }
        }
        else
        {
            if (((left1 + right1) / 2) < mouseX)
            {
                conR = $(".ed_connectorRight", outputElem);

                SetPointsRight(
                conR.offset().left - $("#" + owner.settings.elemid).offset().left,
                conR.offset().top - $("#" + owner.settings.elemid).offset().top + ((conR.height() / 2) * owner.zoom),
                mouseX - $("#" + owner.settings.elemid).offset().left,
                mouseY - $("#" + owner.settings.elemid).offset().top
                )
            }
            else
            {
                conL = $(".ed_connectorLeft", outputElem);

                SetPointsLeft(
                conL.offset().left - $("#" + owner.settings.elemid).offset().left,
                conL.offset().top - $("#" + owner.settings.elemid).offset().top + ((conL.height() / 2) * owner.zoom),
                mouseX - $("#" + owner.settings.elemid).offset().left,
                mouseY - $("#" + owner.settings.elemid).offset().top
                )
            }
        }

        DrawBezier();
    }

    var SetPointsNormal = function (startX, startY, endX, endY)
    {
        self.startPoint = { x: startX, y: startY };
        self.endPoint = { x: endX, y: endY };
        self.controlPoint1 = { x: ((endX - startX) / 2) + startX, y: startY };
        self.controlPoint2 = { x: ((endX - startX) / 2) + startX, y: endY };
    }

    var SetPointsRight = function (startX, startY, endX, endY)
    {
        self.startPoint = { x: startX, y: startY };
        self.endPoint = { x: endX, y: endY };
        self.controlPoint1 = { x: (startX > endX ? startX : endX) + 100, y: startY };
        self.controlPoint2 = { x: (startX > endX ? startX : endX) + 100, y: endY };
    }

    var SetPointsLeft = function (startX, startY, endX, endY)
    {
        self.startPoint = { x: startX, y: startY };
        self.endPoint = { x: endX, y: endY };
        self.controlPoint1 = { x: (startX > endX ? endX : startX) - 100, y: startY };
        self.controlPoint2 = { x: (startX > endX ? startX : endX) - 100, y: endY };
    }

    var ComputePointsOnCurve = function ()
    {
        self.pointsOnCurve = DeCasteljau([self.startPoint, self.controlPoint1, self.controlPoint2, self.endPoint], 5);
    }

    var DrawBezier = function ()
    {
        if (!Path2D)
        {
            owner.context.beginPath();
            owner.context.moveTo(self.startPoint.x, self.startPoint.y);
            owner.context.bezierCurveTo(self.controlPoint1.x, self.controlPoint1.y, self.controlPoint2.x, self.controlPoint2.y, self.endPoint.x, self.endPoint.y);
            owner.context.stroke();
        }
        else
        {
            var path1 = new Path2D();
            path1.moveTo(self.startPoint.x, self.startPoint.y);
            path1.bezierCurveTo(self.controlPoint1.x, self.controlPoint1.y, self.controlPoint2.x, self.controlPoint2.y, self.endPoint.x, self.endPoint.y);
            owner.context.stroke(path1);
            self.path = path1;
        }

        ComputePointsOnCurve();

        //        for (var i = 0; i < self.pointsOnCurve.length - 1; i++ )
        //        {
        //            owner.context.beginPath();

        //            owner.context.beginPath();
        //            owner.context.arc(self.pointsOnCurve[i].x, self.pointsOnCurve[i].y, 4, 0, 2 * Math.PI, false);
        //            owner.context.fillStyle = 'red';
        //            owner.context.strokeStyle = 'red'
        //            owner.context.fill()
        //            owner.context.stroke();
        //        }
    }

    var DeCasteljau = function (points, computedPointsCount)
    {
        var pointsToReturn = [];
        for (var i = 0; i < computedPointsCount; i++)
        {
            var pointsReduced = [];
            var pointsOrig = points;
            var t = i / (computedPointsCount - 1);
            while (pointsOrig.length > 1)
            {
                pointsReduced = [];
                for (var j = 0; j < pointsOrig.length - 1; j++)
                {
                    pointsReduced.push({
                        x: (1 - t) * pointsOrig[j].x + t * pointsOrig[j + 1].x,
                        y: (1 - t) * pointsOrig[j].y + t * pointsOrig[j + 1].y
                    });
                }
                pointsOrig = pointsReduced;
            }
            pointsToReturn.push(pointsOrig[0]);
        }
        return pointsToReturn;
    }
}