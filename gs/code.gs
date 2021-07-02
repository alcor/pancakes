function doGet(e) {
  var parameters = e.parameter;

  var template = HtmlService.createTemplateFromFile('gs/index')
  let favmoji;

  template.mode = parameters.mode || 'view';  
  template.tocId = '';
  template.docId = '';
  template.tocData = {};
  template.docData = {}

  if (parameters.toc) { 
    template.tocId = parameters.toc;
    template.tocData = JSON.parse(getData(parameters.toc, true))
    template.title = template.tocData.title;

    if (template.tocData?.inlineObjects) {
      let obj = template.tocData.inlineObjects ? Object.values(template.tocData.inlineObjects).pop() : undefined;
      template.favicon = obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri + "?.png";
    }
  } 
  
  if (parameters.doc) {
    if (!parameters.doc.startsWith("http")) {
    template.docData = JSON.parse(getData(parameters.doc))
    }
    template.docId = parameters.doc;
  }

  return template.evaluate()
    .setTitle(template.title || "Document Sidebar")
    .setFaviconUrl(template.favicon || `https://ssl.gstatic.com/dynamite/emoji/png/32/emoji_${favmoji || 'u1f4da'}.png`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

// Cache file listing to reduce spreadsheet access
function getData(docId, ignoreCache) {
  let start = new Date().getTime();
  var cache = CacheService.getScriptCache();

  let cached = ignoreCache ? null : cache.get(docId);
  if (cached) { 
    if (cached.charAt(0) != "{") {
      cached = Utilities.base64Decode(cached);
      cached = Utilities.newBlob(cached, "application/x-gzip");
      cached = Utilities.ungzip(cached);
      cached = cached.getDataAsString();
    }

    return cached; 
  }

  // Logger.log("Fetching Doc " + docId  + " " + (new Date().getTime() - start))   
  var doc = Docs.Documents.get(docId, {suggestionsViewMode: 'PREVIEW_WITHOUT_SUGGESTIONS'});

  var str = JSON.stringify(doc);

  if (str.length < 100000) {
    try {
      cache.put(docId, str, 30 * 60);
    } catch (e) {
      Logger.log(e);
      Logger.log(str.length);
    }
  } else {
    try {
      let blob = Utilities.newBlob(str)
      let gzip = Utilities.gzip(blob);
      let base64 = Utilities.base64Encode(gzip.getBytes())
      cache.put(docId, base64, 30 * 60);
    } catch (e) {
      Logger.log(e);
      Logger.log(str.length);
    }
  }

  // Logger.log("Sending " + docId  + " " + (new Date().getTime() - start) )   
  return str; 
}
