import { Utils } from "nodejskernel";
import {Deserialize_ExtendedMessage, ExtendedMessage, Serialize_ExtendedMessage} from "./output/CMD_Login"


const times = 10000;

const extendmsgs: Array<ExtendedMessage> = [];

function RandomBigInt(): bigint {

	const length = Math.floor(Math.random() * 1000) + 10;

	let result = BigInt(1);

	for(let i = 0; i < length; i++) {
		result *= BigInt(Math.floor(Math.random() * 10) + 1);
	}

	return result;
}


function RandomFloat(): number {

	const length = Math.floor(Math.random() * 100) + 10;

	let result = 1.0;

	for(let i = 0; i < length; i++) {
		result *= Math.random() * 10.0 + 1.0;
	}

	return result;
}


for(let i = 0; i < times; i++) {

	extendmsgs.push({
		success: true,
		error: "",

		x: Math.floor(Math.random() * 10000),
		y: Math.floor(Math.random() * 10000),
		z: Math.floor(Math.random() * 10000),

		attack: RandomBigInt(),
		defense: RandomBigInt(),
		hp: RandomBigInt(),
		mp: RandomBigInt()
	});
}

const o = Utils.ObjectClone(extendmsgs[0]);

let buffer = null;
let json = null;

for (let i = 0; i < times; i++) {
	Serialize_ExtendedMessage(extendmsgs[i]);
}



console.time("Serialize_ExtendedMessage");
for (let i = 0; i < times; i++) {
	Serialize_ExtendedMessage(extendmsgs[i]);
}
console.timeEnd("Serialize_ExtendedMessage");

buffer = Serialize_ExtendedMessage(extendmsgs[0]);

for (let i = 0; i < times; i++) {
	JSON.stringify(extendmsgs[i]);
}

console.time("Serialize_ExtendedMessage Json");
for (let i = 0; i < times; i++) {
	JSON.stringify(extendmsgs[i]);
}
console.timeEnd("Serialize_ExtendedMessage Json");

json = JSON.stringify(extendmsgs[0]);


console.log(buffer.byteLength);
console.log(json.length);


let obj = null;
let objjson = null;
console.time("Deserialize_ExtendedMessage");
for (let i = 0; i < times; i++) {
	Deserialize_ExtendedMessage(buffer);
}
console.timeEnd("Deserialize_ExtendedMessage");

obj = Deserialize_ExtendedMessage(buffer);

console.time("Deserialize_ExtendedMessage Json");
for (let i = 0; i < times; i++) {
	JSON.parse(json);
}
console.timeEnd("Deserialize_ExtendedMessage Json");
objjson = JSON.parse(json);

const jstringresult = JSON.stringify(obj[0]);
const jstring = JSON.stringify(objjson);


console.log("result:", jstringresult === jstring ? "true" : "false");

//console.log("obj:", obj[0]);
//console.log("objjson:", objjson);