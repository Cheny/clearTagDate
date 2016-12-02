
var zlib=require("zlib");

exports.deflate=function(data,callback){
  var options={level:zlib.Z_BEST_COMPRESSION};
  var engine=zlib.createDeflate(options);
  //var engine=zlib.createDeflateRaw(options);
  zlibBuffer(engine,data,function(err,buffer){
    if(err){
      callback(data);
    }else{
      callback(buffer);
    }
  });
};

exports.inflate=function(data,callback){
  var engine=zlib.createInflate();
  //var engine=zlib.createInflateRaw();
  zlibBuffer(engine,data,function(err,buffer){
    if(err){
      callback(data);
    }else{
      callback(buffer);
    }
  });
};

function zlibBuffer(engine,buffer,callback){
  var buffers=[];
  var nread=0;
  function onData(chunk){
    buffers.push(chunk);
    nread+=chunk.length;
  }
  function onEnd(){
    callback(null,Buffer.concat(buffers,nread));
  }
  function onError(err){
    engine.removeListener("end",onEnd);
    engine.removeListener("error",onError);
    callback(err);
  }
  engine.on("data",onData);
  engine.on("end",onEnd);
  engine.on("error",onError);
  engine.write(buffer);
  engine.end();
};
