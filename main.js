/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** {brackets-textile} textile Syntax Highlighting for Brackets 
    Provides textile syntax highlight via a CodeMirror mode for Brackets. 
*/

define(function (require, exports, module) {
    'use strict';


    var LanguageManager = brackets.getModule("language/LanguageManager");

    var symbol_regex1 = /^(?:~|%|\^|\*|#|\+|\-|\_|=|\?|&)/;
    //var open_paren_regex = /^()/;
    //var close_paren_regex = /^()/;
    var keyword_regex1 = /^({|\[|!|\"!)/;
    var keyword_regex2 = /^(}|\(|\)|\]|!|!\"|layout:|title:|keywords:|description:)/;
    //var keyword_regex3 = /^()/;
    var html_regex1 = /^(div|<div|<\/div>|pre|table|form|input|<blockquote|<\/blockquote>|<notextile>)/;
    var html_regex2 = /^(h1|h2|h3|h4|h5|h6|p|bq|<\/notextile>)/;
    var comment_regex = /^(\<!--|-->)/;
    
    CodeMirror.defineMode("textile", function () {
        return {
            startState: function () {
                return {
                    inComment: false,
                    comment_indent: 0,
                    inString: false,
                    stringType: "",
                    beforeTag: true,
                    justMatchedKeyword: false,
                    justMatchedSymbol: false,
                    afterParen: false
                };
            },
            token: function (stream, state) {
                //check for state changes
                var next_state = false;
                if (state.justMatchedSymbol && !state.inString) {
                  if((stream.peek() == '"') || (stream.peek() == "'")) {
                    state.stringType = stream.peek();
                    stream.next(); // Skip quote
                    state.inString = true; // Update state
                    next_state = true;
                  } else if(stream.eatSpace() && ((stream.peek() == '"') || (stream.peek() == "'"))) {
                    state.stringType = stream.peek();
                    stream.next(); // Skip quote
                    state.inString = true; // Update state
                    next_state = true;
                  }
                }
                state.justMatchedSymbol = next_state;
              
                if(state.inComment) {
                  if(stream.indentation()<=state.comment_indent) {
                    state.inComment = false;
                  }
                }

                //return state
                if (state.inString) {
                    if (stream.skipTo(state.stringType)) { // Quote found on this line
                        stream.backUp(1);
                        if(stream.peek()=='\\') {
                          //escape quote and continue
                          stream.next();
                          stream.next();
                        } else {
                          stream.next(); // Skip char
                          stream.next(); // Skip quote
                          state.inString = false; // Clear flag
                        }
                    } else {
                        state.inString = false;
                    }
                    state.justMatchedKeyword = false;
                    return "string"; // Token style
                } else if(state.inComment) {
                  stream.skipToEnd();
                  return "comment";
                } else if(stream.sol() && stream.eatSpace()) {
                    if(stream.match(keyword_regex1)) {
                        state.justMatchedKeyword = true;
                        stream.eatSpace();
                        return "keyword";
                    } else if(stream.match(comment_regex)) {
                        state.comment_indent = stream.indentation();
                        state.inComment = true;
                        stream.skipToEnd();
                        return "comment";
                    } 
                    if(stream.match(html_regex1) || stream.match(html_regex2)) {
                        state.justMatchedKeyword = true;
                        return "keyword";
                    } 
                } else if(stream.sol() && stream.match(comment_regex)) {
                    state.comment_indent = stream.indentation();
                    state.inComment = true;
                    stream.skipToEnd();
                    return "comment";
                } else if(stream.sol() && stream.match(keyword_regex1)) {
                    state.justMatchedKeyword = true;
                    stream.eatSpace();
                    return "keyword";
                } else if(stream.sol() && (stream.match(html_regex1) || stream.match(html_regex2))) {
                    state.justMatchedKeyword = true;
                    return "keyword";
                } else if(stream.match(symbol_regex1)) {
                    state.justMatchedSymbol = true;
                    state.justMatchedKeyword = false;
                    return "atom";
                } else if(stream.match(keyword_regex2)) {
                    state.justMatchedKeyword = true;
                    return "keyword";
                } else if(stream.eatSpace()) {
                    state.justMatchedKeyword = false;
                } else {
                    var ch = stream.next();
                    if(state.justMatchedKeyword){
                        return "property";
                    } else if(state.afterParen) {
                        return "property";
                    }
                }
                return null;
            }
        };
    });

LanguageManager.defineLanguage("textile", {
    name: "Textile",
    mode: "textile",
    fileExtensions: ["textile"],
    blockComment: ["//","//"],
    lineComment: ["//-","//"]
});

});
