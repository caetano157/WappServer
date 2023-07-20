function executeInFrame(input) {
    var code = `(function(request) {\
         try { \
              var xpath = request.executeJavaScript.browserTab.browserControl.selectionCriteria.DOMXPath.value.string; \
              var frameObj = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; \
              if(frameObj == null || frameObj == undefined) { \
                var htmlId = request.executeJavaScript.browserTab.browserControl.selectionCriteria['HTML ID'].value.string; \
                frameObj = document.getElementById(htmlId); \
              } \             
              var CrossDomainIframeInfo = { \
                  'RequestMethod': 'GetFrameIndex', \
                  'Framedomxpath': xpath, \
                  'FrameIndex': undefined \
              }; \              
              var iframe_jsondata = JSON.stringify(CrossDomainIframeInfo); \              
              frameObj.contentWindow.postMessage(iframe_jsondata, '*'); \              
              var scriptResponse = { type: 'crossDomainIFrameInfo', request: request };\              
              window.dispatchEvent(new CustomEvent('automationanywhere-recorder-ExecuteJs', { detail: scriptResponse })); \
         } catch (e) { \
             scriptResponse = { type: 'executeJavascriptError', errorResponse: e.message }; \
             window.dispatchEvent(new CustomEvent('automationanywhere-recorder-ExecuteJs', { detail: scriptResponse })); \
         } \
         })(${JSON.stringify(input)});`;
    return code;
}

function javascriptCodeWrapper(functionParam, eventName, responseType) {
    var code = `(function() { \
             var scriptResponse; \
             try { \
                 var returnResult = ${functionParam}; \
                 if (returnResult && typeof returnResult === 'object' && typeof returnResult.then === 'function') { \
                     returnResult.then(function(result) {\
                         scriptResponse = { type: '${responseType}', returnValue: result }; \
                         window.dispatchEvent(new CustomEvent('${eventName}', { detail: scriptResponse }));\
                     });\
                     return;\
                 } else { \
                     scriptResponse = { type: '${responseType}', returnValue: returnResult }; \
                 } \
             } catch (e) {\
                 scriptResponse = { type: 'executeJavascriptError', errorResponse: e.message }; \
             }\
             var customEvent = new CustomEvent('${eventName}', { detail: scriptResponse });\
             window.dispatchEvent(customEvent);\
         })();`;
    return code;
}

function interactWithElementCodeWrapper(targetAttribute, targetValue, elementMethod) {
    var code = `(function() { \
        var el = document.querySelector(\'[${targetAttribute}="${targetValue}"]\');
        if (!el) {
            var path = document.evaluate(\'//*[@${targetAttribute}="${targetValue}"]\', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (path) {
                el = path.singleNodeValue;
            }
        }
        
        if(el) {
            try {
                el["${elementMethod}"]();
                return true;
            } catch(e) {
                return false;
            } finally {
                el.removeAttribute("${targetAttribute}");
            }
        } else {
            return false;
        }
    })();`;
    return code;
}

try {
    module.exports = {
        javascriptCodeWrapper,
        executeInFrame,
        interactWithElementCodeWrapper
    };
} catch (e) { }
