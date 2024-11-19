/* eslint-disable no-constant-condition */
/* eslint-disable prefer-const */
import { EnumInfo, FieldFlag, MessageFieldInfo, MessageInfo, MessagePackage } from "./Compiler";
import { OnException } from "./Exception";
import { Lexer, Token, TokenType } from "./Lexer";

import * as path from "path";

export type ParserFunc = (pkg: MessagePackage, lex: Lexer, tkidentify: Token) => void;

export class Parser {
	private m_Keywords:								Map<string, ParserFunc> = new Map<string, ParserFunc>();

	constructor() {

	}
	
	private Reset(){

	}

	public RegisterKeyword(keyword: string, func: ParserFunc): void {
		this.m_Keywords.set(keyword, func);
	}

	public Parse(file: string): MessagePackage {

		this.Reset();

		let lex: Lexer = new Lexer();

		const abspath = path.resolve(file);

		try {

			lex.Parse(file);
		}
		catch(e) {
			OnException("%s(%s,%s): syntax error %s", file, lex.Line, lex.Column, e);
		}

		

		let pkg: MessagePackage = {
			Imports: [],
			Enums: [],
			Messages: [],
			
			AbsPath: abspath,
			TypesMap: new Map<string, EnumInfo | MessageInfo>()
		};

		while (true) {
			let token = lex.GetNextToken();

			if (token == null) { break; }

			if (token.type === TokenType.Identifier) {

				if (this.m_Keywords.has(token.value) === false) {

					OnException("%s(%s,%s): syntax error unknown keyword %s", file, token.line, token.column, token.value);
				}

				const func = this.m_Keywords.get(token.value);

				try {

					func(pkg, lex, token);
				}
				catch(e) {

					const lasttk = lex.GetLastToken();

					OnException("%s(%s,%s): %s", file, lasttk.line, lasttk.column, e);
				}
			}
			else {
				OnException("%s(%s,%s): unknown identifier %s", file, token.line, token.column, token.value);
			}
		}

		return pkg;
	}
}