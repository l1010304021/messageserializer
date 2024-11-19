/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CodeResult, Compiler, FieldFlag, ICodeGenerator, MessageFieldInfo, MessageInfo, MessagePackage, Keywords } from "./Compiler";
import { WriteToConsole } from "./Console";
import { OnException } from "./Exception";

import * as path from "path";

const CharactorDistance = 48;


interface SizeInfo {

	fieldsize?:											number;
	fixedsize:											boolean;
}

export class CodeGenerator_TS implements ICodeGenerator {
	
	private m_Enums:									Map<string, boolean> = new Map<string, boolean>();


	constructor() {

	}

	public GetExtName(): string {
		return ".ts";
	}

	

	public BuildCode(pkg: MessagePackage): CodeResult {

		this.m_Enums.clear();

		let result: CodeResult = {
			declares: "",
			serializes: ""
		};

		const declares = [];
		const serializes = [];

		//生成导入表
		for (let i = 0; i < pkg.Imports.length; i++) {

			const ipt = pkg.Imports[i];

			//生成导入类型
			const messages = [];

			const abspath = pkg.AbsPath;
			const absdir = path.dirname(abspath);

			const extname = path.extname(ipt.Name);
			const basename = path.basename(ipt.Name, extname);
			const dirname = path.dirname(ipt.Name);

			const importfile = path.join(dirname, basename);

			let relpath = path.relative(absdir, importfile);
			relpath = "./" + relpath.replace(/\\/g, '/');

			//类型定义
			for (let j = 0; j < ipt.Messages.length; j++) {

				const name = ipt.Messages[j];

				messages.push(name);

				const define = ipt.Package.TypesMap.get(name);

				if (define.KindName === "enum") {

					this.m_Enums.set(name, true);
				}

				if (define.KindName === "message") {

					messages.push("GetMessageSize_" + name);
					messages.push("Serialize_" + name);
					messages.push("Deserialize_" + name);
				}
			}

			//接口定义 获取所有类型为message的接口


			declares.push(`import { ${messages.join(", ") } } from "${relpath}";`);
		}

		declares.push("\r\n".repeat(5));

		//生成枚举
		for (let i = 0; i < pkg.Enums.length; i++) {

			const enuminfo = pkg.Enums[i];

			if (enuminfo.Comment !== "") {

				declares.push(`/**\r\n  ${enuminfo.Comment}\r\n */`);
			}

			declares.push(`export enum ${enuminfo.Name}`);
			declares.push("{");


			this.m_Enums.set(enuminfo.Name, true);

			for (let j = 0; j < enuminfo.Fields.length; j++) {

				const field = enuminfo.Fields[j];

				const arr = [
					`\t${field.Name}`,
					`= 0x${field.Value.toString(16).toUpperCase()},`
				];

				if (field.Comment !== "") {

					arr.push(`//${field.Comment}`);
				}

				let s = this.BuildCodeWithDistance(arr);

				declares.push(s);

				if (j !== 0) {

					const lastline = enuminfo.Fields[j - 1].Line;
					const currentline = field.Line;

					for (let k = 0; k < currentline - lastline - 1; k++) {

						declares.push("");
					}
				}
			}

			declares.push("}");
			declares.push("");
		}

		declares.push("\r\n".repeat(5));

		//生成消息体
		for (let i = 0; i < pkg.Messages.length; i++) {

			const msg = pkg.Messages[i];

			WriteToConsole("开始构建Message: %s", msg.Name);

			if (msg.Extend !== "") {
				declares.push(`export interface ${pkg.Messages[i].Name} extends ${msg.Extend}`);
				declares.push("{");
			}
			else {
				declares.push(`export interface ${pkg.Messages[i].Name}`);
				declares.push("{");
			}

			const fields = pkg.Messages[i].Fields;

			for (let j = 0; j < fields.length; j++) {

				const field = fields[j];

				const arr = [];

				const typename = this.GetFieldTypeName(field.Type);

				switch(field.Flag) {

				case FieldFlag.Required:
					arr.push(`\t${field.Name}:`);
					arr.push(`${typename};`);
					break;
				case FieldFlag.Optional:
					arr.push(`\t${field.Name}?:`);
					arr.push(`${typename};`);
					break;
				case FieldFlag.Repeated:
					arr.push(`\t${field.Name}:`);
					arr.push(`Array<${typename}>;`);
					break;
				case FieldFlag.ORepeated:
					arr.push(`\t${field.Name}?:`);
					arr.push(`Array<${typename}>;`);
					break;
				}

				if (field.Comment !== "") {

					arr.push(`//${field.Comment}`);
				}

				const s = this.BuildCodeWithDistance(arr);

				declares.push(s);

				if (j !== 0) {

					const lastline = fields[j - 1].Line;
					const currentline = field.Line;

					for (let k = 0; k < currentline - lastline - 1; k++) {

						declares.push("");
					}
				}
			}

			declares.push("}");
			declares.push("");
		}

		declares.push("\r\n".repeat(5));

		result.declares = declares.join("\r\n");


		//生成代码

		//获取消息大小
		for (let i = 0; i < pkg.Messages.length; i++) {

			const message = pkg.Messages[i];

			serializes.push(this.BuildGetMessageSizeCode(message));

			serializes.push("\r\n".repeat(3));
		}

		//序列化
		for (let i = 0; i < pkg.Messages.length; i++) {

			const message = pkg.Messages[i];

			serializes.push(this.BuildSerializeCode(message));

			serializes.push("\r\n".repeat(3));
		}

		//反序列化
		for (let i = 0; i < pkg.Messages.length; i++) {

			const message = pkg.Messages[i];

			serializes.push(this.BuildDeserializeCode(pkg, message));

			serializes.push("\r\n".repeat(3));
		}

		result.serializes = serializes.join("\r\n");

		return result;
	}

