
var fs=require("fs");
var zlib=require("./zlib");

const MS=0;
const MT=0;

exports.read=function(path,callback){
	var data=fs.readFileSync(path);
	CWS2FWS(data,function(fws){
		var date=getTagDate(fws);
		if(callback) callback(date);
	});
};

exports.clear=function(path,callback){
	var data=fs.readFileSync(path);
	CWS2FWS(data,function(fws){
		var isClear=clearTagDate(fws);
		if(isClear){
			FWS2CWS(fws,function(cws){
				fs.writeFileSync(path,cws);
				if(callback) callback(true);
			});
		}else{
			if(callback) callback(false);
		}
	});
};

function clearTagDate(data){
	var position=getTagPos(data);
	if(position>0){
		var ms=data.readUInt32LE(position);
		var mt=data.readUInt16LE(position+4);
		if(ms==MS&&mt==MT) return false;
		data.writeUInt32LE(MS,position);
		data.writeUInt16LE(MT,position+4);
		return true;
	}
	return false;
};

function getTagDate(data){
	var position=getTagPos(data);
	if(position>0){
		var ms=data.readUInt32LE(position);
		var mt=data.readUInt16LE(position+4);
		var date=new Date();
		date.setTime(ms+mt*4294967296);
		return date;
	}
	return null;
};

function getTagPos(data){
	//Signature + Version + FileLength + FrameSize + FrameRate + FrameCount
	var pos=3 + 1 + 4 + (Math.ceil(((data[8]>>3)*4-3)/8)+1) + 2 + 2;
	while(pos<data.length){
		var tag=data.readUInt16LE(pos);
		pos+=2;
		if(tag>>6==41){
			//ProductID + Edition + MajorVersion + MinorVersion + BuildLow + BuildHigh
			pos+=4 + 4 + 1 + 1 + 4 + 4;
			return pos;
		}else{
			pos+=(tag&63)!=63?(tag&63):data.readUInt16LE(pos)+4;
		}
	}
	return 0;
};

function FWS2CWS(data,callback){
	var type=data.slice(0,3);
	if(type=="FWS"){
		var content=new Buffer(data.slice(8));
		zlib.deflate(content,function(buffer){
			var outData=new Buffer(buffer.length+8);
			outData.write("CWS");
			data.copy(outData,3,3,8);
			buffer.copy(outData,8,0);
			callback(outData);
        });       
	}else{
		callback(data);
	}
};

function CWS2FWS(data,callback){
	var type=data.slice(0,3);
	if(type=="CWS"){
		var content=new Buffer(data.slice(8));
		zlib.inflate(content,function(buffer){
			var outData=new Buffer(buffer.length+8);
			outData.write("FWS");
			data.copy(outData,3,3,8);
			buffer.copy(outData,8,0);
			callback(outData);
        });       
	}else{
		callback(data);
	}
};
