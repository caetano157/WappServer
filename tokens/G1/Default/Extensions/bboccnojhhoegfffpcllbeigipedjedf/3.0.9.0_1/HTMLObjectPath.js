function HTMLObjectPath() {
    function getElementIndex(htmlElement) {
        var parentElement = htmlElement.parentNode;
        var nextSibling = parentElement.firstElementChild;
        var prevSibling = parentElement.lastElementChild;
        var index = 0, index1 = 0;
        while (nextSibling != null || prevSibling != null) {

            if (htmlElement == nextSibling) {
                return ++index;
            }
            else if (htmlElement == prevSibling) {
                return --index1;
            }

            nextSibling = nextSibling.nextElementSibling;
            prevSibling = prevSibling.previousElementSibling;
            index++;
            index1--;
        }
        return 0;
    }

    this.Create = function (htmlElement) {
        if (htmlElement == null || htmlElement.tagName == "BODY")
            return "";
        if (htmlElement.tagName != undefined && htmlElement.tagName == "HTML")
            return "";

        var elementIndex = getElementIndex(htmlElement);

        if (elementIndex == 0)
            throw "Not able to create path.";

        var parentElement = htmlElement.parentNode;
        if (parentElement == null)
            return "";

        var parentPath = this.Create(parentElement);

        if (parentPath == "")
            return elementIndex;
        else
            return parentPath + "|" + elementIndex;

    }
}
"";