	/*

	 消息打包：
		索引 + 长度 + 数据

		如果是数组：
			索引 + 数组长度 + 具体数据(长度 + 数据)

		field.Flag & 
	 */

	private BuildGetMessageSizeCode(message: MessageInfo): string {

		const codes = [];

		codes.push(`// GetMessageSize ${message.Name}`);
		codes.push(`export function GetMessageSize_${message.Name}(msg: ${message.Name}): number {`);
		codes.push(``);
		codes.push(`\tlet tempnumber = 0;`)
		codes.push(`\tlet tempbigint = 0n;`);
		codes.push(``);
		codes.push(`\tlet size = 2;`);
		codes.push(``);

		const fields: Array<MessageFieldInfo> = [];

		for (let i = 0; i < message.ExtendFields.length; i++) {

			fields.push(message.ExtendFields[i]);
		}

		for (let i = 0; i < message.Fields.length; i++) {

			fields.push(message.Fields[i]);
		}

		for (let i = 0; i < fields.length; i++) {

			const field = fields[i];

			codes.push(`\tif (msg.${field.Name} !== undefined) {`);
			codes.push(``);

			const szinfo = this.GetFieldTypeSize(field.Type);

			//索引大小
			codes.push(`\t\tsize += 1;`);

			if (szinfo !== null) {

				if (field.Flag === FieldFlag.Repeated || field.Flag === FieldFlag.ORepeated) {

					//数组长度
					codes.push(`\t\tsize += 2;`);

					//然后再获取所有元素的大小
					if (szinfo.fixedsize) {
						codes.push(`\t\tsize += ${szinfo.fieldsize} * msg.${field.Name}.length;`);
					}
					else {

						switch(field.Type) {
						case "bigint":
							//bigint类型需要特殊处理 2个字节的长度 + N个字节的数据
							codes.push(`\t\tfor (let i = 0; i < msg.${field.Name}.length; i++) {`);
							codes.push(``);
							codes.push(`\t\t\ttempnumber = 0;`);
							codes.push(`\t\t\ttempbigint = msg.${field.Name}[i] > 0n ? msg.${field.Name}[i] : -msg.${field.Name}[i];`);
							codes.push(``);
							codes.push(`\t\t\twhile (tempbigint > 0n) {`);
							codes.push(``);
							codes.push(`\t\t\t\ttempnumber += 8;`);
							codes.push(`\t\t\t\ttempbigint >>= 64n;`);
							codes.push(`\t\t\t}`);
							codes.push(``);
							codes.push(`\t\t\tsize += 2 + tempnumber;`);
							codes.push(`\t\t}`);
							codes.push(``);
							break;
						case "string":
							codes.push(`\t\tfor (let i = 0; i < msg.${field.Name}.length; i++) {`);
							codes.push(``);
							codes.push(`\t\t\tsize += 2 + msg.${field.Name}[i].length * 2;`);
							codes.push(`\t\t}`);
							codes.push(``);
							break;
						default:
							throw new Error(`type ${field.Type} is not fixed.`);
						}
					}
				}
				else {

					if (szinfo.fixedsize) {
						codes.push(`\t\tsize += ${szinfo.fieldsize};`);
					}
					else {

						switch(field.Type) {
						case "bigint":
							codes.push(`\t\ttempnumber = 0;`);
							codes.push(`\t\ttempbigint = msg.${field.Name} > 0n ? msg.${field.Name} : -msg.${field.Name};`);
							codes.push(``);
							codes.push(`\t\twhile (tempbigint > 0n) {`);
							codes.push(``);
							codes.push(`\t\t\ttempnumber += 8;`);
							codes.push(`\t\t\ttempbigint >>= 64n;`);
							codes.push(`\t\t}`);
							codes.push(``);
							codes.push(`\t\tsize += 2 + tempnumber;`);
							break;
						case "string":
							codes.push(`\t\tsize += 2 + msg.${field.Name}.length * 2;`);
							break;
						default:
							throw new Error(`type ${field.Type} is not fixed.`);
						}
					}
				}
			}
			else {

				if (field.Flag === FieldFlag.Repeated || field.Flag === FieldFlag.ORepeated) {

					codes.push(`\t\tsize += 2;`);
					codes.push(`\t\tfor (let i = 0; i < msg.${field.Name}.length; i++) {`);
					codes.push(``);
					codes.push(`\t\t\tsize += GetMessageSize_${field.Type}(msg.${field.Name}[i]);`);
					codes.push(`\t\t}`);
				}
				else {
					codes.push(`\t\tsize += GetMessageSize_${field.Type}(msg.${field.Name});`);
				}

				codes.push(``);
			}

			codes.push(`\t}`);

			if (field.Flag === FieldFlag.Required || field.Flag === FieldFlag.Repeated) {

				codes.push(`\telse {`);
				codes.push(``);
				codes.push(`\t\tthrow new Error("${field.Name} not exists.");`);
				codes.push(`\t}`);
			}

			codes.push(``);
		}

		codes.push(`\treturn size;`);
		codes.push(`}`);

		return codes.join("\r\n");
	}

