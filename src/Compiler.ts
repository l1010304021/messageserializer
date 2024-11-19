/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { EncryptFile } from "nodejskernel";
import { OnException, OnWarning } from "./Exception";
import { Parser } from "./Parser";
import * as fs from "fs";
import { Lexer, Token, TokenType } from "./Lexer";

const path = require("path");


export enum FieldFlag {
	Required									= 1,
	Optional									= 2,
	Repeated									= 3,
	ORepeated									= 4
}

export const Keywords = [
	"boolean",
	"uint8",
	"uint16",
	"uint32",
	"uint64",
	"int8",
	"int16",
	"int32",
	"int64",
	"float",
	"bigint",
	"string"
];


export interface MessageFieldInfo {
	Flag:										number;
	Type:										string;
	Name:										string;
	Index:										number;
	Line:										number;
	Column:										number;
	Comment:									string;
}

export interface MessageInfo {
	KindName:									string;
	Name:										string;
	Extend:										string;
	Fields:										MessageFieldInfo[];
	ExtendFields:								MessageFieldInfo[];
	Line:										number;
	Column:										number;
	Comment:									string;
}

export interface ImportInfo {
	Name:										string;
	Package:									MessagePackage;
	Messages:									Array<string>;
}

export interface EnumFieldInfo {
	Name:										string;
	Value:										number;
	Line:										number;
	Column:										number;
	Comment:									string;
}

export interface EnumInfo {
	KindName:									string;
	Name:										string;
	Fields:										EnumFieldInfo[];
	Line:										number;
	Column:										number;
	Comment:									string;
}

export interface MessagePackage
{
	Imports:									ImportInfo[];
	Enums:										EnumInfo[];
	Messages:									MessageInfo[];

	// 以下为编译时使用 将所有的依赖消息放在这里
	AbsPath:									string;
	TypesMap:									Map<string, MessageInfo | EnumInfo>;
}

export interface CodeResult {

	declares:									string;
	serializes:									string;
}

export interface ICodeGenerator {
	GetExtName(): string;
	BuildCode(pkg: MessagePackage, ): CodeResult;
}


export interface CompileOptions {

	outdir:										string;						//输出目录
	rootdir:									string;						//根目录 用于计算相对路径

	codegenerators:								Array<string>;				//编译器列表

	files:										string[];					//文件列表
}

export class Compiler {
	private m_Parser:							Parser = new Parser();

	private m_MessagePackages:					Map<string, MessagePackage> = new Map<string, MessagePackage>();
	private m_CodeGenerators:					Map<string, ICodeGenerator> = new Map<string, ICodeGenerator>();

	constructor() {

		this.Initialize();
	}
	
	public Reset() {

		this.m_MessagePackages.clear();
	}

