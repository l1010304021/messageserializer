
import * as fs from "fs";
import { OnException } from "./Exception";
import { EncryptFile } from "nodejskernel";

export enum TokenType {
	Identifier,															//标识符
	Number,																//数字
	String,																//字符串
	Equal,																//等号
	Vertical,															//竖线
	Semicolon,															//分号
	LeftBrace,															//左大括号
	RightBrace,															//右大括号
	CommentsSingleLine,													//单行注释
	CommentsMultiLine													//多行注释
}

export interface Token {
	index:						number,
	type:						TokenType,
	value:						string,
	line:						number,
	column:						number
}

export class Lexer {
	private m_Index:			number;
	private m_Count:			number;
	private m_Offset:			number;
	private m_Content:			string;
	private m_Tokens:			Array<Token>;
	private m_Line:				number;
	private m_Column:			number;

	private m_Keywords:			Map<number, Function> = new Map<number, Function>();

	private m_tempfile: string;

	constructor() {
		this.Reset();

		this.Init();
	}

	private Reset() {
		this.m_Tokens = [];
		this.m_Index = 0;
		this.m_Count = 0;
		this.m_Offset = 0;
		this.m_Content = "";
		this.m_Line = 1;
		this.m_Column = 1;
	}

	public get Column(): number { return this.m_Column; }
	public get Line(): number { return this.m_Line; }

	private SetToken(type: TokenType, value: string, line?: number, col?: number): void {

		const index = this.m_Tokens.length;

		if (line !== undefined && col !== undefined) {

			this.m_Tokens.push({
				index: index,
				type: type,
				value: value,
				line: line,
				column: col
			});
		}
		else {

			this.m_Tokens.push({
				index: index,
				type: type,
				value: value,
				line: this.m_Line,
				column: this.m_Column
			});
		}

		this.m_Count++;
	}

	private ReadFile(filepath: string): void {
		this.m_Content = EncryptFile.LoadText(filepath, "");
	}

	private ChangeColumn(col: number, set: boolean = false): void {

		if (set === true) {

			this.m_Column = col;
		}
		else {

			this.m_Column += col;
		}
	}

	private ChangeLine(line: number, set: boolean = false): void {
		
		if (set === true) {

			this.m_Line = line;
		}
		else {

			this.m_Line += line;
			this.m_Column = 1;
		}
	}

	private Move(count: number, col: number, line: number) {
		this.m_Offset += count;
		if (col > 0) this.ChangeColumn(col);
		if (line > 0) this.ChangeLine(line);
	}

	private IsEOF(size?: number): boolean {

		let count = 0;

		if (size !== undefined) { count = size; }

		if ((this.m_Offset + count) < this.m_Content.length) {
			return false;
		}

		return true;
	}

	private GetCharCode(offset: number = 0): number {

		return this.m_Content.charCodeAt(this.m_Offset + offset);
	}

	private GetCharCodeLen(code: number): number {

		// 单字节字符
		if (code <= 0x7F) {
			
			if (code === '\t'.charCodeAt(0)) { return 1; }
			
			return 1;
		} else {
			// 处理多字节字符 代理对是4个字节，但是显示占用2个字符 高位代理对 0xD800-0xDBFF 低位代理对 0xDC00-0xDFFF
			if (code >= 0xD800 && code <= 0xDBFF && code >= 0xDC00 && code <= 0xDFFF) {

				return 1;
			}

			return 1;
		}
	}

	public GetNextToken(): Token {
		
		let index = this.m_Index;

		while(true) {

			if (index >= this.m_Count) {
				return null;
			}

			const token = this.m_Tokens[index];

			if (token.type !== TokenType.CommentsSingleLine && token.type !== TokenType.CommentsMultiLine) {
				break;
			}

			index++;
		}

		this.m_Index = index + 1;
		
		return this.m_Tokens[index];
	}