	private BuildSerializeCode(message: MessageInfo): string {

		const codes = [];

		codes.push(`// Serialize ${message.Name}`);
		codes.push(`export function Serialize_${message.Name}(msg: ${message.Name}, v?: DataView, o?: number): ArrayBuffer | number {`);
		codes.push(``);
		codes.push(`\tlet tempstring = "";`);
		codes.push(`\tlet tempnumber = 0;`);
		codes.push(`\tlet tempbigint = 0n;`);
		codes.push(`\tlet tempboolean = false;`);
		codes.push(`\tlet tempoffset = 0;`);
		codes.push(``);
		codes.push(`\tlet offset = o || 0;`);
		codes.push(`\tlet view = v || null;`);
		codes.push(`\tlet buffer = null;`)
		codes.push(``);
		codes.push(`\tif (view === null) {`);
		codes.push(``);
		codes.push(`\t\tconst msgsize = GetMessageSize_${message.Name}(msg);`)
		codes.push(``);
		codes.push(`\t\tbuffer = new ArrayBuffer(msgsize);`);
		codes.push(`\t\tview = new DataView(buffer);`);
		codes.push(`\t}`);
		codes.push(``);

		//保存偏移
		codes.push(`\tconst sizeoffset = offset;`);
		codes.push(`\toffset += 2;`);

		//如果有继承的消息，先序列化继承的消息
		const fields: Array<MessageFieldInfo> = [];

		for (let i = 0; i < message.ExtendFields.length; i++) {

			fields.push(message.ExtendFields[i]);
		}

		for (let i = 0; i < message.Fields.length; i++) {

			fields.push(message.Fields[i]);
		}

		for (let i = 0; i < fields.length; i++) {

			const field = fields[i];

			codes.push(`\tif (msg.${field.Name} !== undefined) {`);
			codes.push(``);

			//首先写入索引
			codes.push(`\t\tview.setUint8(offset, ${field.Index}); offset += 1;`);

			//然后写入数据

			if (field.Flag === FieldFlag.Repeated || field.Flag === FieldFlag.ORepeated) {

				//写入数组长度
				codes.push(`\t\tview.setUint16(offset, msg.${field.Name}.length, true); offset += 2;`);
				codes.push(``);
				codes.push(`\t\tfor (let i = 0; i < msg.${field.Name}.length; i++) {`);
				codes.push(``);
				const codetemp = this.BuildFieldSerializeCode(field.Type, "\t\t\t", `msg.${field.Name}[i]`);
				codes.push(codetemp);
				codes.push(`\t\t}`);
			}
			else {

				//写入字段数据
				const codetemp = this.BuildFieldSerializeCode(field.Type, "\t\t", `msg.${field.Name}`);
				codes.push(codetemp);
			}

			codes.push(`\t}`);

			if (field.Flag === FieldFlag.Required || field.Flag === FieldFlag.Repeated) {

				codes.push(`\telse {`);
				codes.push(``);
				codes.push(`\t\tthrow new Error("${field.Name} not exists.");`);
				codes.push(`\t}`);
				codes.push(``);
			}
		}

		//写入消息大小
		codes.push(`\tview.setUint16(sizeoffset, offset - sizeoffset - 2, true);`);
		codes.push(``);

		codes.push(`\tif (buffer !== null) {`);
		codes.push(``);
		codes.push(`\t\treturn buffer;`);
		codes.push(`\t}`);
		codes.push(``);

		codes.push(`\treturn offset;`)

		codes.push(`}`);
		codes.push(``);

		return codes.join("\r\n");
	}

