import { BaseMessage, GetMessageSize_BaseMessage, Serialize_BaseMessage, Deserialize_BaseMessage } from "./CMD_Base";












export interface TestMessage extends BaseMessage
{
	x:											number;
	y:											number;
	z:											number;
	attack:										bigint;

	defense:									bigint;
	hp:											bigint;
	mp:											bigint;
}

export interface ExtendedMessage extends TestMessage
{
}






// GetMessageSize TestMessage
export function GetMessageSize_TestMessage(msg: TestMessage): number {

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

	if (msg.x !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("x not exists.");
	}

	if (msg.y !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("y not exists.");
	}

	if (msg.z !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("z not exists.");
	}

	if (msg.attack !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.attack > 0n ? msg.attack : -msg.attack;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("attack not exists.");
	}

	if (msg.defense !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.defense > 0n ? msg.defense : -msg.defense;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("defense not exists.");
	}

	if (msg.hp !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.hp > 0n ? msg.hp : -msg.hp;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("hp not exists.");
	}

	if (msg.mp !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.mp > 0n ? msg.mp : -msg.mp;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("mp not exists.");
	}

	return size;
}




// GetMessageSize ExtendedMessage
export function GetMessageSize_ExtendedMessage(msg: ExtendedMessage): number {

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

	if (msg.x !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("x not exists.");
	}

	if (msg.y !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("y not exists.");
	}

	if (msg.z !== undefined) {

		size += 1;
		size += 4;
	}
	else {

		throw new Error("z not exists.");
	}

	if (msg.attack !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.attack > 0n ? msg.attack : -msg.attack;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("attack not exists.");
	}

	if (msg.defense !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.defense > 0n ? msg.defense : -msg.defense;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("defense not exists.");
	}

	if (msg.hp !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.hp > 0n ? msg.hp : -msg.hp;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("hp not exists.");
	}

	if (msg.mp !== undefined) {

		size += 1;
		tempnumber = 0;
		tempbigint = msg.mp > 0n ? msg.mp : -msg.mp;

		while (tempbigint > 0n) {

			tempnumber += 8;
			tempbigint >>= 64n;
		}

		size += 2 + tempnumber;
	}
	else {

		throw new Error("mp not exists.");
	}

	return size;
}




