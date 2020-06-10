const linkPreviewGenerator = require("link-preview-generator");
const LRU = require("lru-cache");

const cache = new LRU({ maxAge: 1000 * 60 * 60, max: 500 });

exports.handleLinks = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else {
    const {query: { q }} = req;

    if (!q || q.length === 0) {
      res.status(400).json({err: 'No Links Specified'})
    }

    const parsedUrls = q.split(',');

    const linkPreviewPromises = parsedUrls.map(url => {
      if (cache.has(url)) {
        return Promise.resolve(cache.get(url));
      } else {
        return linkPreviewGenerator(url)
      }
    });

    Promise.all(linkPreviewPromises).then((promises) => {
      res.json(promises.map((promise, index) => {
        const link = parsedUrls[index];

        promise.link = link;

        cache.set(link, promise);

        return promise;
      }));
    }).catch(err => res.status(500).json({error: 'fetch error'}));
  }
}
