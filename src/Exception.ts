import { Utils } from "nodejskernel"


export function OnException(format, ...args)
{
	const s = Utils.FormatString(format, ...args);

	throw new Error(s);
}

export function OnWarning(format, ...args)
{
	const s = Utils.FormatString(format, ...args);

	console.warn(s);
}