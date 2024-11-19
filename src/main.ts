/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-const */
import { EncryptFile, Utils } from "nodejskernel"
import { Compiler } from "./Compiler";
import { CodeGenerator_TS } from "./CG_TS";
import { WriteToConsole } from "./Console";

const path = require("path");



interface CMDLine {

	indir:								string;
	outdir:								string;

	target:								string;
}

function InvalidParameter(name: string, usage: string) {

	WriteToConsole("invalid parameter: %s", name);
	WriteToConsole(" usage: %s=%s", name, usage);
	process.exit(1);

}

function CheckParameters(cmdline: CMDLine) {

	if (cmdline.indir === undefined || cmdline.indir === null)
	{
		InvalidParameter("indir", "inpath");
	}

	if (cmdline.outdir === undefined || cmdline.outdir === null)
	{
		InvalidParameter("outdir", "outpath");
	}

	if (cmdline.target === undefined || cmdline.target === null || CodeGenerators[cmdline.target] === undefined)
	{
		InvalidParameter("target", "target language");
	}
	
}

const CodeGenerators = {
	"ts": new CodeGenerator_TS()
}


function Main() {

	let cmdline: CMDLine = Utils.ParseCommandLineArgs();

	CheckParameters(cmdline);

	//将路径修改为indir目录
	let inputdir = path.resolve(cmdline.indir);

	const compiler: Compiler = new Compiler();

	compiler.RegisterCodeGenerator("ts", CodeGenerators.ts);

	const files = [];

	EncryptFile.EnumDirectoryFiles(inputdir, [".proto"], (filename: string)=>{

		files.push(filename);
	});

	try{

		compiler.Compile({
			outdir: cmdline.outdir,
			rootdir: inputdir,
			codegenerators: [cmdline.target],
			files: files
		});
	}
	catch(e) {
		WriteToConsole(e.message);
	}
	
}


Main();
