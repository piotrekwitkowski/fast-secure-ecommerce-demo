import cf from 'cloudfront';
const kvsHandle = cf.kvs('__KVS_ID__'); // Will be replaced with the actual KVS ID

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function handler(event) {
    const request = event.request;
    const headers = request.headers;
    // check the user is already assigned to a segment, otherwise assign it to a random one. This is for A/B testing.
    var userSegment;
    if (request.cookies['user-segment']) {
        userSegment = request.cookies['user-segment'].value;
    } else {
        userSegment = `${randomIntFromInterval(1, 10)}`;
        request.headers['x-user-segment'] = { value: userSegment };
    }
    // apply rules
    try {
        const configRaw = await kvsHandle.get(request.uri);
        const config = JSON.parse(configRaw);

        /* example of config
        {
            "segments" : "1,2,3,4,5,6",
            "countries" : "AE,FR",
            "rules": {
                "rewrite_path" : "/index-v2"
            }
        }
        {
            "segments" : "all",
            "rules": {
                "redirect" : "/"
            }
        }
        */
        const segmentCondition = (!config.segments) || ((config.segments) && ((config.segments === "all") || (config.segments.includes(userSegment))));
        const countryCondition = (!config.countries) || ((config.countries) && (headers['cloudfront-viewer-country']) && (config.countries.includes(headers['cloudfront-viewer-country'].value)));

        if (segmentCondition && countryCondition) {
            if (config.rules) {
                if (config.rules.rewrite_path) {
                    request.uri = config.rules.rewrite_path;
                    return request;
                } else if (config.rules.redirect) {
                    return {
                        statusCode: 302,
                        statusDescription: 'Found',
                        headers: { location: { value: config.rules.redirect} },
                    }
                }
            }

        }
        return request; // move forward with request normally

    } catch (err) {
        // console.log(err);
    }
    return request; // move forward with request normally
    
}