	private Initialize() {

		//导入定义 import "filepath";
		this.m_Parser.RegisterKeyword("import", (pkg: MessagePackage, lex: Lexer, tkidentify: Token) => {

			const tkimport = lex.GetNextToken();

			if (tkimport === null || tkimport.type !== TokenType.String) {
				OnException("syntax error, import(%s) invalid", tkimport.value);
			}

			const tksem = lex.GetNextToken();

			if (tksem === null || tksem.type !== TokenType.Semicolon) {
				OnException("syntax error, import(%s) miss;", tkimport.value);
			}

			//convert to absolute path
			const abspath = path.resolve(path.dirname(pkg.AbsPath), tkimport.value);

			//判断是否已经导入
			for (let i = 0; i < pkg.Imports.length; i++) {

				if (pkg.Imports[i].Name === abspath) {
					OnException("import(%s) repeat define", abspath);
					return;
				}
			}

			pkg.Imports.push({ Name: abspath, Package: null, Messages: [] });
		});

		//枚举定义 enum enumname { name = number; name = number; }
		this.m_Parser.RegisterKeyword("enum", (pkg: MessagePackage, lex: Lexer, tkidentify: Token) => {

			const tkcomment = lex.GetTokenPrevComment(tkidentify);

			const tkenum = lex.GetNextToken();

			if (tkenum === null || tkenum.type !== TokenType.Identifier) {
				OnException("syntax error, enum(%s) invalid name", tkenum.value);
			}

			const enuminfo: EnumInfo = {
				KindName: "enum",
				Name: tkenum.value,
				Fields: [],
				Line: tkenum.line,
				Column: tkenum.column,
				Comment: tkcomment === null ? "" : tkcomment.value
			};

			const tkleftbrace = lex.GetNextToken();

			if (tkleftbrace === null || tkleftbrace.type !== TokenType.LeftBrace) {
				OnException("syntax error, enum(%s) miss{", tkenum.value);
			}

			while (true) {

				const tkname = lex.GetNextToken();

				if (tkname === null) {
					OnException("syntax error, enum(%s) miss }", enuminfo.Name);
				}

				if (tkname.type === TokenType.RightBrace) {
					break;
				}

				const tkequal = lex.GetNextToken();
				const tkvalue = lex.GetNextToken();
				const tksem = lex.GetNextToken();

				if (tkname.type !== TokenType.Identifier) { OnException("syntax error, enum(%s) invalid name(%s)", tkenum.value, tkname.value); }
				if (tkequal === null || tkequal.type !== TokenType.Equal) { OnException("syntax error, enum(%s) miss =", tkenum.value); }
				if (tkvalue === null || tkvalue.type !== TokenType.Number) { OnException("syntax error, enum(%s) invalid value(%s)", tkenum.value, tkvalue.value); }
				if (tksem === null || tksem.type !== TokenType.Semicolon) { OnException("syntax error, enum(%s) miss ;", tkenum.value); }

				const tkcmt = lex.GetTokenNextComment(tksem);

				enuminfo.Fields.push({ Name: tkname.value, Value: parseInt(tkvalue.value), Line: tkname.line, Column: tkname.column, Comment: tkcmt === null ? "": tkcmt.value });
			}

			pkg.Enums.push(enuminfo);
			this.InsertPackageType(pkg, enuminfo);
		});

		/*
			消息定义 
				message messagename extend name {
					flag type name index=number;
					flag type name index=number;
				}
		 */
		this.m_Parser.RegisterKeyword("message", (pkg: MessagePackage, lex: Lexer, tkidentify: Token) => {

			const tkcomment = lex.GetTokenPrevComment(tkidentify);

			const tkmessage = lex.GetNextToken();

			if (tkmessage === null || tkmessage.type !== TokenType.Identifier) {

				OnException("syntax error, message(%s) name is not identifier", tkmessage.value);
			}

			const msg: MessageInfo = {
				KindName: "message",
				Name: tkmessage.value,
				Extend: "",
				Fields: [],
				ExtendFields: [],
				Line: tkmessage.line,
				Column: tkmessage.column,
				Comment: tkcomment === null ? "" : tkcomment.value
			};

			let tkleftbrace = lex.GetNextToken();

			if (tkleftbrace === null) {
				OnException("syntax error, message(%s) miss {", tkmessage.value);
			}

			if (tkleftbrace.type !== TokenType.LeftBrace) {

				if (tkleftbrace.type !== TokenType.Identifier || tkleftbrace.value !== "extend") {
					OnException("syntax error, message(%s) miss {", tkmessage.value);
				}

				const tkextends = lex.GetNextToken();

				if (tkextends === null || tkextends.type !== TokenType.Identifier) {
					OnException("syntax error, message(%s) extends invalid", tkmessage.value);
				}

				msg.Extend = tkextends.value;

				tkleftbrace = lex.GetNextToken();
			}
			
			if (tkleftbrace === null || tkleftbrace.type !== TokenType.LeftBrace) {
				OnException("syntax error, message(%s) miss {", tkmessage.value);
			}

			while (true) {

				const tkfield = lex.GetNextToken();

				if (tkfield === null) {
					OnException("syntax error, message(%s) miss }", msg.Name);
				}

				if (tkfield.type === TokenType.RightBrace) {
					break;
				}

				const tkflag = tkfield;
				const tktype = lex.GetNextToken();
				const tkname = lex.GetNextToken();
				const tkequal = lex.GetNextToken();
				const tkindex = lex.GetNextToken();
				const tksem = lex.GetNextToken();

				if (tkflag === null || tkflag.type !== TokenType.Identifier) { OnException("syntax error, message(%s) invalid field flag(%s)", tkmessage.value, tkflag.value); }
				if (tktype === null || tktype.type !== TokenType.Identifier) { OnException("syntax error, message(%s) invalid field type(%s)", tkmessage.value, tktype.value); }
				if (tkname === null || tkname.type !== TokenType.Identifier) { OnException("syntax error, message(%s) invalid field name(%s)", tkmessage.value, tkname.value); }
				if (tkequal === null || tkequal.type !== TokenType.Equal) { OnException("syntax error, message(%s) field miss =", tkmessage.value); }
				if (tkindex === null || tkindex.type !== TokenType.Number) { OnException("syntax error, message(%s) invalid field index(%s)", tkmessage.value, tkindex.value); }
				if (tksem === null || tksem.type !== TokenType.Semicolon) { OnException("syntax error, message(%s) field miss ;", tkmessage.value); }

				const tkcmt = lex.GetTokenNextComment(tksem);

				let fieldinfo: MessageFieldInfo = {
					Flag: 0,
					Type: tktype.value,
					Name: tkname.value,
					Index: parseInt(tkindex.value),
					Line: tkflag.line,
					Column: tkflag.column,
					Comment: tkcmt === null ? "" : tkcmt.value
				};

				if (tkflag.value === "required") { fieldinfo.Flag = FieldFlag.Required }
				else if (tkflag.value === "optional") { fieldinfo.Flag = FieldFlag.Optional; }
				else if (tkflag.value === "repeated") { fieldinfo.Flag = FieldFlag.Repeated; }
				else if (tkflag.value === "orepeated") { fieldinfo.Flag = FieldFlag.ORepeated; }
				else { OnException("syntax error, message(%s) invalid flag(%s)", tkmessage.value, tkflag.value); }

				msg.Fields.push(fieldinfo);
			}

			pkg.Messages.push(msg);
			this.InsertPackageType(pkg, msg);
		});
	}

