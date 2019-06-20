require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true });

client.connect(err => {
    var db = client.db('backend');
    var Shows = db.collection('shows');
    var offset = 0;

    while(true){
        getMixcloudData(offset).then(data => {
            // if data is empty, return
            if(data.length === 0) return;

            console.log(data.length);

            data.forEach((show) => {
                console.log(show.name);
                getMixcloudShowInfo(show.slug).then(casts => {
                    var tempTags = [];

                    casts.forEach(cast => {
                        cast.tags.forEach(tag => {
                            tempTags.push(tag.name);
                        })
                    })

                    // Calculates mostCommonTags
                    // Taken from: https://stackoverflow.com/questions/22010520/sort-by-number-of-occurrencecount-in-javascript-array

                    const s = tempTags.reduce(function(m, v) {
                        m[v] = (m[v] || 0) + 1;
                        return m;
                    }, {});
                    var mostCommonTags = [];
                    for (let k in s) mostCommonTags.push({ k: k, n: s[k] });
                    mostCommonTags.sort(function(mostCommonTags, b) {
                    return b.n - mostCommonTags.n;
                    });
                    mostCommonTags = mostCommonTags.map(function(mostCommonTags) {
                    return mostCommonTags.k;
                    });

                    // If mostCommonTags contains 'Mixlr', remove it
                    if (mostCommonTags.indexOf("Mixlr") != -1) {
                        mostCommonTags.splice(mostCommonTags.indexOf("Mixlr"), 1);
                    }

                    show.tags = mostCommonTags.splice(0, 3).join(" - ");
                    show.pictures = casts[0].pictures;
                    //onsole.log(casts[0].pictures);

                    // Delete entry if there is a different
                    // Keep entry if there is no difference
                    // Add entry if it doens't exist

                    var oldShow = Shows.findOne({'slug': show.slug});

                    oldShow.toArray().then(res => {
                        // If this show does not exist
                        if(res.length === 0){
                            Shows.insertOne(show);
                            console.log('1 document inserted... ' + 'Show name: ' + show.name);
                        } else {
                            // compare everything but the _id
                            // if there is a difference, save the latest version
                            var {_id, ...oldShowComp} = res[0];
                            if(JSON.stringify(show) !== JSON.stringify(oldShowComp)){
                                console.log(show);
                                console.log(oldShowComp);
                                Shows.deleteOne(res, function(err, obj){
                                    if(err) throw err;
                                    console.log("1 document deleted");
                                });
                                Shows.insertOne(show, function(err, res) {
                                    if(err) throw err;
                                    console.log('1 document updated... ' + 'Show name: ' + show.name);
                                });
                            }
                        }
                        
                    });
                })
            })
            // get first show image data, then compare to mongodb?
        })
        offset+=100;
        if(offset >= 200) break;
    }
});

async function getMixcloudData(offset) {
    try {
        return await axios.get('https://api.mixcloud.com/8ballradio/playlists/', {
            params: {
                limit: 100,
                offset: offset
            }
        }).then(response => {return response.data.data});
    } catch (error) {
        console.log(error);
    }
}

async function getMixcloudShowInfo(slug) {
    try {
        return await axios.get('https://api.mixcloud.com/8ballradio/playlists/' +
            slug +
            '/cloudcasts/?limit=100'
        ).then(res => {return res.data.data});
    } catch (error) {
        console.log(error);
    }
}

// keep making axios calls until paging['next'] DNE
// https://api.mixcloud.com/8ballradio/playlists/?offset=100

/*"//api.mixcloud.com/8ballradio/playlists/" +
            showObj["slug"] +
            "/cloudcasts/?limit=100"*/

// after, make calls to each slug and take the first image from their playlist
// then, connect to client and compare the collection with the rounded up data
// save any data that has been modified
// Fix client connection/close to only when it matters

// make any API call blocking (await/async)
// maybe need to do client in later
// push/pull updated items

// build links using offset to 1000, then get them all
// build database after receiving all data
// iterate through each entry and compare to mongodb db
// if theres a difference found, update entry
// if entry DNE, make it