	//反序列化
	private BuildDeserializeCode(messagepkg: MessagePackage, message: MessageInfo): string {

		const codes = [];

		codes.push(`// Deserialize ${message.Name}`);
		codes.push(`export function Deserialize_${message.Name}(buffer: ArrayBuffer, v?: DataView, o?: number): [${message.Name}, number] {`);
		codes.push(``);
		codes.push(`\tlet tempstring = "";`);
		codes.push(`\tlet tempnumber = 0;`);
		codes.push(`\tlet tempboolean = false;`);
		codes.push(`\tlet temparray = null;`);
		codes.push(`\tlet tempbigint = 0n;`);
		codes.push(`\tlet tempoffset = 0;`);
		codes.push(``);
		codes.push(`\tlet offset = o || 0;`);
		codes.push(`\tlet view = v || null;`);
		codes.push(``);

		codes.push(`\tif (view === null) {`);
		codes.push(``);
		codes.push(`\t\tview = new DataView(buffer);`);
		codes.push(`\t}`);
		codes.push(``);

		codes.push(`\tlet offsetend = view.getUint16(offset, true); offset += 2;`);
		codes.push(`\toffsetend += offset;`);


		codes.push(`\tlet msg: ${message.Name} = {} as any;`);
		codes.push(``);
		codes.push(`\twhile (offset < offsetend) {`);
		codes.push(``);
		codes.push(`\t\tconst index = view.getUint8(offset); offset += 1;`);
		codes.push(``);
		codes.push(`\t\tswitch(index) {`);
		codes.push(``);

		const fields: Array<MessageFieldInfo> = [];

		for (let i = 0; i < message.ExtendFields.length; i++) {

			fields.push(message.ExtendFields[i]);
		}

		for (let i = 0; i < message.Fields.length; i++) {

			fields.push(message.Fields[i]);
		}

		for (let i = 0; i < fields.length; i++) {

			const field = fields[i];

			codes.push(`\t\tcase ${field.Index}:`);
			codes.push(`\t\t\t{`);

			//反序列化

			switch(field.Flag) {

			case FieldFlag.ORepeated:
			case FieldFlag.Repeated:
				{
					codes.push(`\t\t\t\tlet count = view.getUint16(offset, true); offset += 2;`);
					codes.push(`\t\t\t\tmsg.${field.Name} = [];`);
					codes.push(`\t\t\t\tfor (let i = 0; i < count; i++) {`);

					const codetemp = this.BuildFieldDeserializeCode(field.Type, "\t\t\t\t\t", `msg.${field.Name}[i]`);
					codes.push(codetemp);

					codes.push(`\t\t\t\t}`);
				}
				break;
			case FieldFlag.Required:
			case FieldFlag.Optional:
				{
					const codetemp = this.BuildFieldDeserializeCode(field.Type, "\t\t\t\t", `msg.${field.Name}`);
					codes.push(codetemp);
				}
				break;
			}

			codes.push(`\t\t\t}`);
			codes.push(`\t\t\tbreak;`);
		}

		codes.push(`\t\tdefault:`);
		codes.push(`\t\t\tthrow new Error("unknown field index: " + index + " offset: " + offset);`);
		codes.push(`\t\t}`);
		codes.push(`\t}`);
		codes.push(``);
		codes.push(`\treturn [msg, offset];`);
		codes.push(`}`);
		codes.push(``);

		return codes.join("\r\n");
	}

