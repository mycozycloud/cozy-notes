exports = {};/* ------------------------------------------------------------------------
#  MARKUP LANGUAGE CONVERTERS
# _cozy2md (Read a string of editor html code format and turns it into a
#           string in markdown format)
# _md2cozy (Read a string of html code given by showdown and turns it into
#           a string of editor html code)
*/

var md2cozy;

md2cozy = {};

if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

/* ------------------------------------------------------------------------
#  _cozy2md
# Turns line elements form editor into a string in markdown format
*/


md2cozy.cozy2md = function(linesDiv) {
  var line, lineElt, lineMetaData, lines, markCode, prevLineMetaData, _i, _j, _len, _len1, _ref, _ref1;
  md2cozy.currentDepth = 0;
  lines = [];
  prevLineMetaData = null;
  _ref = linesDiv.children();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    line = _ref[_i];
    line = $(line);
    lineMetaData = md2cozy.getLineMetadata(line.attr('class'));
    markCode = md2cozy.buildMarkdownPrefix(lineMetaData, prevLineMetaData);
    prevLineMetaData = lineMetaData;
    _ref1 = line.children();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      lineElt = _ref1[_j];
      if (lineElt.nodeType === 1) {
        markCode += md2cozy.convertInlineEltToMarkdown($(lineElt));
      } else {
        markCode += $(lineElt).text();
      }
    }
    lines.push(markCode);
  }
  return lines.join('');
};

md2cozy.getLineMetadata = function(name) {
  var data, depth, type;
  if (name != null) {
    data = name.split("-");
    type = data[0];
    depth = parseInt(data[1], 10);
    return {
      type: type,
      depth: depth
    };
  } else {
    return {
      type: null,
      depth: null
    };
  }
};

md2cozy.buildMarkdownPrefix = function(metadata, prevMetadata) {
  var blanks, dieses, i, nbBlanks, prefix, _i, _j, _k, _ref, _ref1, _ref2;
  blanks = "";
  switch (metadata.type) {
    case 'Th':
      dieses = '';
      for (i = _i = 1, _ref = metadata.depth; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
        dieses += '#';
      }
      md2cozy.currentDepth = metadata.depth;
      prefix = "" + dieses + " ";
      if (prevMetadata != null) {
        prefix = "\n\n" + prefix;
      }
      return prefix;
    case 'Lh':
      return "\n\n";
    case 'Tu':
      nbBlanks = metadata.depth - md2cozy.currentDepth - 1;
      if (nbBlanks > 0) {
        for (i = _j = 0, _ref1 = nbBlanks - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          blanks += '    ';
        }
      }
      prefix = "" + blanks + "* ";
      if ((prevMetadata != null ? prevMetadata.type : void 0) === "Tu" || (prevMetadata != null ? prevMetadata.type : void 0) === "Lu") {
        prefix = "\n" + prefix;
      } else if (prevMetadata != null) {
        prefix = "\n\n" + prefix;
      }
      return prefix;
    case 'Lu':
      nbBlanks = metadata.depth - md2cozy.currentDepth - 1;
      if (nbBlanks > 0) {
        for (i = _k = 0, _ref2 = nbBlanks - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
          blanks += '    ';
        }
      }
      return "\n\n" + blanks + " ";
    default:
      return '';
  }
};

md2cozy.convertInlineEltToMarkdown = function(obj) {
  var alt, href, src, title;
  switch (obj[0].nodeName) {
    case 'A':
      title = obj.attr('title') != null ? obj.attr('title') : "";
      href = obj.attr('href') != null ? obj.attr('href') : "";
      return '[' + obj.html() + '](' + href + ' "' + title + '")';
    case 'IMG':
      title = obj.attr('title') != null ? obj.attr('title') : "";
      alt = obj.attr('alt') != null ? obj.attr('alt') : "";
      src = obj.attr('src') != null ? obj.attr('src') : "";
      return '![' + alt + '](' + src + ' "' + title + '")';
    case 'SPAN':
      return obj.text();
    default:
      return '';
  }
};

/* ------------------------------------------------------------------------
# Read a string of html code given by showdown and turns it into a string
# of editor html code
*/


md2cozy.md2cozy = function(text) {
  var conv, cozyCode, htmlCode;
  conv = new Showdown.converter();
  htmlCode = $(conv.makeHtml(text));
  console.log(htmlCode);
  cozyCode = '';
  md2cozy.currentId = 0;
  md2cozy.editorDepth = 0;
  htmlCode.each(function() {
    return cozyCode += md2cozy.parseLine($(this));
  });
  if (cozyCode.length === 0) {
    cozyCode = md2cozy.buildEditorLine("Tu", 1, null);
  }
  return cozyCode;
};

md2cozy.parseLine = function(obj) {
  var tag;
  tag = obj[0].tagName;
  if ((tag != null) && tag[0] === "H") {
    md2cozy.editorDepth = parseInt(tag[1], 10);
    return md2cozy.buildEditorLine("Th", md2cozy.editorDepth, obj);
  } else if ((tag != null) && tag === "P") {
    return md2cozy.buildEditorLine("Lh", md2cozy.editorDepth, obj);
  } else {
    return md2cozy.parseList(obj);
  }
};

md2cozy.buildEditorLine = function(type, depth, obj) {
  var code;
  md2cozy.currentId++;
  code = '';
  if (obj != null) {
    obj.contents().each(function() {
      var name;
      name = this.nodeName;
      if (name === "#text") {
        return code += "<span>" + ($(this).text()) + "</span>";
      } else if (this.tagName != null) {
        $(this).wrap('<div></div>');
        code += "" + ($(this).parent().html());
        return $(this).unwrap();
      }
    });
  }
  if (code === "") {
    code = "<span></span>";
  }
  return ("<div id=CNID_" + md2cozy.currentId + " class=" + type + "-" + depth + ">") + code + "<br></div>";
};

md2cozy.parseList = function(obj) {
  var child, cozyCode, i, nodeName, tag, type, _i, _len, _ref;
  tag = obj[0].tagName;
  cozyCode = "";
  if ((tag != null) && tag === "UL") {
    md2cozy.editorDepth++;
    obj.children().each(function() {
      return cozyCode += md2cozy.parseList($(this));
    });
    md2cozy.editorDepth--;
  } else if ((tag != null) && tag === "LI" && (obj.contents().get(0) != null)) {
    _ref = obj[0].childNodes;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      child = _ref[i];
      child = $(child);
      type = "Lu";
      if (i === 0) {
        type = "Tu";
      }
      nodeName = child[0].nodeName;
      if (nodeName === "#text" && child.text().trim() !== "") {
        child = child.clone().wrap('<p></p>').parent();
        cozyCode += md2cozy.buildEditorLine(type, md2cozy.editorDepth, child);
      } else if (nodeName === "P") {
        cozyCode += md2cozy.buildEditorLine(type, md2cozy.editorDepth, child);
      } else {
        cozyCode += md2cozy.parseList(child);
      }
    }
  } else if ((tag != null) && tag === "P") {
    cozyCode += md2cozy.buildEditorLine("Lu", md2cozy.editorDepth, obj);
  }
  return cozyCode;
};

exports.md2cozy = md2cozy;
var selection,
  _this = this;

selection = {};

/* ------------------------------------------------------------------------
# UTILITY FUNCTIONS
# used to set ranges and help normalize selection
# 
# parameters: elt  :  a dom object with only textNode children
#
# note: with google chrome, it seems that non visible elements
#       cannot be selected with rangy (that's where 'blank' comes in)
*/


selection.cleanSelection = function(startLine, endLine, range) {
  var endNode, startNode;
  if (startLine === null) {
    startLine = endLine;
    endLine = endLine.lineNext;
    selection.putStartOnStart(range, startLine.line$[0].firstElementChild);
    endLine.line$.prepend('<span></span>');
    return selection.putEndOnStart(range, endLine.line$[0].firstElementChild);
  } else {
    startNode = startLine.line$[0].lastElementChild.previousElementSibling;
    endNode = endLine.line$[0].lastElementChild.previousElementSibling;
    range.setStartAfter(startNode, 0);
    return range.setEndAfter(endNode, 0);
  }
};

selection.cloneEndFragment = function(range, endLine) {
  var range4fragment;
  range4fragment = rangy.createRangyRange();
  range4fragment.setStart(range.endContainer, range.endOffset);
  range4fragment.setEndAfter(endLine.line$[0].lastChild);
  return range4fragment.cloneContents();
};

/* ------------------------------------------------------------------------
#  _normalize(range)
# 
#  Modify 'range' containers and offsets so it represent a clean selection
#  that it starts inside a textNode and ends inside a textNode.
#
#  Set the flag isEmptyLine to true if an empty line is being normalized
#  so further suppr ~ backspace work properly.
#
*/


selection.normalize = function(range) {
  var endContainer, endDiv, isEmptyLine, startContainer, startDiv, _ref, _ref1;
  startDiv = selection.getStartDiv(range);
  endDiv = selection.getEndDiv(range, startDiv);
  isEmptyLine = startDiv === endDiv && startDiv.innerHTML === '<span></span><br>';
  startContainer = range.startContainer;
  if (startContainer.nodeName === "BODY") {
    selection.handleBodyStart(range, startContainer, isEmptyLine);
  } else if (startContainer.nodeName === "DIV") {
    selection.handleDivStart(range, startContainer);
  } else if ((_ref = startContainer.nodeName) === "SPAN" || _ref === "IMG" || _ref === "A") {
    selection.handleTextEltStart(range, startContainer);
  }
  endContainer = range.endContainer;
  if (endContainer.nodeName === "BODY") {
    selection.handleBodyEnd(range, endContainer);
  }
  if (endContainer.nodeName === "DIV") {
    selection.handleDivEnd(range, endContainer);
  } else if ((_ref1 = endContainer.nodeName) === "SPAN" || _ref1 === "IMG" || _ref1 === "A") {
    selection.handleTextEltEnd(range, endContainer);
  }
  return range;
};

selection.handleBodyStart = function(range, startContainer) {
  var elt;
  elt = selection.getFirstLineFromBody(startContainer);
  return selection.putStartOnStart(range, elt);
};

selection.handleBodyEnd = function(range, endContainer) {
  var elt;
  elt = selection.getLastLineFromBody(endContainer);
  return selection.putEndAtEndOfLine(range, elt);
};

selection.handleDivStart = function(range, startContainer, isEmptyLine) {
  if (isEmptyLine) {
    return selection.putStartOnFirstChild(range, startContainer);
  } else if (range.startOffset < startContainer.childNodes.length - 1) {
    return selection.putStartOnOffset(range, startContainer, range.startOffset);
  } else {
    return selection.putStartAtEndOfLine(range, startContainer);
  }
};

selection.handleDivEnd = function(range, endContainer) {
  if (range.endOffset < endContainer.childNodes.length - 1) {
    return selection.putEndOnOffset(range, endContainer, range.endOffset);
  } else {
    return selection.putEndAtEndOfLine(range, endContainer);
  }
};

selection.handleTextEltStart = function(range, startContainer) {
  if (startContainer.firstChild === null || startContainer.textContent.length === 0) {
    return selection.putStartOnEnd(range, startContainer);
  } else if (range.startOffset < startContainer.childNodes.length) {
    return selection.putStartOnNextChild(range, startContainer);
  } else {
    return selection.putStartOnLastChildEnd(range, startContainer);
  }
};

selection.handleTextEltEnd = function(range, endContainer) {
  if (endContainer.firstChild === null || endContainer.textContent.length === 0) {
    selection.putEndOnEnd(range, endContainer);
  }
  if (range.endOffset < endContainer.childNodes.length) {
    return selection.putEndOnNextChild(range, endContainer);
  } else {
    return selection.putEndOnLastChildEnd(range, endContainer);
  }
};

selection.getLineDiv = function(elt) {
  var parent;
  parent = elt;
  while (parent.nodeName !== 'DIV' && (((parent.id != null) && parent.id.substr(0, 5) !== 'CNID_') || !(parent.id != null)) && parent.parentNode !== null) {
    parent = parent.parentNode;
  }
  return parent;
};

selection.getFirstLineFromBody = function(body) {
  return body.children[1].firstChild;
};

selection.getLastLineFromBody = function(body) {
  return body.children[1].lastChild;
};

