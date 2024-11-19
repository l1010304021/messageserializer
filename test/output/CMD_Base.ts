





export enum TestEnum
{
	OptionOne									= 0x1,
	OptionTwo									= 0x2,
}







export interface BaseMessage
{
	success:									boolean;
	error?:										string;
}






// GetMessageSize BaseMessage
export function GetMessageSize_BaseMessage(msg: BaseMessage): number {

	let tempnumber = 0;
	let tempbigint = 0n;

	let size = 2;

	if (msg.success !== undefined) {

		size += 1;
		size += 1;
	}
	else {

		throw new Error("success not exists.");
	}

	if (msg.error !== undefined) {

		size += 1;
		size += 2 + msg.error.length * 2;
	}

	return size;
}




// Serialize BaseMessage
export function Serialize_BaseMessage(msg: BaseMessage, v?: DataView, o?: number): ArrayBuffer | number {

	let tempstring = "";
	let tempnumber = 0;
	let tempbigint = 0n;
	let tempboolean = false;
	let tempoffset = 0;

	let offset = o || 0;
	let view = v || null;
	let buffer = null;

	if (view === null) {

		const msgsize = GetMessageSize_BaseMessage(msg);

		buffer = new ArrayBuffer(msgsize);
		view = new DataView(buffer);
	}

	const sizeoffset = offset;
	offset += 2;
	if (msg.success !== undefined) {

		view.setUint8(offset, 1); offset += 1;
		view.setUint8(offset, msg.success === true ? 1 : 0); offset += 1;
	}
	else {

		throw new Error("success not exists.");
	}

	if (msg.error !== undefined) {

		view.setUint8(offset, 2); offset += 1;

		tempstring=msg.error;
		tempnumber = tempstring.length;
		view.setUint16(offset, tempnumber, true); offset += 2;
		for (let i = 0; i < tempnumber; i++) {
			view.setUint16(offset, tempstring.charCodeAt(i), true); offset += 2;
		}

	}
	view.setUint16(sizeoffset, offset - sizeoffset - 2, true);

	if (buffer !== null) {

		return buffer;
	}

	return offset;
}





// Deserialize BaseMessage
export function Deserialize_BaseMessage(buffer: ArrayBuffer, v?: DataView, o?: number): [BaseMessage, number] {

	let tempstring = "";
	let tempnumber = 0;
	let tempboolean = false;
	let temparray = null;
	let tempbigint = 0n;
	let tempoffset = 0;

	let offset = o || 0;
	let view = v || null;

	if (view === null) {

		view = new DataView(buffer);
	}

	let offsetend = view.getUint16(offset, true); offset += 2;
	offsetend += offset;
	let msg: BaseMessage = {} as any;

	while (offset < offsetend) {

		const index = view.getUint8(offset); offset += 1;

		switch(index) {

		case 1:
			{
				msg.success = view.getUint8(offset) !== 0; offset += 1;
			}
			break;
		case 2:
			{
				tempnumber = view.getUint16(offset, true); offset += 2;
				msg.error = "";
				for (let j = 0; j < tempnumber; j++) {
					msg.error += String.fromCharCode(view.getUint16(offset, true)); offset += 2;
				}

			}
			break;
		default:
			throw new Error("unknown field index: " + index + " offset: " + offset);
		}
	}

	return [msg, offset];
}




