import { DelimiterHolder } from '@/service/common/delimiterHolder';
import { ConnectionManager } from '@/service/connectionManager';
import * as vscode from 'vscode';
import { SQLBlock, SQLToken } from './sqlBlcok';

export class SQLParser {

    public static parseBlockSingle(document: vscode.TextDocument, current?: vscode.Position): SQLBlock {
        return this.parseBlocks(document, current)[0]
    }

    public static parseBlocks(document: vscode.TextDocument, current?: vscode.Position): SQLBlock[] {


        const delimter = this.getDelimter();

        const blocks: SQLBlock[] = []
        let lastLineLength: number;
        const context = { inSingleQuoteString: false, inDoubleQuoteString: false, inComment: false, sql: '', start: null }
        let tokens: SQLToken[] = []
        const tokenContext = { word: '', wordStart: null }

        const lineCount = Math.min(document.lineCount, 5000);
        for (var i = 0; i < lineCount; i++) {
            var text = document.lineAt(i).text
            lastLineLength = text.length;
            for (let j = 0; j < text.length; j++) {
                const ch = text.charAt(j);
                // comment check
                if (ch == '*' && text.charAt(j + 1) == '/') {
                    j++;
                    context.inComment = false;
                    continue;
                }
                if (context.inComment) continue;
                // string check
                if (ch == `'`) {
                    context.inSingleQuoteString = !context.inSingleQuoteString;
                } else if (ch == `"`) {
                    context.inDoubleQuoteString = !context.inDoubleQuoteString;
                }
                const inString = context.inSingleQuoteString || context.inDoubleQuoteString;
                if (!inString) {
                    // line comment
                    if (ch == '-' && text.charAt(j + 1) == '-') break;
                    // block comment start
                    if (ch == '/' && text.charAt(j + 1) == '*') {
                        j++;
                        context.inComment = true;
                        continue;
                    }
                    // check sql end 
                    if (ch == delimter) {
                        if (!context.start) continue;
                        if (tokenContext.wordStart) {
                            tokens.push({
                                content: tokenContext.word,
                                range: new vscode.Range(tokenContext.wordStart, new vscode.Position(i, j))
                            })
                        }
                        const range = new vscode.Range(context.start, new vscode.Position(i, j + 1));
                        const block = { sql: context.sql, range, tokens };
                        if (current && (range.contains(current) || range.start.line > current.line)) {
                            return [block];
                        }
                        blocks.push(block);
                        context.sql = ''
                        context.start = null
                        tokens = []
                        tokenContext.wordStart = null;
                        tokenContext.word = ''
                        continue;
                    }
                }

                if (!context.start) {
                    if (!ch.match(/\s/)) {
                        context.start = new vscode.Position(i, j)
                        if (!tokenContext.wordStart) {
                            tokenContext.wordStart = new vscode.Position(i, j)
                        }
                        tokenContext.word = tokenContext.word + ch
                        continue;
                    }
                    if (tokenContext.wordStart) {
                        tokens.push({
                            content: tokenContext.word,
                            range: new vscode.Range(tokenContext.wordStart, new vscode.Position(i, j))
                        })
                        tokenContext.wordStart = null;
                        tokenContext.word = ''
                    }
                }
                context.sql = context.sql + ch;
            }
            if (context.sql)
                context.sql = context.sql + '\n';

        }

        // if end withtout delimter
        if (context.start) {
            const range = new vscode.Range(context.start, new vscode.Position(lineCount, lastLineLength));
            const block = { sql: context.sql, range, tokens };
            if (current) return [block];
            blocks.push(block)
        }

        return blocks

    }
    private static getDelimter() {

        const node = ConnectionManager.tryGetConnection()
        if (node) {
            return DelimiterHolder.get(node.getConnectId()).replace(/\\/g, '')
        }
        return ";";
    }

}