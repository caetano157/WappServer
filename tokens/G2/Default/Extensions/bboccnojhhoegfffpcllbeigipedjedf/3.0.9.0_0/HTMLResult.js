
//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.


function HTMLResult()
{

    var _resultNodeStart = "<AAOABResult";
    var _resultNodeEnd = "</AAOABResult>";
    var _valuesStart = "<Vals>";
    var _valuesEnd = "</Vals>";
    var _rowStart = "<Row>";
    var _rowEnd = "</Row>";
    var _tableStart = "<Table>";
    var _tableEnd = "</Table>";
    var _requestNodeStart = "<PluginCommand";
    var _requestNodeEnd = "</PluginCommand>";

    this.IsSuccess = false;
    this.Values = new Array();
    this.ErrorCode = HTMLErrorCode.None;
    this.HTMLObject;
    this.TableValue = "";

    this.SetTableValue = function (tableValue) {
        this.TableValue = tableValue;
    }

    this.SetHTMLObject = function(HObject)
    {
     this.HTMLObject = HObject;
    }

    this.AddValue = function(value)
    {
        this.Values = new Array(1);
        this.Values[0] = value;
    }

    this.SetStatus = function(status)
    {

        this.IsSuccess = status;

    }
    this.SetErrorCode = function (HTMLErrorCode)
    {
        this.ErrorCode = HTMLErrorCode;
    }
    this.GetResultString = function()
    {

        try
        {
        var resultString = _resultNodeStart + " Result='" + this.IsSuccess + "' Error='"+ this.ErrorCode +"'>";


        if (this.Values !=null && this.Values.length > 0)
        {
            resultString = resultString + _valuesStart;
            for(i=0;i<this.Values.length;i++)
            {
                resultString = resultString + "<Val>"+ new HTMLCommon(null).ReplaceSpacialCharacter(this.Values[i].toString())+"</Val>";
            }
            resultString = resultString + _valuesEnd;

        }
        resultString = resultString + _tableStart;
        resultString = resultString + this.TableValue;
        resultString = resultString + _tableEnd;

        if(this.HTMLObject!=null && this.HTMLObject!= UNDEFINED )
            resultString = resultString+ this.HTMLObject.ToString();

        resultString = resultString + _resultNodeEnd;
        return resultString;
        }
        catch (e)
        {
            //alert(e.message);
            AALogger('HTMLResult', 'GetResultString', e.message);
            return _resultNodeStart+" Result='"+ this.IsSuccess +"' Error='"+ this.ErrorCode +"'>"+_resultNodeEnd;
        }

    }

    this.GetCrossDomainErrorString = function (values) {

        try {
            var resultString = "";
            var requeststart = "";
            resultString = resultString + _requestNodeStart + " Typ='CAPTURE_OBJECT_NODE'>";

            this.Values = values;
            if (this.Values != null && this.Values.length > 0) {                
                for (i = 0; i < this.Values.length; i++) {
                    resultString = resultString + "<Prop Nam='" + values[i][0] + "' Val='" + new HTMLCommon(null).ReplaceSpacialCharacter(this.Values[i][1].toString()) + "'/>";
                }             
                resultString = resultString + "<Prop Nam='IsCrossDomainRequest' Val='true'/>";
            }           
            if (this.HTMLObject != null && this.HTMLObject != UNDEFINED)
                resultString = resultString + this.HTMLObject.ToString();

            resultString = resultString + _requestNodeEnd;
            return resultString;
        }
        catch (e) {            
            AALogger('HTMLResult', 'GetResultString', e.message);
            return _requestNodeStart + " Result='" + this.IsSuccess + "' Error='" + this.ErrorCode + "'>" + _requestNodeEnd;
        }

    }
    this.GetCrossDomainPlayRequestString = function (values, requestaction) {

        try {
            var resultString = "";
            var requeststart = "";
            resultString = resultString + _requestNodeStart + " Typ='" + requestaction + "'>";

            this.Values = values;
            if (this.Values != null && this.Values.length > 0) {
                //  resultString = resultString + _valuesStart;
                for (i = 0; i < this.Values.length; i++) {
                    resultString = resultString + "<Prop Nam='" + values[i][0] + "' Val='" + new HTMLCommon(null).ReplaceSpacialCharacter(this.Values[i][1].toString()) + "'/>";
                }
                // resultString = resultString + _valuesEnd;
                resultString = resultString + "<Prop Nam='IsCrossDomainRequest' Val='true'/>";
            }
            if (this.HTMLObject != null && this.HTMLObject != UNDEFINED)
                resultString = resultString + this.HTMLObject.ToString();

            resultString = resultString + _requestNodeEnd;
            return resultString;
        }
        catch (e) {
            //alert(e.message);
            AALogger('HTMLResult', 'GetResultString', e.message);
            return _requestNodeStart + " Result='" + this.IsSuccess + "' Error='" + this.ErrorCode + "'>" + _requestNodeEnd;
        }

    }
}
"";