	public GetTokenNextComment(tk: Token): Token {

		let index = tk.index + 1;

		if (index >= this.m_Count) {
			return null;
		}

		const tkcmt = this.m_Tokens[index];

		if (tkcmt.type !== TokenType.CommentsSingleLine && tkcmt.type !== TokenType.CommentsMultiLine) {

			return null;
		}

		if (tkcmt.line !== tk.line) {

			return null;
		}

		return tkcmt;
	}

	public GetTokenPrevComment(token: Token, prev: boolean = false): Token {

		let index = token.index - 1;

		if (index < 0) {
			return null;
		}

		const tkcmt = this.m_Tokens[index];

		if (tkcmt.type !== TokenType.CommentsSingleLine && tkcmt.type !== TokenType.CommentsMultiLine) {

			return null;
		}

		if (tkcmt.line === token.line) {

			return null;
		}

		return tkcmt;
	}

	public GetLastToken(): Token {

		let index = this.m_Index - 1;

		if (this.m_Index >= this.m_Count) {
			index = this.m_Count - 1;
		}

		if (index < 0) {
			index = 0;
		}

		if (this.m_Index >= this.m_Count) {
			return null;
		}

		return this.m_Tokens[index];
	}

	private RegKeywords(char: string, func: Function): void {

		for (let i = 0; i < char.length; i++) {

			const code = char.charCodeAt(i);

			if (this.m_Keywords.has(code) === true) {
				OnException("register failed, keyword %s already exists", char);
			}

			this.m_Keywords.set(code, func);
		}
	}

