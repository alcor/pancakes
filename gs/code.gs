function doGet(e) {
  var parameters = e.parameter;

  var template = HtmlService.createTemplateFromFile('gs/index')
  let favmoji, favicon;

  let data = {}
  data.mode = parameters.mode || 'view';  
  data.tocId = parameters.toc;
  data.docId = parameters.doc
  data.heading = parameters.heading || ''

  if (parameters.path) {
    let components = parameters.path.split("/");
    if (components.length > 1) data.tocId = components[1]
    if (components.length > 2) data.docId = components[2]
    if (components.length > 3) data.heading = components[3]
  } 

  if (!data.tocId) data.tocId = '1IsZAZfp6E9Z88kGsDH3Ycd3LZRd5S3Rkln_idKhec9g'

  if (data.tocId != '0') {
    data.tocData = JSON.parse(getData(data.tocId, false, true))
  }

  if (data.tocData?.inlineObjects) {
    let obj = data.tocData.inlineObjects ? Object.values(data.tocData.inlineObjects).pop() : undefined;
    favicon = obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri + "?.png";
  }
 
  if (data.docId && !data.docId.startsWith("http")) {
    data.docData = JSON.parse(getData(data.docId))
  }

  let title = data.tocData?.title || data.docData?.title; 

  template.data = JSON.stringify(data);

  return template.evaluate()
    .setTitle(title || "Document Sidebar")
    .setFaviconUrl(favicon || `https://ssl.gstatic.com/dynamite/emoji/png/32/emoji_${favmoji || 'u1f4da'}.png`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

// Cache file listing to reduce spreadsheet access
function getData(docId, ignoreCache, isToc) {
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

  try { 
    var doc = Docs.Documents.get(docId, {suggestionsViewMode: 'PREVIEW_WITHOUT_SUGGESTIONS'});
    pruneContent(doc.body.content);
  } catch (e) {
    return JSON.stringify({error:e});
  }

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
      // TODO: Redirect to preview version for large documents
      Logger.log(e);
      Logger.log(str.length);
    }
  }


  // Logger.log("Sending " + docId  + " " + (new Date().getTime() - start) )   
  return str; 
}
function pruneContent(content) {
  content.forEach(c => {
    delete c.startIndex;
    delete c.endIndex;
    c.elements?.forEach(e => pruneContent(e));
    if (c.table) {
      c.table.tableRows.forEach(tr => {
        delete tr.startIndex;
        delete tr.endIndex;
        tr.tableCells.forEach(td => {
          delete td.startIndex;
          delete td.endIndex;
          pruneContent(td.content);
        })
      })
    }
  })
}

function test() {
  Logger.log(getData("1IsZAZfp6E9Z88kGsDH3Ycd3LZRd5S3Rkln_idKhec9g"))
}

function getUrl() { return ScriptApp.getService().getUrl(); }

function fetchShortcut(query) {
  var props = PropertiesService.getScriptProperties();
  if (query.title) {
    return props.getProperty("TITLE:" + query.title);
  } else if (query.id) {
    return props.getProperty("ID:" + query.id);
  }
}

function storeShortcut(title, id) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty("TITLE:" + title, id);
  props.setProperty("ID:" + id, title);
}

function listStorage() {
  var props = PropertiesService.getScriptProperties();
  Logger.log(props.getKeys());
}
