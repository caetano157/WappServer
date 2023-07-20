// Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
// This software is the proprietary information of Automation Anywhere.
// You shall use it only in accordance with the terms of the license agreement
// you entered into with Automation Anywhere.

String.Empty = '';
String.Format = function (val, args) {
    var str = val;
    return str.replace(String.Format.regex, function (arg) {
        var intVal = parseInt(arg.substring(1, arg.length - 1));
        var replace;
        if (intVal >= 0) {
            replace = args[intVal];
        } else if (intVal === -1) {
            replace = "{";
        } else if (intVal === -2) {
            replace = "}";
        } else {
            replace = String.Empty;
        }
        return replace;
    });
};
String.Format.regex = new RegExp("{-?[0-9]+}", "g");
String.IsNullOrEmpty = function (val) {
    return (val == undefined || val == null || val == String.Empty);
};

var xPathDetectionVersion = {
    JavaScriptDOMXPath: 1
};
"";
