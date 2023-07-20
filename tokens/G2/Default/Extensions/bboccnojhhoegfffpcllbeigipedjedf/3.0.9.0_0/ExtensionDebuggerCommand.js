async function handleDebuggerResult(target, commandResult, resultCallback) {
    AALogger.log('debugger', 'command result', commandResult);
    var scriptResponse = null;
    if (commandResult.result && commandResult.result.subtype == "promise") {
        var objectId = commandResult.result.objectId;
        AALogger.log('debugger', 'command result is promise, id', objectId);        
        var promiseResult = await chrome.debugger.sendCommand(
            target, 'Runtime.awaitPromise',
            {
                promiseObjectId: objectId
            }
        );
        AALogger.log('debugger', 'await result', promiseResult);
        if (promiseResult.result.type == "string") {
            scriptResponse = JSON.parse(promiseResult.result.value);                        
            // could this chain into another promise to await?
        }
        resultCallback(scriptResponse);
    } else {
        if (commandResult.result && commandResult.result.type != undefined) {
            scriptResponse = JSON.parse(commandResult.result.value);                        
        }
        resultCallback(scriptResponse);
    }
}
async function sendDebuggerCommand(tabId, debuggerCommand, resultCallback) {
    AALogger.log('debugger', 'tabId: ', tabId);
    var target = { tabId: tabId };
    await chrome.debugger.attach(target, '1.3');
    try {
        if (debuggerCommand.action = 'executeUserJS') {
            var wrappedExpression = `(async function() { \
                try { \
                  const result = await ${debuggerCommand.commandData}; \
                  return JSON.stringify({success: true, value: result}); \
                } \
                catch (error) { \
                  return JSON.stringify({success: false, value: error}); \
                } \
              })();`;            
            AALogger.log('debugger', `executing wrapperExpression: ${wrappedExpression}`);
            var commandResult = await chrome.debugger.sendCommand(
                target, 'Runtime.evaluate',
                {
                    expression: wrappedExpression,
                    sourceURL: 'file://aaDebuggerCommand',
                    allowUnsafeEvalBlockedByCSP: true
                });
            }
            await handleDebuggerResult(target, commandResult, resultCallback);
    } catch (e) {
        AALogger.warn('debugger', 'err', e);        
    } finally {
        chrome.debugger.detach(target);
    }
}

function getDebuggerCommandResponse(result, resultWrapperFunc) {
    if (result.success === false) {
        var ret = {
            errorResponse: {
                errorMessage: result.value
            }
        };                
    } else if (result.success === true && result.value) {        
        var ret = resultWrapperFunc(result.value);
    } else {
        // The scenario where JS doent return any value, we dont have result.value.
        var ret = resultWrapperFunc(null);
    }    
    return ret;
}

function executeDebuggerCommand(context, browserRequest, resultWrapperFunc) {
    sendDebuggerCommand(
        browserRequest.tabId,
        {
            'action': browserRequest.debuggerAction,
            'commandData': browserRequest.commandData
        },
        (result) => {             
            var ret = getDebuggerCommandResponse(result, resultWrapperFunc);
            AALogger.log('debugger', 'executeDebuggerCommand result', JSON.stringify(ret));
            if (context){
                context.sendResponse(ret);
            }
        }
    );
}

try {
    module.exports = {
        executeDebuggerCommand,
        sendDebuggerCommand
    };
} catch (e) { }