	private BuildFieldSerializeCode(type: string, tabs: string, msg: string): string {

		switch(type) {

		case "boolean": return `${tabs}view.setUint8(offset, ${msg} === true ? 1 : 0); offset += 1;`;
		case "int8": return `${tabs}view.setInt8(offset, ${msg}); offset += 1;`;
		case "uint8": return `${tabs}view.setUint8(offset, ${msg}); offset += 1;`;
		case "int16": return `${tabs}view.setInt16(offset, ${msg}, true); offset += 2;`;
		case "uint16": return `${tabs}view.setUint16(offset, ${msg}, true); offset += 2;`;
		case "int32": return `${tabs}view.setInt32(offset, ${msg}, true); offset += 4`;
		case "uint32": return `${tabs}view.setUint32(offset, ${msg}, true); offset += 4;`;
		case "int64": return `${tabs}view.setBigInt64(offset, ${msg}, true); offset += 8;`;
		case "uint64": return `${tabs}view.setBigUint64(offset, ${msg}, true); offset += 8;`;
		case "float": return `${tabs}view.setFloat64(offset, ${msg}, true); offset += 8;`;
		case "bigint":
			{
				const codes = [];
				codes.push(``);
				codes.push(`${tabs}tempbigint = ${msg};`);
				codes.push(``);
				codes.push(`${tabs}tempboolean = tempbigint < 0n;`);
				codes.push(`${tabs}tempoffset = offset; offset += 2;`);
				codes.push(``);
				codes.push(`${tabs}tempnumber = 0;`);
				codes.push(``);
				codes.push(`${tabs}while (tempbigint > 0n) {`);
				codes.push(``);
				codes.push(`${tabs}\tview.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;`);
				codes.push(`${tabs}\ttempbigint >>= 64n;`);
				codes.push(`${tabs}\ttempnumber++;`);
				codes.push(`${tabs}}`);
				codes.push(``);
				codes.push(`${tabs}if (tempboolean) tempnumber |= 0x8000;`);
				codes.push(``);
				codes.push(`${tabs}view.setUint16(tempoffset, tempnumber, true);`);
				return codes.join("\r\n");
			}
			break;
		case "string":
			{
				const codes = [];
				codes.push(``);
				codes.push(`${tabs}tempstring=${msg};`);
				codes.push(`${tabs}tempnumber = tempstring.length;`);
				codes.push(`${tabs}view.setUint16(offset, tempnumber, true); offset += 2;`);
				codes.push(`${tabs}for (let i = 0; i < tempnumber; i++) {`);
				codes.push(`${tabs}\tview.setUint16(offset, tempstring.charCodeAt(i), true); offset += 2;`);
				codes.push(`${tabs}}`);
				codes.push(``);
				return codes.join("\r\n");
			}
			break;
		}

		if (this.m_Enums.has(type)) {

			return `${tabs}view.setUint32(offset, ${msg}, true); offset += 4;`;
		}

		return `${tabs}offset = Serialize_${type}(${msg}, view, offset) as number;`
	}