// Serialize TestMessage
export function Serialize_TestMessage(msg: TestMessage, v?: DataView, o?: number): ArrayBuffer | number {

	let tempstring = "";
	let tempnumber = 0;
	let tempbigint = 0n;
	let tempboolean = false;
	let tempoffset = 0;

	let offset = o || 0;
	let view = v || null;
	let buffer = null;

	if (view === null) {

		const msgsize = GetMessageSize_TestMessage(msg);

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
	if (msg.x !== undefined) {

		view.setUint8(offset, 10); offset += 1;
		view.setUint32(offset, msg.x, true); offset += 4;
	}
	else {

		throw new Error("x not exists.");
	}

	if (msg.y !== undefined) {

		view.setUint8(offset, 11); offset += 1;
		view.setUint32(offset, msg.y, true); offset += 4;
	}
	else {

		throw new Error("y not exists.");
	}

	if (msg.z !== undefined) {

		view.setUint8(offset, 12); offset += 1;
		view.setUint32(offset, msg.z, true); offset += 4;
	}
	else {

		throw new Error("z not exists.");
	}

	if (msg.attack !== undefined) {

		view.setUint8(offset, 20); offset += 1;

		tempbigint = msg.attack;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("attack not exists.");
	}

	if (msg.defense !== undefined) {

		view.setUint8(offset, 21); offset += 1;

		tempbigint = msg.defense;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("defense not exists.");
	}

	if (msg.hp !== undefined) {

		view.setUint8(offset, 22); offset += 1;

		tempbigint = msg.hp;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("hp not exists.");
	}

	if (msg.mp !== undefined) {

		view.setUint8(offset, 23); offset += 1;

		tempbigint = msg.mp;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("mp not exists.");
	}

	view.setUint16(sizeoffset, offset - sizeoffset - 2, true);

	if (buffer !== null) {

		return buffer;
	}

	return offset;
}





// Serialize ExtendedMessage
export function Serialize_ExtendedMessage(msg: ExtendedMessage, v?: DataView, o?: number): ArrayBuffer | number {

	let tempstring = "";
	let tempnumber = 0;
	let tempbigint = 0n;
	let tempboolean = false;
	let tempoffset = 0;

	let offset = o || 0;
	let view = v || null;
	let buffer = null;

	if (view === null) {

		const msgsize = GetMessageSize_ExtendedMessage(msg);

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
	if (msg.x !== undefined) {

		view.setUint8(offset, 10); offset += 1;
		view.setUint32(offset, msg.x, true); offset += 4;
	}
	else {

		throw new Error("x not exists.");
	}

	if (msg.y !== undefined) {

		view.setUint8(offset, 11); offset += 1;
		view.setUint32(offset, msg.y, true); offset += 4;
	}
	else {

		throw new Error("y not exists.");
	}

	if (msg.z !== undefined) {

		view.setUint8(offset, 12); offset += 1;
		view.setUint32(offset, msg.z, true); offset += 4;
	}
	else {

		throw new Error("z not exists.");
	}

	if (msg.attack !== undefined) {

		view.setUint8(offset, 20); offset += 1;

		tempbigint = msg.attack;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("attack not exists.");
	}

	if (msg.defense !== undefined) {

		view.setUint8(offset, 21); offset += 1;

		tempbigint = msg.defense;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("defense not exists.");
	}

	if (msg.hp !== undefined) {

		view.setUint8(offset, 22); offset += 1;

		tempbigint = msg.hp;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("hp not exists.");
	}

	if (msg.mp !== undefined) {

		view.setUint8(offset, 23); offset += 1;

		tempbigint = msg.mp;

		tempboolean = tempbigint < 0n;
		tempoffset = offset; offset += 2;

		tempnumber = 0;

		while (tempbigint > 0n) {

			view.setBigUint64(offset, tempbigint & 0xFFFFFFFFFFFFFFFFn, true); offset += 8;
			tempbigint >>= 64n;
			tempnumber++;
		}

		if (tempboolean) tempnumber |= 0x8000;

		view.setUint16(tempoffset, tempnumber, true);
	}
	else {

		throw new Error("mp not exists.");
	}

	view.setUint16(sizeoffset, offset - sizeoffset - 2, true);

	if (buffer !== null) {

		return buffer;
	}

	return offset;
}





// Deserialize TestMessage
export function Deserialize_TestMessage(buffer: ArrayBuffer, v?: DataView, o?: number): [TestMessage, number] {

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
	let msg: TestMessage = {} as any;

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
		case 10:
			{
				msg.x = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 11:
			{
				msg.y = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 12:
			{
				msg.z = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 20:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.attack = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 21:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.defense = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 22:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.hp = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 23:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.mp = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		default:
			throw new Error("unknown field index: " + index + " offset: " + offset);
		}
	}

	return [msg, offset];
}





// Deserialize ExtendedMessage
export function Deserialize_ExtendedMessage(buffer: ArrayBuffer, v?: DataView, o?: number): [ExtendedMessage, number] {

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
	let msg: ExtendedMessage = {} as any;

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
		case 10:
			{
				msg.x = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 11:
			{
				msg.y = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 12:
			{
				msg.z = view.getUint32(offset, true); offset += 4;
			}
			break;
		case 20:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.attack = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 21:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.defense = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 22:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.hp = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		case 23:
			{

				tempnumber = view.getUint16(offset, true); offset += 2;
				tempboolean = (tempnumber & 0x8000) === 0x8000;
				tempnumber &= 0x7FFF;

				tempbigint = 0n;

				if (tempnumber > 0) {

					tempoffset = offset + (tempnumber - 1) * 8;

					for (let j = tempoffset; j >= offset; j -= 8) {
						tempbigint = (tempbigint << 64n) | view.getBigUint64(j, true);
					}

					offset += tempnumber * 8;
				}

				msg.mp = tempboolean ? -tempbigint : tempbigint;

			}
			break;
		default:
			throw new Error("unknown field index: " + index + " offset: " + offset);
		}
	}

	return [msg, offset];
}




