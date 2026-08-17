ace.define("ace/mode/rakudoc", function (require,exports,module) {
    "use strict";
    const TextMode = require("ace/mode/text").Mode;
    const Tokenizer = require("ace/tokenizer").Tokenizer;
    const { config } = require("ace/lib/lang");

    var RakuDocHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var s_directive = "constant.type";
    var s_opn_contin = "storage.type";
    var s_builtin = "support.function";
    var s_semantic = "support.constant";
    var s_custom = "support.variable";
    var s_markup = "markup.italic";
    var s_markup_cont = "string.double";
    var s_metaoption = "support.class";
    var s_option_cont = "string.single";
    var s_document = "constant.type";
    var s_rowcol = "constant.type";
    var s_alias = "storage.type";
    var s_alias_tag = "constant.type.italic";
    var s_alias_text = "support.variable";
    var s_place = "constant.type";
    var s_place_sc = "string.italic.bold.underline";
    var s_place_uri = "string.italic.underline";

    const Rules = function () {
        var builtin = ("cell|citation|code|input|output|comment|" +
            "head|defn|ignore|item|nested|para|rakudoc|section|pod|table|" +
            "formula|data");
        var semantic = "[A-Z0-9_-]+\\d*\\b";
        var custom = "[A-Z][a-zA-Z0-9_-]+\\d*\\b";
        var metaoption_b = {
            token: [s_metaoption],
            regex: "((?<=\\s)\\:\\!?[a-zA-Z][a-zA-Z0-9_-]+)\\b",
            next: "metaoptionLine"
        };
        var metaoption_c = {
            token: [s_metaoption, s_metaoption, s_option_cont, s_metaoption],
            regex: "(\\:[a-zA-Z][a-zA-Z0-9_-]+)([<({«]+)([^>)}»]+?)([>)}»]+)",
            next: "metaoptionLine"
        };
        var markups = {
            token: [s_markup, s_markup, s_markup_cont, s_markup],
            regex: "([A-Z])([<«(]+)([^>»)]+)([>»)]+)",
            next: "start"
        };

        this.$rules = {
            "start": [
                {
                    token: s_document,
                    regex: "^\\s*=document\\b",
                    next: "metaoptionLine"
                },
                {
                    token: [s_place, s_place_sc, s_place_uri],
                    regex: "(^\\s*=place\\s+)(\\S+\\:)(\\S+)",
                    next: "metaoptionLine"
                },
                {
                    token: s_rowcol,
                    regex: "^\\s*=row\\b|^\\s*=column\\b",
                    next: "metaoptionLine"
                },
                {
                    token: [s_alias, s_alias_tag],
                    regex: "(^\\s*=alias\\s+)" +
                        "([A-Z][A-Z_-]+\\b)",
                    next: "alias_text"
                },
                // blocks starting with =
                // semantic must always be before custom
                {
                    token: s_builtin,
                    regex: "(^\\s*=)(num)?(" + builtin + ")(\\d*\\b)"
                },
                {
                    token: s_semantic,
                    regex: "(^\\s*=)(" + semantic + ")"
                },
                {
                    token: s_custom,
                    regex: "(^\\s*=)(num)?(" + custom + ")"
                },
                markups,
                {
                    token: [s_directive, s_builtin, s_builtin, s_builtin],
                    regex: "(^\\s*=begin\\s+|^\\s*=for\\s+|^\\s*=config\\s+|^\\s*=counter\\s+)(num)?(" + builtin + ")(\\d*)",
                    next: "metaoptionLine"
                },
                {
                    token: [s_directive, s_semantic, s_semantic],
                    regex: "(^\\s*=begin\\s+|^\\s*=for\\s+|^\\s*=config\\s+|^\\s*=counter\\s+)(" + semantic + ")(\\d*)",
                    next: "metaoptionLine"
                },
                {
                    token: [s_directive, s_custom, s_custom, s_custom],
                    regex: "(^\\s*=begin\\s+|^\\s*=for\\s+|^\\s*=config\\s+|^\\s*=counter\\s+)(num)?(" + custom + ")(\\d*)",
                    next: "metaoptionLine"
                },
                // end blocks, no options
                {
                    token: [s_directive, s_builtin, s_builtin],
                    regex: "(^\\s*=end\\s+)(num)?(" + builtin + ")",
                    next: "start"
                },
                {
                    token: [s_directive, s_semantic],
                    regex: "(^\\s*=end\\s+)(" + semantic + ")",
                    next: "start"
                },
                {
                    token: [s_directive, s_custom],
                    regex: "(^\\s*=end\\s+)(num?" + custom + "\\d*)",
                    next: "start"
                }
            ],
            "alias_text": [
                {
                    token: s_alias_text,
                    regex: ".+|^=\\s.+",
                    next: "alias_text"
                },
                {
                    token: 'text',
                    regex: '(^$)|(?=\\=)',
                    next: 'start'
                }
            ],
            "metaoptionLine": [
                metaoption_c,
                metaoption_b,
                {
                    token: "invalid.illegal",
                    regex: "(?<=\\s)[^\\s:]\\S+\\b",
                    next: "metaoptionLine"
                },
                {// an = at start of line followed by whitespace is a continuation
                    token: s_opn_contin,
                    regex: "^\\s*=\\s",
                    next: "metaoptionLine"
                },
                {
                    token: "text",
                    regex: "^(?=\\s*=\\S)",
                    next: "start"
                },
                {
                    token: "text",
                    regex: "^(?:[^=])",
                    next: "start"
                },
                {
                    token: "text",
                    regex: "^$",
                    next: "start"
                }
            ]
        }
    };
    Rules.prototype = Object.create(RakuDocHighlightRules.prototype);
    Rules.prototype.constructor = Rules;

    const Mode = function () {
        TextMode.call(this);
        this.HighlightRules = Rules;
        this.$tokenizer = new Tokenizer( new Rules().$rules, "start" );
    }

    Mode.prototype = Object.create(TextMode.prototype);
    Mode.prototype.constructor = Mode;

    exports.Mode = Mode;
});