	private Init() {

		//空格和制表符
		this.RegKeywords(' ', ()=>{ this.Move(1, 1, 0); return true; });
		this.RegKeywords('\t', ()=>{ this.Move(1, 1, 0); return true; });

		//换行符\r \r\n
		this.RegKeywords('\r', ()=>{ 
			
			if (this.IsEOF(1) === false && this.GetCharCode(1) === '\n'.charCodeAt(0)) {
				this.Move(2, 0, 1);
			}
			else {
				this.Move(1, 0, 1);
			}

			return true;
		});

		//换行符\n
		this.RegKeywords('\n', ()=>{ this.Move(1, 0, 1); return true; });

		//注释
		this.RegKeywords('/', ()=>{

			const colstart = this.m_Column;
			const linestart = this.m_Line;

			if (this.IsEOF(1) === false && this.GetCharCode(1) === '/'.charCodeAt(0)) {

				this.Move(2, 2, 0);

				let movecount = 0;
				let column = 0;

				while (true) {

					if (this.IsEOF(movecount)) break;

					const code = this.GetCharCode(movecount);

					if (code === '\n'.charCodeAt(0) || code === '\r'.charCodeAt(0)) { break; }

					column += this.GetCharCodeLen(this.GetCharCode(movecount));

					movecount++;
				}

				if (movecount > 0) {

					this.SetToken(TokenType.CommentsSingleLine, this.m_Content.substring(this.m_Offset, this.m_Offset + movecount), linestart, colstart);
					this.Move(movecount, column, 0);
				}

				return true;
			}

			if (this.IsEOF(1) === false && this.GetCharCode(1) === '*'.charCodeAt(0)) {

				this.Move(2, 2, 0);

				let movecount = 0;

				while (true) {

					if (this.IsEOF(movecount)) break;

					const code = this.GetCharCode(movecount);

					if (code === '*'.charCodeAt(0) && this.IsEOF(movecount + 1) === false && this.GetCharCode(movecount + 1) === '/'.charCodeAt(0)) {

						this.SetToken(TokenType.CommentsMultiLine, this.m_Content.substring(this.m_Offset, this.m_Offset + movecount), linestart, colstart);
						this.Move(movecount + 2, 0, 0);
						this.ChangeColumn(2);
						return true;
					}

					if (code === '\r'.charCodeAt(0)) {

						if (this.IsEOF(movecount + 1) === false && this.GetCharCode(movecount + 1) === '\n'.charCodeAt(0)) {
							
							movecount++;	
						}

						this.ChangeLine(1);
					}
					else  if (code === '\n'.charCodeAt(0)) {
						this.ChangeLine(1);
					}
					else {
						this.ChangeColumn(this.GetCharCodeLen(code));
					}

					movecount++;
				}

				OnException("missing */");
			}

			return false;
		});

		//分号
		this.RegKeywords(';', ()=>{ this.SetToken(TokenType.Semicolon, ";"); this.Move(1, 1, 0); return true; });

		//左大括号
		this.RegKeywords('{', ()=>{ this.SetToken(TokenType.LeftBrace, "{"); this.Move(1, 1, 0); return true; });

		//右大括号
		this.RegKeywords('}', ()=>{ this.SetToken(TokenType.RightBrace, "}"); this.Move(1, 1, 0); return true; });

		//等号
		this.RegKeywords('=', ()=>{ this.SetToken(TokenType.Equal, "="); this.Move(1, 1, 0); return true; });

		//竖线
		this.RegKeywords('|', ()=>{ this.SetToken(TokenType.Vertical, "|"); this.Move(1, 1, 0); return true; });

		//字符串
		this.RegKeywords('"', ()=>{

			const colstart = this.m_Column;
			const linestart = this.m_Line;

			this.Move(1, 1, 0);

			let movecount = 0;
			let column = 0;

			while (true) {

				if (this.IsEOF(movecount)) break;

				const code = this.GetCharCode(movecount);

				if (code === '"'.charCodeAt(0)) {
					
					this.SetToken(TokenType.String, this.m_Content.substring(this.m_Offset, this.m_Offset + movecount), linestart, colstart);
					this.Move(movecount + 1, column + 1, 0);

					return true;
				}

				if (code === '\r'.charCodeAt(0) || code === '\n'.charCodeAt(0)) { break; }

				column += this.GetCharCodeLen(code);

				movecount++;
			}

			OnException("missing \"");

			return false;
		});

		//数字
		this.RegKeywords('0123456789', ()=>{

			let movecount = 1;
			let column = 1;

			//判断是否为16进制
			if (this.IsEOF(1) === false && (this.GetCharCode(1) === 'x'.charCodeAt(0) || this.GetCharCode(1) === 'X'.charCodeAt(0))) {

				movecount++;
				column++;

				while (true) {

					if (this.IsEOF(movecount)) break;

					const code = this.GetCharCode(movecount);

					if ((code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0)) &&
						(code < 'a'.charCodeAt(0) || code > 'f'.charCodeAt(0)) &&
						(code < 'A'.charCodeAt(0) || code > 'F'.charCodeAt(0))) break;

					column += this.GetCharCodeLen(code);
					movecount++;
				}
			}
			else {

				while (true) {

					if (this.IsEOF(movecount)) break;

					const code = this.GetCharCode(movecount);

					if (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0)) break;

					column += this.GetCharCodeLen(code);
					movecount++;
				}
			}

			this.SetToken(TokenType.Number, this.m_Content.substring(this.m_Offset, this.m_Offset + movecount));
			this.Move(movecount, column, 0);

			return true;
		});

		//标识符
		this.RegKeywords('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', ()=>{

			let movecount = 1;
			let column = 1;

			while (true) {

				if (this.IsEOF(movecount)) break;

				const code = this.GetCharCode(movecount);

				if ((code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0)) &&
					(code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0)) &&
					(code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0) &&
					code !== '_'.charCodeAt(0))) break;

				column += this.GetCharCodeLen(code);
				movecount++;
			}

			this.SetToken(TokenType.Identifier, this.m_Content.substring(this.m_Offset, this.m_Offset + movecount));
			this.Move(movecount, column, 0);

			return true;
		});
	}


	public Parse(file: string): void {
		this.Reset();
		this.ReadFile(file);

		this.m_tempfile = file;

		while(this.IsEOF() === false) {

			const code = this.GetCharCode();

			if (this.m_Keywords.has(code) && this.m_Keywords.get(code)()) {

				continue;
			}

			OnException("unrecognized character %s", this.m_Content[this.m_Offset]);
		}
	}
}