selection.putStartOnFirstChild = function(range, container) {
  var elt;
  elt = container.firstChild;
  return selection.putStartOnStart(range, elt);
};

selection.putStartOnOffset = function(range, container, offset) {
  var elt;
  elt = container.childNodes[offset];
  return selection.putStartOnStart(range, elt);
};

selection.putEndOnOffset = function(range, container, offset) {
  var elt;
  elt = container.childNodes[offset];
  return selection.putEndOnStart(range, elt);
};

selection.putStartOnNextChild = function(range, container) {
  var elt;
  elt = container.childNodes[range.startOffset];
  return range.setStart(elt, 0);
};

selection.putEndOnNextChild = function(range, container) {
  var elt;
  elt = container.childNodes[range.endOffset];
  return range.setEnd(elt, 0);
};

selection.putStartOnLastChildEnd = function(range, container) {
  var elt, offset;
  elt = container.lastChild;
  offset = elt.data.length;
  return range.setStart(elt, offset);
};

selection.putEndOnLastChildEnd = function(range, container) {
  var elt, offset;
  elt = container.lastChild;
  offset = elt.data.length;
  return range.setEnd(elt, offset);
};

selection.putStartAtEndOfLine = function(range, container) {
  var elt;
  elt = container.lastChild.previousElementSibling;
  if (elt != null) {
    return selection.putStartOnEnd(range, elt);
  } else if (container.lastChild != null) {
    return selection.putStartOnEnd(container.lastChild);
  } else {
    return console.log("Normalize: no where to put selection start.");
  }
};

selection.putEndAtEndOfLine = function(range, container) {
  var elt;
  elt = container.lastChild.previousElementSibling;
  if (elt != null) {
    return selection.putEndOnEnd(range, elt);
  } else if (container.lastChild != null) {
    return selection.putEndOnEnd(container.lastChild);
  } else {
    return console.log("Normalize: no where to put selection start.");
  }
};

selection.putStartOnStart = function(range, elt) {
  var blank, offset;
  if ((elt != null ? elt.firstChild : void 0) != null) {
    offset = elt.firstChild.textContent.length;
    if (offset === 0) {
      elt.firstChild.data = " ";
    }
    return range.setStart(elt.firstChild, 0);
  } else if (elt != null) {
    blank = document.createTextNode(" ");
    elt.appendChild(blank);
    return range.setStart(blank, 0);
  }
};

selection.putStartOnEnd = function(range, elt) {
  var blank, offset;
  if ((elt != null ? elt.lastChild : void 0) != null) {
    offset = elt.lastChild.textContent.length;
    if (offset === 0) {
      elt.lastChild.data = " ";
      offset = 1;
    }
    return range.setStart(elt.lastChild, offset);
  } else if (elt != null) {
    blank = document.createTextNode(" ");
    elt.appendChild(blank);
    return range.setStart(blank, 0);
  }
};

selection.putEndOnStart = function(range, elt) {
  var blank, offset;
  if ((elt != null ? elt.firstChild : void 0) != null) {
    offset = elt.firstChild.textContent.length;
    if (offset === 0) {
      elt.firstChild.data = " ";
    }
    return range.setEnd(elt.firstChild, 0);
  } else if (elt != null) {
    blank = document.createTextNode(" ");
    elt.appendChild(blank);
    return range.setEnd(blank, 0);
  }
};

selection.putEndOnEnd = function(range, elt) {
  if (elt != null) {
    range.setEnd(elt.nextSibling, 0);
  }
  return range;
};

selection.getStartDiv = function(range) {
  var startDiv;
  if (range.startContainer.nodeName === 'BODY') {
    startDiv = range.startContainer.children[range.startOffset];
  } else {
    startDiv = range.startContainer;
  }
  if (startDiv.nodeName !== "DIV") {
    startDiv = selection.getLineDiv(startDiv);
  }
  return startDiv;
};

selection.getEndDiv = function(range, startDiv) {
  var endDiv;
  if (range.endContainer.nodeName === "BODY") {
    endDiv = range.endContainer.children[range.endOffset - 1];
  } else {
    endDiv = range.endContainer;
  }
  if ((endDiv != null ? endDiv.nodeName : void 0) !== "DIV") {
    endDiv = selection.getLineDiv(endDiv);
  } else {
    endDiv = startDiv;
  }
  return endDiv;
};

exports.selection = selection;
/* ------------------------------------------------------------------------
# CLASS FOR THE COZY NOTE EDITOR
#
# usage : 
#
# newEditor = new CNEditor( iframeTarget,callBack )
#   iframeTarget = iframe where the editor will be nested
#   callBack     = launched when editor ready, the context 
#                  is set to the editorCtrl (callBack.call(this))
# properties & methods :
#   replaceContent    : (htmlContent) ->  # TODO: replace with markdown
#   _keyPressListener : (e) =>
#   _insertLineAfter  : (param) ->
#   _insertLineBefore : (param) ->
#   
#   editorIframe      : the iframe element where is nested the editor
#   editorBody$       : the jquery pointer on the body of the iframe
#   _lines            : {} an objet, each property refers a line
#   _highestId        : 
#   _firstLine        : points the first line : TODO : not taken into account
*/

var CNeditor, md2cozy, selection,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (typeof require !== "undefined" && require !== null) {
  if (!(typeof md2cozy !== "undefined" && md2cozy !== null)) {
    md2cozy = require('./md2cozy').md2cozy;
  }
  if (!(typeof selection !== "undefined" && selection !== null)) {
    selection = require('./selection').selection;
  }
}

