var net = require('net'),
    speakerLib = require('speaker'),
    Transform = require('stream').Transform,
    ServiceDiscovery = require('node-discovery'),
    discovery = new ServiceDiscovery(),
    speaker = new speakerLib(),
    startTime = 0,
    beforeStart = 0,
    stream = new Transform(),
    streamBuffer = "",
    splitStart = -1,
    splitEnd = -1,
    client;

discovery.setup('service.rpihifi.server',function(service, callback){
    client = net.connect({port: 8080, host: service.host}, function() {
    });
    client.on('data', function(data){
        streamBuffer += data.toString('utf8');
        splitStart = streamBuffer.indexOf('{');
        splitEnd = streamBuffer.indexOf('}');
        splitEnd = (splitStart > splitEnd) ? streamBuffer.indexOf('}', (splitEnd+1)):splitEnd;
        if (splitStart !== -1 && splitEnd !== -1) {
            var string = streamBuffer.slice(splitStart, (splitEnd+1)),
                obj = JSON.parse(string);

            streamBuffer = streamBuffer.slice((splitEnd+1));

            // console.log(obj.time);
            if (startTime === 0) {
                startTime = obj.time;
                beforeStart = startTime - (new Date()).getTime();
                setTimeout(function(){
                    stream.pipe(speaker)
                }, beforeStart);
            }
            console.log((new Date()).getTime());
            stream.push(new Buffer(obj.chunk, 'hex'));
        }
    })
    callback();
});

stream._transform = function (chunk, enc, next) {
    this.push(chunk)
    next();
}