	private BuildFieldDeserializeCode(type: string, tabs: string, msg: string): string {

		switch(type) {

		case "boolean": return `${tabs}${msg} = view.getUint8(offset) !== 0; offset += 1;`;
		case "int8": return `${tabs}${msg} = view.getInt8(offset); offset += 1;`;
		case "uint8": return `${tabs}${msg} = view.getUint8(offset); offset += 1;`;
		case "int16": return `${tabs}${msg} = view.getInt16(offset, true); offset += 2;`;
		case "uint16": return `${tabs}${msg} = view.getUint16(offset, true); offset += 2;`;
		case "int32": return `${tabs}${msg} = view.getInt32(offset, true); offset += 4;`;
		case "uint32": return `${tabs}${msg} = view.getUint32(offset, true); offset += 4;`;
		case "int64": return `${tabs}${msg} = view.getBigInt64(offset, true); offset += 8;`;
		case "uint64": return `${tabs}${msg} = view.getBigUint64(offset, true); offset += 8;`;
		case "float": return `${tabs}${msg} = view.getFloat64(offset, true); offset += 8;`;
		case "bigint":
			{
				const codes = [];
				codes.push(``);
				codes.push(`${tabs}tempnumber = view.getUint16(offset, true); offset += 2;`);
				codes.push(`${tabs}tempboolean = (tempnumber & 0x8000) === 0x8000;`);
				codes.push(`${tabs}tempnumber &= 0x7FFF;`);
				codes.push(``);
				codes.push(`${tabs}tempbigint = 0n;`);
				codes.push(``);
				codes.push(`${tabs}if (tempnumber > 0) {`);
				codes.push(``);
				codes.push(`${tabs}\ttempoffset = offset + (tempnumber - 1) * 8;`);
				codes.push(``);
				codes.push(`${tabs}\tfor (let j = tempoffset; j >= offset; j -= 8) {`);
				codes.push(`${tabs}\t\ttempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);`);
				codes.push(`${tabs}\t}`);
				codes.push(``);
				codes.push(`${tabs}\toffset += tempnumber * 8;`);
				codes.push(`${tabs}}`);
				codes.push(``);
				codes.push(`${tabs}${msg} = tempboolean ? -tempbigint : tempbigint;`);
				codes.push(``);
				return codes.join("\r\n");
			}
			break;
		case "string":
			{
				const codes = [];
				codes.push(`${tabs}tempnumber = view.getUint16(offset, true); offset += 2;`);
				codes.push(`${tabs}${msg} = "";`);
				codes.push(`${tabs}for (let j = 0; j < tempnumber; j++) {`);
				codes.push(`${tabs}\t${msg} += String.fromCharCode(view.getUint16(offset, true)); offset += 2;`);
				codes.push(`${tabs}}`);
				codes.push(``);
				return codes.join("\r\n");
			}
			break;
		}

		if (this.m_Enums.has(type)) {

			return `${tabs}${msg} = view.getUint32(offset, true); offset += 4;`;
		}

		const codes = [];

		codes.push(`${tabs}{`);
		codes.push(`${tabs}\tconst [resultmsg, resultoffset] = Deserialize_${type}(buffer, view, offset);`);
		codes.push(`${tabs}\t${msg} = resultmsg;`);
		codes.push(`${tabs}\toffset = resultoffset;`);
		codes.push(`${tabs}}`);

		return codes.join("\r\n");
	}

	private GetFieldTypeName(type: string): string {
		if (type === "boolean") return "boolean";
		if (type === "int8") return "number";
		if (type === "uint8") return "number";
		if (type === "int16") return "number";
		if (type === "uint16") return "number";
		if (type === "int32") return "number";
		if (type === "uint32") return "number";
		if (type === "int64") return "bigint";
		if (type === "uint64") return "bigint";
		if (type === "float") return "number";
		if (type === "bigint") return "bigint";
		if (type === "string") return "string";

		return type;
	}

	private GetFieldTypeSize(type: string): SizeInfo {

		switch(type) {

		case "boolean": return { fieldsize: 1, fixedsize: true };
		case "int8": return { fieldsize: 1, fixedsize: true };
		case "uint8": return { fieldsize: 1, fixedsize: true };
		case "int16": return { fieldsize: 2, fixedsize: true };
		case "uint16": return { fieldsize: 2, fixedsize: true };
		case "int32": return { fieldsize: 4, fixedsize: true };
		case "uint32": return { fieldsize: 4, fixedsize: true };
		case "int64": return { fieldsize: 8, fixedsize: true };
		case "uint64": return { fieldsize: 8, fixedsize: true };
		case "float": return { fieldsize: 8, fixedsize: true };
		case "bigint": return { fieldsize: 0, fixedsize: false };
		case "string": return { fieldsize: 0, fixedsize: false };
		}

		if (this.m_Enums.has(type)) {

			return { fieldsize: 4, fixedsize: true };
		}

		return null;
	}

	private CalcStringLen(s: string): number {

		let len = 0;

		for (let i = 0; i < s.length; i++) {

			const c = s.charCodeAt(i);

			if (c > 255) {
				len += 2;
			}
			else {

				if (c === "\t".charCodeAt(0)) {
					len += 4;
				}
				else {
					len += 1;
				}
			}
		}

		return len;
	}

	private BuildCodeWithDistance(codes: Array<string>) {

		
		let s = "";

		const codestemp = [];

		for (let i = 0; i < codes.length; i++) {

			s += codes[i];

			if (i === codes.length - 1) { break; }

			const len = this.CalcStringLen(codes[i]);
			const requirelen = CharactorDistance - len;

			if (requirelen % 4 !== 0) {

				s += "\t".repeat(requirelen / 4 + 1);
			}
			else {

				s += "\t".repeat(requirelen / 4);
			}
		}

		return s;
	}
}