	public RegisterCodeGenerator(name: string, c: ICodeGenerator): void {

		if (this.m_CodeGenerators.has(name)) {
			OnException("compiler(%s) repeat define", name);
		}

		this.m_CodeGenerators.set(name, c);
	}

	private InsertPackage(pkg: MessagePackage): void {

		const pkgSearch: MessagePackage = this.FindPackage(pkg.AbsPath);
		
		if (pkgSearch !== null) {

			OnWarning("message package(%s) repeat define", pkg.AbsPath);
		}

		this.m_MessagePackages.set(pkg.AbsPath, pkg);
	}

	private FindPackage(name: string): MessagePackage {

		if (this.m_MessagePackages.has(name) === false) {
			return null;
		}

		return this.m_MessagePackages.get(name);
	}

	private EnumPackages(call: Function) {
		
		this.m_MessagePackages.forEach((pkg: MessagePackage) => {
			call(pkg);
		});
	}

	private IsKeywords(value: string): boolean {

		return Keywords.includes(value);
	}

	private InsertPackageType(pkg: MessagePackage, type: MessageInfo | EnumInfo): void {

		if (pkg.TypesMap.has(type.Name)) {
			OnException("%s(%s,%s): syntax error type(%s) repeat define", pkg.AbsPath, type.Line, type.Column, type.Name);
		}

		pkg.TypesMap.set(type.Name, type);
	}

	private ParseMessageFiles(files: Array<string>) {

		//解析所有的文件
		for (let i = 0; i < files.length; i++) {

			let pkg: MessagePackage = this.m_Parser.Parse(files[i]);

			this.InsertPackage(pkg);
		}
	}

	private FindTypePackage(pkg: MessagePackage, type: string): Array<MessagePackage> {

		const pkgs = [];

		if (pkg.TypesMap.has(type)) {

			pkgs.push(pkg);
		}

		for (let ipt of pkg.Imports) {

			if (ipt.Package.TypesMap.has(type)) {

				pkgs.push(ipt.Package);
			}
		}

		return pkgs;
	}

