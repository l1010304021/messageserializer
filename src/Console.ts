import { Utils } from "nodejskernel";
const iconv = require('iconv-lite');

export function WriteToConsole(format, ...args) {

	const s = Utils.FormatString(format, ...args);

	if (process.env.VisualStudioVersion !== undefined) {

		const encodedMessage = iconv.encode(s + '\n', 'gbk');
		process.stdout.write(encodedMessage);
	}
	else {

		console.log(s);
	}
}