exports.CNeditor = (function() {
  /*
      #   Constructor : newEditor = new CNEditor( iframeTarget,callBack )
      #       iframeTarget = iframe where the editor will be nested
      #       callBack     = launched when editor ready, the context 
      #                      is set to the editorCtrl (callBack.call(this))
  */

  function CNeditor(editorTarget, callBack) {
    var iframe$,
      _this = this;
    this.editorTarget = editorTarget;
    this._processPaste = __bind(this._processPaste, this);

    this._waitForPasteData = __bind(this._waitForPasteData, this);

    this._keyPressListener = __bind(this._keyPressListener, this);

    if (this.editorTarget.nodeName === "IFRAME") {
      this.getEditorSelection = function() {
        return rangy.getIframeSelection(this.editorTarget);
      };
      this.saveEditorSelection = function() {
        return rangy.saveSelection(rangy.dom.getIframeWindow(this.editorTarget));
      };
      iframe$ = $(this.editorTarget);
      iframe$.on('load', function() {
        var cssLink, editor_head$, editor_html$;
        editor_html$ = iframe$.contents().find("html");
        _this.editorBody$ = editor_html$.find("body");
        _this.editorBody$.parent().attr('id', '__ed-iframe-html');
        _this.editorBody$.attr("contenteditable", "true");
        _this.editorBody$.attr("id", "__ed-iframe-body");
        _this.document = _this.editorBody$[0].ownerDocument;
        editor_head$ = editor_html$.find("head");
        cssLink = '<link id="editorCSS" ';
        cssLink += 'href="stylesheets/CNeditor.css" rel="stylesheet">';
        editor_head$.html(cssLink);
        _this._lines = {};
        _this.newPosition = true;
        _this._highestId = 0;
        _this._deepest = 1;
        _this._firstLine = null;
        _this._history = {
          index: 0,
          history: [null],
          historySelect: [null],
          historyScroll: [null],
          historyPos: [null]
        };
        _this._lastKey = null;
        _this.editorBody$.prop('__editorCtl', _this);
        _this.editorBody$.on('keydown', _this._keyPressListener);
        _this.editorBody$.on('mouseup', function() {
          return _this.newPosition = true;
        });
        _this.editorBody$.on('keyup', function() {
          return iframe$.trigger(jQuery.Event("onKeyUp"));
        });
        _this.editorBody$.on('click', function(event) {
          return _this._lastKey = null;
        });
        _this.editorBody$.on('paste', function(event) {
          return _this.paste(event);
        });
        _this.linesDiv = document.createElement('div');
        _this.linesDiv.setAttribute('id', 'editor-lines');
        _this.editorBody$.append(_this.linesDiv);
        _this._initClipBoard();
        callBack.call(_this);
        return _this;
      });
      this.editorTarget.src = '';
    }
  }

  /* ------------------------------------------------------------------------
  # EXTENSION : _updateDeepest
  # 
  # Find the maximal deep (thus the deepest line) of the text
  # TODO: improve it so it only calculates the new depth from the modified
  #       lines (not all of them)
  # TODO: set a class system rather than multiple CSS files. Thus titles
  #       classes look like "Th-n depth3" for instance if max depth is 3
  # note: These todos arent our priority for now
  */


  CNeditor.prototype._updateDeepest = function() {
    var c, lines, max;
    max = 1;
    lines = this._lines;
    for (c in lines) {
      if (this.editorBody$.children("#" + ("" + lines[c].lineID)).length > 0 && lines[c].lineType === "Th" && lines[c].lineDepthAbs > max) {
        max = this._lines[c].lineDepthAbs;
      }
    }
    if (max !== this._deepest) {
      this._deepest = max;
      if (max < 4) {
        return this.replaceCSS("stylesheets/app-deep-" + max + ".css");
      } else {
        return this.replaceCSS("stylesheets/app-deep-4.css");
      }
    }
  };

  /* ------------------------------------------------------------------------
  # Initialize the editor content from a html string
  */


  CNeditor.prototype.replaceContent = function(htmlContent) {
    this.linesDiv.innerHTML = htmlContent;
    return this._readHtml();
  };

  /* ------------------------------------------------------------------------
  # Clear editor content
  */


  CNeditor.prototype.deleteContent = function() {
    var emptyLine;
    emptyLine = '<div id="CNID_1" class="Tu-1"><span></span><br></div>';
    this.linesDiv.innerHTML = emptyLine;
    return this._readHtml();
  };

  /* ------------------------------------------------------------------------
  # Returns a markdown string representing the editor content
  */


  CNeditor.prototype.getEditorContent = function() {
    return md2cozy.cozy2md($(this.linesDiv));
  };

  /* ------------------------------------------------------------------------
  # Sets the editor content from a markdown string
  */


  CNeditor.prototype.setEditorContent = function(mdContent) {
    var cozyContent;
    cozyContent = md2cozy.md2cozy(mdContent);
    this.linesDiv.innerHTML = cozyContent;
    return this._readHtml();
  };

  /*
      # Change the path of the css applied to the editor iframe
  */


  CNeditor.prototype.replaceCSS = function(path) {
    var document, linkElm;
    document = this.document;
    linkElm = document.querySelector('#editorCSS');
    linkElm.setAttribute('href', path);
    return document.head.appendChild(linkElm);
  };

  /* ------------------------------------------------------------------------
  #   _keyPressListener
  # 
  # The listener of keyPress event on the editor's iframe... the king !
  */


  /*
      # SHORTCUT
      #
      # Definition of a shortcut : 
      #   a combination alt,ctrl,shift,meta
      #   + one caracter(.which) 
      #   or 
      #     arrow (.keyCode=dghb:) or 
      #     return(keyCode:13) or 
      #     bckspace (which:8) or 
      #     tab(keyCode:9)
      #   ex : shortcut = 'CtrlShift-up', 'Ctrl-115' (ctrl+s), '-115' (s),
      #                   'Ctrl-'
  */


  CNeditor.prototype._keyPressListener = function(e) {
    var keyStrokesCode, metaKeyStrokesCode, normalizedRange, range, sel, shortcut;
    metaKeyStrokesCode = (e.altKey ? "Alt" : "") + 
                              (e.ctrlKey ? "Ctrl" : "") + 
                              (e.shiftKey ? "Shift" : "");
    switch (e.keyCode) {
      case 13:
        keyStrokesCode = "return";
        break;
      case 35:
        keyStrokesCode = "end";
        break;
      case 36:
        keyStrokesCode = "home";
        break;
      case 33:
        keyStrokesCode = "pgUp";
        break;
      case 34:
        keyStrokesCode = "pgDwn";
        break;
      case 37:
        keyStrokesCode = "left";
        break;
      case 38:
        keyStrokesCode = "up";
        break;
      case 39:
        keyStrokesCode = "right";
        break;
      case 40:
        keyStrokesCode = "down";
        break;
      case 9:
        keyStrokesCode = "tab";
        break;
      case 8:
        keyStrokesCode = "backspace";
        break;
      case 32:
        keyStrokesCode = "space";
        break;
      case 27:
        keyStrokesCode = "esc";
        break;
      case 46:
        keyStrokesCode = "suppr";
        break;
      case 16:
        e.preventDefault();
        return;
      case 17:
        e.preventDefault();
        return;
      case 18:
        e.preventDefault();
        return;
      default:
        switch (e.which) {
          case 32:
            keyStrokesCode = "space";
            break;
          case 8:
            keyStrokesCode = "backspace";
            break;
          case 65:
            keyStrokesCode = "A";
            break;
          case 83:
            keyStrokesCode = "S";
            break;
          case 86:
            keyStrokesCode = "V";
            break;
          case 89:
            keyStrokesCode = "Y";
            break;
          case 90:
            keyStrokesCode = "Z";
            break;
          default:
            keyStrokesCode = "other";
        }
    }
    shortcut = metaKeyStrokesCode + '-' + keyStrokesCode;
    if (shortcut === "-A" || shortcut === "-S" || shortcut === "-V" || shortcut === "-Y" || shortcut === "-Z") {
      shortcut = "-other";
    }
    if (this._lastKey !== shortcut && (shortcut === "-tab" || shortcut === "-return" || shortcut === "-backspace" || shortcut === "-suppr" || shortcut === "CtrlShift-down" || shortcut === "CtrlShift-up" || shortcut === "CtrlShift-left" || shortcut === "CtrlShift-right" || shortcut === "Ctrl-V" || shortcut === "Shift-tab" || shortcut === "-space" || shortcut === "-other")) {
      this._addHistory();
    }
    this._lastKey = shortcut;
    if (this.newPosition && (shortcut === '-other' || shortcut === '-space' || shortcut === '-suppr' || shortcut === '-backspace' || shortcut === '-return')) {
      this.newPosition = false;
      sel = this.getEditorSelection();
      range = sel.getRangeAt(0);
      normalizedRange = selection.normalize(range);
      sel.setSingleRange(normalizedRange);
    }
    if ((keyStrokesCode === "left" || keyStrokesCode === "up" || keyStrokesCode === "right" || keyStrokesCode === "down" || keyStrokesCode === "pgUp" || keyStrokesCode === "pgDwn" || keyStrokesCode === "end" || keyStrokesCode === "home" || keyStrokesCode === "return" || keyStrokesCode === "suppr" || keyStrokesCode === "backspace") && (shortcut !== "CtrlShift-down" && shortcut !== "CtrlShift-up" && shortcut !== "CtrlShift-right" && shortcut !== "CtrlShift-left")) {
      this.newPosition = true;
    }
    this.currentSel = null;
    switch (shortcut) {
      case "-return":
        this._return();
        return e.preventDefault();
      case "-tab":
        this.tab();
        return e.preventDefault();
      case "CtrlShift-right":
        this.tab();
        return e.preventDefault();
      case "-backspace":
        return this._backspace(e);
      case "-suppr":
        return this._suppr(e);
      case "CtrlShift-down":
        this._moveLinesDown();
        return e.preventDefault();
      case "CtrlShift-up":
        this._moveLinesUp();
        return e.preventDefault();
      case "Shift-tab":
        this.shiftTab();
        return e.preventDefault();
      case "CtrlShift-left":
        this.shiftTab();
        return e.preventDefault();
      case "Alt-A":
        this._toggleLineType();
        return e.preventDefault();
      case "Ctrl-V":
        return true;
      case "Ctrl-S":
        $(this.editorTarget).trigger(jQuery.Event("saveRequest"));
        return e.preventDefault();
      case "Ctrl-Z":
        e.preventDefault();
        return this.unDo();
      case "Ctrl-Y":
        e.preventDefault();
        return this.reDo();
    }
  };

  /* ------------------------------------------------------------------------
  #  _suppr :
  # 
  # Manage deletions when suppr key is pressed
  */


  CNeditor.prototype._suppr = function(event) {
    var range, startLine, startOffset, textNode, txt;
    this._findLinesAndIsStartIsEnd();
    startLine = this.currentSel.startLine;
    if (this.currentSel.range.collapsed) {
      if (this.currentSel.rangeIsEndLine) {
        if (startLine.lineNext !== null) {
          this.currentSel.range.setEndBefore(startLine.lineNext.line$[0].firstChild);
          this.currentSel.endLine = startLine.lineNext;
          this._deleteMultiLinesSelections();
        } else {
          console.log('_suppr 2 - test ');
        }
      } else {
        console.log('_suppr 3 - test ');
        textNode = this.currentSel.range.startContainer;
        startOffset = this.currentSel.range.startOffset;
        txt = textNode.textContent;
        textNode.textContent = txt.substr(0, startOffset) + txt.substr(startOffset + 1);
        range = rangy.createRange();
        range.collapseToPoint(textNode, startOffset);
        this.currentSel.sel.setSingleRange(range);
      }
    } else if (this.currentSel.endLine === startLine) {
      console.log('_suppr 4 - test ');
      this.currentSel.sel.range.deleteContents();
    } else {
      console.log('_suppr 5 - test ');
      this._deleteMultiLinesSelections();
    }
    e.preventDefault();
    return false;
  };

  /* ------------------------------------------------------------------------
  #  _backspace
  # 
  # Manage deletions when backspace key is pressed
  */


  CNeditor.prototype._backspace = function(e) {
    var offset, prevLine, range, sel, startLine, startOffset, text, textNode, txt;
    this._findLinesAndIsStartIsEnd();
    sel = this.currentSel;
    if (this.isEmptyLine) {
      this.isEmptyLine = false;
      sel.range.deleteContents();
    }
    startLine = sel.startLine;
    if (sel.range.collapsed) {
      if (sel.rangeIsStartLine) {
        if (startLine.linePrev !== null) {
          sel.range.setStartBefore(startLine.linePrev.line$[0].lastChild);
          sel.startLine = startLine.linePrev;
          prevLine = startLine.linePrev.line$[0];
          text = prevLine.lastChild.previousSibling.firstChild;
          offset = text.length;
          this._deleteMultiLinesSelections();
          range = rangy.createRange();
          text = prevLine.lastChild.previousSibling.firstChild;
          range.collapseToPoint(text, offset);
          this.currentSel.sel.setSingleRange(range);
        }
      } else {
        textNode = sel.range.startContainer;
        startOffset = sel.range.startOffset;
        txt = textNode.textContent;
        textNode.textContent = txt.substr(0, startOffset - 1) + txt.substr(startOffset);
        range = rangy.createRange();
        range.collapseToPoint(textNode, startOffset - 1);
        this.currentSel.sel.setSingleRange(range);
        this.currentSel = null;
      }
    } else if (sel.endLine === startLine) {
      sel.range.deleteContents();
    } else {
      this._deleteMultiLinesSelections();
    }
    e.preventDefault();
    return false;
  };

  /* ------------------------------------------------------------------------
  #  titleList
  # 
  # Turn selected lines in a title List (Th)
  */


  CNeditor.prototype.titleList = function() {
    var endDiv, line, range, sel, startDiv, _results;
    sel = this.getEditorSelection();
    range = sel.getRangeAt(0);
    startDiv = selection.getStartDiv(range);
    endDiv = selection.getEndDiv(range, startDiv);
    line = this._lines[startDiv.id];
    _results = [];
    while (true) {
      this._line2titleList(line);
      if (line.lineID === endDiv.id) {
        break;
      } else {
        _results.push(line = line.lineNext);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  _line2titleList
  # 
  #  Turn a given line in a title List Line (Th)
  */


  CNeditor.prototype._line2titleList = function(line) {
    var parent1stSibling, _results;
    if (line.lineType !== 'Th') {
      if (line.lineType[0] === 'L') {
        line.lineType = 'Tu';
        line.lineDepthAbs += 1;
      }
      this._titilizeSiblings(line);
      parent1stSibling = this._findParent1stSibling(line);
      _results = [];
      while (parent1stSibling !== null && parent1stSibling.lineType !== 'Th') {
        this._titilizeSiblings(parent1stSibling);
        _results.push(parent1stSibling = this._findParent1stSibling(parent1stSibling));
      }
      return _results;
    }
  };

  /* ------------------------------------------------------------------------
  # turn in Th or Lh of the siblings of line (and line itself of course)
  # the children are not modified
  */


  CNeditor.prototype._titilizeSiblings = function(line) {
    var l, lineDepthAbs;
    lineDepthAbs = line.lineDepthAbs;
    l = line;
    while (l !== null && l.lineDepthAbs >= lineDepthAbs) {
      if (l.lineDepthAbs === lineDepthAbs) {
        switch (l.lineType) {
          case 'Tu':
          case 'To':
            l.line$.prop("class", "Th-" + lineDepthAbs);
            l.lineType = 'Th';
            l.lineDepthRel = 0;
            break;
          case 'Lu':
          case 'Lo':
            l.line$.prop("class", "Lh-" + lineDepthAbs);
            l.lineType = 'Lh';
            l.lineDepthRel = 0;
        }
      }
      l = l.lineNext;
    }
    l = line.linePrev;
    while (l !== null && l.lineDepthAbs >= lineDepthAbs) {
      if (l.lineDepthAbs === lineDepthAbs) {
        switch (l.lineType) {
          case 'Tu':
          case 'To':
            l.line$.prop("class", "Th-" + lineDepthAbs);
            l.lineType = 'Th';
            l.lineDepthRel = 0;
            break;
          case 'Lu':
          case 'Lo':
            l.line$.prop("class", "Lh-" + lineDepthAbs);
            l.lineType = 'Lh';
            l.lineDepthRel = 0;
        }
      }
      l = l.linePrev;
    }
    return true;
  };

  /* ------------------------------------------------------------------------
  #  markerList
  # 
  #  Turn selected lines in a Marker List
  */


  CNeditor.prototype.markerList = function(l) {
    var endDiv, endLineID, line, lineTypeTarget, range, startDiv, startDivID, _results;
    if (l != null) {
      startDivID = l.lineID;
      endLineID = startDivID;
    } else {
      range = this.getEditorSelection().getRangeAt(0);
      startDiv = selection.getStartDiv(range);
      endDiv = selection.getEndDiv(range, startDiv);
      startDivID = startDiv.id;
      endLineID = endDiv.id;
    }
    line = this._lines[startDivID];
    _results = [];
    while (true) {
      switch (line.lineType) {
        case 'Th':
          lineTypeTarget = 'Tu';
          l = line.lineNext;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            switch (l.lineType) {
              case 'Th':
                l.line$.prop("class", "Tu-" + l.lineDepthAbs);
                l.lineType = 'Tu';
                l.lineDepthRel = this._findDepthRel(l);
                break;
              case 'Lh':
                l.line$.prop("class", "Lu-" + l.lineDepthAbs);
                l.lineType = 'Lu';
                l.lineDepthRel = this._findDepthRel(l);
            }
            l = l.lineNext;
          }
          l = line.linePrev;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            switch (l.lineType) {
              case 'Th':
                l.line$.prop("class", "Tu-" + l.lineDepthAbs);
                l.lineType = 'Tu';
                l.lineDepthRel = this._findDepthRel(l);
                break;
              case 'Lh':
                l.line$.prop("class", "Lu-" + l.lineDepthAbs);
                l.lineType = 'Lu';
                l.lineDepthRel = this._findDepthRel(l);
            }
            l = l.linePrev;
          }
          break;
        case 'Lh':
        case 'Lu':
          this.tab(line);
          break;
        default:
          lineTypeTarget = false;
      }
      if (lineTypeTarget) {
        line.line$.prop("class", "" + lineTypeTarget + "-" + line.lineDepthAbs);
        line.lineType = lineTypeTarget;
      }
      if (line.lineID === endLineID) {
        break;
      } else {
        _results.push(line = line.lineNext);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  _findDepthRel
  # 
  # Calculates the relative depth of the line
  #   usage   : cycle : Tu => To => Lx => Th
  #   param   : line : the line we want to find the relative depth
  #   returns : a number
  #
  */


  CNeditor.prototype._findDepthRel = function(line) {
    var linePrev;
    if (line.lineDepthAbs === 1) {
      if (line.lineType[1] === "h") {
        return 0;
      } else {
        return 1;
      }
    } else {
      linePrev = line.linePrev;
      while (linePrev !== null && linePrev.lineDepthAbs >= line.lineDepthAbs) {
        linePrev = linePrev.linePrev;
      }
      if (linePrev !== null) {
        return linePrev.lineDepthRel + 1;
      } else {
        return 0;
      }
    }
  };

  /* ------------------------------------------------------------------------
  #  _toggleLineType
  # 
  # Toggle line type
  #   usage : cycle : Tu => To => Lx => Th
  #   param :
  #       e = event
  */


  CNeditor.prototype._toggleLineType = function() {
    var endDiv, endLineID, l, line, lineTypeTarget, range, sel, startDiv, _results;
    sel = this.getEditorSelection();
    range = sel.getRangeAt(0);
    startDiv = selection.getStartDiv(range);
    endDiv = selection.getEndDiv(range, startDiv);
    endLineID = endDiv.id;
    line = this._lines[startDiv.id];
    _results = [];
    while (true) {
      switch (line.lineType) {
        case 'Tu':
          lineTypeTarget = 'Th';
          l = line.lineNext;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            if (l.lineDepthAbs === line.lineDepthAbs) {
              if (l.lineType === 'Tu') {
                l.line$.prop("class", "Th-" + line.lineDepthAbs);
                l.lineType = 'Th';
              } else {
                l.line$.prop("class", "Lh-" + line.lineDepthAbs);
                l.lineType = 'Lh';
              }
            }
            l = l.lineNext;
          }
          l = line.linePrev;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            if (l.lineDepthAbs === line.lineDepthAbs) {
              if (l.lineType === 'Tu') {
                l.line$.prop("class", "Th-" + line.lineDepthAbs);
                l.lineType = 'Th';
              } else {
                l.line$.prop("class", "Lh-" + line.lineDepthAbs);
                l.lineType = 'Lh';
              }
            }
            l = l.linePrev;
          }
          break;
        case 'Th':
          lineTypeTarget = 'Tu';
          l = line.lineNext;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            if (l.lineDepthAbs === line.lineDepthAbs) {
              if (l.lineType === 'Th') {
                l.line$.prop("class", "Tu-" + line.lineDepthAbs);
                l.lineType = 'Tu';
              } else {
                l.line$.prop("class", "Lu-" + line.lineDepthAbs);
                l.lineType = 'Lu';
              }
            }
            l = l.lineNext;
          }
          l = line.linePrev;
          while (l !== null && l.lineDepthAbs >= line.lineDepthAbs) {
            if (l.lineDepthAbs === line.lineDepthAbs) {
              if (l.lineType === 'Th') {
                l.line$.prop("class", "Tu-" + line.lineDepthAbs);
                l.lineType = 'Tu';
              } else {
                l.line$.prop("class", "Lu-" + line.lineDepthAbs);
                l.lineType = 'Lu';
              }
            }
            l = l.linePrev;
          }
          break;
        default:
          lineTypeTarget = false;
      }
      if (lineTypeTarget) {
        line.line$.prop("class", "" + lineTypeTarget + "-" + line.lineDepthAbs);
        line.lineType = lineTypeTarget;
      }
      if (line.lineID === endDiv.id) {
        break;
      } else {
        _results.push(line = line.lineNext);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  tab
  # 
  # tab keypress
  #   l = optional : a line to indent. If none, the selection will be indented
  */


  CNeditor.prototype.tab = function(l) {
    var endDiv, endLineID, isTabAllowed, line, lineNext, linePrev, linePrevSibling, lineTypeTarget, nextLineType, range, sel, startDiv, _results;
    if (l != null) {
      startDiv = l.line$[0];
      endDiv = startDiv;
    } else {
      sel = this.getEditorSelection();
      range = sel.getRangeAt(0);
      startDiv = selection.getStartDiv(range);
      endDiv = selection.getEndDiv(range, startDiv);
    }
    if (startDiv.nodeName !== "DIV") {
      startDiv = $(startDiv).parents("div")[0];
    }
    if (endDiv.nodeName !== "DIV") {
      endDiv = $(endDiv).parents("div")[0];
    }
    endLineID = endDiv.id;
    line = this._lines[startDiv.id];
    _results = [];
    while (true) {
      switch (line.lineType) {
        case 'Tu':
        case 'Th':
          linePrevSibling = this._findPrevSibling(line);
          if (linePrevSibling === null) {
            isTabAllowed = false;
          } else {
            isTabAllowed = true;
            if (linePrevSibling.lineType === 'Th') {
              lineTypeTarget = 'Lh';
            } else {
              if (linePrevSibling.lineType === 'Tu') {
                lineTypeTarget = 'Lu';
              } else {
                lineTypeTarget = 'Lo';
              }
              if (line.lineType === 'Th') {
                lineNext = line.lineNext;
                while (lineNext !== null && lineNext.lineDepthAbs > line.lineDepthAbs) {
                  switch (lineNext.lineType) {
                    case 'Th':
                      lineNext.lineType = 'Tu';
                      line.line$.prop("class", "Tu-" + lineNext.lineDepthAbs);
                      nextLineType = prevTxType;
                      break;
                    case 'Tu':
                      nextLineType = 'Lu';
                      break;
                    case 'To':
                      nextLineType = 'Lo';
                      break;
                    case 'Lh':
                      lineNext.lineType = nextLineType;
                      line.line$.prop("class", "" + nextLineType + "-" + lineNext.lineDepthAbs);
                  }
                }
              }
            }
          }
          break;
        case 'Lh':
        case 'Lu':
        case 'Lo':
          lineNext = line.lineNext;
          lineTypeTarget = null;
          while (lineNext !== null && lineNext.lineDepthAbs >= line.lineDepthAbs) {
            if (lineNext.lineDepthAbs !== line.lineDepthAbs + 1) {
              lineNext = lineNext.lineNext;
            } else {
              lineTypeTarget = lineNext.lineType;
              lineNext = null;
            }
          }
          if (lineTypeTarget === null) {
            linePrev = line.linePrev;
            while (linePrev !== null && linePrev.lineDepthAbs >= line.lineDepthAbs) {
              if (linePrev.lineDepthAbs === line.lineDepthAbs + 1) {
                lineTypeTarget = linePrev.lineType;
                linePrev = null;
              } else {
                linePrev = linePrev.linePrev;
              }
            }
          }
          if (lineTypeTarget === null) {
            isTabAllowed = true;
            lineTypeTarget = 'Tu';
            line.lineDepthAbs += 1;
            line.lineDepthRel += 1;
          } else {
            if (lineTypeTarget === 'Th') {
              isTabAllowed = true;
              line.lineDepthAbs += 1;
              line.lineDepthRel = 0;
            }
            if (lineTypeTarget === 'Tu' || lineTypeTarget === 'To') {
              isTabAllowed = true;
              line.lineDepthAbs += 1;
              line.lineDepthRel += 1;
            }
          }
      }
      if (isTabAllowed) {
        line.line$.prop("class", "" + lineTypeTarget + "-" + line.lineDepthAbs);
        line.lineType = lineTypeTarget;
      }
      if (line.lineID === endLineID) {
        break;
      } else {
        _results.push(line = line.lineNext);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  shiftTab
  #   param : myRange : if defined, refers to a specific region to untab
  */


  CNeditor.prototype.shiftTab = function(range) {
    var endDiv, endLineID, isTabAllowed, line, lineTypeTarget, nextL, parent, sel, startDiv, _results;
    if (range == null) {
      sel = this.getEditorSelection();
      range = sel.getRangeAt(0);
    }
    startDiv = selection.getStartDiv(range);
    endDiv = selection.getEndDiv(range, startDiv);
    endLineID = endDiv.id;
    line = this._lines[startDiv.id];
    _results = [];
    while (true) {
      switch (line.lineType) {
        case 'Tu':
        case 'Th':
        case 'To':
          parent = line.linePrev;
          while (parent !== null && parent.lineDepthAbs >= line.lineDepthAbs) {
            parent = parent.linePrev;
          }
          if (parent !== null) {
            isTabAllowed = true;
            lineTypeTarget = parent.lineType;
            lineTypeTarget = "L" + lineTypeTarget.charAt(1);
            line.lineDepthAbs -= 1;
            line.lineDepthRel -= parent.lineDepthRel;
            if ((line.lineNext != null) && line.lineNext.lineType[0] === 'L') {
              nextL = line.lineNext;
              nextL.lineType = 'T' + nextL.lineType[1];
              nextL.line$.prop('class', "" + nextL.lineType + "-" + nextL.lineDepthAbs);
            }
          } else {
            isTabAllowed = false;
          }
          break;
        case 'Lh':
          isTabAllowed = true;
          lineTypeTarget = 'Th';
          break;
        case 'Lu':
          isTabAllowed = true;
          lineTypeTarget = 'Tu';
          break;
        case 'Lo':
          isTabAllowed = true;
          lineTypeTarget = 'To';
      }
      if (isTabAllowed) {
        line.line$.prop("class", "" + lineTypeTarget + "-" + line.lineDepthAbs);
        line.lineType = lineTypeTarget;
      }
      if (line.lineID === endDiv.id) {
        break;
      } else {
        _results.push(line = line.lineNext);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  _return
  # return keypress
  #   e = event
  */


  CNeditor.prototype._return = function() {
    var currSel, endLine, endOfLineFragment, newLine, range4sel, startLine;
    this._findLinesAndIsStartIsEnd();
    currSel = this.currentSel;
    startLine = currSel.startLine;
    endLine = currSel.endLine;
    if (currSel.range.collapsed) {

    } else if (endLine === startLine) {
      currSel.range.deleteContents();
    } else {
      this._deleteMultiLinesSelections();
      this._findLinesAndIsStartIsEnd();
      currSel = this.currentSel;
      startLine = currSel.startLine;
    }
    if (currSel.rangeIsEndLine) {
      newLine = this._insertLineAfter({
        sourceLine: startLine,
        targetLineType: startLine.lineType,
        targetLineDepthAbs: startLine.lineDepthAbs,
        targetLineDepthRel: startLine.lineDepthRel
      });
      range4sel = rangy.createRange();
      range4sel.collapseToPoint(newLine.line$[0].firstChild, 0);
      return currSel.sel.setSingleRange(range4sel);
    } else if (currSel.rangeIsStartLine) {
      newLine = this._insertLineBefore({
        sourceLine: startLine,
        targetLineType: startLine.lineType,
        targetLineDepthAbs: startLine.lineDepthAbs,
        targetLineDepthRel: startLine.lineDepthRel
      });
      range4sel = rangy.createRange();
      range4sel.collapseToPoint(startLine.line$[0].firstChild, 0);
      return currSel.sel.setSingleRange(range4sel);
    } else {
      currSel.range.setEndBefore(startLine.line$[0].lastChild);
      endOfLineFragment = currSel.range.extractContents();
      currSel.range.deleteContents();
      newLine = this._insertLineAfter({
        sourceLine: startLine,
        targetLineType: startLine.lineType,
        targetLineDepthAbs: startLine.lineDepthAbs,
        targetLineDepthRel: startLine.lineDepthRel,
        fragment: endOfLineFragment
      });
      range4sel = rangy.createRange();
      range4sel.collapseToPoint(newLine.line$[0].firstChild, 0);
      currSel.sel.setSingleRange(range4sel);
      return this.currentSel = null;
    }
  };

  /* ------------------------------------------------------------------------
  #  _findParent1stSibling
  # 
  # find the sibling line of the parent of line that is the first of the list
  # ex :
  #   . Sibling1 <= _findParent1stSibling(line)
  #   . Sibling2
  #   . Parent
  #      . child1
  #      . line     : the line in argument
  # returns null if no previous sibling, the line otherwise
  # the sibling is a title (Th, Tu or To), not a line (Lh nor Lu nor Lo)
  */


  CNeditor.prototype._findParent1stSibling = function(line) {
    var lineDepthAbs, linePrev;
    lineDepthAbs = line.lineDepthAbs;
    linePrev = line.linePrev;
    if (linePrev === null) {
      return line;
    }
    if (lineDepthAbs <= 2) {
      while (linePrev.linePrev !== null) {
        linePrev = linePrev.linePrev;
      }
      return linePrev;
    } else {
      while (linePrev !== null && linePrev.lineDepthAbs > (lineDepthAbs - 2)) {
        linePrev = linePrev.linePrev;
      }
      return linePrev.lineNext;
    }
  };

  /* ------------------------------------------------------------------------
  #  _findPrevSibling
  # 
  # find the previous sibling line.
  # returns null if no previous sibling, the line otherwise
  # the sibling is a title (Th, Tu or To), not a line (Lh nor Lu nor Lo)
  */


  CNeditor.prototype._findPrevSibling = function(line) {
    var lineDepthAbs, linePrevSibling;
    lineDepthAbs = line.lineDepthAbs;
    linePrevSibling = line.linePrev;
    if (linePrevSibling === null) {
      return null;
    } else if (linePrevSibling.lineDepthAbs < lineDepthAbs) {
      return null;
    } else {
      while (linePrevSibling.lineDepthAbs > lineDepthAbs) {
        linePrevSibling = linePrevSibling.linePrev;
      }
      while (linePrevSibling.lineType[0] === 'L') {
        linePrevSibling = linePrevSibling.linePrev;
      }
      return linePrevSibling;
    }
  };

  /**
  # Delete the user multi line selection
  # Prerequisite : at least 2 different lines must be selected
  # If startLine and endLine are specified, lines included between these two
  # are deleted (including startLine & endLine.
  # @param  {[line]} startLine [optional] if exists, the whole line will be taken
  # @param  {[line]} endLine   [optional] if exists, the whole line will be taken
  # @return {[none]}           [nothing]
  */


  CNeditor.prototype._deleteMultiLinesSelections = function(startLine, endLine) {
    var curSel, deltaDepth, endLineDepth, endOfLineFragment, nextEndLine, prevStartLine, range, replaceCaret, startContainer, startLineDepth, startOffset;
    if (this.currentSel == null) {
      console.log("no selection, can't delete multi lines");
      return null;
    }
    if (startLine != null) {
      range = rangy.createRange();
      selection.cleanSelection(startLine, endLine, range);
      replaceCaret = false;
    } else {
      curSel = this._findLines();
      range = curSel.range;
      startContainer = range.startContainer;
      startOffset = range.startOffset;
      startLine = curSel.startLine;
      endLine = curSel.endLine;
      if (startLine != null) {
        prevStartLine = startLine.linePrev;
      }
      if (endLine != null) {
        nextEndLine = endLine.lineNext;
      }
      replaceCaret = true;
    }
    startLineDepth = startLine.lineDepthAbs;
    endLineDepth = endLine.lineDepthAbs;
    deltaDepth = endLineDepth - startLineDepth;
    endOfLineFragment = selection.cloneEndFragment(range, endLine);
    this._adaptEndLineType(startLine, endLine);
    this._deleteSelectedLines(range);
    this._addMissingFragment(startLine, endOfLineFragment);
    this._removeEndLine(startLine, endLine);
    this._adaptDepth(startLine, startLineDepth, endLineDepth, deltaDepth);
    if (replaceCaret) {
      return this._setCaret(startContainer, startOffset, startLine, nextEndLine);
    }
  };

  CNeditor.prototype._trimLine = function(startLine) {};

  CNeditor.prototype._adaptDepth = function(startLine, startLineDepthAbs, endLineDepthAbs, deltaDepth) {
    var deltaDepth1stLine, depthSibling, firstLineAfterSiblingsOfDeleted, line, newDepth, prevSiblingType;
    line = startLine.lineNext;
    if (line !== null) {
      deltaDepth1stLine = line.lineDepthAbs - startLineDepthAbs;
      if (deltaDepth1stLine > 1) {
        while (line !== null && line.lineDepthAbs >= endLineDepthAbs) {
          newDepth = line.lineDepthAbs - deltaDepth;
          line.lineDepthAbs = newDepth;
          line.line$.prop("class", "" + line.lineType + "-" + newDepth);
          line = line.lineNext;
        }
      }
    }
    if (line !== null) {
      if (line.lineType[0] === 'L') {
        line.lineType = 'T' + line.lineType[1];
        line.line$.prop("class", "" + line.lineType + "-" + line.lineDepthAbs);
      }
      firstLineAfterSiblingsOfDeleted = line;
      depthSibling = line.lineDepthAbs;
      while (line !== null && line.lineDepthAbs > depthSibling) {
        line = line.linePrev;
      }
      if (line !== null && line !== firstLineAfterSiblingsOfDeleted) {
        prevSiblingType = line.lineType;
        if (firstLineAfterSiblingsOfDeleted.lineType !== prevSiblingType) {
          if (prevSiblingType[1] === 'h') {
            return this._line2titleList(firstLineAfterSiblingsOfDeleted);
          } else {
            return this.markerList(firstLineAfterSiblingsOfDeleted);
          }
        }
      }
    }
  };

  CNeditor.prototype._deleteSelectedLines = function(range) {
    return range.deleteContents();
  };

  CNeditor.prototype._addMissingFragment = function(startLine, endOfLineFragment) {
    var endLine, l, newText, startContainer, startFrag, startOffset, _ref;
    startFrag = endOfLineFragment.childNodes[0];
    if (startLine.line$[0].lastChild === null) {
      startLine.line$.prepend('<span></span>');
    }
    if (startLine.line$[0].lastChild.nodeName === 'BR') {
      startLine.line$[0].removeChild(startLine.line$[0].lastChild);
    }
    endLine = startLine.line$[0].lastChild;
    if ((startFrag.tagName === (_ref = endLine.tagName) && _ref === 'SPAN') && startFrag.className === endLine.className) {
      startOffset = endLine.textContent.length;
      newText = endLine.textContent + startFrag.textContent;
      endLine.innerHTML = newText;
      startContainer = endLine.firstChild;
      l = 1;
      while (l < endOfLineFragment.childNodes.length) {
        $(endOfLineFragment.childNodes[l]).appendTo(startLine.line$);
        l++;
      }
      if ((startContainer != null ? startContainer.nodeName : void 0) === '#text') {
        startContainer = endLine.nextLine;
      }
      return startContainer;
    } else {
      startLine.line$.append(endOfLineFragment);
      return null;
    }
  };

  CNeditor.prototype._removeEndLine = function(startLine, endLine) {
    startLine.lineNext = endLine.lineNext;
    if (endLine.lineNext !== null) {
      endLine.lineNext.linePrev = startLine;
    }
    endLine.line$.remove();
    return delete this._lines[endLine.lineID];
  };

  CNeditor.prototype._adaptEndLineType = function(startLine, endLine) {
    var endLineType, startLineType;
    endLineType = endLine.lineType;
    startLineType = startLine.lineType;
    if (endLineType[1] === 'h' && startLineType[1] === !'h') {
      if (endLineType[0] === 'L') {
        endLineType = 'T' + endLineType[1];
        endLine.line$.prop("class", "" + endLineType + "-" + endLineDepth);
      }
      return this.markerList(endLine);
    }
  };

  CNeditor.prototype._setCaret = function(startContainer, startOffset, startLine, nextEndLine, prevStartLine) {
    var range;
    if (startOffset === 0) {
      if ((prevStartLine != null) || (nextEndLine != null)) {
        if (startLine != null) {
          startContainer = startLine.line$[0].firstChild.firstChild;
        } else {
          startContainer = nextEndLine.line$[0];
        }
      } else {
        console.log("ctrl a");
        startContainer = startLine.line$[0].lastChild;
        console.log(startContainer);
      }
    } else {
      startContainer = startLine.line$[0].firstChild.firstChild;
    }
    range = rangy.createRange();
    range.collapseToPoint(startContainer, startOffset);
    return this.currentSel.sel.setSingleRange(range);
  };

  /* ------------------------------------------------------------------------
  #  _insertLineAfter
  # 
  # Insert a line after a source line
  # The line will be inserted in the parent of the source line (which can be 
  # the editor or a fragment in the case of the paste for instance)
  # p = 
  #     sourceLine         : line after which the line will be added
  #     fragment           : [optionnal] - an html fragment that will be added
  #                          in the div of the line.
  #     innerHTML          : [optionnal] - an html string that will be added
  #     targetLineType     : type of the line to add
  #     targetLineDepthAbs : absolute depth of the line to add
  #     targetLineDepthRel : relative depth of the line to add
  */


  CNeditor.prototype._insertLineAfter = function(p) {
    var lineID, newLine, newLine$, nextSibling, sourceLine;
    this._highestId += 1;
    lineID = 'CNID_' + this._highestId;
    if (p.fragment != null) {
      newLine$ = $("<div id='" + lineID + "' class='" + p.targetLineType + "-" + p.targetLineDepthAbs + "'></div>");
      newLine$.append(p.fragment);
      if (newLine$[0].childNodes.length === 0 || newLine$[0].lastChild.nodeName !== 'BR') {
        newLine$.append('<br>');
      }
    } else if (p.innerHTML != null) {
      newLine$ = $("<div id='" + lineID + "' class='" + p.targetLineType + "-" + p.targetLineDepthAbs + "'>                " + p.innerHTML + "</div>");
      if (newLine$[0].lastChild.nodeName !== 'BR') {
        newLine$.append('<br>');
      }
    } else {
      newLine$ = $("<div id='" + lineID + "' class='" + p.targetLineType + "-" + p.targetLineDepthAbs + "'></div>");
      newLine$.append($('<span></span><br>'));
    }
    sourceLine = p.sourceLine;
    nextSibling = sourceLine.line$[0].nextSibling;
    if (nextSibling === null) {
      sourceLine.line$[0].parentNode.appendChild(newLine$[0]);
    } else {
      newLine$ = $(sourceLine.line$[0].parentNode.insertBefore(newLine$[0], nextSibling));
    }
    newLine = {
      line$: newLine$,
      lineID: lineID,
      lineType: p.targetLineType,
      lineDepthAbs: p.targetLineDepthAbs,
      lineDepthRel: p.targetLineDepthRel,
      lineNext: sourceLine.lineNext,
      linePrev: sourceLine
    };
    this._lines[lineID] = newLine;
    if (sourceLine.lineNext !== null) {
      sourceLine.lineNext.linePrev = newLine;
    }
    sourceLine.lineNext = newLine;
    return newLine;
  };

  /* ------------------------------------------------------------------------
  #  _insertLineBefore
  # 
  # Insert a line before a source line
  # p = 
  #     sourceLine         : ID of the line before which a line will be added
  #     fragment           : [optionnal] - an html fragment that will be added
  #     targetLineType     : type of the line to add
  #     targetLineDepthAbs : absolute depth of the line to add
  #     targetLineDepthRel : relative depth of the line to add
  */


  CNeditor.prototype._insertLineBefore = function(p) {
    var lineID, newLine, newLine$, sourceLine;
    this._highestId += 1;
    lineID = 'CNID_' + this._highestId;
    newLine$ = $("<div id='" + lineID + "' class='" + p.targetLineType + "-" + p.targetLineDepthAbs + "'></div>");
    if (p.fragment != null) {
      newLine$.append(p.fragment);
      newLine$.append($('<br>'));
    } else {
      newLine$.append($('<span></span><br>'));
    }
    sourceLine = p.sourceLine;
    newLine$ = newLine$.insertBefore(sourceLine.line$);
    newLine = {
      line$: newLine$,
      lineID: lineID,
      lineType: p.targetLineType,
      lineDepthAbs: p.targetLineDepthAbs,
      lineDepthRel: p.targetLineDepthRel,
      lineNext: sourceLine,
      linePrev: sourceLine.linePrev
    };
    this._lines[lineID] = newLine;
    if (sourceLine.linePrev !== null) {
      sourceLine.linePrev.lineNext = newLine;
    }
    sourceLine.linePrev = newLine;
    return newLine;
  };

  CNeditor.prototype._findStartLine = function(startContainer) {
    var startLine;
    if (startContainer.nodeName === 'DIV') {
      return startLine = this._lines[startContainer.id];
    } else {
      return startLine = this._lines[selection.getLineDiv(startContainer).id];
    }
  };

  CNeditor.prototype._findEndLine = function(endContainer) {
    var endLine;
    if ((endContainer.id != null) && endContainer.id.substr(0, 5) === 'CNID_') {
      endLine = this._lines[endContainer.id];
    } else {
      endLine = this._lines[selection.getLineDiv(endContainer).id];
    }
    return endLine;
  };

  /* ------------------------------------------------------------------------
  #  _endDiv
  #  
  # Finds :
  #   First and last line of selection. 
  # Remark :
  #   Only the first range of the selections is taken into account.
  # Returns : 
  #   sel : the selection
  #   range : the 1st range of the selections
  #   startLine : the 1st line of the range
  #   endLine : the last line of the range
  */


  CNeditor.prototype._findLines = function() {
    var endLine, range, sel, startLine;
    if (this.currentSel === null) {
      sel = this.getEditorSelection();
      range = sel.getRangeAt(0);
      endLine = this._findEndLine(range.endContainer);
      startLine = this._findStartLine(range.startContainer);
      this.currentSel = {
        sel: sel,
        range: range,
        startLine: startLine,
        endLine: endLine,
        rangeIsStartLine: null,
        rangeIsEndLine: null
      };
    }
    return this.currentSel;
  };

  /* ------------------------------------------------------------------------
  #  _findLinesAndIsStartIsEnd
  # 
  # Finds :
  #   first and last line of selection 
  #   wheter the selection starts at the beginning of startLine or not
  #   wheter the selection ends at the end of endLine or not
  # 
  # Remark :
  #   Only the first range of the selections is taken into account.
  #
  # Returns : 
  #   sel   : the selection
  #   range : the 1st range of the selections
  #   startLine : the 1st line of the range
  #   endLine   : the last line of the range
  #   rangeIsEndLine   : true if the range ends at the end of the last line
  #   rangeIsStartLine : true if the range starts at the start of 1st line
  */


  CNeditor.prototype._findLinesAndIsStartIsEnd = function() {
    var endContainer, endLine, endLineDiv, initialEndOffset, initialStartOffset, nextSibling, parentEndContainer, parentStartContainer, range, rangeIsEndLine, rangeIsStartLine, sel, startContainer, startLine;
    sel = this.getEditorSelection();
    range = sel.getRangeAt(0);
    startContainer = range.startContainer;
    endContainer = range.endContainer;
    initialStartOffset = range.startOffset;
    initialEndOffset = range.endOffset;
    if ((endContainer.id != null) && endContainer.id.substr(0, 5) === 'CNID_') {
      endLine = this._lines[endContainer.id];
      rangeIsEndLine = endContainer.children.length < initialEndOffset || endContainer.children[initialEndOffset].nodeName === "BR";
    } else if ($(endContainer).parents("div").length > 0) {
      endLineDiv = selection.getLineDiv(endContainer);
      endLine = this._lines[endLineDiv.id];
      rangeIsEndLine = false;
      if (endContainer.nodeType === Node.TEXT_NODE) {
        rangeIsEndLine = endContainer.nextSibling === null && initialEndOffset === endContainer.textContent.length;
      } else {
        rangeIsEndLine = endContainer.nodeName === 'BR' || (endContainer.nextSibling.nodeName === 'BR' && endContainer.childNodes.length === initialEndOffset);
      }
      parentEndContainer = endContainer.parentNode;
      while (rangeIsEndLine && parentEndContainer.nodeName !== "DIV") {
        nextSibling = parentEndContainer.nextSibling;
        rangeIsEndLine = nextSibling === null || nextSibling.nodeName === 'BR';
        parentEndContainer = parentEndContainer.parentNode;
      }
    } else {
      endLine = this._lines["CNID_1"];
    }
    if (startContainer.nodeName === 'DIV') {
      startLine = this._lines[startContainer.id];
      rangeIsStartLine = initialStartOffset === 0;
    } else if ($(startContainer).parents("div").length > 0) {
      startLine = this._lines[selection.getLineDiv(startContainer).id];
      if (startContainer.nodeType === Node.TEXT_NODE) {
        rangeIsStartLine = endContainer.previousSibling === null && initialStartOffset === 0;
      } else {
        rangeIsStartLine = initialStartOffset === 0;
      }
      parentStartContainer = startContainer.parentNode;
      while (rangeIsStartLine && parentStartContainer.nodeName !== "DIV") {
        rangeIsStartLine = parentStartContainer.previousSibling === null;
        parentStartContainer = parentStartContainer.parentNode;
      }
    } else {
      startLine = this._lines["CNID_1"];
    }
    if ((endLine != null ? endLine.line$[0].innerHTML : void 0) === "<span></span><br>") {
      rangeIsEndLine = true;
    }
    if ((startLine != null ? startLine.line$[0].innerHTML : void 0) === "<span></span><br>") {
      rangeIsStartLine = true;
    }
    this.currentSel = {
      sel: sel,
      range: range,
      startLine: startLine,
      endLine: endLine,
      rangeIsStartLine: rangeIsStartLine,
      rangeIsEndLine: rangeIsEndLine
    };
    return this.currrentSel;
  };

  /*  -----------------------------------------------------------------------
  #   _readHtml
  # 
  # Parse a raw html inserted in the iframe in order to update the controller
  */


  CNeditor.prototype._readHtml = function() {
    var deltaDepthAbs, htmlLine, htmlLine$, lineClass, lineDepthAbs, lineDepthAbs_old, lineDepthRel, lineDepthRel_old, lineID, lineID_st, lineNew, lineNext, linePrev, lineType, linesDiv$, _i, _len, _ref;
    linesDiv$ = $(this.linesDiv).children();
    lineDepthAbs = 0;
    lineDepthRel = 0;
    lineID = 0;
    this._lines = {};
    linePrev = null;
    lineNext = null;
    for (_i = 0, _len = linesDiv$.length; _i < _len; _i++) {
      htmlLine = linesDiv$[_i];
      htmlLine$ = $(htmlLine);
      lineClass = (_ref = htmlLine$.attr('class')) != null ? _ref : "";
      lineClass = lineClass.split('-');
      lineType = lineClass[0];
      if (lineType !== "") {
        lineDepthAbs_old = lineDepthAbs;
        lineDepthAbs = +lineClass[1];
        deltaDepthAbs = lineDepthAbs - lineDepthAbs_old;
        lineDepthRel_old = lineDepthRel;
        if (lineType === "Th") {
          lineDepthRel = 0;
        } else {
          lineDepthRel = lineDepthRel_old + deltaDepthAbs;
        }
        lineID = parseInt(lineID, 10) + 1;
        lineID_st = "CNID_" + lineID;
        htmlLine$.prop("id", lineID_st);
        lineNew = {
          line$: htmlLine$,
          lineID: lineID_st,
          lineType: lineType,
          lineDepthAbs: lineDepthAbs,
          lineDepthRel: lineDepthRel,
          lineNext: null,
          linePrev: linePrev
        };
        if (linePrev !== null) {
          linePrev.lineNext = lineNew;
        }
        linePrev = lineNew;
        this._lines[lineID_st] = lineNew;
      }
    }
    return this._highestId = lineID;
  };

  /* ------------------------------------------------------------------------
  # LINES MOTION MANAGEMENT
  # 
  # Functions to perform the motion of an entire block of lines
  # BUG : when doubleclicking on an end of line then moving this line
  #       down, selection does not behave as expected :-)
  # TODO: correct behavior when moving the second line up
  # TODO: correct behavior when moving the first line down
  # TODO: improve re-insertion of the line swapped with the block
  */


  /* ------------------------------------------------------------------------
  # _moveLinesDown:
  #
  # -variables:
  #    linePrev                                       linePrev
  #    lineStart__________                            lineNext
  #    |.                 | The block                 lineStart_______
  #    |.                 | to move down      ==>     |.              |
  #    lineEnd____________|                           |.              |
  #    lineNext                                       lineEnd_________|
  #
  # -algorithm:
  #    1.delete lineNext with _deleteMultilinesSelections()
  #    2.insert lineNext between linePrev and lineStart
  #    3.if lineNext is more indented than linePrev, untab lineNext
  #      until it is ok
  #    4.else (lineNext less indented than linePrev), select the block
  #      (lineStart and some lines below) that is more indented than lineNext
  #      and untab it until it is ok
  */


  CNeditor.prototype._moveLinesDown = function() {
    var cloneLine, endDiv, endLineID, line, lineEnd, lineNext, linePrev, lineStart, myRange, numOfUntab, range, sel, startDiv, startLineID, _results, _results1;
    sel = this.getEditorSelection();
    range = sel.getRangeAt(0);
    startDiv = selection.getStartDiv(range);
    endDiv = selection.getEndDiv(range, startDiv);
    startLineID = startDiv.id;
    endLineID = endDiv.id;
    lineStart = this._lines[startLineID];
    lineEnd = this._lines[endLineID];
    linePrev = lineStart.linePrev;
    lineNext = lineEnd.lineNext;
    if (lineNext !== null) {
      cloneLine = {
        line$: lineNext.line$.clone(),
        lineID: lineNext.lineID,
        lineType: lineNext.lineType,
        lineDepthAbs: lineNext.lineDepthAbs,
        lineDepthRel: lineNext.lineDepthRel,
        linePrev: lineNext.linePrev,
        lineNext: lineNext.lineNext
      };
      this._deleteMultiLinesSelections(lineEnd, lineNext);
      lineNext = cloneLine;
      this._lines[lineNext.lineID] = lineNext;
      lineNext.linePrev = linePrev;
      lineStart.linePrev = lineNext;
      if (lineNext.lineNext !== null) {
        lineNext.lineNext.linePrev = lineEnd;
      }
      lineEnd.lineNext = lineNext.lineNext;
      lineNext.lineNext = lineStart;
      if (linePrev !== null) {
        linePrev.lineNext = lineNext;
      }
      lineStart.line$.before(lineNext.line$);
      if (linePrev === null) {
        return;
      }
      if (lineNext.lineDepthAbs <= linePrev.lineDepthAbs) {
        line = lineNext;
        while (line.lineNext !== null && line.lineNext.lineDepthAbs > lineNext.lineDepthAbs) {
          line = line.lineNext;
        }
        if (line.lineNext !== null) {
          line = line.lineNext;
        }
        myRange = rangy.createRange();
        myRange.setStart(lineStart.line$[0], 0);
        myRange.setEnd(line.line$[0], 0);
        numOfUntab = lineStart.lineDepthAbs - lineNext.lineDepthAbs;
        if (lineNext.lineNext.lineType[0] === 'T') {
          if (lineStart.lineType[0] === 'T') {
            numOfUntab -= 1;
          } else {
            numOfUntab += 1;
          }
        }
        _results = [];
        while (numOfUntab >= 0) {
          this.shiftTab(myRange);
          _results.push(numOfUntab -= 1);
        }
        return _results;
      } else {
        myRange = rangy.createRange();
        myRange.setStart(lineNext.line$[0], 0);
        myRange.setEnd(lineNext.line$[0], 0);
        numOfUntab = lineNext.lineDepthAbs - linePrev.lineDepthAbs;
        if (lineStart.lineType[0] === 'T') {
          if (linePrev.lineType[0] === 'T') {
            numOfUntab -= 1;
          } else {
            numOfUntab += 1;
          }
        }
        _results1 = [];
        while (numOfUntab >= 0) {
          this.shiftTab(myRange);
          _results1.push(numOfUntab -= 1);
        }
        return _results1;
      }
    }
  };

  /* ------------------------------------------------------------------------
  # _moveLinesUp:
  #
  # -variables:
  #    linePrev                                   lineStart_________
  #    lineStart__________                        |.                |
  #    |.                 | The block             |.                |
  #    |.                 | to move up     ==>    lineEnd___________|
  #    lineEnd____________|                       linePrev
  #    lineNext                                   lineNext
  #
  # -algorithm:
  #    1.delete linePrev with _deleteMultilinesSelections()
  #    2.insert linePrev between lineEnd and lineNext
  #    3.if linePrev is more indented than lineNext, untab linePrev
  #      until it is ok
  #    4.else (linePrev less indented than lineNext), select the block
  #      (lineNext and some lines below) that is more indented than linePrev
  #      and untab it until it is ok
  */


  CNeditor.prototype._moveLinesUp = function() {
    var cloneLine, endDiv, endLineID, isSecondLine, line, lineEnd, lineNext, linePrev, lineStart, myRange, numOfUntab, range, sel, startDiv, startLineID, _results, _results1;
    sel = this.getEditorSelection();
    range = sel.getRangeAt(0);
    startDiv = selection.getStartDiv(range);
    endDiv = selection.getEndDiv(range, startDiv);
    startLineID = startDiv.id;
    endLineID = endDiv.id;
    lineStart = this._lines[startLineID];
    lineEnd = this._lines[endLineID];
    linePrev = lineStart.linePrev;
    lineNext = lineEnd.lineNext;
    if (linePrev !== null) {
      isSecondLine = linePrev.linePrev === null;
      cloneLine = {
        line$: linePrev.line$.clone(),
        lineID: linePrev.lineID,
        lineType: linePrev.lineType,
        lineDepthAbs: linePrev.lineDepthAbs,
        lineDepthRel: linePrev.lineDepthRel,
        linePrev: linePrev.linePrev,
        lineNext: linePrev.lineNext
      };
      this._deleteMultiLinesSelections(linePrev.linePrev, linePrev);
      if (isSecondLine) {
        $(linePrev.line$[0].firstElementChild).remove();
        linePrev.line$.append('<br>');
        lineStart.line$ = linePrev.line$;
        lineStart.line$.attr('id', lineStart.lineID);
        this._lines[lineStart.lineID] = lineStart;
      }
      linePrev = cloneLine;
      this._lines[linePrev.lineID] = linePrev;
      linePrev.lineNext = lineNext;
      lineEnd.lineNext = linePrev;
      if (linePrev.linePrev !== null) {
        linePrev.linePrev.lineNext = lineStart;
      }
      lineStart.linePrev = linePrev.linePrev;
      linePrev.linePrev = lineEnd;
      if (lineNext !== null) {
        lineNext.linePrev = linePrev;
      }
      lineEnd.line$.after(linePrev.line$);
      if (linePrev.lineDepthAbs <= lineEnd.lineDepthAbs && lineNext !== null) {
        line = linePrev;
        while (line.lineNext !== null && line.lineNext.lineDepthAbs > linePrev.lineDepthAbs) {
          line = line.lineNext;
        }
        if (line.lineNext !== null) {
          line = line.lineNext;
        }
        myRange = rangy.createRange();
        myRange.setStart(lineNext.line$[0], 0);
        myRange.setEnd(line.line$[0], 0);
        numOfUntab = lineNext.lineDepthAbs - linePrev.lineDepthAbs;
        if (linePrev.lineNext.lineType[0] === 'T') {
          if (linePrev.lineType[0] === 'T') {
            numOfUntab -= 1;
          } else {
            numOfUntab += 1;
          }
        }
        _results = [];
        while (numOfUntab >= 0) {
          this.shiftTab(myRange);
          _results.push(numOfUntab -= 1);
        }
        return _results;
      } else {
        myRange = rangy.createRange();
        myRange.setStart(linePrev.line$[0], 0);
        myRange.setEnd(linePrev.line$[0], 0);
        numOfUntab = linePrev.lineDepthAbs - lineEnd.lineDepthAbs;
        if (linePrev.lineType[0] === 'T') {
          if (lineEnd.lineType[0] === 'T') {
            numOfUntab -= 1;
          } else {
            numOfUntab += 1;
          }
        }
        _results1 = [];
        while (numOfUntab >= 0) {
          this.shiftTab(myRange);
          _results1.push(numOfUntab -= 1);
        }
        return _results1;
      }
    }
  };

  /*
      #  HISTORY MANAGEMENT:
      # 1. _addHistory (Save html code, selection markers, positions...)
      # 2. undoPossible (Return true only if unDo can be called)
      # 3. redoPossible (Return true only if reDo can be called)
      # 4. unDo (Undo the previous action)
      # 5. reDo ( Redo a undo-ed action)
      #
      # What is saved in the history:
      #  - current html content
      #  - current selection
      #  - current scrollbar position
      #  - the boolean newPosition
  */


  /*
      #  _addHistory
      # 
      # Add html code and selection markers and scrollbar positions to the history
  */


  CNeditor.prototype._addHistory = function() {
    var savedScroll, savedSel;
    savedSel = this.saveEditorSelection();
    this._history.historySelect.push(savedSel);
    savedScroll = {
      xcoord: this.editorBody$.scrollTop(),
      ycoord: this.editorBody$.scrollLeft()
    };
    this._history.historyScroll.push(savedScroll);
    this._history.historyPos.push(this.newPosition);
    this._history.history.push(this.editorBody$.html());
    rangy.removeMarkers(savedSel);
    return this._history.index = this._history.history.length - 1;
  };

  /* -------------------------------------------------------------------------
  #  undoPossible
  # Return true only if unDo can be called
  */


  CNeditor.prototype.undoPossible = function() {
    return this._history.index > 0;
  };

  /* -------------------------------------------------------------------------
  #  redoPossible
  # Return true only if reDo can be called
  */


  CNeditor.prototype.redoPossible = function() {
    return this._history.index < this._history.history.length - 2;
  };

  /* -------------------------------------------------------------------------
  #  unDo :
  # Undo the previous action
  */


  CNeditor.prototype.unDo = function() {
    var savedSel, xcoord, ycoord;
    if (this.undoPossible()) {
      if (this._history.index === this._history.history.length - 1) {
        this._addHistory();
        this._history.index -= 1;
      }
      this.newPosition = this._history.historyPos[this._history.index];
      this.linesDiv.innerHTML = this._history.history[this._history.index];
      savedSel = this._history.historySelect[this._history.index];
      savedSel.restored = false;
      rangy.restoreSelection(savedSel);
      xcoord = this._history.historyScroll[this._history.index].xcoord;
      ycoord = this._history.historyScroll[this._history.index].ycoord;
      this.editorBody$.scrollTop(xcoord);
      this.editorBody$.scrollLeft(ycoord);
      this._readHtml();
      return this._history.index -= 1;
    }
  };

  /* -------------------------------------------------------------------------
  #  reDo :
  # Redo a undo-ed action
  */


  CNeditor.prototype.reDo = function() {
    var savedSel, xcoord, ycoord;
    if (this.redoPossible()) {
      this.newPosition = this._history.historyPos[this._history.index + 1];
      this._history.index += 1;
      this.linesDiv.innerHTML = this._history.history[this._history.index + 1];
      savedSel = this._history.historySelect[this._history.index + 1];
      savedSel.restored = false;
      rangy.restoreSelection(savedSel);
      xcoord = this._history.historyScroll[this._history.index + 1].xcoord;
      ycoord = this._history.historyScroll[this._history.index + 1].ycoord;
      this.editorBody$.scrollTop(xcoord);
      this.editorBody$.scrollLeft(ycoord);
      return this._readHtml();
    }
  };

  /* ------------------------------------------------------------------------
  # EXTENSION  :  auto-summary management and upkeep
  # 
  # initialization
  # TODO: avoid updating the summary too often
  #       it would be best to make the update faster (rather than reading
  #       every line)
  */


  CNeditor.prototype._initSummary = function() {
    var summary;
    summary = this.editorBody$.children("#navi");
    if (summary.length === 0) {
      summary = $(document.createElement('div'));
      summary.attr('id', 'navi');
      summary.prependTo(this.editorBody$);
    }
    return summary;
  };

  CNeditor.prototype._buildSummary = function() {
    var c, lines, summary, _results;
    summary = this.initSummary();
    this.editorBody$.children("#navi").children().remove();
    lines = this._lines;
    _results = [];
    for (c in lines) {
      if (this.editorBody$.children("#" + ("" + lines[c].lineID)).length > 0 && lines[c].lineType === "Th") {
        _results.push(lines[c].line$.clone().appendTo(summary));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  /* ------------------------------------------------------------------------
  #  EXTENSION  :  DECORATION FUNCTIONS (bold/italic/underlined/quote)
  #  TODO
  */


  /* ------------------------------------------------------------------------
  #  PASTE MANAGEMENT
  # 0 - save selection
  # 1 - move the cursor into an invisible sandbox
  # 2 - redirect pasted content in this sandox
  # 3 - sanitize and adapt pasted content to the editor's format
  # 4 - restore selection
  # 5 - insert cleaned content is behind the cursor position
  */


  CNeditor.prototype.paste = function(event) {
    var mySandBox, range, sel;
    mySandBox = this.clipboard;
    this._findLinesAndIsStartIsEnd();
    range = rangy.createRange();
    range.selectNodeContents(mySandBox);
    sel = this.getEditorSelection();
    sel.setSingleRange(range);
    range.detach();
    if (event && event.clipboardData && event.clipboardData.getData) {
      if (event.clipboardData.types === "text/html") {
        mySandBox.innerHTML = event.clipboardData.getData('text/html');
      } else if (event.clipboardData.types === "text/plain") {
        mySandBox.innerHTML = event.clipboardData.getData('text/plain');
      } else {
        mySandBox.innerHTML = "";
      }
      this._waitForPasteData(mySandBox);
      if (event.preventDefault) {
        event.stopPropagation();
        event.preventDefault();
      }
      return false;
    } else {
      mySandBox.innerHTML = "";
      this._waitForPasteData(mySandBox);
      return true;
    }
  };

  /**
  # * init the div where the browser will actualy paste.
  # * this method is called after each refresh of the content of the editor (
  # * replaceContent, deleteContent, setEditorContent)
  # * TODO : should be called just once at editor init : for this the editable
  # * content shouldn't be directly in the body of the iframe but in a div.
  # * @return {obj} a ref to the clipboard div
  */


  CNeditor.prototype._initClipBoard = function() {
    var getOffTheScreen;
    this.clipboard$ = $(document.createElement('div'));
    this.clipboard$.attr('id', 'editor-clipboard');
    getOffTheScreen = {
      left: -300
    };
    this.clipboard$.offset(getOffTheScreen);
    this.clipboard$.prependTo(this.editorBody$);
    this.clipboard = this.clipboard$[0];
    this.clipboard.style.setProperty('width', '280px');
    this.clipboard.style.setProperty('position', 'fixed');
    this.clipboard.style.setProperty('overflow', 'hidden');
    return this.clipboard;
  };

  /**
   * Function that will call itself until the browser has pasted data in the
   * clipboar div
   * @param  {element} sandbox      the div where the browser will paste data
   * @param  {function} processpaste the function to call back whan paste 
   * is ok
  */


  CNeditor.prototype._waitForPasteData = function() {
    if (this.clipboard.childNodes && this.clipboard.childNodes.length > 0) {
      return this._processPaste();
    } else {
      return setTimeout(this._waitForPasteData, 10);
    }
  };

  /*
       * Called when the browser has pasted data in the clipboard div. Its role is to
       * insert the content of the clipboard into the editor.
       * @param  {element} sandbox
  */


  CNeditor.prototype._processPaste = function() {
    var absDepth, caretOffset, caretTextNodeTarget, currSel, currentLineFrag, domWalkContext, dummyLine, elToInsert, endLine, endOffset, endTargetLineFrag, firstAddedLine, frag, htmlStr, i, line, lineElements, lineNextStartLine, nbElements, newText, parendDiv, range, sandbox, secondAddedLine, startLine, startOffset, targetNode, targetText, txt;
    sandbox = this.clipboard;
    currSel = this.currentSel;
    sandbox.innerHTML = sanitize(sandbox.innerHTML).xss();
    frag = document.createDocumentFragment();
    dummyLine = {
      lineNext: null,
      linePrev: null,
      line$: $("<div id='dummy' class='Tu-1'></div>")
    };
    frag.appendChild(dummyLine.line$[0]);
    currentLineFrag = document.createDocumentFragment();
    absDepth = currSel.startLine.lineDepthAbs;
    if (currSel.startLine.lineType === 'Th') {
      absDepth += 1;
    }
    domWalkContext = {
      absDepth: absDepth,
      prevHxLevel: null,
      frag: frag,
      prevCNLineAbsDepth: null,
      lastAddedLine: dummyLine,
      currentLineFrag: currentLineFrag,
      currentLineEl: currentLineFrag,
      isCurrentLineBeingPopulated: false
    };
    htmlStr = this._domWalk(sandbox, domWalkContext);
    sandbox.innerHTML = "";
    frag.removeChild(frag.firstChild);
    /*
            # TODO : the following steps removes all the styles of the lines in frag
            # Later this will be removed in order to take into account styles.
    */

    i = 0;
    while (i < frag.childNodes.length) {
      line = frag.childNodes[i];
      txt = line.textContent;
      line.innerHTML = '<span></span><br>';
      line.firstChild.appendChild(document.createTextNode(txt));
      i += 1;
    }
    /*
            # END TODO
    */

    startLine = currSel.startLine;
    endLine = currSel.endLine;
    if (currSel.range.collapsed) {

    } else if (endLine === startLine) {
      currSel.range.deleteContents();
    } else {
      this._deleteMultiLinesSelections();
      this._findLinesAndIsStartIsEnd();
      currSel = this.currentSel;
      startLine = currSel.startLine;
    }
    targetNode = currSel.range.startContainer;
    startOffset = currSel.range.startOffset;
    if (targetNode.nodeName === 'DIV' && targetNode.id.substr(0, 5) === 'CNID_') {
      targetNode = targetNode.firstChild.firstChild;
      if (startOffset > 0) {
        startOffset = targetNode.length;
      } else {
        startOffset = 0;
      }
      endOffset = targetNode.length - startOffset;
    }
    if (targetNode.nodeName === 'SPAN') {
      targetNode = targetNode.firstChild;
      endOffset = targetNode.length - startOffset;
    }
    if (frag.childNodes.length > 0) {
      lineElements = frag.firstChild.childNodes;
    } else {
      lineElements = [frag];
    }
    i = 0;
    nbElements = lineElements.length;
    while (i < nbElements - 1) {
      elToInsert = lineElements[i];
      i += 1;
      if ((elToInsert.tagName === 'SPAN') && (targetNode.tagName === 'SPAN' || targetNode.nodeType === Node.TEXT_NODE)) {
        targetText = targetNode.textContent;
        newText = targetText.substr(0, startOffset);
        newText += elToInsert.textContent;
        newText += targetText.substr(startOffset);
        targetNode.textContent = newText;
        startOffset += elToInsert.textContent.length;
      }
    }
    if (frag.childNodes.length > 1) {
      range = document.createRange();
      range.setStart(targetNode, startOffset);
      parendDiv = targetNode;
      while (parendDiv.tagName !== 'DIV') {
        parendDiv = parendDiv.parentElement;
      }
      range.setEnd(parendDiv, parendDiv.children.length - 1);
      endTargetLineFrag = range.extractContents();
      range.detach();
      this._insertFrag(frag.lastChild, frag.lastChild.children.length - 1, endTargetLineFrag);
      parendDiv = targetNode;
      while (parendDiv.tagName !== 'DIV') {
        parendDiv = parendDiv.parentElement;
      }
    }
    firstAddedLine = dummyLine.lineNext;
    secondAddedLine = firstAddedLine != null ? firstAddedLine.lineNext : void 0;
    if (frag.firstChild != null) {
      frag.removeChild(frag.firstChild);
    }
    if (firstAddedLine != null) {
      delete this._lines[firstAddedLine.lineID];
    }
    if (secondAddedLine != null) {
      lineNextStartLine = currSel.startLine.lineNext;
      currSel.startLine.lineNext = secondAddedLine;
      secondAddedLine.linePrev = currSel.startLine;
      if (lineNextStartLine === null) {
        this.linesDiv.appendChild(frag);
      } else {
        domWalkContext.lastAddedLine.lineNext = lineNextStartLine;
        lineNextStartLine.linePrev = domWalkContext.lastAddedLine;
        this.linesDiv.insertBefore(frag, lineNextStartLine.line$[0]);
      }
    }
    if (secondAddedLine != null) {
      caretTextNodeTarget = lineNextStartLine.linePrev.line$[0].childNodes[0].firstChild;
      caretOffset = caretTextNodeTarget.length - endOffset;
      return currSel.sel.collapse(caretTextNodeTarget, caretOffset);
    } else {
      return currSel.sel.collapse(targetNode, startOffset);
    }
  };

  /**
   * Insert a frag in a node container at startOffset
   * ASSERTION : 
   * TODO : this method could be also used in _deleteMultiLinesSelections 
   * especialy if _insertFrag optimizes the insertion by fusionning cleverly
   * the elements
   * @param  {Node} targetContainer the node where to make the insert
   * @param  {Integer} targetOffset    the offset of insertion in targetContainer
   * @param  {fragment} frag           the fragment to insert
   * @return {nothing}                nothing
  */


  CNeditor.prototype._insertFrag = function(targetContainer, targetOffset, frag) {
    var range, targetNode;
    if (targetOffset === 0) {
      range = document.createRange();
      range.setStart(startContainer, startOffset);
      range.setEnd(startContainer, startOffset);
      range.insertNode(frag);
      return range.detach();
    } else {
      if (frag.childNodes.length > 0) {
        targetNode = targetContainer.childNodes[targetOffset - 1];
        return targetNode.textContent += frag.firstChild.textContent;
      }
    }
  };

  /**
   * Walks thoug an html tree in order to convert it in a strutured content
   * that fit to a note structure.
   * @param  {html element} elemt   Reference to an html element to be parsed
   * @param  {object} context _domWalk is recursive and its context of execution
   *                  is kept in this param instead of using the editor context
   *                  (quicker and better) isolation
  */


  CNeditor.prototype._domWalk = function(elemt, context) {
    var p;
    this.__domWalk(elemt, context);
    if (context.currentLineFrag.childNodes.length > 0) {
      p = {
        sourceLine: context.lastAddedLine,
        fragment: context.currentLineFrag,
        targetLineType: "Tu",
        targetLineDepthAbs: context.absDepth,
        targetLineDepthRel: context.absDepth
      };
      return context.lastAddedLine = this._insertLineAfter(p);
    }
  };

  /**
   * Walks thoug an html tree in order to convert it in a strutured content
   * that fit to a note structure.
   * @param  {html element} nodeToParse   Reference to an html element to 
   *                        be parsed
   * @param  {object} context __domWalk is recursive and its context of 
   *                          execution is kept in this param instead of 
   *                          using the editor context (quicker and better) 
   *                          isolation
  */


  CNeditor.prototype.__domWalk = function(nodeToParse, context) {
    var absDepth, child, deltaHxLevel, lastInsertedEl, prevHxLevel, spanEl, spanNode, txtNode, _i, _len, _ref, _ref1;
    absDepth = context.absDepth;
    prevHxLevel = context.prevHxLevel;
    _ref = nodeToParse.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      switch (child.nodeName) {
        case '#text':
          txtNode = document.createTextNode(child.textContent);
          if ((_ref1 = context.currentLineEl.nodeName) === 'SPAN' || _ref1 === 'A') {
            context.currentLineEl.appendChild(txtNode);
          } else {
            spanEl = document.createElement('span');
            spanEl.appendChild(txtNode);
            context.currentLineEl.appendChild(spanEl);
          }
          context.isCurrentLineBeingPopulated = true;
          break;
        case 'P':
        case 'UL':
        case 'OL':
          context.absDepth = absDepth;
          this.__domWalk(child, context);
          if (context.isCurrentLineBeingPopulated) {
            this._appendCurrentLineFrag(context, absDepth, absDepth);
          }
          break;
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          deltaHxLevel = 0;
          this.__domWalk(child, context);
          if (context.isCurrentLineBeingPopulated) {
            this._appendCurrentLineFrag(context, Math.min(0, deltaHxLevel) + absDepth, Math.min(0, deltaHxLevel) + absDepth);
          }
          break;
        case 'LI':
          if (context.isCurrentLineBeingPopulated) {
            this._appendCurrentLineFrag(context, absDepth, absDepth);
          }
          this.__domWalk(child, context);
          if (context.isCurrentLineBeingPopulated) {
            this._appendCurrentLineFrag(context, absDepth, absDepth);
          }
          break;
        case 'BR':
          this._appendCurrentLineFrag(context, absDepth, absDepth);
          break;
        case 'A':
          lastInsertedEl = context.currentLineEl.lastChild;
          if (lastInsertedEl !== null && lastInsertedEl.nodeName === 'SPAN') {
            lastInsertedEl.textContent += '[[' + child.textContent + '|' + child.href + ']]';
          } else {
            spanNode = document.createElement('a');
            spanNode.href = child.href;
            spanNode.textContent = child.textContent;
            context.currentLineEl.appendChild(spanNode);
          }
          context.isCurrentLineBeingPopulated = true;
          break;
        case 'DIV':
          if (child.id.substr(0, 5) === 'CNID_') {
            this._clipBoard_Insert_InternalLine(child, context);
          } else {
            this.__domWalk(child, context);
          }
          break;
        default:
          lastInsertedEl = context.currentLineEl.lastChild;
          if (lastInsertedEl !== null && lastInsertedEl.nodeName === 'SPAN') {
            lastInsertedEl.textContent += child.textContent;
          } else {
            spanNode = document.createElement('span');
            spanNode.textContent = child.textContent;
            context.currentLineEl.appendChild(spanNode);
          }
          context.isCurrentLineBeingPopulated = true;
      }
    }
    return true;
  };

  /**
   * Append to frag the currentLineFrag and prepare a new empty one.
   * @param  {Object} context  [description]
   * @param  {Number} absDepth absolute depth of the line to insert
   * @param  {Number} relDepth relative depth of the line to insert
  */


  CNeditor.prototype._appendCurrentLineFrag = function(context, absDepth, relDepth) {
    var p, spanNode;
    if (context.currentLineFrag.childNodes.length === 0) {
      spanNode = document.createElement('span');
      context.currentLineFrag.appendChild(spanNode);
    }
    p = {
      sourceLine: context.lastAddedLine,
      fragment: context.currentLineFrag,
      targetLineType: "Tu",
      targetLineDepthAbs: absDepth,
      targetLineDepthRel: relDepth
    };
    context.lastAddedLine = this._insertLineAfter(p);
    context.currentLineFrag = document.createDocumentFragment();
    context.currentLineEl = context.currentLineFrag;
    return context.isCurrentLineBeingPopulated = false;
  };

  /**
   * Insert in the editor a line that was copied in a cozy note editor
   * @param  {html element} elemt a div ex : <div id="CNID_7" class="Lu-3"> ... </div>
   * @return {line}        a ref to the line object
  */


  CNeditor.prototype._clipBoard_Insert_InternalLine = function(elemt, context) {
    var deltaDepth, lineClass, lineDepthAbs, p;
    lineClass = elemt.className.split('-');
    lineDepthAbs = +lineClass[1];
    lineClass = lineClass[0];
    if (!context.prevCNLineAbsDepth) {
      context.prevCNLineAbsDepth = lineDepthAbs;
    }
    deltaDepth = lineDepthAbs - context.prevCNLineAbsDepth;
    if (deltaDepth > 0) {

    } else {

    }
    p = {
      sourceLine: context.lastAddedLine,
      innerHTML: elemt.innerHTML,
      targetLineType: "Tu",
      targetLineDepthAbs: context.absDepth,
      targetLineDepthRel: context.absDepth
    };
    return context.lastAddedLine = this._insertLineAfter(p);
  };

  /* ------------------------------------------------------------------------
  # EXTENSION  :  cleaned up HTML parsing
  #
  #  (TODO)
  # 
  # We suppose the html treated here has already been sanitized so the DOM
  #  structure is coherent and not twisted
  # 
  # _parseHtml:
  #  Parse an html string and return the matching html in the editor's format
  # We try to restitute the very structure the initial fragment :
  #   > indentation
  #   > lists
  #   > images, links, tables... and their specific attributes
  #   > text
  #   > textuals enhancements (bold, underlined, italic)
  #   > titles
  #   > line return
  # 
  # Ideas to do that :
  #  0- textContent is always kept
  #  1- A, IMG keep their specific attributes
  #  2- UL, OL become divs whose class is Tu/To. LI become Lu/Lo
  #  3- H[1-6] become divs whose class is Th. Depth is determined depending on
  #     where the element was pasted.
  #  4- U, B have the effect of adding to each elt they contain a class (bold
  #     and underlined class)
  #  5- BR delimit the different DIV that will be added
  #  6- relative indentation preserved with imbrication of paragraphs P
  #  7- any other elt is turned into a simple SPAN with a textContent
  #  8- IFRAME, FRAME, SCRIPT are ignored
  */


  CNeditor.prototype.logKeyPress = function(e) {};

  return CNeditor;

})();

CNeditor = exports.CNeditor;