	private BuildImportTable() {

		//首先定位导入包
		this.EnumPackages((pkg: MessagePackage) => {

			for (let ipt of pkg.Imports) {

				const iptpkg = this.FindPackage(ipt.Name);

				if (iptpkg === null) {
					OnException("%s: syntax error import(%s) not found", pkg.AbsPath, ipt.Name);
					continue;
				}

				ipt.Package = iptpkg;
			}
		});

		//然后遍历所有包，对每一个包的消息进行检查，如果有依赖的消息没有找到，则报错，如果有多个定义，也报错，否则将该消息加入导入表内的Messages字段内
		this.EnumPackages((pkg: MessagePackage) => {

			for (let msg of pkg.Messages) {

				if (msg.Extend !== "") {

					const pkgs = this.FindTypePackage(pkg, msg.Extend);

					if (pkgs.length === 0) {

						OnException("%s(%s,%s): syntax error message(%s) extend(%s) not found", pkg.AbsPath, msg.Line, msg.Column, msg.Name, msg.Extend);
						continue;
					}

					if (pkgs.length > 1) {

						OnException("%s(%s,%s): syntax error message(%s) extend(%s) repeat define", pkg.AbsPath, msg.Line, msg.Column, msg.Name, msg.Extend);
						continue;
					}



					if (pkgs[0] !== pkg) {

						for (let i = 0; i < pkg.Imports.length; i++) {

							if (pkg.Imports[i].Name === pkgs[0].AbsPath) {

								if (pkg.Imports[i].Messages.includes(msg.Extend) === false) {

									pkg.Imports[i].Messages.push(msg.Extend);
								}

								break;
							}
						}
					}
				}

				for (let field of msg.Fields) {

					if (this.IsKeywords(field.Type)) {
						continue;
					}

					const pkgs = this.FindTypePackage(pkg, field.Type);

					if (pkgs.length === 0) {
						OnException("%s(%s,%s): syntax error message(%s) field(%s) type(%s) not found", pkg.AbsPath, field.Line, field.Column, msg.Name, field.Name, field.Type);
						continue;
					}

					if (pkgs.length > 1) {
						OnException("%s(%s,%s): syntax error message(%s) field(%s) type(%s) repeat define", pkg.AbsPath, field.Line, field.Column, msg.Name, field.Name, field.Type);
						continue;
					}

					if (pkgs[0] === pkg) {
						continue;
					}

					for (let i = 0; i < pkg.Imports.length; i++) {

						if (pkg.Imports[i].Name === pkgs[0].AbsPath) {

							if (pkg.Imports[i].Messages.includes(field.Type) === false) {

								pkg.Imports[i].Messages.push(field.Type);
							}

							break;
						}
					}
				}
			}
		});
	}
	
	private CheckMessages() {

		
		const BuildMessageIndexs = (pkg: MessagePackage, msg: MessageInfo, indexs: Array<number>, names: Array<string>, extendfields: Array<MessageFieldInfo>, extend: boolean) => {

			if (msg.Extend !== "") {

				//找到定义
				const pkgs = this.FindTypePackage(pkg, msg.Extend);

				const typedefine = pkgs[0].TypesMap.get(msg.Extend);

				if (typedefine.KindName !== "message") {
					OnException("%s(%s,%s): syntax error message(%s) extend(%s) not message", pkg.AbsPath, msg.Line, msg.Column, msg.Name, msg.Extend);
				}

				BuildMessageIndexs(pkgs[0], typedefine as MessageInfo, indexs, names, extendfields, true);
			}

			for (let i = 0; i < msg.Fields.length; i++) {

				if (indexs.includes(msg.Fields[i].Index)) {

					OnException("%s(%s,%s): syntax error message(%s) field(%s) index(%d) repeat define", pkg.AbsPath, msg.Fields[i].Line, msg.Fields[i].Column, msg.Name, msg.Fields[i].Name, msg.Fields[i].Index);
				}

				if (names.includes(msg.Fields[i].Name)) {

					OnException("%s(%s,%s): syntax error message(%s) field(%s) name(%s) repeat define", pkg.AbsPath, msg.Fields[i].Line, msg.Fields[i].Column, msg.Name, msg.Fields[i].Name, msg.Fields[i].Name);
				}

				indexs.push(msg.Fields[i].Index);
				names.push(msg.Fields[i].Name);

				if (extend === true) {

					extendfields.push(msg.Fields[i]);
				}
			}
		};

		//检查所有的消息 Field Index是否重复，Field Name是否重复
		this.EnumPackages((pkg: MessagePackage) => {

			for (let msg of pkg.Messages) {

				const indexs = [];
				const names = [];

				BuildMessageIndexs(pkg, msg, indexs, names, msg.ExtendFields, false);
			}
		});
	}

	private GenerateCodes(options) {

		//生成代码
		for (let i = 0; i < options.codegenerators.length; i++) {

			const c: ICodeGenerator = this.m_CodeGenerators.get(options.codegenerators[i]);

			if (c === null) {
				OnWarning("codegenerator(%s) not found", options.codegenerators[i]);
				continue;
			}

			for (let pkg of this.m_MessagePackages.values()) {

				let code: CodeResult = c.BuildCode(pkg);

				let outfile = path.join(options.outdir, path.relative(options.rootdir, pkg.AbsPath));

				const extname = path.extname(outfile);
				const basename = path.basename(outfile, extname);
				const dirname = path.dirname(outfile);

				outfile = path.join(dirname, basename + c.GetExtName());
				
				fs.mkdirSync(dirname, { recursive: true });

				fs.writeFileSync(outfile, code.declares + code.serializes);
			}
		}
	}

	public Compile(options: CompileOptions) {

		//重置所有的数据
		this.Reset();

		this.ParseMessageFiles(options.files);

		this.BuildImportTable();

		this.CheckMessages();

		this.GenerateCodes(options);
	}
}