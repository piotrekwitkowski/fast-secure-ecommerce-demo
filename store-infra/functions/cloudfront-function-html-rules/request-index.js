import cf from 'cloudfront';
const kvsHandle = cf.kvs('__KVS_ID__'); // Will be replaced with the actual KVS ID

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function handler(event) {
    const request = event.request;
    const headers = request.headers;
    // check the user is already assigned to a segment, otherwise assign it to a random one
    var userSegment;
    if (request.cookies['user-segment']) {
        userSegment = request.cookies['user-segment'].value;
    } else {
        userSegment = `${randomIntFromInterval(1, 10)}`;
        request.headers['x-user-segment'] = { value: userSegment };
    }
    try {
        const lookupKey = `${userSegment}-${request.uri}`;
        const configRaw = await kvsHandle.get(lookupKey);
        const config = JSON.parse(configRaw);
        if (config.countries) {
            console.log("conuntries exist");
            if ((config.uri) && (headers['cloudfront-viewer-country']) && (config.countries.includes(headers['cloudfront-viewer-country'].value))) {
                request.uri = config.uri;
            }
        } else  if (config.uri) {
            request.uri = config.uri;
        }
    } catch (err) {
        console.log(err);
        // don't apply rules
    }

    return request;
}
